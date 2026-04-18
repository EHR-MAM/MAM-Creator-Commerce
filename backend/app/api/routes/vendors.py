from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid

from app.core.database import get_db
from app.core.deps import require_admin_or_operator, get_current_user
from app.core.security import hash_password
from app.models.vendor import Vendor
from app.models.user import User
from app.schemas.vendor import VendorCreate, VendorUpdate, VendorOut

router = APIRouter()


@router.get("")
async def list_vendors(
    current_user: User = Depends(require_admin_or_operator),
    db: AsyncSession = Depends(get_db),
):
    """Admin: list all vendors (all statuses) enriched with user email."""
    result = await db.execute(
        select(Vendor, User.email)
        .outerjoin(User, User.id == Vendor.user_id)
        .order_by(Vendor.business_name)
    )
    rows = result.all()
    out = []
    for vendor, email in rows:
        d = {c.key: getattr(vendor, c.key) for c in vendor.__table__.columns}
        d["id"] = str(d["id"])
        d["user_id"] = str(d["user_id"]) if d.get("user_id") else None
        d["email"] = email
        out.append(d)
    return out


@router.get("/me", response_model=VendorOut)
async def get_my_vendor(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Vendor: return own vendor profile (used by frontend to resolve vendor_id)."""
    result = await db.execute(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = result.scalar_one_or_none()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    return vendor


@router.patch("/me", response_model=VendorOut)
async def update_my_vendor(
    body: VendorUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Vendor: update own profile (business_name, contact_name, contact_phone, location)."""
    result = await db.execute(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = result.scalar_one_or_none()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    allowed = {"business_name", "location", "contact_name", "contact_phone"}
    for field, value in body.model_dump(exclude_unset=True).items():
        if field in allowed:
            setattr(vendor, field, value)
    await db.commit()
    await db.refresh(vendor)
    return vendor


@router.get("/{vendor_id}", response_model=VendorOut)
async def get_vendor(
    vendor_id: uuid.UUID,
    current_user: User = Depends(require_admin_or_operator),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Vendor).where(Vendor.id == vendor_id))
    vendor = result.scalar_one_or_none()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return vendor


@router.post("", response_model=VendorOut, status_code=status.HTTP_201_CREATED)
async def create_vendor(
    body: VendorCreate,
    current_user: User = Depends(require_admin_or_operator),
    db: AsyncSession = Depends(get_db),
):
    # Check email not already taken
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        role="vendor",
        name=body.business_name,
        email=body.email,
        hashed_password=hash_password(body.password),
    )
    db.add(user)
    await db.flush()  # get user.id before committing

    vendor = Vendor(
        user_id=user.id,
        business_name=body.business_name,
        location=body.location,
        contact_name=body.contact_name,
        contact_phone=body.contact_phone,
        fulfillment_sla_hours=body.fulfillment_sla_hours,
    )
    db.add(vendor)
    await db.commit()
    await db.refresh(vendor)
    return vendor


@router.patch("/{vendor_id}", response_model=VendorOut)
async def update_vendor(
    vendor_id: uuid.UUID,
    body: VendorUpdate,
    current_user: User = Depends(require_admin_or_operator),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Vendor).where(Vendor.id == vendor_id))
    vendor = result.scalar_one_or_none()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(vendor, field, value)

    await db.commit()
    await db.refresh(vendor)
    return vendor
