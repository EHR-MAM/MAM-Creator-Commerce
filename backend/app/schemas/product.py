from pydantic import BaseModel, UUID4, Field
from decimal import Decimal
from typing import Optional, List


class ProductCreate(BaseModel):
    vendor_id: Optional[UUID4] = None
    sku: str
    name: str
    description: Optional[str] = None
    category: str
    color: Optional[str] = None
    size: Optional[str] = None
    price: Decimal
    cost_basis: Optional[Decimal] = None
    currency: str = "GHS"
    inventory_count: int = Field(default=0, ge=0)
    media_urls: Optional[List[str]] = None
    image_alt_text: Optional[str] = None
    affiliate_url: Optional[str] = None
    video_url: Optional[str] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    inventory_count: Optional[int] = None
    status: Optional[str] = None
    media_urls: Optional[List[str]] = None
    image_alt_text: Optional[str] = None
    affiliate_url: Optional[str] = None
    video_url: Optional[str] = None


class ProductOut(BaseModel):
    id: UUID4
    vendor_id: UUID4
    sku: str
    name: str
    description: Optional[str]
    category: str
    color: Optional[str]
    size: Optional[str]
    price: Decimal
    currency: str
    inventory_count: int
    status: str
    media_urls: Optional[List[str]]
    image_alt_text: Optional[str] = None
    affiliate_url: Optional[str]
    video_url: Optional[str] = None
    rating: Optional[float] = None
    review_count: Optional[int] = None
    creator_handle: Optional[str] = None

    class Config:
        from_attributes = True
