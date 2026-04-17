from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, cast, Date, text
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta, timezone
import uuid

from app.core.database import get_db
from app.core.deps import require_admin_or_operator, get_current_user
from app.models.analytics import AnalyticsEvent
from app.models.influencer import Influencer
from app.models.order import Order
from app.models.commission import Commission
from app.models.user import User

router = APIRouter()


class EventIn(BaseModel):
    event_name: str
    entity_type: Optional[str] = None
    entity_id: Optional[uuid.UUID] = None
    payload: Optional[dict] = None


@router.post("/events", status_code=201)
async def ingest_event(body: EventIn, db: AsyncSession = Depends(get_db)):
    event = AnalyticsEvent(
        actor_type="external",
        event_name=body.event_name,
        entity_type=body.entity_type,
        entity_id=body.entity_id,
        payload_json=body.payload,
    )
    db.add(event)
    await db.commit()
    return {"status": "recorded"}


@router.get("/reports/kpis")
async def get_kpis(
    current_user: User = Depends(require_admin_or_operator),
    db: AsyncSession = Depends(get_db),
):
    total_orders = await db.execute(select(func.count(Order.id)))
    delivered_orders = await db.execute(select(func.count(Order.id)).where(Order.status == "delivered"))
    total_gmv = await db.execute(select(func.sum(Order.total)).where(Order.status == "delivered"))
    payable_commissions = await db.execute(
        select(func.sum(Commission.influencer_amount)).where(Commission.commission_status == "payable")
    )

    total_count = total_orders.scalar() or 0
    delivered_count = delivered_orders.scalar() or 0

    return {
        "total_orders": total_count,
        "delivered_orders": delivered_count,
        "total_gmv_GHS": str(total_gmv.scalar() or 0),
        "payable_creator_commissions_GHS": str(payable_commissions.scalar() or 0),
        "delivery_success_rate": round(delivered_count / (total_count or 1) * 100, 1),
    }


