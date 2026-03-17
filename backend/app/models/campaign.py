import uuid
from datetime import datetime
from sqlalchemy import String, ForeignKey, DateTime, JSON, Boolean, Integer, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Campaign(Base):
    __tablename__ = "campaigns"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    influencer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("influencers.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    start_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    end_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(
        Enum("draft", "active", "paused", "ended", name="campaign_status"),
        default="draft",
    )
    attribution_rules_json: Mapped[dict | None] = mapped_column(JSON)
    product_links = relationship("ProductCampaignLink", back_populates="campaign")


class ProductCampaignLink(Base):
    __tablename__ = "product_campaign_links"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    campaign_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("campaigns.id"), nullable=False)
    product_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("products.id"), nullable=False)
    featured_rank: Mapped[int] = mapped_column(Integer, default=0)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    campaign = relationship("Campaign", back_populates="product_links")
    product = relationship("Product")
