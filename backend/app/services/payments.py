import hashlib
import hmac
import logging
import os
from decimal import Decimal
from typing import Any

import httpx

logger = logging.getLogger(__name__)

PAYSTACK_SECRET = os.getenv("PAYSTACK_SECRET_KEY", "")
PAYSTACK_PUBLIC = os.getenv("PAYSTACK_PUBLIC_KEY", "")
FLUTTERWAVE_SECRET = os.getenv("FLUTTERWAVE_SECRET_KEY", "")
MPESA_CONSUMER_KEY = os.getenv("MPESA_CONSUMER_KEY", "")
MPESA_CONSUMER_SECRET = os.getenv("MPESA_CONSUMER_SECRET", "")
MPESA_SHORTCODE = os.getenv("MPESA_SHORTCODE", "")
MPESA_PASSKEY = os.getenv("MPESA_PASSKEY", "")
MPESA_CALLBACK_URL = os.getenv("MPESA_CALLBACK_URL", "https://api.yesmam.africa/v1/payments/mpesa/callback")
CINETPAY_APIKEY = os.getenv("CINETPAY_APIKEY", "")
CINETPAY_SITE_ID = os.getenv("CINETPAY_SITE_ID", "")
PLATFORM_CALLBACK_BASE = os.getenv("PLATFORM_CALLBACK_BASE", "https://api.yesmam.africa/v1")

# All African payment methods, keyed by 2-letter country code
PAYMENT_METHODS: dict[str, list[dict]] = {
    "GH": [
        {"id": "card", "name": "Debit / Credit Card", "provider": "paystack", "icon": "card"},
        {"id": "mtn_momo_gh", "name": "MTN Mobile Money", "provider": "paystack", "icon": "mobile"},
        {"id": "telecel_cash", "name": "Telecel Cash", "provider": "paystack", "icon": "mobile"},
        {"id": "airtel_money_gh", "name": "Airtel Money", "provider": "paystack", "icon": "mobile"},
        {"id": "pay_on_delivery", "name": "Pay on Delivery", "provider": "cod", "icon": "home"},
        {"id": "bank_transfer", "name": "Bank Transfer", "provider": "paystack", "icon": "bank"},
    ],
    "NG": [
        {"id": "card", "name": "Debit / Credit Card", "provider": "paystack", "icon": "card"},
        {"id": "bank_transfer_ng", "name": "Bank Transfer", "provider": "paystack", "icon": "bank"},
        {"id": "ussd", "name": "USSD (*737#)", "provider": "paystack", "icon": "phone"},
        {"id": "mtn_momo_ng", "name": "MTN MoMo (NG)", "provider": "flutterwave", "icon": "mobile"},
        {"id": "opay", "name": "OPay", "provider": "flutterwave", "icon": "mobile"},
        {"id": "pay_on_delivery", "name": "Pay on Delivery", "provider": "cod", "icon": "home"},
    ],
    "KE": [
        {"id": "mpesa", "name": "M-Pesa (STK Push)", "provider": "mpesa", "icon": "mobile"},
        {"id": "card", "name": "Debit / Credit Card", "provider": "flutterwave", "icon": "card"},
        {"id": "airtel_money_ke", "name": "Airtel Money", "provider": "flutterwave", "icon": "mobile"},
        {"id": "bank_transfer_ke", "name": "Bank Transfer", "provider": "flutterwave", "icon": "bank"},
    ],
    "TZ": [
        {"id": "mpesa_tz", "name": "M-Pesa Tanzania", "provider": "flutterwave", "icon": "mobile"},
        {"id": "tigo_pesa", "name": "Tigo Pesa", "provider": "flutterwave", "icon": "mobile"},
        {"id": "airtel_money_tz", "name": "Airtel Money", "provider": "flutterwave", "icon": "mobile"},
        {"id": "card", "name": "Debit / Credit Card", "provider": "flutterwave", "icon": "card"},
    ],
    "ZA": [
        {"id": "card", "name": "Debit / Credit Card", "provider": "flutterwave", "icon": "card"},
        {"id": "bank_transfer_za", "name": "EFT / Bank Transfer", "provider": "flutterwave", "icon": "bank"},
        {"id": "ozow", "name": "Ozow (Instant EFT)", "provider": "flutterwave", "icon": "lightning"},
    ],
    "CI": [
        {"id": "orange_money_ci", "name": "Orange Money", "provider": "cinetpay", "icon": "mobile"},
        {"id": "mtn_momo_ci", "name": "MTN MoMo", "provider": "cinetpay", "icon": "mobile"},
        {"id": "wave_ci", "name": "Wave", "provider": "cinetpay", "icon": "mobile"},
        {"id": "card", "name": "Debit / Credit Card", "provider": "cinetpay", "icon": "card"},
    ],
    "SN": [
        {"id": "orange_money_sn", "name": "Orange Money", "provider": "cinetpay", "icon": "mobile"},
        {"id": "wave_sn", "name": "Wave", "provider": "cinetpay", "icon": "mobile"},
        {"id": "free_money_sn", "name": "Free Money", "provider": "cinetpay", "icon": "mobile"},
        {"id": "card", "name": "Debit / Credit Card", "provider": "cinetpay", "icon": "card"},
    ],
    "UG": [
        {"id": "mtn_momo_ug", "name": "MTN MoMo", "provider": "flutterwave", "icon": "mobile"},
        {"id": "airtel_money_ug", "name": "Airtel Money", "provider": "flutterwave", "icon": "mobile"},
        {"id": "card", "name": "Debit / Credit Card", "provider": "flutterwave", "icon": "card"},
    ],
    "EG": [
        {"id": "card", "name": "Debit / Credit Card", "provider": "flutterwave", "icon": "card"},
        {"id": "vodafone_cash", "name": "Vodafone Cash", "provider": "flutterwave", "icon": "mobile"},
        {"id": "fawry", "name": "Fawry", "provider": "flutterwave", "icon": "store"},
    ],
    "CM": [
        {"id": "mtn_momo_cm", "name": "MTN MoMo", "provider": "flutterwave", "icon": "mobile"},
        {"id": "orange_money_cm", "name": "Orange Money", "provider": "cinetpay", "icon": "mobile"},
        {"id": "card", "name": "Debit / Credit Card", "provider": "flutterwave", "icon": "card"},
    ],
    "RW": [
        {"id": "mtn_momo_rw", "name": "MTN MoMo", "provider": "flutterwave", "icon": "mobile"},
        {"id": "airtel_money_rw", "name": "Airtel Money", "provider": "flutterwave", "icon": "mobile"},
        {"id": "card", "name": "Debit / Credit Card", "provider": "flutterwave", "icon": "card"},
    ],
    "ET": [
        {"id": "telebirr", "name": "Telebirr", "provider": "flutterwave", "icon": "mobile"},
        {"id": "card", "name": "Debit / Credit Card", "provider": "flutterwave", "icon": "card"},
    ],
    "default": [
        {"id": "card", "name": "Debit / Credit Card", "provider": "flutterwave", "icon": "card"},
        {"id": "bank_transfer", "name": "Bank Transfer", "provider": "flutterwave", "icon": "bank"},
        {"id": "pay_on_delivery", "name": "Pay on Delivery", "provider": "cod", "icon": "home"},
    ],
}


