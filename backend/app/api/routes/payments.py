from fastapi import APIRouter, HTTPException, Request, Header
from pydantic import BaseModel
from decimal import Decimal
from typing import Optional
import logging

from app.services.payments import (
    get_methods_for_country,
    initialize_payment,
    paystack_verify,
    paystack_verify_webhook,
    flutterwave_verify,
)

router = APIRouter()
logger = logging.getLogger(__name__)


class PaymentInitRequest(BaseModel):
    order_id: str
    email: str
    amount: Decimal
    currency: str = "GHS"
    country_code: str = "GH"
    method_id: str
    phone: Optional[str] = None
    callback_url: Optional[str] = None
    metadata: Optional[dict] = None


class PaymentVerifyRequest(BaseModel):
    reference: str
    provider: str
    transaction_id: Optional[str] = None


@router.get("/methods")
async def payment_methods(country: str = "GH"):
    return {
        "country": country.upper(),
        "methods": get_methods_for_country(country),
    }


@router.post("/initialize")
async def create_payment(body: PaymentInitRequest):
    try:
        result = await initialize_payment(
            order_id=body.order_id,
            email=body.email,
            amount=body.amount,
            currency=body.currency,
            country_code=body.country_code,
            method_id=body.method_id,
            phone=body.phone,
            callback_url=body.callback_url,
            metadata=body.metadata,
        )
        return {"status": "ok", "data": result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Payment init error: {e}")
        raise HTTPException(status_code=502, detail="Payment provider error")


@router.post("/verify")
async def verify_payment(body: PaymentVerifyRequest):
    try:
        if body.provider == "paystack":
            data = await paystack_verify(body.reference)
            paid = data.get("status") == "success"
        elif body.provider == "flutterwave":
            if not body.transaction_id:
                raise HTTPException(status_code=400, detail="transaction_id required for Flutterwave")
            data = await flutterwave_verify(body.transaction_id)
            paid = data.get("status") == "successful"
        elif body.provider == "cod":
            return {"status": "pending", "message": "Pay on delivery — awaiting fulfilment confirmation"}
        else:
            raise HTTPException(status_code=400, detail=f"Unknown provider: {body.provider}")
        return {"status": "paid" if paid else "failed", "data": data}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Payment verify error: {e}")
        raise HTTPException(status_code=502, detail="Verification failed")


@router.post("/paystack/webhook")
async def paystack_webhook(request: Request, x_paystack_signature: str = Header(None)):
    body = await request.body()
    if not paystack_verify_webhook(body, x_paystack_signature or ""):
        raise HTTPException(status_code=400, detail="Invalid webhook signature")
    event = (await request.json()).get("event", "")
    logger.info(f"Paystack webhook: {event}")
    return {"received": True}


@router.post("/flutterwave/webhook")
async def flutterwave_webhook(request: Request):
    data = await request.json()
    logger.info(f"Flutterwave webhook: {data.get('event')}")
    return {"received": True}


@router.post("/mpesa/callback")
async def mpesa_callback(request: Request):
    data = await request.json()
    logger.info(f"M-Pesa callback: {data}")
    return {"ResultCode": 0, "ResultDesc": "Accepted"}


@router.post("/cinetpay/notify")
async def cinetpay_notify(request: Request):
    data = await request.json()
    logger.info(f"CinetPay IPN: {data}")
    return {"received": True}
