"""
MAM Email Templates — Sprint LXXIX
HTML email templates for order confirmations, payout notifications, and creator onboarding.
Uses inline CSS for maximum email client compatibility.
"""


def get_order_notification_html(order_data: dict) -> tuple[str, str]:
    """
    Generate HTML + plain text email for new order notification.
    Returns: (html_body, text_body) tuple.
    """
    order_id = str(order_data.get("order_id", ""))[:8].upper()
    customer_name = order_data.get("customer_name", "Customer")
    total = float(order_data.get("total", 0))
    creator_handle = order_data.get("creator_handle", "—")
    items_list = order_data.get("items", [])

    # Build items HTML
    items_html = ""
    for item in items_list:
        size_str = f" — {item.get('size_variant', '')}" if item.get("size_variant") else ""
        qty = item.get("qty", 1)
        line_total = float(item.get("line_total", 0))
        items_html += f"""
        <tr>
          <td style="padding: 8px 12px; font-size: 14px; color: #333;">
            {item.get('name', 'Item')}{size_str}
          </td>
          <td style="padding: 8px 12px; text-align: center; font-size: 14px; color: #666;">
            x{qty}
          </td>
          <td style="padding: 8px 12px; text-align: right; font-size: 14px; color: #333; font-weight: 600;">
            GHS {line_total:.2f}
          </td>
        </tr>
        """

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New MAM Order</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
      <table width="100%" style="background-color: #f5f5f5;">
        <tr>
          <td align="center" style="padding: 20px;">
            <table width="600" style="background-color: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #0A0A0A 0%, #1a1a1a 100%); padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center;">
                  <h1 style="margin: 0; font-size: 28px; color: #C9A84C; font-weight: 700;">🛒 Yes MAM</h1>
                  <p style="margin: 8px 0 0 0; font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 1px;">New Order Received</p>
                </td>
              </tr>

              <!-- Order Info Card -->
              <tr>
                <td style="padding: 30px 20px;">
                  <div style="background-color: #fafaf8; border-left: 4px solid #C9A84C; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Order #{order_id}</p>
                    <p style="margin: 0; font-size: 24px; color: #0A0A0A; font-weight: 700;">GHS {total:.2f}</p>
                    <p style="margin: 8px 0 0 0; font-size: 13px; color: #999;">From: @{creator_handle}</p>
                  </div>

                  <p style="margin: 0 0 12px 0; font-size: 14px; color: #333;">
                    <strong>Customer:</strong> {customer_name}
                  </p>
                  <p style="margin: 0 0 12px 0; font-size: 14px; color: #333;">
                    <strong>Phone:</strong> {order_data.get('customer_phone', '—')}
                  </p>
                  <p style="margin: 0 0 20px 0; font-size: 14px; color: #333;">
                    <strong>Delivery:</strong> {order_data.get('delivery_address', '—')}
                  </p>

                  <!-- Items Table -->
                  <table width="100%" style="margin-bottom: 20px; border-collapse: collapse;">
                    <thead>
                      <tr style="border-bottom: 2px solid #eee;">
                        <th style="padding: 12px; text-align: left; font-size: 12px; color: #999; font-weight: 600; text-transform: uppercase;">Item</th>
                        <th style="padding: 12px; text-align: center; font-size: 12px; color: #999; font-weight: 600; text-transform: uppercase;">Qty</th>
                        <th style="padding: 12px; text-align: right; font-size: 12px; color: #999; font-weight: 600; text-transform: uppercase;">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items_html}
                    </tbody>
                  </table>

                  <!-- Totals -->
                  <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px;">
                    <table width="100%" style="border-collapse: collapse;">
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #666;">Subtotal:</td>
                        <td style="padding: 6px 0; text-align: right; font-size: 13px; color: #666;">GHS {order_data.get('subtotal', 0):.2f}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #666;">Delivery:</td>
                        <td style="padding: 6px 0; text-align: right; font-size: 13px; color: #666;">GHS {order_data.get('delivery_fee', 20):.2f}</td>
                      </tr>
                      <tr style="border-top: 2px solid #ddd;">
                        <td style="padding: 12px 0; font-size: 14px; color: #0A0A0A; font-weight: 700;">Total:</td>
                        <td style="padding: 12px 0; text-align: right; font-size: 18px; color: #C9A84C; font-weight: 700;">GHS {total:.2f}</td>
                      </tr>
                    </table>
                  </div>
                </td>
              </tr>

              <!-- CTA -->
              <tr>
                <td style="padding: 20px; text-align: center; border-top: 1px solid #eee;">
                  <a href="#" style="display: inline-block; background-color: #C9A84C; color: #0A0A0A; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: 700; font-size: 14px;">
                    View Order Details
                  </a>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 20px; background-color: #f9f9f9; border-radius: 0 0 8px 8px; text-align: center; border-top: 1px solid #eee;">
                  <p style="margin: 0; font-size: 12px; color: #999;">
                    Yes MAM — Africa's Creator Commerce Platform<br>
                    <a href="#" style="color: #C9A84C; text-decoration: none;">sensedirector.com/mam</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """

    # Plain text fallback
    text = f"""