def get_methods_for_country(country_code: str) -> list[dict]:
    return PAYMENT_METHODS.get(country_code.upper(), PAYMENT_METHODS["default"])


# ---------------------------------------------------------------------------
# Paystack
# ---------------------------------------------------------------------------

async def paystack_initialize(
    email: str,
    amount_ghs: Decimal,
    reference: str,
    callback_url: str,
    channels: list[str] | None = None,
    metadata: dict | None = None,
) -> dict:
    if not PAYSTACK_SECRET:
        raise ValueError("PAYSTACK_SECRET_KEY not configured")
    payload: dict[str, Any] = {
        "email": email,
        "amount": int(amount_ghs * 100),
        "currency": "GHS",
        "reference": reference,
        "callback_url": callback_url,
        "metadata": metadata or {},
    }
    if channels:
        payload["channels"] = channels
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            "https://api.paystack.co/transaction/initialize",
            json=payload,
            headers={"Authorization": f"Bearer {PAYSTACK_SECRET}"},
        )
        resp.raise_for_status()
    data = resp.json()
    if not data.get("status"):
        raise ValueError(f"Paystack error: {data.get('message')}")
    return data["data"]


async def paystack_verify(reference: str) -> dict:
    if not PAYSTACK_SECRET:
        raise ValueError("PAYSTACK_SECRET_KEY not configured")
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            f"https://api.paystack.co/transaction/verify/{reference}",
            headers={"Authorization": f"Bearer {PAYSTACK_SECRET}"},
        )
        resp.raise_for_status()
    return resp.json().get("data", {})


