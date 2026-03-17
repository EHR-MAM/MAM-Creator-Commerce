from pydantic import BaseModel, UUID4
from decimal import Decimal
from typing import Optional, List


class ProductCreate(BaseModel):
    sku: str
    name: str
    description: Optional[str] = None
    category: str
    color: Optional[str] = None
    size: Optional[str] = None
    price: Decimal
    cost_basis: Optional[Decimal] = None
    currency: str = "GHS"
    inventory_count: int = 0
    media_urls: Optional[List[str]] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    inventory_count: Optional[int] = None
    status: Optional[str] = None
    media_urls: Optional[List[str]] = None


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

    class Config:
        from_attributes = True
