from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from pydantic import BaseModel
from decimal import Decimal
from typing import Optional
import uuid

from app.core.database import get_db
from app.core.deps import require_admin_or_operator
from app.models.payout import Payout
from app.models.commission import Commission
from app.models.user import User

router = APIRouter()


class PayoutOut(BaseModel):
    id: uuid.UUID
    payee_type: str
    payee_id: uuid.UUID
    amount: Decimal
    currency: str
    status: str
    payment_method: Optional[str]

    class Config:
        from_attributes = True


@router.get("", response_model=list[PayoutOut])
async def list_payouts(
    current_user: User = Depends(require_admin_or_operator),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Payout).order_by(Payout.period_end.desc()).limit(100))
    return result.scalars().all()


@router.post("/run")
async def run_payouts(
    influencer_id: uuid.UUID,
    current_user: User = Depends(require_admin_or_operator),
    db: AsyncSession = Depends(get_db),
):
    """
    Aggregate all payable commissions for an influencer and create a payout batch.
    HUMAN APPROVAL REQUIRED before marking payout as processing.
    This endpoint only creates the payout record in 'pending' status.
    """
    result = await db.execute(
        select(Commission).where(Commission.commission_status == "payable")
    )
    commissions = result.scalars().all()

    if not commissions:
        return {"message": "No payable commissions found", "total": "0.00"}

    total = sum(c.influencer_amount for c in commissions)

    payout = Payout(
        payee_type="influencer",
        payee_id=influencer_id,
        amount=total,
        currency="GHS",
        status="pending",  # Requires human approval to move to 'processing'
    )
    db.add(payout)
    await db.flush()

    # Link commissions to this payout batch
    for commission in commissions:
        commission.payout_batch_id = payout.id
        commission.commission_status = "paid"

    await db.commit()
    await db.refresh(payout)

    return {
        "message": "Payout batch created — REQUIRES HUMAN APPROVAL before processing",
        "payout_id": str(payout.id),
        "total_GHS": str(total),
        "commission_count": len(commissions),
    }


@router.get("/{payout_id}", response_model=PayoutOut)
async def get_payout(
    payout_id: uuid.UUID,
    current_user: User = Depends(require_admin_or_operator),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Payout).where(Payout.id == payout_id))
    payout = result.scalar_one_or_none()
    if not payout:
        raise HTTPException(status_code=404, detail="Payout not found")
    return payout
