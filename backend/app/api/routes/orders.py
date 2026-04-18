from fastapi import APIRouter, Depends, HTTPException, status, Header, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from decimal import Decimal
from pydantic import BaseModel
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
from app.services.notifications import send_order_notifications, send_order_status_notification, send_creator_order_notification, send_customer_order_confirmation

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
        # Decrement inventory; auto-deactivate when stock hits zero
        product.inventory_count -= quantity
        if product.inventory_count <= 0:
            product.inventory_count = 0
            product.status = "out_of_stock"

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

    # Resolve influencer handle + phone for notification (non-blocking)
    creator_handle = None
    creator_phone = None
    try:
        inf_result = await db.execute(select(Influencer).where(Influencer.id == influencer_id))
        influencer = inf_result.scalar_one_or_none()
        if influencer:
            creator_handle = influencer.handle
            # Use MoMo/payout number as WhatsApp target, fall back to user.phone
            creator_phone = influencer.payout_details_ref or None
            if not creator_phone and influencer.user:
                creator_phone = getattr(influencer.user, "phone", None)
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
        "creator_phone": creator_phone,
    }
    background_tasks.add_task(send_order_notifications, notification_data)
    background_tasks.add_task(send_creator_order_notification, notification_data)
    background_tasks.add_task(send_customer_order_confirmation, notification_data)

    return order


