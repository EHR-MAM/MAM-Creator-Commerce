"""
MAM Notification Service — Sprint A
Sends order notifications via:
1. WhatsApp (Twilio API) → ops team numbers
2. Email (SMTP) → ops email
3. Influencer notification (stored in DB for dashboard badge)

WhatsApp numbers notified on every order:
- +13107763650 (David / primary ops)
- +19492430088 (ops group / test)

WhatsApp provider: Twilio WhatsApp Sandbox / Business API
Falls back silently if not configured — order still saves.
"""

import asyncio
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


def _format_whatsapp_order_message(order_data: dict) -> str:
    """Build the WhatsApp ops notification message for a new order."""
    order_id_short = str(order_data.get("order_id", ""))[:8].upper()
    lines = [
        f"🛒 *NEW MAM ORDER* — #{order_id_short}",
        "",
        f"*Customer:* {order_data.get('customer_name', 'Unknown')}",
        f"*Phone:* {order_data.get('customer_phone', '—')}",
    ]

    if order_data.get("customer_email"):
        lines.append(f"*Email:* {order_data['customer_email']}")

    lines += [
        f"*Delivery:* {order_data.get('delivery_address', '—')}",
        "",
        "*Items:*",
    ]

    for item in order_data.get("items", []):
        size_str = f" ({item['size_variant']})" if item.get("size_variant") else ""
        lines.append(f"  • {item['name']} x{item['qty']}{size_str} — GHS {item['line_total']:.2f}")

    lines += [
        "",
        f"*Subtotal:* GHS {order_data.get('subtotal', 0):.2f}",
        f"*Delivery:* GHS {order_data.get('delivery_fee', 20):.2f}",
        f"*TOTAL:* GHS {order_data.get('total', 0):.2f}",
    ]

    if order_data.get("special_instructions"):
        lines += ["", f"*Instructions:* {order_data['special_instructions']}"]

    lines += [
        "",
        f"*Influencer:* @{order_data.get('creator_handle', '—')}",
        f"*Source:* {order_data.get('source_channel', 'tiktok')}",
        "",
        "Reply CONFIRM to process · Reply CANCEL to cancel",
    ]

    return "\n".join(lines)


def _format_vendor_summary_message(order_data: dict) -> str:
    """
    Pre-filled vendor order summary for ops to copy-paste to supplier.
    Semi-automated: ops reviews and sends with one click / forward.
    """
    order_id_short = str(order_data.get("order_id", ""))[:8].upper()
    lines = [
        f"📦 *ORDER TO FULFIL* — #{order_id_short}",
        "",
        "Hello,",
        "Please prepare the following order for MAM delivery:",
        "",
        "*Items Required:*",
    ]

    for item in order_data.get("items", []):
        size_str = f" — Size/Variant: {item['size_variant']}" if item.get("size_variant") else ""
        lines.append(f"  • {item['name']} (SKU: {item.get('sku', '—')}) x{item['qty']}{size_str}")

    lines += [
        "",
        f"*Delivery Address:* {order_data.get('delivery_address', '—')}",
        f"*Customer Phone:* {order_data.get('customer_phone', '—')}",
        "",
        f"*Order ID:* {order_id_short}",
        f"*SLA:* Please dispatch within 48 hours.",
        "",
        "Thank you,",
        "MAM Operations Team",
    ]

    return "\n".join(lines)


