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
from app.schemas.product import ProductCreate, ProductUpdate, ProductOut

router = APIRouter()


@router.get("", response_model=list[ProductOut])
async def list_products(
    category: Optional[str] = Query(None),
    vendor_id: Optional[uuid.UUID] = Query(None),
    status: Optional[str] = Query("active"),
    search: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    db: AsyncSession = Depends(get_db),
):
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
    return result.scalars().all()


@router.get("/mine", response_model=list[ProductOut])
async def list_my_products(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Vendor sees their own products."""
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
    vendor_id: uuid.UUID = Query(..., description="Vendor this product belongs to"),
    current_user: User = Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    product = Product(vendor_id=vendor_id, **body.model_dump())
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