@router.get("")
async def list_orders(
    current_user: User = Depends(require_admin_or_operator),
    status_filter: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Admin: list all orders with items and product names."""
    query = select(Order)
    if status_filter:
        query = query.where(Order.status == status_filter)
    result = await db.execute(query.order_by(Order.created_at.desc()).limit(100))
    orders = result.scalars().all()

    if not orders:
        return []

    # Bulk-fetch all items for these orders + product names in one query
    order_ids = [o.id for o in orders]
    items_result = await db.execute(
        select(OrderItem, Product.name)
        .outerjoin(Product, Product.id == OrderItem.product_id)
        .where(OrderItem.order_id.in_(order_ids))
    )
    items_by_order: dict = {}
    for item, product_name in items_result.all():
        items_by_order.setdefault(item.order_id, []).append({
            "product_name": product_name or "Product",
            "quantity": item.quantity,
            "unit_price": str(item.unit_price),
            "line_total": str(item.line_total),
        })

    out = []
    for o in orders:
        d = {c.key: getattr(o, c.key) for c in o.__table__.columns}
        d["id"] = str(d["id"])
        d["subtotal"] = str(d["subtotal"])
        d["delivery_fee"] = str(d["delivery_fee"])
        d["total"] = str(d["total"])
        d["influencer_id"] = str(d["influencer_id"]) if d.get("influencer_id") else None
        d["vendor_id"] = str(d["vendor_id"]) if d.get("vendor_id") else None
        d["customer_id"] = str(d["customer_id"]) if d.get("customer_id") else None
        d["campaign_id"] = str(d["campaign_id"]) if d.get("campaign_id") else None
        d["created_at"] = o.created_at.isoformat() if o.created_at else None
        d["updated_at"] = o.updated_at.isoformat() if o.updated_at else None
        d["items"] = items_by_order.get(o.id, [])
        out.append(d)
    return out


@router.get("/mine")
async def list_my_orders(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Influencers see orders attributed to them (with items + product names).
    Vendors see orders for their vendor account (with items + product names).
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
        orders = result.scalars().all()
    else:
        # Vendor: sees their own orders
        vendor_result = await db.execute(select(Vendor).where(Vendor.user_id == current_user.id))
        vendor = vendor_result.scalar_one_or_none()
        if not vendor:
            return []
        result = await db.execute(
            select(Order).where(Order.vendor_id == vendor.id).order_by(Order.created_at.desc()).limit(100)
        )
        orders = result.scalars().all()

    if not orders:
        return []

    # Bulk-fetch items + product names in one query
    order_ids = [o.id for o in orders]
    items_result = await db.execute(
        select(OrderItem, Product.name)
        .outerjoin(Product, Product.id == OrderItem.product_id)
        .where(OrderItem.order_id.in_(order_ids))
    )
    items_by_order: dict = {}
    for item, product_name in items_result.all():
        items_by_order.setdefault(item.order_id, []).append({
            "product_name": product_name or "Product",
            "quantity": item.quantity,
            "unit_price": str(item.unit_price),
            "line_total": str(item.line_total),
        })

    out = []
    for o in orders:
        d = {c.key: getattr(o, c.key) for c in o.__table__.columns}
        d["id"] = str(d["id"])
        d["subtotal"] = str(d["subtotal"])
        d["delivery_fee"] = str(d["delivery_fee"])
        d["total"] = str(d["total"])
        d["influencer_id"] = str(d["influencer_id"]) if d.get("influencer_id") else None
        d["vendor_id"] = str(d["vendor_id"]) if d.get("vendor_id") else None
        d["customer_id"] = str(d["customer_id"]) if d.get("customer_id") else None
        d["campaign_id"] = str(d["campaign_id"]) if d.get("campaign_id") else None
        d["created_at"] = o.created_at.isoformat() if o.created_at else None
        d["updated_at"] = o.updated_at.isoformat() if o.updated_at else None
        d["items"] = items_by_order.get(o.id, [])
        out.append(d)
    return out


@router.get("/track")
async def track_order(
    order_id: uuid.UUID,
    phone: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Sprint XXVI: Public order tracking — no auth required.
    Customers look up their order by order_id + customer_phone.
    Returns a limited status view (no internal IDs, no PII beyond what the
    customer already knows).
    """
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Verify ownership: normalize both phones to digits only for comparison
    def digits_only(s: str) -> str:
        return "".join(c for c in (s or "") if c.isdigit())

    if digits_only(order.customer_phone) != digits_only(phone):
        raise HTTPException(status_code=404, detail="Order not found")

    # Resolve influencer handle for display
    creator_handle = None
    try:
        if order.influencer_id:
            inf_result = await db.execute(select(Influencer).where(Influencer.id == order.influencer_id))
            inf = inf_result.scalar_one_or_none()
            if inf:
                creator_handle = inf.handle
    except Exception:
        pass

    # Load order items with product names
    items_result = await db.execute(
        select(OrderItem, Product.name).outerjoin(
            Product, Product.id == OrderItem.product_id
        ).where(OrderItem.order_id == order.id)
    )
    items_with_names = items_result.all()

    STATUS_MESSAGES = {
        "pending":    ("Your order has been received.", "We are reviewing it now."),
        "confirmed":  ("Order confirmed!", "We have confirmed your order and are preparing it."),
        "processing": ("Being prepared.", "Your items are being packed and checked."),
        "shipped":    ("On its way!", "Your order has been dispatched. Expect delivery within 24-72 hours."),
        "delivered":  ("Delivered!", "Your order has been delivered. Enjoy your purchase!"),
        "cancelled":  ("Order cancelled.", "This order has been cancelled. Contact us on WhatsApp if you have questions."),
        "refunded":   ("Refunded.", "A refund has been processed for this order."),
    }
    status_msg, status_detail = STATUS_MESSAGES.get(order.status, ("Status unknown.", ""))

    return {
        "order_id": str(order.id),
        "order_id_short": str(order.id)[:8].upper(),
        "status": order.status,
        "status_message": status_msg,
        "status_detail": status_detail,
        "customer_name": order.customer_name,
        "total": str(order.total),
        "currency": order.currency,
        "delivery_address": order.delivery_address,
        "creator_handle": creator_handle,
        "created_at": order.created_at.isoformat() if order.created_at else None,
        "updated_at": order.updated_at.isoformat() if order.updated_at else None,
        "items": [
            {
                "product_name": product_name or "Product",
                "quantity": item.quantity,
                "unit_price": str(item.unit_price),
                "line_total": str(item.line_total),
            }
            for item, product_name in items_with_names
        ],
    }

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
    background_tasks: BackgroundTasks,
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

    # Notify customer via WhatsApp on shipped + delivered
    if new_status in ("shipped", "delivered"):
        # Grab influencer handle for the message
        inf_handle = ""
        if order.influencer_id:
            inf_result = await db.execute(select(Influencer).where(Influencer.id == order.influencer_id))
            inf = inf_result.scalar_one_or_none()
            if inf:
                inf_handle = inf.handle

        # Grab first item name for context
        items_result = await db.execute(
            select(Product.name)
            .join(OrderItem, OrderItem.product_id == Product.id)
            .where(OrderItem.order_id == order.id)
            .limit(1)
        )
        first_item_name = items_result.scalar_one_or_none() or "your item"

        background_tasks.add_task(send_order_status_notification, {
            "order_id": str(order.id),
            "customer_name": order.customer_name,
            "customer_phone": order.customer_phone,
            "new_status": new_status,
            "creator_handle": inf_handle,
            "product_name": first_item_name,
        })

    return order


# ---------------------------------------------------------------------------
# Sprint XXII: Payment initialization for an existing order
# ---------------------------------------------------------------------------
# Sprint LI: Admin order notes
# ---------------------------------------------------------------------------

class OrderNotesUpdate(BaseModel):
    notes: str


@router.patch("/{order_id}/notes")
async def update_order_notes(
    order_id: uuid.UUID,
    body: OrderNotesUpdate,
    current_user: User = Depends(require_admin_or_operator),
    db: AsyncSession = Depends(get_db),
):
    """Admin: set or clear internal notes on an order."""
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.admin_notes = body.notes.strip() or None
    await db.commit()
    return {"id": str(order.id), "admin_notes": order.admin_notes}


# ---------------------------------------------------------------------------

from pydantic import BaseModel as _PayBaseModel
from typing import Optional as _Opt

class OrderPayRequest(_PayBaseModel):
    method_id: str
    email: str
    phone: _Opt[str] = None
    callback_url: _Opt[str] = None


@router.post('/{order_id}/pay')
async def initiate_payment(
    order_id: uuid.UUID,
    body: OrderPayRequest,
    db: AsyncSession = Depends(get_db),
):
    from app.services.payments import initialize_payment, PAYSTACK_SECRET

    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail='Order not found')

    if order.status not in ('pending', 'confirmed'):
        raise HTTPException(status_code=400, detail='Order is not payable in current status')

    if body.method_id == 'pay_on_delivery':
        return {
            'provider': 'cod',
            'status': 'pending_delivery',
            'message': "Pay on delivery — we'll collect cash or MoMo when your order arrives.",
            'order_id': str(order.id),
        }

    if not PAYSTACK_SECRET and body.method_id in ('card', 'mtn_momo_gh', 'telecel_cash', 'airtel_money_gh', 'bank_transfer'):
        raise HTTPException(
            status_code=503,
            detail='Online payments not yet configured. Please use Pay on Delivery.',
        )

    try:
        payment = await initialize_payment(
            order_id=str(order.id),
            email=body.email,
            amount=Decimal(str(order.total)),
            currency=order.currency,
            country_code='GH',
            method_id=body.method_id,
            phone=body.phone,
            callback_url=body.callback_url,
            metadata={
                'order_id': str(order.id),
                'customer_name': order.customer_name,
                'customer_phone': order.customer_phone,
            },
        )
        return {
            'provider': payment.get('provider'),
            'redirect_url': payment.get('redirect_url'),
            'reference': payment.get('reference'),
            'order_id': str(order.id),
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f'Payment provider error: {exc}')
