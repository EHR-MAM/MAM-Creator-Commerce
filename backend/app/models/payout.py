import uuid
from decimal import Decimal
from datetime import datetime
from sqlalchemy import String, Numeric, Enum, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class Payout(Base):
    __tablename__ = "payouts"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    payee_type: Mapped[str] = mapped_column(
        Enum("influencer", "platform", name="payee_type"), nullable=False
    )
    payee_id: Mapped[uuid.UUID] = mapped_column(nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="GHS")
    status: Mapped[str] = mapped_column(
        Enum("pending", "processing", "completed", "failed", name="payout_status"),
        default="pending",
    )
    payment_method: Mapped[str | None] = mapped_column(String(50))
    external_reference: Mapped[str | None] = mapped_column(String(255))
    period_start: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    period_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
