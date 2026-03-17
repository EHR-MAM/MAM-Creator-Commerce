import uuid
from decimal import Decimal
from sqlalchemy import String, Numeric, Integer, ForeignKey, Enum, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    vendor_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("vendors.id"), nullable=False, index=True)
    sku: Mapped[str] = mapped_column(String(100), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(2000))
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    color: Mapped[str | None] = mapped_column(String(50))
    size: Mapped[str | None] = mapped_column(String(50))
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    cost_basis: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    currency: Mapped[str] = mapped_column(String(3), default="GHS")
    inventory_count: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(
        Enum("active", "inactive", "out_of_stock", name="product_status"),
        default="active",
        index=True,
    )
    media_urls: Mapped[list | None] = mapped_column(JSON)
    metadata_json: Mapped[dict | None] = mapped_column(JSON)

    vendor = relationship("Vendor", back_populates="products")
