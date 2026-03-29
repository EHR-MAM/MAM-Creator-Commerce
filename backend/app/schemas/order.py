from pydantic import BaseModel, UUID4
from decimal import Decimal
from typing import Optional, List


class OrderItemIn(BaseModel):
    product_id: UUID4
    quantity: int


class OrderCreate(BaseModel):
    campaign_id: Optional[UUID4] = None
    items: List[OrderItemIn]
    source_channel: str = "tiktok"
    # Customer details (guest checkout — no account required)
    customer_name: str
    customer_phone: str
    delivery_address: str
    size_variant: Optional[str] = None           # e.g. "M", "XL", "26in"
    special_instructions: Optional[str] = None   # e.g. "Call before delivery"
    customer_email: Optional[str] = None         # optional for receipt


class OrderOut(BaseModel):
    id: UUID4
    status: str
    subtotal: Decimal
    delivery_fee: Decimal
    total: Decimal
    currency: str
    payment_status: str
    fulfillment_status: str
    source_channel: str
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    delivery_address: Optional[str] = None
    size_variant: Optional[str] = None
    special_instructions: Optional[str] = None

    class Config:
        from_attributes = True