async def _send_whatsapp_twilio(to_number: str, message: str) -> bool:
    """Send a WhatsApp message via Twilio. Returns True on success."""
    if not settings.WHATSAPP_API_KEY or not settings.WHATSAPP_FROM_NUMBER:
        logger.warning("WhatsApp not configured — skipping send to %s", to_number)
        return False

    try:
        # Twilio uses synchronous client; run in thread pool to avoid blocking
        import httpx

        # Twilio REST API for WhatsApp
        account_sid, auth_token = settings.WHATSAPP_API_KEY.split(":", 1)
        url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"

        # Ensure E.164 format
        if not to_number.startswith("+"):
            to_number = f"+{to_number}"

        data = {
            "From": f"whatsapp:{settings.WHATSAPP_FROM_NUMBER}",
            "To": f"whatsapp:{to_number}",
            "Body": message,
        }

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                url,
                data=data,
                auth=(account_sid, auth_token),
                timeout=10.0,
            )

        if resp.status_code in (200, 201):
            logger.info("WhatsApp sent to %s", to_number)
            return True
        else:
            logger.error("WhatsApp failed to %s: %s %s", to_number, resp.status_code, resp.text)
            return False

    except Exception as exc:
        logger.error("WhatsApp exception for %s: %s", to_number, exc)
        return False


def _send_email_notification(order_data: dict) -> bool:
    """Send order notification email to ops. Returns True on success."""
    if not settings.SMTP_HOST or not settings.NOTIFY_EMAIL:
        logger.warning("Email not configured — skipping email notification")
        return False

    try:
        order_id_short = str(order_data.get("order_id", ""))[:8].upper()
        subject = f"[MAM] New Order #{order_id_short} — GHS {order_data.get('total', 0):.2f}"

        # Plain text body
        body_lines = [
            f"New order received on MAM platform.",
            f"",
            f"Order ID: {order_data.get('order_id')}",
            f"Customer: {order_data.get('customer_name')} — {order_data.get('customer_phone')}",
            f"Email: {order_data.get('customer_email', 'Not provided')}",
            f"Delivery: {order_data.get('delivery_address')}",
            f"",
            f"Items:",
        ]
        for item in order_data.get("items", []):
            size_str = f" ({item['size_variant']})" if item.get("size_variant") else ""
            body_lines.append(f"  - {item['name']} x{item['qty']}{size_str} = GHS {item['line_total']:.2f}")

        body_lines += [
            f"",
            f"Subtotal: GHS {order_data.get('subtotal', 0):.2f}",
            f"Delivery fee: GHS {order_data.get('delivery_fee', 20):.2f}",
            f"Total: GHS {order_data.get('total', 0):.2f}",
            f"",
            f"Special instructions: {order_data.get('special_instructions', 'None')}",
            f"",
            f"Influencer: @{order_data.get('creator_handle', '—')}",
            f"Source: {order_data.get('source_channel', 'tiktok')}",
        ]

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.SMTP_USER or settings.NOTIFY_EMAIL
        msg["To"] = settings.NOTIFY_EMAIL
        msg.attach(MIMEText("\n".join(body_lines), "plain"))

        with smtplib.SMTP(settings.SMTP_HOST, int(settings.SMTP_PORT or 587)) as smtp:
            smtp.starttls()
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            smtp.sendmail(msg["From"], [settings.NOTIFY_EMAIL], msg.as_string())

        logger.info("Email notification sent for order %s", order_data.get("order_id"))
        return True

    except Exception as exc:
        logger.error("Email notification failed: %s", exc)
        return False


async def send_order_notifications(order_data: dict) -> None:
    """
    Fire-and-forget notification dispatch called after order is committed.
    Sends to all configured channels. Failures are logged but do NOT
    propagate back to the order creation response.

    order_data keys:
        order_id, customer_name, customer_phone, customer_email,
        delivery_address, size_variant, special_instructions,
        items: [{name, sku, qty, size_variant, line_total}],
        subtotal, delivery_fee, total,
        creator_handle, influencer_id, source_channel
    """
    # Parse notify numbers from env (comma-separated)
    notify_numbers_raw = getattr(settings, "WHATSAPP_NOTIFY_NUMBERS", "") or ""
    notify_numbers = [n.strip() for n in notify_numbers_raw.split(",") if n.strip()]

    ops_message = _format_whatsapp_order_message(order_data)

    # Send WhatsApp to all ops numbers concurrently
    if notify_numbers:
        tasks = [_send_whatsapp_twilio(num, ops_message) for num in notify_numbers]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        for num, result in zip(notify_numbers, results):
            if isinstance(result, Exception):
                logger.error("WhatsApp to %s raised exception: %s", num, result)

    # Send email in thread pool (SMTP is sync)
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _send_email_notification, order_data)

    logger.info(
        "Notifications dispatched for order %s (WA targets: %d)",
        order_data.get("order_id"),
        len(notify_numbers),
    )