def paystack_verify_webhook(payload: bytes, signature: str) -> bool:
    computed = hmac.new(PAYSTACK_SECRET.encode(), payload, hashlib.sha512).hexdigest()
    return hmac.compare_digest(computed, signature)


# ---------------------------------------------------------------------------
# Flutterwave
# ---------------------------------------------------------------------------

async def flutterwave_initialize(
    email: str,
    amount: Decimal,
    currency: str,
    reference: str,
    redirect_url: str,
    phone_number: str | None = None,
    payment_options: str | None = None,
    meta: dict | None = None,
) -> dict:
    if not FLUTTERWAVE_SECRET:
        raise ValueError("FLUTTERWAVE_SECRET_KEY not configured")
    payload: dict[str, Any] = {
        "tx_ref": reference,
        "amount": float(amount),
        "currency": currency,
        "redirect_url": redirect_url,
        "customer": {"email": email, "phonenumber": phone_number or ""},
        "meta": meta or {},
        "customizations": {
            "title": "Yes MAM",
            "description": "Micro Affiliate Marketing - Africa Creator Commerce",
        },
    }
    if payment_options:
        payload["payment_options"] = payment_options
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            "https://api.flutterwave.com/v3/payments",
            json=payload,
            headers={"Authorization": f"Bearer {FLUTTERWAVE_SECRET}"},
        )
        resp.raise_for_status()
    data = resp.json()
    if data.get("status") != "success":
        raise ValueError(f"Flutterwave error: {data.get('message')}")
    return {"payment_link": data["data"]["link"], "tx_ref": reference}


async def flutterwave_verify(transaction_id: str) -> dict:
    if not FLUTTERWAVE_SECRET:
        raise ValueError("FLUTTERWAVE_SECRET_KEY not configured")
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            f"https://api.flutterwave.com/v3/transactions/{transaction_id}/verify",
            headers={"Authorization": f"Bearer {FLUTTERWAVE_SECRET}"},
        )
        resp.raise_for_status()
    return resp.json().get("data", {})


# ---------------------------------------------------------------------------
# M-Pesa (Safaricom Daraja)
# ---------------------------------------------------------------------------

_mpesa_token_cache: dict = {}


async def _mpesa_access_token() -> str:
    import base64
    import time
    cached = _mpesa_token_cache.get("token")
    if cached and time.time() < _mpesa_token_cache.get("expires_at", 0):
        return cached
    creds = base64.b64encode(f"{MPESA_CONSUMER_KEY}:{MPESA_CONSUMER_SECRET}".encode()).decode()
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
            headers={"Authorization": f"Basic {creds}"},
        )
        resp.raise_for_status()
    data = resp.json()
    _mpesa_token_cache["token"] = data["access_token"]
    _mpesa_token_cache["expires_at"] = time.time() + int(data.get("expires_in", 3599)) - 60
    return data["access_token"]


async def mpesa_stk_push(phone: str, amount: Decimal, reference: str, description: str) -> dict:
    if not MPESA_CONSUMER_KEY:
        raise ValueError("MPESA credentials not configured")
    import base64
    import time
    token = await _mpesa_access_token()
    timestamp = time.strftime("%Y%m%d%H%M%S")
    password = base64.b64encode(
        f"{MPESA_SHORTCODE}{MPESA_PASSKEY}{timestamp}".encode()
    ).decode()
    payload = {
        "BusinessShortCode": MPESA_SHORTCODE,
        "Password": password,
        "Timestamp": timestamp,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": int(amount),
        "PartyA": phone,
        "PartyB": MPESA_SHORTCODE,
        "PhoneNumber": phone,
        "CallBackURL": MPESA_CALLBACK_URL,
        "AccountReference": reference,
        "TransactionDesc": description[:13],
    }
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
            json=payload,
            headers={"Authorization": f"Bearer {token}"},
        )
        resp.raise_for_status()
    return resp.json()


# ---------------------------------------------------------------------------
# CinetPay (Orange Money, Wave — Francophone Africa)
# ---------------------------------------------------------------------------

