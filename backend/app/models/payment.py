import uuid
from decimal import Decimal
from sqlalchemy import String, Numeric, ForeignKey, Enum, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    order_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("orders.id"), nullable=False)
    provider: Mapped[str] = mapped_column(String(50), nullable=False)
    provider_reference: Mapped[str | None] = mapped_column(String(255), unique=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="GHS")
    status: Mapped[str] = mapped_column(
        Enum("initiated", "pending", "success", "failed", "refunded", name="payment_provider_status"),
        default="initiated",
    )
    raw_payload_json: Mapped[dict | None] = mapped_column(JSON)
