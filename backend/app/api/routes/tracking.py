"""Tracking links — attribution for TikTok / social posts.

Endpoints:
  POST /tracking/links          — creator generates a new link
  GET  /tracking/links          — creator lists their links
  GET  /tracking/r/{code}       — public redirect (logs click, redirects)
  GET  /tracking/links/stats    — admin: all link stats
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
import uuid
import random
import string
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.deps import get_current_user, require_admin_or_operator
from app.models.tracking_link import TrackingLink
from app.models.influencer import Influencer
from app.models.analytics import AnalyticsEvent
from app.models.user import User
from app.core.config import settings

router = APIRouter()

STOREFRONT_BASE = ""   # resolved at runtime from settings or env; falls back to relative


def _gen_code(length: int = 8) -> str:
    chars = string.ascii_letters + string.digits
    return "".join(random.choices(chars, k=length))


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class TrackingLinkCreate(BaseModel):
    label: Optional[str] = None
    campaign_id: Optional[uuid.UUID] = None
    destination_path: Optional[str] = None   # defaults to /<handle>
    expires_at: Optional[datetime] = None


class TrackingLinkOut(BaseModel):
    id: uuid.UUID
    code: str
    label: Optional[str]
    destination_path: str
    click_count: int
    is_active: bool
    created_at: datetime
    short_url: str                            # convenience — full redirect URL

    class Config:
        from_attributes = True


def _build_short_url(request: Request, code: str) -> str:
    base = str(request.base_url).rstrip("/")
    return f"{base}/tracking/r/{code}"


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/links", response_model=TrackingLinkOut, status_code=201)
async def create_link(
    body: TrackingLinkCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Creator (influencer) creates a new attribution link."""
    inf_result = await db.execute(
        select(Influencer).where(Influencer.user_id == current_user.id)
    )
    influencer = inf_result.scalar_one_or_none()
    if not influencer:
        raise HTTPException(status_code=403, detail="Not an influencer account")

    # Default destination: the creator's storefront
    destination = body.destination_path or f"/{influencer.handle}"

    # Generate a unique code (retry on collision)
    for _ in range(5):
        code = _gen_code()
        existing = await db.execute(select(TrackingLink).where(TrackingLink.code == code))
        if not existing.scalar_one_or_none():
            break

    link = TrackingLink(
        code=code,
        influencer_id=influencer.id,
        campaign_id=body.campaign_id,
        label=body.label or f"Link {datetime.now(timezone.utc).strftime('%Y-%m-%d')}",
        destination_path=destination,
        expires_at=body.expires_at,
    )
    db.add(link)
    await db.commit()
    await db.refresh(link)

    result = TrackingLinkOut.model_validate(link)
    result.short_url = _build_short_url(request, link.code)
    return result


@router.get("/links", response_model=list[TrackingLinkOut])
async def list_my_links(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Creator lists their own tracking links."""
    inf_result = await db.execute(
        select(Influencer).where(Influencer.user_id == current_user.id)
    )
    influencer = inf_result.scalar_one_or_none()
    if not influencer:
        return []

    result = await db.execute(
        select(TrackingLink)
        .where(TrackingLink.influencer_id == influencer.id)
        .order_by(TrackingLink.created_at.desc())
    )
    links = result.scalars().all()
    out = []
    for lnk in links:
        item = TrackingLinkOut.model_validate(lnk)
        item.short_url = _build_short_url(request, lnk.code)
        out.append(item)
    return out


@router.get("/r/{code}")
async def redirect_link(
    code: str,
    request: Request,
    ref: Optional[str] = None,
    utm_source: Optional[str] = None,
    utm_medium: Optional[str] = None,
    utm_campaign: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Public redirect endpoint. Logs click then sends viewer to storefront."""
    result = await db.execute(
        select(TrackingLink).where(TrackingLink.code == code, TrackingLink.is_active == True)
    )
    link = result.scalar_one_or_none()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found or inactive")

    if link.expires_at and link.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=410, detail="Link has expired")

    # Increment click counter
    link.click_count += 1

    # Log analytics event (non-blocking — best effort)
    db.add(AnalyticsEvent(
        actor_type="external",
        event_name="link.clicked",
        entity_type="tracking_link",
        entity_id=link.id,
        payload_json={
            "code": code,
            "ref": ref,
            "utm_source": utm_source or "tiktok",
            "utm_medium": utm_medium or "social",
            "utm_campaign": utm_campaign,
            "influencer_id": str(link.influencer_id),
            "ip": request.client.host if request.client else None,
            "user_agent": request.headers.get("user-agent"),
        },
    ))
    await db.commit()

    # Build redirect URL — append ref/UTMs so storefront can read them
    dest = link.destination_path
    params = []
    if ref or code:
        params.append(f"ref={ref or code}")
    if utm_source:
        params.append(f"utm_source={utm_source}")
    if utm_medium:
        params.append(f"utm_medium={utm_medium}")
    if utm_campaign:
        params.append(f"utm_campaign={utm_campaign}")
    if params:
        sep = "&" if "?" in dest else "?"
        dest = dest + sep + "&".join(params)

    # Redirect to frontend (Next.js storefront on same domain or configured base)
    frontend_base = getattr(settings, "FRONTEND_URL", "http://localhost:3000")
    return RedirectResponse(url=f"{frontend_base}{dest}", status_code=302)


@router.get("/links/all", response_model=list[TrackingLinkOut])
async def list_all_links(
    request: Request,
    current_user: User = Depends(require_admin_or_operator),
    db: AsyncSession = Depends(get_db),
):
    """Admin: see all tracking links with click counts."""
    result = await db.execute(
        select(TrackingLink).order_by(TrackingLink.click_count.desc()).limit(200)
    )
    links = result.scalars().all()
    out = []
    for lnk in links:
        item = TrackingLinkOut.model_validate(lnk)
        item.short_url = _build_short_url(request, lnk.code)
        out.append(item)
    return out


@router.patch("/links/{link_id}/deactivate", status_code=200)
async def deactivate_link(
    link_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Creator or admin deactivates a link."""
    result = await db.execute(select(TrackingLink).where(TrackingLink.id == link_id))
    link = result.scalar_one_or_none()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")

    if current_user.role not in ("admin", "operator"):
        inf_result = await db.execute(
            select(Influencer).where(Influencer.user_id == current_user.id)
        )
        influencer = inf_result.scalar_one_or_none()
        if not influencer or link.influencer_id != influencer.id:
            raise HTTPException(status_code=403, detail="Not your link")

    link.is_active = False
    await db.commit()
    return {"status": "deactivated"}