async def cinetpay_initialize(
    transaction_id: str,
    amount: int,
    currency: str,
    description: str,
    return_url: str,
    notify_url: str,
    channels: str = "MOBILE_MONEY",
) -> dict:
    if not CINETPAY_APIKEY:
        raise ValueError("CINETPAY_APIKEY not configured")
    payload = {
        "apikey": CINETPAY_APIKEY,
        "site_id": CINETPAY_SITE_ID,
        "transaction_id": transaction_id,
        "amount": amount,
        "currency": currency,
        "description": description,
        "return_url": return_url,
        "notify_url": notify_url,
        "channels": channels,
        "lang": "fr",
    }
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post("https://api-checkout.cinetpay.com/v2/payment", json=payload)
        resp.raise_for_status()
    data = resp.json()
    if data.get("code") != "201":
        raise ValueError(f"CinetPay error: {data.get('message')}")
    return data["data"]


# ---------------------------------------------------------------------------
# Unified payment router
# ---------------------------------------------------------------------------

async def initialize_payment(
    order_id: str,
    email: str,
    amount: Decimal,
    currency: str,
    country_code: str,
    method_id: str,
    phone: str | None = None,
    callback_url: str | None = None,
    metadata: dict | None = None,
) -> dict:
    reference = f"MAM-{order_id}"
    cb = callback_url or f"{PLATFORM_CALLBACK_BASE}/payments/callback"

    ps_methods = {
        "card", "mtn_momo_gh", "telecel_cash", "airtel_money_gh",
        "bank_transfer", "ussd", "qr", "bank_transfer_ng",
    }
    if method_id in ps_methods and country_code in ("GH", "NG", "KE"):
        channel_map = {
            "card": ["card"],
            "mtn_momo_gh": ["mobile_money"],
            "telecel_cash": ["mobile_money"],
            "airtel_money_gh": ["mobile_money"],
            "bank_transfer": ["bank_transfer"],
            "bank_transfer_ng": ["bank_transfer"],
            "ussd": ["ussd"],
            "qr": ["qr"],
        }
        data = await paystack_initialize(
            email=email, amount_ghs=amount, reference=reference,
            callback_url=cb, channels=channel_map.get(method_id), metadata=metadata,
        )
        return {"reference": reference, "redirect_url": data["authorization_url"], "provider": "paystack"}

    if method_id == "mpesa" and country_code == "KE":
        if not phone:
            raise ValueError("Phone number required for M-Pesa")
        data = await mpesa_stk_push(phone=phone, amount=amount, reference=reference, description="Yes MAM Order")
        return {"reference": reference, "checkout_request_id": data.get("CheckoutRequestID"), "provider": "mpesa"}

    cp_methods = {
        "orange_money_ci", "orange_money_sn", "mtn_momo_ci",
        "wave_ci", "wave_sn", "free_money_sn", "orange_money_cm",
    }
    if method_id in cp_methods:
        data = await cinetpay_initialize(
            transaction_id=reference, amount=int(amount), currency=currency,
            description="Yes MAM Order", return_url=cb,
            notify_url=f"{PLATFORM_CALLBACK_BASE}/payments/cinetpay/notify",
        )
        return {"reference": reference, "redirect_url": data.get("payment_url"), "provider": "cinetpay"}

    if method_id == "pay_on_delivery":
        return {"reference": reference, "provider": "cod", "status": "pending_delivery"}

    flw_map = {
        "mpesa_tz": "mpesa",
        "tigo_pesa": "mobilemoneyghana",
        "airtel_money_tz": "mobilemoneyuganda",
        "airtel_money_ke": "airtel",
        "mtn_momo_ug": "mobilemoneyuganda",
        "airtel_money_ug": "airtel",
        "mtn_momo_ng": "mobilemoneyghana",
        "vodafone_cash": "mobilemoneyegypt",
        "fawry": "fawry",
        "bank_transfer_ke": "account",
        "bank_transfer_za": "account",
        "ozow": "account",
        "opay": "opay",
        "mtn_momo_cm": "mobilemoneyghana",
        "mtn_momo_rw": "mobilemoneyuganda",
        "airtel_money_rw": "airtel",
        "telebirr": "mobilemoneyethiopia",
    }
    flw_option = flw_map.get(method_id, "card")
    data = await flutterwave_initialize(
        email=email, amount=amount, currency=currency, reference=reference,
        redirect_url=cb, phone_number=phone, payment_options=flw_option, meta=metadata,
    )
    return {"reference": reference, "redirect_url": data["payment_link"], "provider": "flutterwave"}
