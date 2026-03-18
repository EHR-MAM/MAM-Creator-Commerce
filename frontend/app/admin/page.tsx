// Admin dashboard — order monitor + navigation hub
// Route: /admin
// Protected: admin-only (enforced via backend JWT; frontend shows login gate)
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Order {
  id: string;
  status: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  total_amount: number;
  currency: string;
  source_channel: string;
  created_at: string;
  items?: { product_name: string; quantity: number; unit_price: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-600",
  refunded: "bg-red-100 text-red-800",
};

const NEXT_STATUS: Record<string, string | null> = {
  pending: "confirmed",
  confirmed: "processing",
  processing: "shipped",
  shipped: "delivered",
  delivered: null,
  cancelled: null,
  refunded: null,
};

export default function AdminOrders() {
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: (e.target as any).email.value, password: (e.target as any).password.value }),
      });
      if (!res.ok) throw new Error("Invalid credentials");
      const data = await res.json();
      setToken(data.access_token);
      setAuthed(true);
    } catch {
      setError("Login failed. Check credentials.");
    }
  }

  async function fetchOrders() {
    setLoading(true);
    try {
      const params = filterStatus !== "all" ? `?status=${filterStatus}` : "";
      const res = await fetch(`${API_URL}/orders${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setOrders(await res.json());
    } catch {
      setError("Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }

  async function advanceStatus(order: Order) {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    setUpdatingId(order.id);
    try {
      const res = await fetch(`${API_URL}/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error();
      await fetchOrders();
    } catch {
      setError("Failed to update order status.");
    } finally {
      setUpdatingId(null);
    }
  }

  useEffect(() => {
    if (authed) fetchOrders();
  }, [authed, filterStatus]);

  if (!authed) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 shadow-sm w-full max-w-sm">
          <h1 className="text-xl font-bold mb-1">Admin Login</h1>
          <p className="text-sm text-gray-500 mb-6">MAM — Micro-Affiliate Marketing</p>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <form onSubmit={login} className="space-y-4">
            <input name="email" type="email" required placeholder="Email" defaultValue="airatpack@gmail.com"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
            <input name="password" type="password" required placeholder="Password"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
            <button type="submit" className="w-full bg-black text-white py-3 rounded-xl font-bold text-sm">
              Sign In
            </button>
          </form>
        </div>
      </main>
    );
  }

  const filtered = filterStatus === "all" ? orders : orders.filter(o => o.status === filterStatus);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-black text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-lg">Admin — Order Monitor</h1>
          <p className="text-gray-400 text-xs mt-0.5">MAM — Micro-Affiliate Marketing</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/payouts" className="text-[#C9A84C] text-sm font-medium">Payouts</Link>
          <Link href="/dashboard" className="text-gray-300 text-sm">Creator</Link>
          <Link href="/vendor" className="text-gray-300 text-sm">Vendor</Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Summary bar */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {["pending", "confirmed", "delivered"].map(s => (
            <div key={s} className="bg-white rounded-xl p-4 border border-gray-100">
              <p className="text-xs text-gray-400 uppercase tracking-wide">{s}</p>
              <p className="text-2xl font-bold mt-1">
                {orders.filter(o => o.status === s).length}
              </p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {["all", "pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterStatus === s ? "bg-black text-white" : "bg-white text-gray-600 border border-gray-200"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading orders…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No orders found.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map(order => (
              <div key={order.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status]}`}>
                        {order.status}
                      </span>
                      <span className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString()}</span>
                      <span className="text-xs text-gray-400">via {order.source_channel}</span>
                    </div>
                    <p className="font-semibold mt-1">{order.customer_name}</p>
                    <p className="text-sm text-gray-500">{order.customer_phone}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{order.delivery_address}</p>
                    <p className="text-xs text-gray-400 mt-0.5 font-mono">#{order.id.slice(0, 8)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-lg">{order.currency} {Number(order.total_amount).toFixed(2)}</p>
                    {NEXT_STATUS[order.status] && (
                      <button
                        onClick={() => advanceStatus(order)}
                        disabled={updatingId === order.id}
                        className="mt-2 px-3 py-1.5 bg-black text-white text-xs rounded-lg font-medium disabled:opacity-50"
                      >
                        {updatingId === order.id ? "…" : `Mark ${NEXT_STATUS[order.status]}`}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
