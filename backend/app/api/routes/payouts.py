from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from decimal import Decimal
from datetime import datetime, timezone
from typing import Optional
import uuid

from app.core.database import get_db
from app.core.deps import require_admin_or_operator, get_current_user
from app.models.payout import Payout
from app.models.commission import Commission
from app.models.influencer import Influencer
from app.models.order import Order
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
    external_reference: Optional[str] = None
    period_end: Optional[datetime] = None
    # Enriched fields (joined from influencers table)
    influencer_handle: Optional[str] = None
    influencer_momo: Optional[str] = None

    class Config:
        from_attributes = True


@router.get("", response_model=list[PayoutOut])
async def list_payouts(
    current_user: User = Depends(require_admin_or_operator),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Payout).order_by(Payout.period_end.desc()).limit(100))
    payouts = result.scalars().all()

    # Enrich with influencer handle + MoMo number
    enriched = []
    for payout in payouts:
        out = PayoutOut.model_validate(payout)
        if payout.payee_type == "influencer":
            inf_result = await db.execute(
                select(Influencer).where(Influencer.id == payout.payee_id)
            )
            influencer = inf_result.scalar_one_or_none()
            if influencer:
                out.influencer_handle = influencer.handle
                out.influencer_momo = influencer.payout_details_ref
        enriched.append(out)
    return enriched


@router.get("/mine", response_model=list[PayoutOut])
async def list_my_payouts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Influencer sees their own payout history."""
    inf_result = await db.execute(select(Influencer).where(Influencer.user_id == current_user.id))
    influencer = inf_result.scalar_one_or_none()
    if not influencer:
        return []
    result = await db.execute(
        select(Payout)
        .where(Payout.payee_type == "influencer", Payout.payee_id == influencer.id)
        .order_by(Payout.period_end.desc())
        .limit(20)
    )
    return result.scalars().all()


@router.post("/request")
async def request_payout(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Influencer requests a payout of all their payable commissions.
    Creates a payout record in 'pending' status — admin must approve before money moves.
    """
    inf_result = await db.execute(select(Influencer).where(Influencer.user_id == current_user.id))
    influencer = inf_result.scalar_one_or_none()
    if not influencer:
        raise HTTPException(status_code=404, detail="Influencer profile not found")

    # Find all payable commissions for this influencer's orders
    commissions_result = await db.execute(
        select(Commission)
        .join(Order, Commission.order_id == Order.id)
        .where(Order.influencer_id == influencer.id, Commission.commission_status == "payable")
    )
    commissions = commissions_result.scalars().all()

    if not commissions:
        raise HTTPException(status_code=400, detail="No payable commissions to request payout for")

    total = sum(c.influencer_amount for c in commissions)
    now = datetime.now(timezone.utc)

    payout = Payout(
        payee_type="influencer",
        payee_id=influencer.id,
        amount=total,
        currency="GHS",
        status="pending",
        period_end=now,
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
        "message": "Payout request submitted — admin will process within 1-2 business days",
        "payout_id": str(payout.id),
        "total_GHS": str(total),
        "commission_count": len(commissions),
    }


@router.post("/run")
async def run_payouts(
    influencer_id: uuid.UUID,
    current_user: User = Depends(require_admin_or_operator),
    db: AsyncSession = Depends(get_db),
):
    """
    Admin: aggregate all payable commissions for a specific influencer and create a payout batch.
    HUMAN APPROVAL REQUIRED before marking payout as processing.
    This endpoint only creates the payout record in 'pending' status.
    """
    commissions_result = await db.execute(
        select(Commission)
        .join(Order, Commission.order_id == Order.id)
        .where(Order.influencer_id == influencer_id, Commission.commission_status == "payable")
    )
    commissions = commissions_result.scalars().all()

    if not commissions:
        return {"message": "No payable commissions found for this influencer", "total": "0.00"}

    total = sum(c.influencer_amount for c in commissions)
    now = datetime.now(timezone.utc)

    payout = Payout(
        payee_type="influencer",
        payee_id=influencer_id,
        amount=total,
        currency="GHS",
        status="pending",
        period_end=now,
    )
    db.add(payout)
    await db.flush()

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


class PayoutStatusUpdate(BaseModel):
    status: str  # "completed" | "failed" | "processing"
    payment_method: Optional[str] = None
    external_reference: Optional[str] = None


@router.patch("/{payout_id}/status", response_model=PayoutOut)
async def update_payout_status(
    payout_id: uuid.UUID,
    body: PayoutStatusUpdate,
    current_user: User = Depends(require_admin_or_operator),
    db: AsyncSession = Depends(get_db),
):
    """Admin: mark a payout as completed, failed, or processing."""
    valid_statuses = {"pending", "processing", "completed", "failed"}
    if body.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Choose from: {valid_statuses}")

    result = await db.execute(select(Payout).where(Payout.id == payout_id))
    payout = result.scalar_one_or_none()
    if not payout:
        raise HTTPException(status_code=404, detail="Payout not found")

    payout.status = body.status
    if body.payment_method:
        payout.payment_method = body.payment_method
    if body.external_reference:
        payout.external_reference = body.external_reference

    # If marking failed: reverse commissions back to payable so influencer can request again
    if body.status == "failed":
        commissions_result = await db.execute(
            select(Commission).where(Commission.payout_batch_id == payout_id)
        )
        for commission in commissions_result.scalars().all():
            commission.commission_status = "payable"
            commission.payout_batch_id = None

    await db.commit()
    await db.refresh(payout)
    return payout
