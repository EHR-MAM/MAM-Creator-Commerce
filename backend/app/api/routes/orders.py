from fastapi import APIRouter, Depends, HTTPException, status, Header, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from decimal import Decimal
import uuid

from app.core.database import get_db
from app.core.deps import require_admin_or_operator, get_current_user
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.vendor import Vendor
from app.models.commission import Commission
from app.models.analytics import AnalyticsEvent
from app.models.influencer import Influencer
from app.models.user import User
from app.schemas.order import OrderCreate, OrderOut
from app.core.config import settings
from app.services.notifications import send_order_notifications

router = APIRouter()

# Valid order status transitions — enforce the state machine
VALID_TRANSITIONS = {
    "pending": ["confirmed", "cancelled"],
    "confirmed": ["processing", "cancelled"],
    "processing": ["shipped", "cancelled"],
    "shipped": ["delivered"],
    "delivered": ["refunded"],
    "cancelled": [],
    "refunded": [],
}


@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
async def create_order(
    body: OrderCreate,
    background_tasks: BackgroundTasks,
    influencer_id: uuid.UUID,
    vendor_id: uuid.UUID,
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    db: AsyncSession = Depends(get_db),
):
    # Resolve products and calculate totals
    subtotal = Decimal("0.00")
    order_items_data = []

    for item_in in body.items:
        result = await db.execute(
            select(Product).where(Product.id == item_in.product_id, Product.status == "active")
        )
        product = result.scalar_one_or_none()
        if not product:
            raise HTTPException(status_code=400, detail=f"Product {item_in.product_id} not available")
        if product.inventory_count < item_in.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {product.name}")

        line_total = product.price * item_in.quantity
        subtotal += line_total
        order_items_data.append((product, item_in.quantity, line_total))

    delivery_fee = Decimal("20.00")  # flat pilot rate in GHS
    total = subtotal + delivery_fee

    order = Order(
        influencer_id=influencer_id,
        vendor_id=vendor_id,
        campaign_id=body.campaign_id,
        subtotal=subtotal,
        delivery_fee=delivery_fee,
        total=total,
        source_channel=body.source_channel,
        customer_name=body.customer_name,
        customer_phone=body.customer_phone,
        customer_email=body.customer_email,
        delivery_address=body.delivery_address,
        size_variant=body.size_variant,
        special_instructions=body.special_instructions,
    )
    db.add(order)
    await db.flush()

    for product, quantity, line_total in order_items_data:
        db.add(OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=quantity,
            unit_price=product.price,
            line_total=line_total,
        ))
        # Decrement inventory
        product.inventory_count -= quantity

    # Log analytics event
    db.add(AnalyticsEvent(
        actor_type="customer",
        event_name="order.created",
        entity_type="order",
        entity_id=order.id,
        payload_json={"total": str(total), "source": body.source_channel},
    ))

    await db.commit()
    await db.refresh(order)

    # Resolve influencer handle for notification (non-blocking)
    creator_handle = None
    try:
        inf_result = await db.execute(select(Influencer).where(Influencer.id == influencer_id))
        influencer = inf_result.scalar_one_or_none()
        if influencer:
            creator_handle = influencer.handle
    except Exception:
        pass

    # Build notification payload and fire in background — never blocks order response
    notification_data = {
        "order_id": str(order.id),
        "customer_name": body.customer_name,
        "customer_phone": body.customer_phone,
        "customer_email": body.customer_email,
        "delivery_address": body.delivery_address,
        "special_instructions": body.special_instructions,
        "items": [
            {
                "name": product.name,
                "sku": product.sku,
                "qty": quantity,
                "size_variant": body.size_variant,
                "line_total": float(line_total),
            }
            for product, quantity, line_total in order_items_data
        ],
        "subtotal": float(subtotal),
        "delivery_fee": float(delivery_fee),
        "total": float(total),
        "creator_handle": creator_handle,
        "influencer_id": str(influencer_id),
        "source_channel": body.source_channel,
    }
    background_tasks.add_task(send_order_notifications, notification_data)

    return order


@router.get("", response_model=list[OrderOut])
async def list_orders(
    current_user: User = Depends(require_admin_or_operator),
    status_filter: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(Order)
    if status_filter:
        query = query.where(Order.status == status_filter)
    result = await db.execute(query.order_by(Order.created_at.desc()).limit(100))
    return result.scalars().all()


@router.get("/mine", response_model=list[OrderOut])
async def list_my_orders(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Influencers see orders attributed to them.
    Vendors see orders for their vendor account.
    """
    if current_user.role == "influencer":
        inf_result = await db.execute(select(Influencer).where(Influencer.user_id == current_user.id))
        influencer = inf_result.scalar_one_or_none()
        if not influencer:
            return []
        result = await db.execute(
            select(Order)
            .where(Order.influencer_id == influencer.id)
            .order_by(Order.created_at.desc())
            .limit(50)
        )
        return result.scalars().all()

    # Vendor: sees their own orders
    vendor_result = await db.execute(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = vendor_result.scalar_one_or_none()
    if not vendor:
        return []
    result = await db.execute(
        select(Order).where(Order.vendor_id == vendor.id).order_by(Order.created_at.desc()).limit(100)
    )
    return result.scalars().all()


@router.get("/{order_id}", response_model=OrderOut)
async def get_order(
    order_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.patch("/{order_id}/status", response_model=OrderOut)
async def update_order_status(
    order_id: uuid.UUID,
    body: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    new_status = body.get("status")
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Vendors can only advance their own orders; admins can advance any
    if current_user.role not in ("admin", "operator"):
        vendor_result = await db.execute(select(Vendor).where(Vendor.user_id == current_user.id))
        vendor = vendor_result.scalar_one_or_none()
        if not vendor or order.vendor_id != vendor.id:
            raise HTTPException(status_code=403, detail="Not your order")

    allowed = VALID_TRANSITIONS.get(order.status, [])
    if new_status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot transition from '{order.status}' to '{new_status}'",
        )

    order.status = new_status

    # When delivered: generate commission record
    if new_status == "delivered":
        influencer_amt = (order.subtotal * Decimal(str(settings.DEFAULT_CREATOR_COMMISSION_RATE))).quantize(Decimal("0.01"))
        platform_amt = (order.subtotal * Decimal(str(settings.DEFAULT_PLATFORM_COMMISSION_RATE))).quantize(Decimal("0.01"))
        vendor_amt = order.subtotal - influencer_amt - platform_amt

        commission = Commission(
            order_id=order.id,
            influencer_amount=influencer_amt,
            platform_amount=platform_amt,
            vendor_amount=vendor_amt,
            commission_status="payable",
        )
        db.add(commission)

        db.add(AnalyticsEvent(
            actor_type="system",
            event_name="commission.created",
            entity_type="order",
            entity_id=order.id,
            payload_json={
                "influencer": str(influencer_amt),
                "platform": str(platform_amt),
                "vendor": str(vendor_amt),
            },
        ))

    # When refunded: reverse commission
    if new_status == "refunded":
        result2 = await db.execute(select(Commission).where(Commission.order_id == order.id))
        commission = result2.scalar_one_or_none()
        if commission and commission.commission_status != "reversed":
            commission.commission_status = "reversed"

    await db.commit()
    await db.refresh(order)
    return order
