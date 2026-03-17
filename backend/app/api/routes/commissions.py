from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
import uuid

from app.core.database import get_db
from app.core.deps import require_admin_or_operator, get_current_user
from app.models.commission import Commission
from app.models.influencer import Influencer
from app.models.order import Order
from app.models.user import User
from pydantic import BaseModel
from decimal import Decimal


class CommissionOut(BaseModel):
    id: uuid.UUID
    order_id: uuid.UUID
    influencer_amount: Decimal
    platform_amount: Decimal
    vendor_amount: Decimal
    commission_status: str
    calculated_at: str

    class Config:
        from_attributes = True

    @classmethod
    def from_orm_with_iso(cls, obj: Commission) -> "CommissionOut":
        return cls(
            id=obj.id,
            order_id=obj.order_id,
            influencer_amount=obj.influencer_amount,
            platform_amount=obj.platform_amount,
            vendor_amount=obj.vendor_amount,
            commission_status=obj.commission_status,
            calculated_at=obj.calculated_at.isoformat(),
        )


router = APIRouter()


@router.get("/me", response_model=list[CommissionOut])
async def list_my_commissions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Influencer sees their own commissions."""
    inf_result = await db.execute(select(Influencer).where(Influencer.user_id == current_user.id))
    influencer = inf_result.scalar_one_or_none()
    if not influencer:
        return []

    result = await db.execute(
        select(Commission)
        .join(Order, Commission.order_id == Order.id)
        .where(Order.influencer_id == influencer.id)
        .order_by(Commission.calculated_at.desc())
        .limit(100)
    )
    commissions = result.scalars().all()
    return [CommissionOut.from_orm_with_iso(c) for c in commissions]


@router.get("", response_model=list[CommissionOut])
async def list_commissions(
    status_filter: Optional[str] = None,
    current_user: User = Depends(require_admin_or_operator),
    db: AsyncSession = Depends(get_db),
):
    query = select(Commission)
    if status_filter:
        query = query.where(Commission.commission_status == status_filter)
    result = await db.execute(query.order_by(Commission.calculated_at.desc()).limit(200))
    commissions = result.scalars().all()
    return [CommissionOut.from_orm_with_iso(c) for c in commissions]


@router.get("/order/{order_id}", response_model=CommissionOut)
async def get_commission_for_order(
    order_id: uuid.UUID,
    current_user: User = Depends(require_admin_or_operator),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Commission).where(Commission.order_id == order_id))
    commission = result.scalar_one_or_none()
    if not commission:
        return None
    return CommissionOut.from_orm_with_iso(commission)
