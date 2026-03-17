"use client";
import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Product {
  id: string;
  name: string;
  price: number;
  currency: string;
  vendor_id: string;
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
  const [address, setAddress] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const total = (product.price * quantity + 20).toFixed(2); // +20 GHS delivery

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
            delivery_address: address,
            source_channel: "tiktok",
          }),
        }
      );

      if (!res.ok) throw new Error("Order failed");
      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try WhatsApp below.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <p className="text-3xl mb-2">✅</p>
        <p className="font-bold text-green-800">Order placed!</p>
        <p className="text-sm text-gray-600 mt-1">
          We'll contact you on WhatsApp at {phone} to confirm delivery.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl p-5 space-y-4 border border-gray-100">
      <h2 className="font-bold text-lg">Place Your Order</h2>

      <div>
        <label className="text-sm text-gray-600 block mb-1">Your Name *</label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Akosua Mensah"
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      <div>
        <label className="text-sm text-gray-600 block mb-1">
          WhatsApp Number *
        </label>
        <input
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="e.g. 0244123456"
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      <div>
        <label className="text-sm text-gray-600 block mb-1">
          Delivery Address (Accra) *
        </label>
        <textarea
          required
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="e.g. East Legon, near ABC junction"
          rows={2}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
        />
      </div>

      <div>
        <label className="text-sm text-gray-600 block mb-1">Quantity</label>
        <select
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
        >
          {[1, 2, 3].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      {/* Order summary */}
      <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-500">Item</span>
          <span>{product.currency} {(product.price * quantity).toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Delivery (Accra)</span>
          <span>{product.currency} 20.00</span>
        </div>
        <div className="flex justify-between font-bold border-t border-gray-200 pt-1">
          <span>Total</span>
          <span>{product.currency} {total}</span>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-black text-white py-3.5 rounded-xl font-bold text-sm disabled:opacity-50"
      >
        {submitting ? "Placing order…" : `Order for ${product.currency} ${total}`}
      </button>

      <p className="text-xs text-gray-400 text-center">
        Pay on delivery · We'll confirm via WhatsApp
      </p>
    </form>
  );
}
