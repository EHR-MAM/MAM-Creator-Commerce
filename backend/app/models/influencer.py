import uuid
from sqlalchemy import String, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Influencer(Base):
    __tablename__ = "influencers"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    handle: Mapped[str] = mapped_column(String(100), nullable=False)
    platform_name: Mapped[str] = mapped_column(String(50), default="tiktok")
    audience_region: Mapped[str] = mapped_column(String(100), default="Ghana")
    payout_method: Mapped[str | None] = mapped_column(String(50))
    payout_details_ref: Mapped[str | None] = mapped_column(String(255))  # encrypted ref
    status: Mapped[str] = mapped_column(
        Enum("active", "inactive", "suspended", name="influencer_status"),
        default="active",
    )
    # Storefront customisation (Sprint B)
    template_id: Mapped[str | None] = mapped_column(String(50), default="glow")
    bio: Mapped[str | None] = mapped_column(String(500))
    avatar_url: Mapped[str | None] = mapped_column(String(500))

    user = relationship("User", foreign_keys=[user_id])