New Order Received on Yes MAM

Order ID: {order_id}
Total: GHS {total:.2f}
From: @{creator_handle}

Customer: {customer_name}
Phone: {order_data.get('customer_phone', '—')}
Delivery: {order_data.get('delivery_address', '—')}

Items:
"""
    for item in items_list:
        size_str = f" — {item.get('size_variant', '')}" if item.get("size_variant") else ""
        text += f"\n  • {item.get('name', 'Item')}{size_str} x{item.get('qty', 1)} = GHS {float(item.get('line_total', 0)):.2f}"

    text += f"""

Subtotal: GHS {order_data.get('subtotal', 0):.2f}
Delivery: GHS {order_data.get('delivery_fee', 20):.2f}
Total: GHS {total:.2f}

---
Yes MAM — Africa's Creator Commerce Platform
sensedirector.com/mam
    """

    return html, text.strip()


def get_payout_notification_html(payout_data: dict) -> tuple[str, str]:
    """Generate HTML + plain text email for payout completion notification."""
    creator_handle = payout_data.get("creator_handle", "Creator")
    amount = float(payout_data.get("amount", 0))
    method = payout_data.get("payout_method", "MoMo")
    reference = payout_data.get("external_reference", "")

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payout Completed</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
      <table width="100%" style="background-color: #f5f5f5;">
        <tr>
          <td align="center" style="padding: 20px;">
            <table width="600" style="background-color: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #2D6A4F 0%, #1b4332 100%); padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center;">
                  <h1 style="margin: 0; font-size: 28px; color: #fff; font-weight: 700;">✓ Payout Sent</h1>
                  <p style="margin: 8px 0 0 0; font-size: 12px; color: #aaa; text-transform: uppercase; letter-spacing: 1px;">Earnings Transferred</p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 30px 20px;">
                  <p style="margin: 0 0 20px 0; font-size: 16px; color: #333;">
                    Hi @{creator_handle},
                  </p>
                  <p style="margin: 0 0 20px 0; font-size: 14px; color: #666; line-height: 1.6;">
                    Great news! We've sent your payout. Your earnings are on their way to your {method} account.
                  </p>

                  <!-- Amount Box -->
                  <div style="background-color: #f0f8f4; border-left: 4px solid #2D6A4F; padding: 20px; margin: 20px 0; border-radius: 4px;">
                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Amount Sent</p>
                    <p style="margin: 0; font-size: 32px; color: #2D6A4F; font-weight: 700;">GHS {amount:.2f}</p>
                  </div>

                  <!-- Details -->
                  <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
                    <p style="margin: 0 0 10px 0; font-size: 13px; color: #666;">
                      <strong>Method:</strong> {method}
                    </p>
                    {f'<p style="margin: 0; font-size: 13px; color: #666;"><strong>Reference:</strong> {reference}</p>' if reference else ''}
                  </div>

                  <p style="margin: 0 0 20px 0; font-size: 14px; color: #666; line-height: 1.6;">
                    If you don't see the funds within 24 hours, please reach out to our support team.
                  </p>

                  <a href="#" style="display: inline-block; background-color: #2D6A4F; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: 700; font-size: 14px;">
                    View Dashboard
                  </a>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 20px; background-color: #f9f9f9; border-radius: 0 0 8px 8px; text-align: center; border-top: 1px solid #eee;">
                  <p style="margin: 0; font-size: 12px; color: #999;">
                    Yes MAM — Africa's Creator Commerce Platform<br>
                    <a href="#" style="color: #2D6A4F; text-decoration: none;">sensedirector.com/mam</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """

    text = f"""
Payout Sent to @{creator_handle}

Amount: GHS {amount:.2f}
Method: {method}
{"Reference: " + reference if reference else ""}

Your earnings have been transferred. Please check your {method} account.
If funds don't arrive within 24 hours, contact support.

---
Yes MAM — Africa's Creator Commerce Platform
sensedirector.com/mam
    """

    return html, text.strip()


