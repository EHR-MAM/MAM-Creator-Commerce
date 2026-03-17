from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid

from app.core.database import get_db
from app.core.deps import require_admin_or_operator
from app.models.campaign import Campaign, ProductCampaignLink
from app.models.user import User

router = APIRouter()


class CampaignCreate(BaseModel):
    influencer_id: uuid.UUID
    name: str
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None


class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None


class CampaignOut(BaseModel):
    id: uuid.UUID
    influencer_id: uuid.UUID
    name: str
    status: str
    start_at: Optional[datetime]
    end_at: Optional[datetime]

    class Config:
        from_attributes = True


class AddProductRequest(BaseModel):
    product_id: uuid.UUID
    featured_rank: int = 0


@router.get("", response_model=list[CampaignOut])
async def list_campaigns(
    current_user: User = Depends(require_admin_or_operator),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Campaign))
    return result.scalars().all()


@router.post("", response_model=CampaignOut, status_code=status.HTTP_201_CREATED)
async def create_campaign(
    body: CampaignCreate,
    current_user: User = Depends(require_admin_or_operator),
    db: AsyncSession = Depends(get_db),
):
    campaign = Campaign(**body.model_dump())
    db.add(campaign)
    await db.commit()
    await db.refresh(campaign)
    return campaign


@router.patch("/{campaign_id}", response_model=CampaignOut)
async def update_campaign(
    campaign_id: uuid.UUID,
    body: CampaignUpdate,
    current_user: User = Depends(require_admin_or_operator),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Campaign).where(Campaign.id == campaign_id))
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(campaign, field, value)

    await db.commit()
    await db.refresh(campaign)
    return campaign


@router.post("/{campaign_id}/products", status_code=status.HTTP_201_CREATED)
async def add_product_to_campaign(
    campaign_id: uuid.UUID,
    body: AddProductRequest,
    current_user: User = Depends(require_admin_or_operator),
    db: AsyncSession = Depends(get_db),
):
    link = ProductCampaignLink(
        campaign_id=campaign_id,
        product_id=body.product_id,
        featured_rank=body.featured_rank,
    )
    db.add(link)
    await db.commit()
    return {"message": "Product added to campaign"}
