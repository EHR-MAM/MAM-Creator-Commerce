"use client";
import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8200";

interface Product {
  id: string;
  name: string;
  price: number;
  currency: string;
  vendor_id: string;
  // sizes available if product has variants (e.g. ["S","M","L","XL"] or ["18in","20in","22in"])
  sizes?: string[];
}

export default function OrderForm({
  product,
  creatorHandle,
  influencerId,
}: {
  product: Product;
  creatorHandle: string;
  influencerId: string | null;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [sizeVariant, setSizeVariant] = useState("");
  const [instructions, setInstructions] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [error, setError] = useState("");

  const deliveryFee = 20;
  const itemTotal = product.price * quantity;
  const total = (itemTotal + deliveryFee).toFixed(2);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const influencerParam = influencerId ? `&influencer_id=${influencerId}` : "";
      const res = await fetch(
        `${API_URL}/orders?vendor_id=${product.vendor_id}${influencerParam}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: [{ product_id: product.id, quantity }],
            customer_name: name,
            customer_phone: phone,
            customer_email: email || undefined,
            delivery_address: address,
            size_variant: sizeVariant || undefined,
            special_instructions: instructions || undefined,
            source_channel: "tiktok",
          }),
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Order failed");
      }

      const data = await res.json();
      setOrderId(String(data.id).slice(0, 8).toUpperCase());
      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(msg + " You can also order via WhatsApp below.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center space-y-3">
        <p className="text-4xl">✅</p>
        <p className="font-bold text-green-800 text-lg">Order placed!</p>
        {orderId && (
          <p className="text-xs text-gray-500 font-mono bg-white border border-gray-200 rounded px-3 py-1 inline-block">
            Order #{orderId}
          </p>
        )}
        <p className="text-sm text-gray-600">
          We'll reach you on WhatsApp at <span className="font-semibold">{phone}</span> within 2 hours to confirm your delivery.
        </p>
        <p className="text-xs text-gray-400">Pay on delivery · Cash or Mobile Money accepted</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl p-5 space-y-4 border border-gray-100 shadow-sm">
      <h2 className="font-bold text-lg">Place Your Order</h2>

      {/* Full name */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">
          Full Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Akosua Mensah"
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      {/* WhatsApp / Phone */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">
          WhatsApp / Phone Number <span className="text-red-400">*</span>
        </label>
        <input
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="e.g. 0244123456"
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
        <p className="text-xs text-gray-400 mt-0.5">We'll confirm your order via WhatsApp</p>
      </div>

      {/* Delivery address */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">
          Delivery Address <span className="text-red-400">*</span>
        </label>
        <textarea
          required
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="e.g. East Legon, near ABC junction, house number 12"
          rows={2}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
        />
        <p className="text-xs text-gray-400 mt-0.5">Accra delivery only for now · 72hr max</p>
      </div>

      {/* Quantity */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Quantity</label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="w-10 h-10 rounded-lg border border-gray-200 text-lg font-bold flex items-center justify-center active:bg-gray-100"
          >
            −
          </button>
          <span className="w-8 text-center font-bold text-lg">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity(Math.min(5, quantity + 1))}
            className="w-10 h-10 rounded-lg border border-gray-200 text-lg font-bold flex items-center justify-center active:bg-gray-100"
          >
            +
          </button>
        </div>
      </div>

      {/* Size / Variant — show if product has sizes */}
      {product.sizes && product.sizes.length > 0 && (
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">
            Size / Variant <span className="text-red-400">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSizeVariant(s)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  sizeVariant === s
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-700 border-gray-200 active:bg-gray-50"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          {sizeVariant === "" && (
            <p className="text-xs text-amber-600 mt-1">Please select a size</p>
          )}
        </div>
      )}

      {/* Free-text size/variant if no predefined sizes */}
      {(!product.sizes || product.sizes.length === 0) && (
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">
            Size / Variant <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={sizeVariant}
            onChange={(e) => setSizeVariant(e.target.value)}
            placeholder="e.g. M, XL, 18in natural black"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>
      )}

      {/* Special instructions */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">
          Special Instructions <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="e.g. Call before delivery, leave with gate security"
          rows={2}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
        />
      </div>

      {/* Email — optional */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">
          Email <span className="text-gray-400 font-normal">(optional — for receipt)</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="akosua@gmail.com"
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      {/* Order summary */}
      <div className="bg-[#FAF7F2] rounded-xl p-4 text-sm space-y-2 border border-[#E8D9C0]">
        <p className="font-semibold text-gray-800 text-xs uppercase tracking-wide mb-2">Order Summary</p>
        <div className="flex justify-between">
          <span className="text-gray-500">{product.name} × {quantity}</span>
          <span className="font-medium">{product.currency} {itemTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Delivery (Accra)</span>
          <span className="font-medium">{product.currency} {deliveryFee.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-base border-t border-[#E8D9C0] pt-2 mt-1">
          <span>Total</span>
          <span className="text-[#C9A84C]">{product.currency} {total}</span>
        </div>
        <p className="text-xs text-gray-400 text-center mt-1">Pay on delivery — Cash or Mobile Money</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || (product.sizes && product.sizes.length > 0 && !sizeVariant)}
        className="w-full bg-[#111111] text-white py-4 rounded-xl font-bold text-base disabled:opacity-50 active:scale-95 transition-transform"
      >
        {submitting ? "Placing your order…" : `Order Now — ${product.currency} ${total}`}
      </button>

      <p className="text-xs text-gray-400 text-center">
        No payment now · Pay on delivery · We confirm via WhatsApp
      </p>
    </form>
  );
}
