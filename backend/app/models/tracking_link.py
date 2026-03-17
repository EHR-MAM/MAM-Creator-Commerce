import uuid
from datetime import datetime, timezone
from sqlalchemy import String, ForeignKey, DateTime, Integer, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class TrackingLink(Base):
    """Short attribution links for TikTok / social posts.

    Creator generates a link per post (or campaign). Viewer clicks it,
    we log the hit + UTM params, then redirect to the storefront.
    """
    __tablename__ = "tracking_links"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    influencer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("influencers.id"), nullable=False)
    campaign_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("campaigns.id"))
    label: Mapped[str | None] = mapped_column(String(200))           # e.g. "TikTok post 2025-03-15"
    destination_path: Mapped[str] = mapped_column(String(500))       # e.g. /sweet200723 or /sweet200723/prod-slug
    click_count: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    influencer = relationship("Influencer", foreign_keys=[influencer_id])
