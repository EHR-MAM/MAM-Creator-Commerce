from pydantic import BaseModel, UUID4
from typing import Optional


class VendorCreate(BaseModel):
    business_name: str
    location: str
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    fulfillment_sla_hours: int = 72
    # User account fields
    email: str
    password: str


class VendorUpdate(BaseModel):
    business_name: Optional[str] = None
    location: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    fulfillment_sla_hours: Optional[int] = None
    status: Optional[str] = None


class VendorOut(BaseModel):
    id: UUID4
    business_name: str
    location: str
    contact_name: Optional[str]
    contact_phone: Optional[str]
    fulfillment_sla_hours: int
    status: str

    class Config:
        from_attributes = True
