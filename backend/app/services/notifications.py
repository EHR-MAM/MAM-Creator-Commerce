"""
MAM Notification Service — Sprint A + Sprint LXXIX (HTML email templates)
Sends order notifications via:
1. WhatsApp (Twilio API) → ops team numbers
2. Email (SMTP) → ops email (HTML + plain text)
3. Influencer notification (stored in DB for dashboard badge)

WhatsApp numbers notified on every order:
- +13107763650 (David / primary ops)
- +19492430088 (ops group / test)

WhatsApp provider: Twilio WhatsApp Sandbox / Business API
Email templates: email_templates.py (HTML + plain text fallback)
Falls back silently if not configured — order still saves.
"""

import asyncio
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

from app.core.config import settings
from app.services.email_templates import get_order_notification_html, get_payout_notification_html, get_creator_onboarding_html

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
    """Send order notification email to ops with HTML template. Returns True on success."""
    if not settings.SMTP_HOST or not settings.NOTIFY_EMAIL:
        logger.warning("Email not configured — skipping email notification")
        return False

    try:
        order_id_short = str(order_data.get("order_id", ""))[:8].upper()
        subject = f"[MAM] New Order #{order_id_short} — GHS {order_data.get('total', 0):.2f}"

        # Get HTML + plain text from template
        html_body, text_body = get_order_notification_html(order_data)

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.SMTP_USER or settings.NOTIFY_EMAIL
        msg["To"] = settings.NOTIFY_EMAIL

        # Plain text fallback first, then HTML
        msg.attach(MIMEText(text_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

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


async def send_order_status_notification(order_data: dict) -> None:
    """
    Fire-and-forget customer notification when an order status changes to
    'shipped' or 'delivered'. Sends a WhatsApp message to the customer's phone.

    order_data keys:
        order_id, customer_name, customer_phone, new_status,
        creator_handle (optional), product_name (optional)
    """
    customer_phone = order_data.get("customer_phone", "")
    customer_name = order_data.get("customer_name", "Customer")
    new_status = order_data.get("new_status", "")
    order_id_short = str(order_data.get("order_id", ""))[:8].upper()
    handle = order_data.get("creator_handle", "")
    product_name = order_data.get("product_name", "your order")

    if not customer_phone:
        logger.warning("No customer phone — skipping order status notification for %s", order_id_short)
        return

    if new_status == "shipped":
        message = (
            f"📦 *Your MAM order is on its way!*\n\n"
            f"Hi {customer_name},\n\n"
            f"Great news — your order #{order_id_short} for *{product_name}* has been shipped "
            f"and is on its way to you.\n\n"
            f"Delivery usually takes 24–72 hours within Accra.\n\n"
            f"Questions? WhatsApp us: +13107763650\n\n"
            f"— Yes MAM"
            + (f"\n_(via @{handle}'s store)_" if handle else "")
        )
    elif new_status == "delivered":
        message = (
            f"✅ *Order delivered!*\n\n"
            f"Hi {customer_name},\n\n"
            f"Your order #{order_id_short} for *{product_name}* has been marked as delivered. "
            f"We hope you love it!\n\n"
            f"If you have any issues, WhatsApp us: +13107763650\n\n"
            f"— Yes MAM"
            + (f"\n_(via @{handle}'s store)_" if handle else "")
        )
    else:
        # Only notify on shipped + delivered
        return

    await _send_whatsapp_twilio(customer_phone, message)
    logger.info(
        "Order status notification sent to %s for order %s (status: %s)",
        customer_phone, order_id_short, new_status,
    )



async def send_customer_order_confirmation(order_data: dict) -> None:
    """
    Sprint XLIII: Fire-and-forget WhatsApp confirmation to the customer immediately
    after they place an order. Gives them their order ID, total, and tracking link.

    order_data keys (same as notification_data in create_order):
        order_id, customer_name, customer_phone, items, total, creator_handle
    """
    customer_phone = order_data.get("customer_phone", "")
    if not customer_phone:
        logger.warning(
            "No customer phone — skipping customer confirmation for order %s",
            str(order_data.get("order_id", ""))[:8].upper(),
        )
        return

    order_id_short = str(order_data.get("order_id", ""))[:8].upper()
    full_order_id = str(order_data.get("order_id", ""))
    customer_name = order_data.get("customer_name", "there")
    first_name = customer_name.split()[0] if customer_name else "there"
    total = float(order_data.get("total", 0))
    handle = order_data.get("creator_handle", "")
    items = order_data.get("items", [])

    # Build item summary (max 3 lines)
    if items:
        item_lines = "\n".join(
            "  • {} x{}".format(item["name"], item["qty"])
            for item in items[:3]
        )
        if len(items) > 3:
            item_lines += "\n  • +{} more item{}".format(len(items) - 3, "s" if len(items) - 3 > 1 else "")
    else:
        item_lines = "  (see order details)"

    # Tracking URL — uses the order-status page
    tracking_url = "https://sensedirector.com/mam/order-status?order_id={}".format(full_order_id)

    message = (
        "\U0001f6d2 *Order Confirmed — Yes MAM*\n\n"
        "Hi {first_name}, thank you for your order!\n\n"
        "*Order #{order_id}*\n"
        "{items}\n\n"
        "*Total: GHS {total:.2f}* (pay on delivery)\n\n"
        "Track your order:\n{tracking}\n\n"
        "We'll send you updates when your order is shipped.\n"
        "Questions? WhatsApp us: +13107763650\n\n"
        "— Yes MAM"
        + ("\n_(via @{handle}'s store)_".format(handle=handle) if handle else "")
    ).format(
        first_name=first_name,
        order_id=order_id_short,
        items=item_lines,
        total=total,
        tracking=tracking_url,
    )

    await _send_whatsapp_twilio(customer_phone, message)
    logger.info(
        "Customer order confirmation sent to %s for order %s",
        customer_phone,
        order_id_short,
    )


async def send_creator_order_notification(order_data: dict) -> None:
    """
    Sprint XXIV: Fire-and-forget WhatsApp alert to the creator when someone
    orders from their store. Sends to payout_details_ref (MoMo/WhatsApp number)
    or user.phone as fallback. Falls back silently if no phone is set.

    order_data keys:
        order_id, customer_name, items, total, creator_handle, creator_phone
    """
    creator_phone = order_data.get("creator_phone", "")
    if not creator_phone:
        logger.info(
            "Creator has no phone set -- skipping creator order notification for order %s",
            str(order_data.get("order_id", ""))[:8].upper(),
        )
        return

    order_id_short = str(order_data.get("order_id", ""))[:8].upper()
    handle = order_data.get("creator_handle", "your store")
    customer_name = order_data.get("customer_name", "A customer")
    total = order_data.get("total", 0)
    items = order_data.get("items", [])

    if items:
        item_lines = ", ".join(
            "{} x{}".format(item["name"], item["qty"]) for item in items[:3]
        )
        if len(items) > 3:
            item_lines += " + {} more".format(len(items) - 3)
    else:
        item_lines = "items"

    message = (
        "*Yes MAM \U0001f6d2 New Order!*\n\n"
        "Hi @{handle},\n\n"
        "*{customer}* just placed an order from your store!\n\n"
        "*Items:* {items}\n"
        "*Order Total:* GHS {total:.2f}\n"
        "*Order ID:* #{order_id}\n\n"
        "Your commission will be added to your dashboard once the order is delivered.\n\n"
        "Questions? WhatsApp ops: +13107763650\n\n"
        "Keep sharing your store link to earn more! \U0001f4b0"
    ).format(
        handle=handle,
        customer=customer_name,
        items=item_lines,
        total=float(total),
        order_id=order_id_short,
    )

    await _send_whatsapp_twilio(creator_phone, message)
    logger.info(
        "Creator order notification sent to %s (@%s) for order %s",
        creator_phone,
        handle,
        order_id_short,
    )


def _send_payout_notification_email(payout_data: dict, recipient_email: str) -> bool:
    """Send payout completion email with HTML template. Returns True on success."""
    if not settings.SMTP_HOST:
        logger.warning("Email not configured — skipping payout notification")
        return False

    try:
        amount = float(payout_data.get("amount", 0))
        html_body, text_body = get_payout_notification_html(payout_data)

        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Payout Sent — GHS {amount:.2f}"
        msg["From"] = settings.SMTP_USER or settings.NOTIFY_EMAIL
        msg["To"] = recipient_email

        msg.attach(MIMEText(text_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(settings.SMTP_HOST, int(settings.SMTP_PORT or 587)) as smtp:
            smtp.starttls()
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            smtp.sendmail(msg["From"], [recipient_email], msg.as_string())

        logger.info("Payout email sent to %s", recipient_email)
        return True

    except Exception as exc:
        logger.error("Payout email failed: %s", exc)
        return False


def _send_creator_onboarding_email(creator_data: dict, recipient_email: str) -> bool:
    """Send creator welcome email with HTML template. Returns True on success."""
    if not settings.SMTP_HOST:
        logger.warning("Email not configured — skipping onboarding email")
        return False

    try:
        html_body, text_body = get_creator_onboarding_html(creator_data)

        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Welcome to Yes MAM — Your Creator Store is Live!"
        msg["From"] = settings.SMTP_USER or settings.NOTIFY_EMAIL
        msg["To"] = recipient_email

        msg.attach(MIMEText(text_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(settings.SMTP_HOST, int(settings.SMTP_PORT or 587)) as smtp:
            smtp.starttls()
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            smtp.sendmail(msg["From"], [recipient_email], msg.as_string())

        logger.info("Onboarding email sent to %s", recipient_email)
        return True

    except Exception as exc:
        logger.error("Onboarding email failed: %s", exc)
        return False
