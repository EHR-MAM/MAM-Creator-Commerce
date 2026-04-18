// Sprint XXVI: Customer order tracking page — public, no auth required
// Customers look up their order by order ID + phone number
"use client";
import { useState, FormEvent } from "react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8200";
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "/mam";

const STATUS_STEPS = ["pending", "confirmed", "processing", "shipped", "delivered"];

const STATUS_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  pending:    { icon: "🕐", color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200" },
  confirmed:  { icon: "✅", color: "text-blue-700",   bg: "bg-blue-50 border-blue-200" },
  processing: { icon: "📦", color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
  shipped:    { icon: "🚚", color: "text-orange-700", bg: "bg-orange-50 border-orange-200" },
  delivered:  { icon: "🎉", color: "text-green-700",  bg: "bg-green-50 border-green-200" },
  cancelled:  { icon: "❌", color: "text-red-700",    bg: "bg-red-50 border-red-200" },
  refunded:   { icon: "↩️", color: "text-gray-700",   bg: "bg-gray-50 border-gray-200" },
};

interface TrackResult {
  order_id: string;
  order_id_short: string;
  status: string;
  status_message: string;
  status_detail: string;
  customer_name: string;
  total: string;
  currency: string;
  delivery_address: string;
  creator_handle: string | null;
  created_at: string | null;
  updated_at: string | null;
  items: { quantity: number; unit_price: string; line_total: string }[];
}

export default function OrderStatusPage() {
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackResult | null>(null);
  const [error, setError] = useState("");

  async function handleLookup(e: FormEvent) {
    e.preventDefault();
    if (!orderId.trim() || !phone.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(
        `${API_URL}/orders/track?order_id=${encodeURIComponent(orderId.trim())}&phone=${encodeURIComponent(phone.trim())}`
      );
      if (res.status === 404) {
        setError("Order not found. Please check your order ID and phone number.");
      } else if (!res.ok) {
        setError("Something went wrong. Please try again.");
      } else {
        setResult(await res.json());
      }
    } catch {
      setError("Network error — please check your connection and try again.");
    }
    setLoading(false);
  }

  const stepIndex = result ? STATUS_STEPS.indexOf(result.status) : -1;
  const cfg = result ? STATUS_CONFIG[result.status] || STATUS_CONFIG.pending : null;

  const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString("en-GH", {
        day: "numeric", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      {/* Header */}
      <div className="bg-[#111111] text-white px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link href={`${BASE}/home`} className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #A8832A 0%, #C9A84C 40%, #E8C97A 100%)" }}>
              <span className="text-[11px] font-black text-[#0A0A0A]">Y</span>
            </div>
            <span className="font-black text-sm" style={{ color: "#C9A84C" }}>Yes MAM</span>
          </Link>
          <span className="text-gray-400 text-xs">Order Tracking</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">

        {/* Hero */}
        <div className="text-center">
          <div className="text-4xl mb-3">📦</div>
          <h1 className="text-2xl font-black text-gray-900">Track Your Order</h1>
          <p className="text-sm text-gray-500 mt-1">
            Enter your order ID and the phone number you used when ordering.
          </p>
        </div>

        {/* Lookup form */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <form onSubmit={handleLookup} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                Order ID
              </label>
              <input
                type="text"
                value={orderId}
                onChange={e => setOrderId(e.target.value)}
                placeholder="e.g. 082a19bb-5f59-43d1-b134-9068a25b2fab"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-gray-400 placeholder-gray-300"
              />
              <p className="text-xs text-gray-400 mt-1">Found in your order confirmation WhatsApp message</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+233 24 000 0000"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-400"
              />
              <p className="text-xs text-gray-400 mt-1">The number you used when placing the order</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !orderId.trim() || !phone.trim()}
              className="w-full bg-[#111111] text-white py-3.5 rounded-xl font-bold text-sm disabled:opacity-40 hover:bg-[#222] transition-colors"
            >
              {loading ? "Looking up…" : "Track Order"}
            </button>
          </form>
        </div>

        {/* Result */}
        {result && cfg && (
          <div className="space-y-4">
            {/* Status card */}
            <div className={`rounded-2xl border p-5 ${cfg.bg}`}>
              <div className="flex items-start gap-4">
                <span className="text-3xl shrink-0">{cfg.icon}</span>
                <div>
                  <p className={`font-black text-lg ${cfg.color}`}>{result.status_message}</p>
                  <p className={`text-sm mt-0.5 ${cfg.color} opacity-80`}>{result.status_detail}</p>
                </div>
              </div>
            </div>

            {/* Progress bar (only for active orders) */}
            {stepIndex >= 0 && !["cancelled", "refunded"].includes(result.status) && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Order Progress</p>
                <div className="flex items-center gap-0">
                  {STATUS_STEPS.map((step, i) => {
                    const done = i <= stepIndex;
                    const active = i === stepIndex;
                    return (
                      <div key={step} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                              done
                                ? "bg-[#C9A84C] text-black"
                                : "bg-gray-100 text-gray-300"
                            } ${active ? "ring-2 ring-[#C9A84C] ring-offset-2" : ""}`}
                          >
                            {done ? "✓" : i + 1}
                          </div>
                          <p className={`text-[9px] mt-1 capitalize font-medium whitespace-nowrap ${done ? "text-[#8B6914]" : "text-gray-300"}`}>
                            {step}
                          </p>
                        </div>
                        {i < STATUS_STEPS.length - 1 && (
                          <div className={`flex-1 h-0.5 mx-1 mb-4 transition-all ${i < stepIndex ? "bg-[#C9A84C]" : "bg-gray-100"}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Order details */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Order Details</p>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Order ID</p>
                  <p className="font-mono font-bold text-gray-800">#{result.order_id_short}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Total</p>
                  <p className="font-black text-gray-900">{result.currency} {Number(result.total).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Customer</p>
                  <p className="font-medium text-gray-800">{result.customer_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Placed</p>
                  <p className="text-gray-600 text-xs">{formatDate(result.created_at)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-400 mb-0.5">Delivery Address</p>
                  <p className="text-gray-700">{result.delivery_address}</p>
                </div>
                {result.creator_handle && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400 mb-0.5">Store</p>
                    <Link
                      href={`${BASE}/${result.creator_handle}`}
                      className="text-[#C9A84C] font-semibold text-sm hover:underline"
                    >
                      @{result.creator_handle}
                    </Link>
                  </div>
                )}
              </div>

              {/* Items */}
              {result.items.length > 0 && (
                <div className="border-t border-gray-50 pt-3">
                  <p className="text-xs text-gray-400 mb-2">Items ({result.items.length})</p>
                  <div className="space-y-1">
                    {result.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">× {item.quantity}</span>
                        <span className="text-xs text-gray-400">
                          {result.currency} {Number(item.unit_price).toFixed(2)} each
                        </span>
                        <span className="font-semibold text-gray-800">
                          {result.currency} {Number(item.line_total).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Help CTA */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
              <div className="w-10 h-10 bg-[#25D366] rounded-xl flex items-center justify-center text-white text-lg shrink-0">
                💬
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm text-gray-900">Need help?</p>
                <p className="text-xs text-gray-500">WhatsApp our team for updates on your order.</p>
              </div>
              <a
                href={`https://wa.me/13107763650?text=${encodeURIComponent(`Hi! I have a question about my order #${result.order_id_short}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#25D366] text-white text-xs font-bold px-3 py-2 rounded-xl shrink-0"
              >
                Chat
              </a>
            </div>

            {/* Track another */}
            <button
              onClick={() => { setResult(null); setOrderId(""); setPhone(""); setError(""); }}
              className="w-full text-sm text-gray-400 hover:text-gray-600 py-2 transition-colors"
            >
              Track a different order →
            </button>
          </div>
        )}

        {/* Footer note */}
        {!result && (
          <p className="text-center text-xs text-gray-400">
            Your order ID is in the WhatsApp confirmation sent after your purchase.{" "}
            <a
              href={`https://wa.me/13107763650?text=${encodeURIComponent("Hi! I lost my order ID. Can you help me find my order?")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#C9A84C] font-semibold hover:underline"
            >
              Lost your ID? Chat with us.
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
