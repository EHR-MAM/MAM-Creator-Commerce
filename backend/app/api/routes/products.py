from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
import uuid

from app.core.database import get_db
from app.core.deps import require_vendor, get_current_user
from app.models.product import Product
from app.models.vendor import Vendor
from app.models.user import User
from app.models.influencer import Influencer
from app.models.campaign import Campaign, ProductCampaignLink
from app.schemas.product import ProductCreate, ProductUpdate, ProductOut

router = APIRouter()


async def _build_handle_map(product_ids: list, db: AsyncSession) -> dict:
    """Return {product_id: creator_handle} for all products that appear in active campaigns."""
    if not product_ids:
        return {}
    rows = await db.execute(
        select(ProductCampaignLink.product_id, Influencer.handle)
        .join(Campaign, Campaign.id == ProductCampaignLink.campaign_id)
        .join(Influencer, Influencer.id == Campaign.influencer_id)
        .where(ProductCampaignLink.product_id.in_(product_ids))
        .where(ProductCampaignLink.active == True)
    )
    # First handle wins per product
    result: dict = {}
    for product_id, handle in rows.all():
        if product_id not in result:
            result[product_id] = handle
    return result


def _enrich(products: list, handle_map: dict) -> list[dict]:
    """Add creator_handle field to each product dict."""
    out = []
    for p in products:
        d = {c.key: getattr(p, c.key) for c in p.__table__.columns}
        d["creator_handle"] = handle_map.get(p.id)
        out.append(d)
    return out


@router.get("", response_model=list[ProductOut])
async def list_products(
    category: Optional[str] = Query(None),
    vendor_id: Optional[uuid.UUID] = Query(None),
    influencer_id: Optional[uuid.UUID] = Query(None),
    status: Optional[str] = Query("active"),
    search: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    db: AsyncSession = Depends(get_db),
):
    # influencer_id filter: return only products assigned to that influencer via campaigns
    if influencer_id:
        links_result = await db.execute(
            select(ProductCampaignLink.product_id)
            .join(Campaign, Campaign.id == ProductCampaignLink.campaign_id)
            .where(Campaign.influencer_id == influencer_id)
            .where(ProductCampaignLink.active == True)
        )
        product_ids = [row[0] for row in links_result.all()]
        if not product_ids:
            return []
        query = select(Product).where(Product.id.in_(product_ids))
        if status:
            query = query.where(Product.status == status)
        if category:
            query = query.where(Product.category == category)
        query = query.order_by(Product.name).offset(offset).limit(limit)
        result = await db.execute(query)
        products = result.scalars().all()
        handle_map = await _build_handle_map([p.id for p in products], db)
        return _enrich(products, handle_map)

    query = select(Product)
    if status:
        query = query.where(Product.status == status)
    if category:
        query = query.where(Product.category == category)
    if vendor_id:
        query = query.where(Product.vendor_id == vendor_id)
    if search:
        query = query.where(Product.name.ilike(f"%{search}%"))
    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    products = result.scalars().all()
    handle_map = await _build_handle_map([p.id for p in products], db)
    return _enrich(products, handle_map)


@router.get("/mine", response_model=list[ProductOut])
async def list_my_products(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Vendor sees their own products. Influencer sees products assigned via their campaigns."""
    if current_user.role == "influencer":
        influencer_result = await db.execute(
            select(Influencer).where(Influencer.user_id == current_user.id)
        )
        influencer = influencer_result.scalar_one_or_none()
        if not influencer:
            return []
        # Get all active product_ids linked to influencer's campaigns
        links_result = await db.execute(
            select(ProductCampaignLink.product_id)
            .join(Campaign, Campaign.id == ProductCampaignLink.campaign_id)
            .where(Campaign.influencer_id == influencer.id)
            .where(ProductCampaignLink.active == True)
        )
        product_ids = [row[0] for row in links_result.all()]
        if not product_ids:
            return []
        result = await db.execute(
            select(Product).where(Product.id.in_(product_ids)).order_by(Product.name)
        )
        return result.scalars().all()

    # Vendor: return their own products
    vendor_result = await db.execute(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = vendor_result.scalar_one_or_none()
    if not vendor:
        return []
    result = await db.execute(select(Product).where(Product.vendor_id == vendor.id).order_by(Product.name))
    return result.scalars().all()


@router.get("/{product_id}", response_model=ProductOut)
async def get_product(product_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
async def create_product(
    body: ProductCreate,
    vendor_id: Optional[uuid.UUID] = Query(None, description="Vendor this product belongs to"),
    current_user: User = Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    effective_vendor_id = vendor_id or body.vendor_id
    if not effective_vendor_id:
        raise HTTPException(status_code=422, detail="vendor_id required")
    product = Product(vendor_id=effective_vendor_id, **{k: v for k, v in body.model_dump().items() if k != "vendor_id"})
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product


@router.patch("/{product_id}", response_model=ProductOut)
async def update_product(
    product_id: uuid.UUID,
    body: ProductUpdate,
    current_user: User = Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(product, field, value)

    await db.commit()
    await db.refresh(product)
    return product
