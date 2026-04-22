const NOTIFY_NUMBERS = (process.env.WHATSAPP_NOTIFY_NUMBERS || "").split(",").map((n) => n.trim()).filter(Boolean);

export async function sendWhatsApp(to: string, message: string): Promise<void> {
  const [sid, token] = (process.env.WHATSAPP_API_KEY || ":").split(":");
  if (!sid || !token) return;
  try {
    const body = new URLSearchParams({
      From: `whatsapp:${process.env.WHATSAPP_FROM_NUMBER || "+14155238886"}`,
      To: `whatsapp:${to}`,
      Body: message,
    });
    await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });
  } catch (err) {
    console.error("[WhatsApp] send failed to", to, err);
  }
}

export async function notifyOps(message: string): Promise<void> {
  await Promise.all(NOTIFY_NUMBERS.map((n) => sendWhatsApp(n, message)));
}
