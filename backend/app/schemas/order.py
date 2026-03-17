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
    # Customer details (guest checkout)
    customer_name: str
    customer_phone: str
    delivery_address: str


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

    class Config:
        from_attributes = True
