from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
import uuid

from app.core.database import get_db
from app.core.deps import require_admin_or_operator, get_current_user
from app.core.security import hash_password
from app.models.influencer import Influencer
from app.models.user import User

router = APIRouter()


class InfluencerCreate(BaseModel):
    name: str
    email: str
    password: str
    handle: str
    platform_name: str = "tiktok"
    audience_region: str = "Africa"
    payout_method: Optional[str] = None


class InfluencerUpdate(BaseModel):
    handle: Optional[str] = None
    payout_method: Optional[str] = None
    payout_details_ref: Optional[str] = None
    status: Optional[str] = None


class InfluencerOut(BaseModel):
    id: uuid.UUID
    handle: str
    platform_name: str
    audience_region: str
    payout_method: Optional[str]
    status: str
    template_id: Optional[str] = "glow"
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True


class TemplateUpdate(BaseModel):
    template_id: str


class ProfileUpdate(BaseModel):
    bio: Optional[str] = None
    avatar_url: Optional[str] = None


@router.get("/me", response_model=InfluencerOut)
async def get_my_influencer_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Influencer sees their own profile (handle, template, bio, etc.)"""
    result = await db.execute(select(Influencer).where(Influencer.user_id == current_user.id))
    influencer = result.scalar_one_or_none()
    if not influencer:
        raise HTTPException(status_code=404, detail="Influencer profile not found")
    return influencer


@router.patch("/me/template", response_model=InfluencerOut)
async def update_my_template(
    body: TemplateUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Influencer sets their storefront template."""
    valid_templates = {"glow", "kente", "noir", "bloom"}
    if body.template_id not in valid_templates:
        raise HTTPException(status_code=400, detail=f"Invalid template. Choose from: {', '.join(valid_templates)}")

    result = await db.execute(select(Influencer).where(Influencer.user_id == current_user.id))
    influencer = result.scalar_one_or_none()
    if not influencer:
        raise HTTPException(status_code=404, detail="Influencer profile not found")

    influencer.template_id = body.template_id
    await db.commit()
    await db.refresh(influencer)
    return influencer


@router.patch("/me/profile", response_model=InfluencerOut)
async def update_my_profile(
    body: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Influencer updates their bio and/or avatar URL."""
    result = await db.execute(select(Influencer).where(Influencer.user_id == current_user.id))
    influencer = result.scalar_one_or_none()
    if not influencer:
        raise HTTPException(status_code=404, detail="Influencer profile not found")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(influencer, field, value)

    await db.commit()
    await db.refresh(influencer)
    return influencer


@router.get("", response_model=list[InfluencerOut])
async def list_influencers(
    handle: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """List influencers. Optionally filter by handle (public storefront lookup)."""
    query = select(Influencer)
    if handle:
        query = query.where(Influencer.handle == handle)
    result = await db.execute(query)
    influencers = result.scalars().all()
    if handle and not influencers:
        raise HTTPException(status_code=404, detail="Creator not found")
    return influencers


@router.post("", response_model=InfluencerOut, status_code=status.HTTP_201_CREATED)
async def create_influencer(
    body: InfluencerCreate,
    current_user: User = Depends(require_admin_or_operator),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        role="influencer",
        name=body.name,
        email=body.email,
        hashed_password=hash_password(body.password),
    )
    db.add(user)
    await db.flush()

    influencer = Influencer(
        user_id=user.id,
        handle=body.handle,
        platform_name=body.platform_name,
        audience_region=body.audience_region,
        payout_method=body.payout_method,
    )
    db.add(influencer)
    await db.commit()
    await db.refresh(influencer)
    return influencer


@router.get("/{influencer_id}", response_model=InfluencerOut)
async def get_influencer(
    influencer_id: uuid.UUID,
    current_user: User = Depends(require_admin_or_operator),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Influencer).where(Influencer.id == influencer_id))
    influencer = result.scalar_one_or_none()
    if not influencer:
        raise HTTPException(status_code=404, detail="Influencer not found")
    return influencer


@router.patch("/{influencer_id}", response_model=InfluencerOut)
async def update_influencer(
    influencer_id: uuid.UUID,
    body: InfluencerUpdate,
    current_user: User = Depends(require_admin_or_operator),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Influencer).where(Influencer.id == influencer_id))
    influencer = result.scalar_one_or_none()
    if not influencer:
        raise HTTPException(status_code=404, detail="Influencer not found")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(influencer, field, value)

    await db.commit()
    await db.refresh(influencer)
    return influencer
