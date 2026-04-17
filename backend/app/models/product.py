import uuid
from decimal import Decimal
from datetime import datetime
from sqlalchemy import String, Numeric, Integer, ForeignKey, Enum, JSON, DateTime, Boolean, Text, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    vendor_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("vendors.id"), nullable=False, index=True)
    sku: Mapped[str] = mapped_column(String(100), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    subcategory: Mapped[str | None] = mapped_column(String(100))
    brand: Mapped[str | None] = mapped_column(String(100))
    color: Mapped[str | None] = mapped_column(String(50))
    size: Mapped[str | None] = mapped_column(String(50))
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    original_price: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    cost_basis: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    currency: Mapped[str] = mapped_column(String(3), default="GHS")
    inventory_count: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(
        Enum("active", "inactive", "out_of_stock", name="product_status"),
        default="active", index=True,
    )
    media_urls: Mapped[list | None] = mapped_column(JSON)
    metadata_json: Mapped[dict | None] = mapped_column(JSON)
    tags: Mapped[list | None] = mapped_column(JSON)
    rating: Mapped[float | None] = mapped_column(Float)
    review_count: Mapped[int | None] = mapped_column(Integer, default=0)
    sales_count: Mapped[int | None] = mapped_column(Integer, default=0)
    badge: Mapped[str | None] = mapped_column(String(20))
    country_availability: Mapped[list | None] = mapped_column(JSON)

    # Affiliate sync fields
    affiliate_source: Mapped[str | None] = mapped_column(String(50), index=True)
    affiliate_product_id: Mapped[str | None] = mapped_column(String(255), index=True)
    affiliate_url: Mapped[str | None] = mapped_column(String(1000))
    affiliate_commission_rate: Mapped[float | None] = mapped_column(Float)
    last_synced_at: Mapped[datetime | None] = mapped_column(DateTime)
    sync_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    source_price_usd: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    delivery_days_min: Mapped[int | None] = mapped_column(Integer)
    delivery_days_max: Mapped[int | None] = mapped_column(Integer)
    ships_from: Mapped[str | None] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    vendor = relationship("Vendor", back_populates="products")
