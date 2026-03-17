import uuid
from decimal import Decimal
from datetime import datetime, timezone
from sqlalchemy import Numeric, ForeignKey, Enum, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Commission(Base):
    __tablename__ = "commissions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    order_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("orders.id"), nullable=False, unique=True)
    influencer_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    platform_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    vendor_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    commission_status: Mapped[str] = mapped_column(
        Enum("pending", "payable", "paid", "reversed", name="commission_status"),
        default="pending", nullable=False, index=True,
    )
    payout_batch_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("payouts.id"))
    calculated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )

    order = relationship("Order", back_populates="commission")
