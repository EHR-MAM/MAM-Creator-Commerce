// Always-visible WhatsApp fallback — critical for Ghana market
// Many customers prefer WhatsApp over online checkout.
// When a product is provided, the message pre-fills with product name + price
// so the operator can enter the order into the system manually.

interface Props {
  handle: string;
  productName?: string;
  productPrice?: string;
  currency?: string;
  productId?: string;
  creatorPhone?: string | null;
}

function formatPhone(phone: string | null | undefined): string {
  if (!phone) return process.env.NEXT_PUBLIC_CREATOR_WHATSAPP || "233000000000";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("0")) return "233" + digits.slice(1);
  if (digits.length >= 10) return digits;
  return process.env.NEXT_PUBLIC_CREATOR_WHATSAPP || "233000000000";
}

export default function WhatsAppFallback({
  handle,
  productName,
  productPrice,
  currency = "GHS",
  productId,
  creatorPhone,
}: Props) {
  const whatsappNumber = formatPhone(creatorPhone);

  // Structured message — operator uses this to manually log order in admin panel
  const message = productName
    ? [
        `Hi @${handle}! I want to order:`,
        ``,
        `Product: ${productName}`,
        `Price: ${currency} ${productPrice}`,
        productId ? `Ref: ${productId.slice(0, 8)}` : null,
        ``,
        `Please let me know how to pay and where to deliver.`,
      ]
        .filter(l => l !== null)
        .join("\n")
    : `Hi! I saw your TikTok @${handle} and I'd like to order. Can you help me?`;

  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

  return (
    <div className="border border-green-100 rounded-xl p-4 bg-green-50">
      <p className="text-sm font-semibold text-gray-700 mb-1">
        {productName ? "Order via WhatsApp" : "Prefer to order via WhatsApp?"}
      </p>
      <p className="text-xs text-gray-500 mb-3">
        {productName
          ? "Tap below to send a pre-filled order message — we'll confirm delivery details."
          : "Not ready to checkout? Chat with us directly on WhatsApp."}
      </p>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors w-full justify-center"
      >
        <span className="text-lg">💬</span> Chat on WhatsApp
      </a>
      <p className="text-xs text-gray-400 mt-2 text-center">
        Available 8am–8pm GMT · Usually responds within 2 hours
      </p>
    </div>
  );
}
