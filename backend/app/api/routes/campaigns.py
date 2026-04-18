from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid

from app.core.database import get_db
from app.core.deps import require_admin_or_operator, get_current_user
from app.models.campaign import Campaign, ProductCampaignLink
from app.models.influencer import Influencer
from app.models.product import Product
from app.models.user import User
from app.schemas.product import ProductOut

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


@router.get("/by-influencer/{influencer_id}", response_model=list[CampaignOut])
async def get_campaigns_for_influencer(
    influencer_id: uuid.UUID,
    current_user: User = Depends(require_admin_or_operator),
    db: AsyncSession = Depends(get_db),
):
    """Admin: list all campaigns for a given influencer."""
    result = await db.execute(
        select(Campaign).where(Campaign.influencer_id == influencer_id)
    )
    return result.scalars().all()


@router.post("/{campaign_id}/products", status_code=status.HTTP_201_CREATED)
async def add_product_to_campaign(
    campaign_id: uuid.UUID,
    body: AddProductRequest,
    current_user: User = Depends(require_admin_or_operator),
    db: AsyncSession = Depends(get_db),
):
    # Check not already linked
    existing_result = await db.execute(
        select(ProductCampaignLink).where(
            and_(
                ProductCampaignLink.campaign_id == campaign_id,
                ProductCampaignLink.product_id == body.product_id,
            )
        )
    )
    if existing_result.scalar_one_or_none():
        return {"message": "Product already in campaign"}

    link = ProductCampaignLink(
        campaign_id=campaign_id,
        product_id=body.product_id,
        featured_rank=body.featured_rank,
    )
    db.add(link)
    await db.commit()
    return {"message": "Product added to campaign"}


@router.get("/{campaign_id}/products", response_model=list[ProductOut])
async def list_campaign_products(
    campaign_id: uuid.UUID,
    current_user: User = Depends(require_admin_or_operator),
    db: AsyncSession = Depends(get_db),
):
    """Admin: list products assigned to a campaign."""
    result = await db.execute(
        select(Product)
        .join(ProductCampaignLink, ProductCampaignLink.product_id == Product.id)
        .where(
            and_(
                ProductCampaignLink.campaign_id == campaign_id,
                ProductCampaignLink.active == True,
            )
        )
        .order_by(ProductCampaignLink.featured_rank, Product.name)
    )
    return result.scalars().all()


@router.delete("/{campaign_id}/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_product_from_campaign(
    campaign_id: uuid.UUID,
    product_id: uuid.UUID,
    current_user: User = Depends(require_admin_or_operator),
    db: AsyncSession = Depends(get_db),
):
    """Admin: remove (deactivate) a product from a campaign."""
    result = await db.execute(
        select(ProductCampaignLink).where(
            and_(
                ProductCampaignLink.campaign_id == campaign_id,
                ProductCampaignLink.product_id == product_id,
            )
        )
    )
    link = result.scalar_one_or_none()
    if not link:
        raise HTTPException(status_code=404, detail="Product not in campaign")
    link.active = False
    await db.commit()


@router.post("/ensure-for-influencer", response_model=CampaignOut, status_code=status.HTTP_200_OK)
async def ensure_campaign_for_influencer(
    body: CampaignCreate,
    current_user: User = Depends(require_admin_or_operator),
    db: AsyncSession = Depends(get_db),
):
    """Admin: get-or-create the default campaign for an influencer. Returns existing if found."""
    result = await db.execute(
        select(Campaign).where(Campaign.influencer_id == body.influencer_id)
    )
    existing = result.scalar_one_or_none()
    if existing:
        return existing
    campaign = Campaign(**body.model_dump())
    db.add(campaign)
    await db.commit()
    await db.refresh(campaign)
    return campaign


@router.get("/product-categories")
async def list_product_categories(
    current_user: User = Depends(require_admin_or_operator),
    db: AsyncSession = Depends(get_db),
):
    """Admin: return list of {category, count} for all active products, sorted by count desc."""
    result = await db.execute(
        select(Product.category, func.count(Product.id).label("cnt"))
        .where(Product.status == "active")
        .group_by(Product.category)
        .order_by(func.count(Product.id).desc())
    )
    return [{"category": row[0], "count": row[1]} for row in result.all()]


class BulkCategoryRequest(BaseModel):
    category: str


@router.post("/{campaign_id}/products/bulk-category")
async def bulk_assign_by_category(
    campaign_id: uuid.UUID,
    body: BulkCategoryRequest,
    current_user: User = Depends(require_admin_or_operator),
    db: AsyncSession = Depends(get_db),
):
    """Admin: assign all active products in a category to a campaign in one operation.
    Already-linked products are skipped. Returns assigned + skipped counts.
    """
    # Verify campaign exists
    cp_result = await db.execute(select(Campaign).where(Campaign.id == campaign_id))
    if not cp_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Campaign not found")

    # Fetch all active products in this category (no limit — server-side bulk op)
    prod_result = await db.execute(
        select(Product.id).where(
            and_(
                func.lower(Product.category) == body.category.lower(),
                Product.status == "active",
            )
        )
    )
    product_ids = [row[0] for row in prod_result.all()]

    if not product_ids:
        return {"assigned": 0, "skipped": 0, "total_in_category": 0}

    # Fetch already-linked product IDs for this campaign
    linked_result = await db.execute(
        select(ProductCampaignLink.product_id).where(
            ProductCampaignLink.campaign_id == campaign_id
        )
    )
    already_linked = {row[0] for row in linked_result.all()}

    assigned = 0
    skipped = 0
    for pid in product_ids:
        if pid in already_linked:
            skipped += 1
            continue
        db.add(ProductCampaignLink(
            campaign_id=campaign_id,
            product_id=pid,
            featured_rank=0,
        ))
        assigned += 1

    if assigned > 0:
        await db.commit()

    return {"assigned": assigned, "skipped": skipped, "total_in_category": len(product_ids)}
