import uuid
from sqlalchemy import String, Integer, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Vendor(Base):
    __tablename__ = "vendors"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    business_name: Mapped[str] = mapped_column(String(255), nullable=False)
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    contact_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    contact_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    fulfillment_sla_hours: Mapped[int] = mapped_column(Integer, default=72)
    status: Mapped[str] = mapped_column(
        Enum("active", "inactive", "suspended", name="vendor_status"),
        default="active",
    )

    user = relationship("User", foreign_keys=[user_id])
    products = relationship("Product", back_populates="vendor")
