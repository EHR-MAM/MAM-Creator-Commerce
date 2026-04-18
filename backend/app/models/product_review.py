import uuid
from datetime import datetime
from sqlalchemy import String, Integer, ForeignKey, Text, DateTime, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class ProductReview(Base):
    """Sprint XXVIII: Customer product reviews with star rating."""
    __tablename__ = "product_reviews"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    product_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    order_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("orders.id", ondelete="SET NULL"), nullable=True)
    customer_name: Mapped[str] = mapped_column(String(100), nullable=False)
    customer_phone_last4: Mapped[str | None] = mapped_column(String(4))  # last 4 digits for display
    rating: Mapped[int] = mapped_column(Integer, nullable=False)  # 1-5
    headline: Mapped[str | None] = mapped_column(String(150))
    body: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(
        Enum("pending", "approved", "rejected", name="review_status"),
        default="approved",  # auto-approve for pilot
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
