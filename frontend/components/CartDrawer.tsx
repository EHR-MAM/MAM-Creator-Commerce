"use client";
// CartDrawer — Sprint XIX + Sprint XXII (payment method selector + Paystack redirect)
// Slide-up cart panel: shows items, quantities, payment method, and inline checkout form.
import { useState, useEffect } from "react";
import { useCart } from "@/lib/cart";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8200";
const DELIVERY_FEE = 20;

// Payment methods fetched from backend — typed inline
interface PayMethod {
  id: string;
  name: string;
  provider: string;
  icon: string;
}

const ICON_MAP: Record<string, string> = {
  mobile: "📱",
  card: "💳",
  bank: "🏦",
  home: "🏠",
  phone: "📞",
  lightning: "⚡",
  store: "🏪",
};

export default function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, count, total, removeItem, updateQty, clear } = useCart();

  // Checkout form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [instructions, setInstructions] = useState("");
  const [methodId, setMethodId] = useState("pay_on_delivery");
  const [payMethods, setPayMethods] = useState<PayMethod[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paymentRedirect, setPaymentRedirect] = useState<string | null>(null);
  const [orderId, setOrderId] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState<"cart" | "checkout">("cart");

  const orderTotal = (total + DELIVERY_FEE).toFixed(2);

  // Fetch payment methods on mount
  useEffect(() => {
    fetch(`${API_URL}/payments/methods?country=GH`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.methods) {
          setPayMethods(data.methods);
          // Default to cod if available
          const cod = data.methods.find((m: PayMethod) => m.id === "pay_on_delivery");
          if (cod) setMethodId("pay_on_delivery");
        }
      })
      .catch(() => {/* use fallback */});
  }, []);

  // Reset when drawer opens
  useEffect(() => {
    if (open) {
      setSuccess(false);
      setPaymentRedirect(null);
      setError("");
      setStep("cart");
    }
  }, [open]);

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return;
    setSubmitting(true);
    setError("");

    const first = items[0];
    const vendorId = first.vendorId;
    const influencerId = first.influencerId;
    const influencerParam = influencerId ? `&influencer_id=${influencerId}` : "";

    try {
      // Step 1: Create the order
      const res = await fetch(
        `${API_URL}/orders?vendor_id=${vendorId}${influencerParam}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: items.map(i => ({
              product_id: i.productId,
              quantity: i.quantity,
              unit_price: i.price,
            })),
            customer_name: name,
            customer_phone: phone,
            customer_email: email || undefined,
            delivery_address: address,
            special_instructions: instructions || undefined,
            source_channel: "tiktok",
            subtotal: total,
            delivery_fee: DELIVERY_FEE,
            total: total + DELIVERY_FEE,
          }),
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Order failed");
      }

      const orderData = await res.json();
      const shortId = String(orderData.id).slice(0, 8).toUpperCase();
      setOrderId(shortId);
      clear();

      // Step 2: Initiate payment if not COD
      if (methodId !== "pay_on_delivery") {
        const payRes = await fetch(`${API_URL}/orders/${orderData.id}/pay`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method_id: methodId,
            email: email || `${phone}@yesmam.shop`,
            phone: phone,
            callback_url: `${window.location.origin}/payment-complete?order_id=${orderData.id}`,
          }),
        });

        if (payRes.ok) {
          const payData = await payRes.json();
          if (payData.redirect_url) {
            setPaymentRedirect(payData.redirect_url);
          }
        }
        // If pay endpoint fails (503 — Paystack not configured), fall through to COD success
      }

      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(msg + " You can also order via WhatsApp.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  // Determine which methods to show — prioritize cod first, then mobile money, then card
  const displayMethods = payMethods.length > 0
    ? [
        ...payMethods.filter(m => m.id === "pay_on_delivery"),
        ...payMethods.filter(m => m.provider === "paystack" && m.id !== "pay_on_delivery"),
        ...payMethods.filter(m => m.provider !== "paystack" && m.id !== "pay_on_delivery"),
      ]
    : [
        { id: "pay_on_delivery", name: "Pay on Delivery", provider: "cod", icon: "home" },
        { id: "mtn_momo_gh", name: "MTN Mobile Money", provider: "paystack", icon: "mobile" },
        { id: "card", name: "Debit / Credit Card", provider: "paystack", icon: "card" },
      ];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛒</span>
            <h2 className="font-black text-lg">
              {step === "cart" ? `Cart (${count})` : "Checkout"}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
        </div>

        <div className="px-5 py-4">

          {/* ── SUCCESS STATE ── */}
          {success ? (
            <div className="text-center py-8 space-y-3">
              <p className="text-5xl">{paymentRedirect ? "🔗" : "✅"}</p>
              <p className="font-black text-xl">{paymentRedirect ? "Order placed!" : "Order placed!"}</p>
              <p className="text-xs font-mono bg-gray-100 rounded px-3 py-1 inline-block">
                Order #{orderId}
              </p>

              {paymentRedirect ? (
                <>
                  <p className="text-sm text-gray-600">
                    Your order is saved. Complete payment below to confirm.
                  </p>
                  <a
                    href={paymentRedirect}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-[#FFB81C] text-black py-4 rounded-xl font-black text-base mt-2 text-center"
                  >
                    Pay Now — GHS {orderTotal}
                  </a>
                  <p className="text-xs text-gray-400">Opens Paystack secure payment page</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-600">
                    We'll reach you on WhatsApp at <span className="font-semibold">{phone}</span> to confirm and arrange delivery.
                  </p>
                  <p className="text-xs text-gray-400">Pay on delivery — cash or MoMo accepted</p>
                </>
              )}

              <button
                onClick={onClose}
                className="mt-4 bg-black text-white px-8 py-3 rounded-xl font-bold text-sm"
              >
                Done
              </button>
            </div>

          ) : step === "cart" ? (

          /* ── CART STEP ── */
          <>
            {items.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-4xl mb-3">🛒</p>
                <p className="font-medium">Your cart is empty</p>
                <p className="text-sm mt-1">Add items from the store to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map(item => (
                  <div key={item.productId} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="w-14 h-14 object-cover rounded-lg shrink-0"
                        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{item.productName}</p>
                      <p className="text-xs text-gray-500">
                        {item.currency} {item.price.toFixed(2)} each
                      </p>
                    </div>
                    {/* Qty controls */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => updateQty(item.productId, item.quantity - 1)}
                        className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 font-bold text-sm flex items-center justify-center"
                      >−</button>
                      <span className="text-sm font-bold w-5 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.productId, item.quantity + 1)}
                        className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 font-bold text-sm flex items-center justify-center"
                      >+</button>
                    </div>
                    <p className="text-sm font-bold shrink-0 w-16 text-right">
                      {item.currency} {(item.price * item.quantity).toFixed(2)}
                    </p>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="text-gray-300 hover:text-red-400 shrink-0"
                    >×</button>
                  </div>
                ))}

                {/* Order summary */}
                <div className="border-t border-gray-100 pt-3 space-y-1">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Subtotal</span>
                    <span>GHS {total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Delivery</span>
                    <span>GHS {DELIVERY_FEE.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-black text-base">
                    <span>Total</span>
                    <span>GHS {orderTotal}</span>
                  </div>
                </div>

                <button
                  onClick={() => setStep("checkout")}
                  className="w-full bg-black text-white py-4 rounded-xl font-black text-base mt-2"
                >
                  Checkout — GHS {orderTotal}
                </button>
              </div>
            )}
          </>

          ) : (

          /* ── CHECKOUT STEP ── */
          <form onSubmit={handleCheckout} className="space-y-4">
            {/* Back to cart */}
            <button
              type="button"
              onClick={() => setStep("cart")}
              className="text-sm text-gray-500 hover:text-black flex items-center gap-1"
            >
              ← Back to cart
            </button>

            {/* Order summary mini */}
            <div className="bg-gray-50 rounded-xl p-3 text-sm">
              <p className="font-semibold mb-1">{count} item{count !== 1 ? "s" : ""} · GHS {orderTotal}</p>
              {items.map(i => (
                <p key={i.productId} className="text-xs text-gray-500">
                  {i.productName} × {i.quantity}
                </p>
              ))}
            </div>

            {/* Customer fields */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text" required value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Akosua Mensah"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                WhatsApp / Phone <span className="text-red-400">*</span>
              </label>
              <input
                type="tel" required value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. 0244123456"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
              <p className="text-xs text-gray-400 mt-0.5">We'll confirm via WhatsApp</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Delivery Address <span className="text-red-400">*</span>
              </label>
              <textarea
                required value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="e.g. East Legon, near ABC junction, house no. 12"
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Email (optional)</label>
              <input
                type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="for order receipt"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
              {methodId !== "pay_on_delivery" && !email && (
                <p className="text-xs text-amber-500 mt-0.5">Email recommended for online payment receipt</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Special instructions (optional)</label>
              <input
                type="text" value={instructions}
                onChange={e => setInstructions(e.target.value)}
                placeholder="e.g. size preferences, colour, etc."
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            {/* Payment method selector */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Payment Method</label>
              <div className="space-y-2">
                {displayMethods.map(method => (
                  <label
                    key={method.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                      methodId === method.id
                        ? "border-black bg-gray-50"
                        : "border-gray-100 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value={method.id}
                      checked={methodId === method.id}
                      onChange={() => setMethodId(method.id)}
                      className="sr-only"
                    />
                    <span className="text-xl shrink-0">{ICON_MAP[method.icon] || "💰"}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{method.name}</p>
                      <p className="text-xs text-gray-400">
                        {method.provider === "paystack" ? "Secure · Powered by Paystack" :
                         method.provider === "cod" ? "Cash or MoMo when delivered" :
                         method.provider}
                      </p>
                    </div>
                    {methodId === method.id && (
                      <span className="text-black font-black text-sm">✓</span>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-xs bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-black text-white py-4 rounded-xl font-black text-base disabled:opacity-50"
            >
              {submitting ? "Placing order…" : methodId === "pay_on_delivery"
                ? `Place Order — GHS ${orderTotal}`
                : `Place Order + Pay — GHS ${orderTotal}`}
            </button>

            {methodId !== "pay_on_delivery" && (
              <p className="text-center text-xs text-gray-400">
                You'll be redirected to Paystack to complete payment securely
              </p>
            )}
          </form>

          )}
        </div>
      </div>
    </>
  );
}