@router.get("/reports/kpis/me")
async def get_my_kpis(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Influencer sees their own KPI summary."""
    inf_result = await db.execute(select(Influencer).where(Influencer.user_id == current_user.id))
    influencer = inf_result.scalar_one_or_none()
    if not influencer:
        return {
            "total_orders": 0, "delivered_orders": 0,
            "total_influencer_earnings": "0.00",
            "pending_commission": "0.00", "paid_out": "0.00", "currency": "GHS",
        }

    total = await db.execute(select(func.count(Order.id)).where(Order.influencer_id == influencer.id))
    delivered = await db.execute(
        select(func.count(Order.id)).where(Order.influencer_id == influencer.id, Order.status == "delivered")
    )
    total_earned = await db.execute(
        select(func.sum(Commission.influencer_amount))
        .join(Order, Commission.order_id == Order.id)
        .where(Order.influencer_id == influencer.id)
    )
    pending = await db.execute(
        select(func.sum(Commission.influencer_amount))
        .join(Order, Commission.order_id == Order.id)
        .where(Order.influencer_id == influencer.id, Commission.commission_status == "payable")
    )
    paid = await db.execute(
        select(func.sum(Commission.influencer_amount))
        .join(Order, Commission.order_id == Order.id)
        .where(Order.influencer_id == influencer.id, Commission.commission_status == "paid")
    )

    return {
        "total_orders": total.scalar() or 0,
        "delivered_orders": delivered.scalar() or 0,
        "total_influencer_earnings": str(total_earned.scalar() or "0.00"),
        "pending_commission": str(pending.scalar() or "0.00"),
        "paid_out": str(paid.scalar() or "0.00"),
        "currency": "GHS",
    }


@router.get("/reports/daily")
async def get_daily_trend(
    days: int = Query(default=14, ge=1, le=90),
    current_user: User = Depends(require_admin_or_operator),
    db: AsyncSession = Depends(get_db),
):
    """Daily rollup of storefront views, link clicks, and orders placed.

    Returns one row per day for the last N days (default 14).
    Used by the admin analytics dashboard to render trend charts.
    """
    since = datetime.now(timezone.utc) - timedelta(days=days)

    # Daily event counts — use PostgreSQL TO_CHAR for date truncation
    day_col = func.to_char(AnalyticsEvent.occurred_at, "YYYY-MM-DD").label("day")
    event_counts = await db.execute(
        select(
            day_col,
            AnalyticsEvent.event_name,
            func.count(AnalyticsEvent.id).label("count"),
        )
        .where(
            AnalyticsEvent.occurred_at >= since,
            AnalyticsEvent.event_name.in_(["storefront.viewed", "link.clicked", "order.created"]),
        )
        .group_by(day_col, AnalyticsEvent.event_name)
        .order_by(day_col)
    )
    rows = event_counts.all()

    # Pivot into day -> {event: count}
    pivot: dict = {}
    for row in rows:
        day_str = str(row.day)
        if day_str not in pivot:
            pivot[day_str] = {"date": day_str, "storefront_views": 0, "link_clicks": 0, "orders": 0}
        if row.event_name == "storefront.viewed":
            pivot[day_str]["storefront_views"] = row.count
        elif row.event_name == "link.clicked":
            pivot[day_str]["link_clicks"] = row.count
        elif row.event_name == "order.created":
            pivot[day_str]["orders"] = row.count

    return sorted(pivot.values(), key=lambda x: x["date"])


@router.get("/reports/daily/me")
async def get_my_daily_trend(
    days: int = Query(default=14, ge=1, le=90),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Influencer: daily orders + commissions for their store over the last N days."""
    inf_result = await db.execute(select(Influencer).where(Influencer.user_id == current_user.id))
    influencer = inf_result.scalar_one_or_none()
    if not influencer:
        return []

    since = datetime.now(timezone.utc) - timedelta(days=days)

    day_col = func.to_char(Order.created_at, "YYYY-MM-DD").label("day")
    rows_result = await db.execute(
        select(
            day_col,
            func.count(Order.id).label("orders"),
            func.sum(Order.total).label("gmv"),
        )
        .where(Order.influencer_id == influencer.id, Order.created_at >= since)
        .group_by(day_col)
        .order_by(day_col)
    )
    rows = rows_result.all()
    return [
        {"date": str(r.day), "orders": r.orders, "gmv_GHS": str(r.gmv or "0.00")}
        for r in rows
    ]


@router.get("/reports/attribution/me")
async def get_my_attribution(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Influencer: traffic source breakdown for their storefront."""
    inf_result = await db.execute(select(Influencer).where(Influencer.user_id == current_user.id))
    influencer = inf_result.scalar_one_or_none()
    if not influencer:
        return []

    result = await db.execute(
        text("""
            SELECT
                COALESCE(payload_json->>'utm_source', 'direct') AS source,
                COUNT(*) AS views
            FROM analytics_events
            WHERE event_name = 'storefront.viewed'
              AND payload_json->>'influencer_handle' = :handle
            GROUP BY source
            ORDER BY views DESC
        """),
        {"handle": influencer.handle},
    )
    rows = result.all()
    return [{"source": r.source, "views": r.views} for r in rows]


@router.get("/reports/attribution")
async def get_attribution_breakdown(
    current_user: User = Depends(require_admin_or_operator),
    db: AsyncSession = Depends(get_db),
):
    """Breakdown of storefront views by utm_source (tiktok, direct, other).

    Reads utm_source out of payload_json. Useful for showing what % of
    traffic came from TikTok vs direct vs other social channels.
    """
    # Postgres JSON extraction: payload_json->>'utm_source'
    result = await db.execute(
        text("""
            SELECT
                COALESCE(payload_json->>'utm_source', 'unknown') AS source,
                COUNT(*) AS views
            FROM analytics_events
            WHERE event_name = 'storefront.viewed'
            GROUP BY source
            ORDER BY views DESC
        """)
    )
    rows = result.all()
    return [{"source": r.source, "views": r.views} for r in rows]