async def send_welcome_notification(user_data: dict) -> None:
    """
    Fire-and-forget welcome notification when a new influencer registers.
    Sends:
    1. WhatsApp welcome to the influencer (if phone known — skipped for signup since no phone yet)
    2. WhatsApp alert to ops: "New creator registered"
    3. Email receipt to the new user (if SMTP configured)

    user_data keys: email, name, role, handle (influencer only)
    """
    name = user_data.get("name") or "Creator"
    email = user_data.get("email", "")
    handle = user_data.get("handle", "")
    role = user_data.get("role", "influencer")

    if role != "influencer":
        return  # Welcome flow only for influencers for now

    # Notify ops: new creator signed up
    notify_numbers_raw = getattr(settings, "WHATSAPP_NOTIFY_NUMBERS", "") or ""
    notify_numbers = [n.strip() for n in notify_numbers_raw.split(",") if n.strip()]

    ops_message = (
        f"🌟 *NEW CREATOR REGISTERED* — Yes MAM\n\n"
        f"*Name:* {name}\n"
        f"*Email:* {email}\n"
        f"*Handle:* @{handle}\n"
        f"*Store:* https://sensedirector.com/mam/{handle}\n\n"
        f"Action: Add products, then contact {name} via email to activate their store."
    )

    tasks = [_send_whatsapp_twilio(num, ops_message) for num in notify_numbers]
    if tasks:
        await asyncio.gather(*tasks, return_exceptions=True)

    # Send welcome email to the new influencer
    if email and settings.SMTP_HOST:
        def _send_welcome_email() -> None:
            try:
                store_url = f"https://sensedirector.com/mam/{handle}"
                subject = f"Welcome to Yes MAM, {name}! Your store is live 🎉"
                body = (
                    f"Hi {name},\n\n"
                    f"Welcome to Yes MAM — Africa's creator commerce platform!\n\n"
                    f"Your store is live at:\n{store_url}\n\n"
                    f"Log in to your creator dashboard at:\nhttps://sensedirector.com/mam/dashboard\n\n"
                    f"Your login email: {email}\n\n"
                    f"What's next:\n"
                    f"1. Log in and complete your profile (add your bio and photo)\n"
                    f"2. Browse your assigned products\n"
                    f"3. Share your store link on TikTok, Instagram, or WhatsApp\n"
                    f"4. Earn commissions on every sale — paid weekly to your MoMo!\n\n"
                    f"Questions? WhatsApp us: +13107763650\n\n"
                    f"— The Yes MAM Team"
                )
                msg = MIMEMultipart("alternative")
                msg["Subject"] = subject
                msg["From"] = settings.SMTP_USER or settings.NOTIFY_EMAIL
                msg["To"] = email
                msg.attach(MIMEText(body, "plain"))
                with smtplib.SMTP(settings.SMTP_HOST, int(settings.SMTP_PORT or 587)) as smtp:
                    smtp.starttls()
                    if settings.SMTP_USER and settings.SMTP_PASSWORD:
                        smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                    smtp.sendmail(msg["From"], [email], msg.as_string())
                logger.info("Welcome email sent to %s", email)
            except Exception as exc:
                logger.error("Welcome email failed for %s: %s", email, exc)

        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, _send_welcome_email)

    logger.info("Welcome notification dispatched for new influencer %s (%s)", handle, email)