def get_creator_onboarding_html(creator_data: dict) -> tuple[str, str]:
    """Generate HTML + plain text email for new creator onboarding."""
    handle = creator_data.get("handle", "Creator")
    name = creator_data.get("name", "")
    store_url = f"sensedirector.com/mam/{handle}"

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Store is Ready!</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
      <table width="100%" style="background-color: #f5f5f5;">
        <tr>
          <td align="center" style="padding: 20px;">
            <table width="600" style="background-color: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #C9A84C 0%, #d4af6a 100%); padding: 40px 20px; border-radius: 8px 8px 0 0; text-align: center;">
                  <h1 style="margin: 0; font-size: 32px; color: #0A0A0A; font-weight: 700;">🎉 Welcome!</h1>
                  <p style="margin: 8px 0 0 0; font-size: 14px; color: #333; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Your Store is Live</p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px 20px;">
                  <p style="margin: 0 0 16px 0; font-size: 18px; color: #333; font-weight: 600;">
                    Hey {name or handle}! 👋
                  </p>
                  <p style="margin: 0 0 20px 0; font-size: 14px; color: #666; line-height: 1.8;">
                    Your Yes MAM creator store is now live! Your followers can discover and order from your curated products, and you earn 18% commission on every sale.
                  </p>

                  <!-- Store Link -->
                  <div style="background-color: #fafaf8; border: 2px dashed #C9A84C; padding: 20px; border-radius: 6px; margin: 30px 0; text-align: center;">
                    <p style="margin: 0 0 10px 0; font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Your Store URL</p>
                    <p style="margin: 0; font-size: 16px; color: #C9A84C; font-weight: 700; word-break: break-all;">
                      {store_url}
                    </p>
                    <p style="margin: 12px 0 0 0; font-size: 12px; color: #999;">
                      Share this link with your followers on TikTok, Instagram, WhatsApp — everywhere!
                    </p>
                  </div>

                  <!-- Next Steps -->
                  <p style="margin: 0 0 12px 0; font-size: 14px; color: #333; font-weight: 600;">Next Steps:</p>
                  <ul style="margin: 0 0 20px 0; padding-left: 20px;">
                    <li style="margin: 8px 0; font-size: 14px; color: #666;">Complete your profile: add a bio and avatar</li>
                    <li style="margin: 8px 0; font-size: 14px; color: #666;">Add your MoMo number for payouts</li>
                    <li style="margin: 8px 0; font-size: 14px; color: #666;">Share your store link with your audience</li>
                    <li style="margin: 8px 0; font-size: 14px; color: #666;">Track orders and earnings in your dashboard</li>
                  </ul>

                  <a href="#" style="display: inline-block; background-color: #C9A84C; color: #0A0A0A; text-decoration: none; padding: 14px 28px; border-radius: 4px; font-weight: 700; font-size: 14px; margin-right: 10px;">
                    Go to Dashboard
                  </a>
                  <a href="#" style="display: inline-block; background-color: #f0f0f0; color: #0A0A0A; text-decoration: none; padding: 14px 28px; border-radius: 4px; font-weight: 700; font-size: 14px;">
                    View Your Store
                  </a>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 20px; background-color: #f9f9f9; border-radius: 0 0 8px 8px; text-align: center; border-top: 1px solid #eee;">
                  <p style="margin: 0 0 10px 0; font-size: 12px; color: #999;">
                    Questions? Reply to this email or chat with us on WhatsApp<br>
                    <a href="#" style="color: #C9A84C; text-decoration: none;">WhatsApp Support</a>
                  </p>
                  <p style="margin: 10px 0 0 0; font-size: 11px; color: #ccc;">
                    Yes MAM — Africa's Creator Commerce Platform
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """

    text = f"""
Welcome to Yes MAM, {name or handle}!

Your store is live at: {store_url}

Share your store link with your followers on TikTok, Instagram, WhatsApp, and anywhere else!

Next Steps:
1. Complete your profile (add bio and avatar)
2. Add your MoMo number for payouts
3. Start sharing your store link
4. Track orders and earnings in your dashboard

Need help? Reply to this email or chat with us on WhatsApp.

---
Yes MAM — Africa's Creator Commerce Platform
sensedirector.com/mam
    """

    return html, text.strip()
