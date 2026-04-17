// Vendor Dashboard — order queue + stock update (FE-12)
// Route: /vendor
// Sprint III: auth gate via useAuth + redirect to /login
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8200";
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "/mam";

interface Order {
  id: string;
  status: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  total_amount: number;
  currency: string;
  created_at: string;
  items?: { product_id: string; product_name: string; quantity: number; unit_price: number }[];
}

interface Product {
  id: string;
  name: string;
  sku: string;
  inventory_count: number;
  price: number;
  currency: string;
  status: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-600",
};

const NEXT_STATUS: Record<string, string | null> = {
  pending: "confirmed",
  confirmed: "processing",
  processing: "shipped",
  shipped: "delivered",
  delivered: null,
  cancelled: null,
};

export default function VendorDashboard() {
  const { user, token: authToken, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const token = authToken || "";
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [tab, setTab] = useState<"orders" | "stock">("orders");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [stockEditing, setStockEditing] = useState<string | null>(null);
  const [stockValue, setStockValue] = useState<number>(0);

  // Redirect to login if not authenticated or wrong role
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`${BASE}/login?next=${encodeURIComponent("/mam/vendor")}`);
    } else if (!authLoading && user && user.role !== "vendor" && user.role !== "admin") {
      router.replace(`${BASE}/dashboard`);
    }
  }, [user, authLoading, router]);

  async function fetchOrders() {
    try {
      const res = await fetch(`${API_URL}/orders/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setOrders(await res.json());
    } catch { /* silently fail */ }
  }

  async function fetchProducts() {
    try {
      const res = await fetch(`${API_URL}/products/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setProducts(await res.json());
    } catch { /* silently fail */ }
  }

  async function fetchData() {
    setLoading(true);
    await Promise.all([fetchOrders(), fetchProducts()]);
    setLoading(false);
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

  async function updateStock(productId: string) {
    try {
      const res = await fetch(`${API_URL}/products/${productId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ inventory_count: stockValue }),
      });
      if (!res.ok) throw new Error();
      setStockEditing(null);
      await fetchProducts();
    } catch {
      setError("Failed to update stock.");
    }
  }

  useEffect(() => { if (user && token) fetchData(); }, [user, token]);

  const activeOrders = orders.filter(o => !["delivered", "cancelled", "refunded"].includes(o.status));
  const recentOrders = orders.filter(o => ["delivered", "cancelled"].includes(o.status));

  // Show spinner while auth loads or redirecting
  if (authLoading || !user || (user.role !== "vendor" && user.role !== "admin")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-gray-800 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-black text-white px-4 py-4">
        <div className="max-w-lg mx-auto">
          <p className="text-[#C9A84C] text-xs font-medium tracking-widest uppercase">Vendor Dashboard</p>
          <h1 className="text-xl font-bold mt-0.5">Order Queue</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
            <p className="text-2xl font-bold">{activeOrders.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">Active</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
            <p className="text-2xl font-bold">{orders.filter(o => o.status === "delivered").length}</p>
            <p className="text-xs text-gray-400 mt-0.5">Delivered</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
            <p className="text-2xl font-bold">{products.filter(p => p.inventory_count <= 2).length}</p>
            <p className="text-xs text-amber-500 mt-0.5">Low Stock</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          <button onClick={() => setTab("orders")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium ${tab === "orders" ? "bg-black text-white" : "bg-white text-gray-600 border border-gray-200"}`}>
            Orders
          </button>
          <button onClick={() => setTab("stock")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium ${tab === "stock" ? "bg-black text-white" : "bg-white text-gray-600 border border-gray-200"}`}>
            My Products
          </button>
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading…</div>
        ) : tab === "orders" ? (
          <div className="space-y-3">
            {activeOrders.length === 0 && recentOrders.length === 0 && (
              <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-100">
                No orders yet.
              </div>
            )}
            {/* Active orders first */}
            {activeOrders.map(order => (
              <div key={order.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status]}`}>
                        {order.status}
                      </span>
                      <span className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="font-semibold text-sm">{order.customer_name}</p>
                    <p className="text-xs text-gray-500">{order.customer_phone}</p>
                    <p className="text-xs text-gray-400 truncate">{order.delivery_address}</p>
                    {order.items && (
                      <div className="mt-2 space-y-0.5">
                        {order.items.map((item, i) => (
                          <p key={i} className="text-xs text-gray-600">
                            {item.quantity}× {item.product_name}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold">{order.currency} {Number(order.total_amount).toFixed(2)}</p>
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
            {/* Recent delivered/cancelled */}
            {recentOrders.length > 0 && (
              <>
                <p className="text-xs text-gray-400 uppercase tracking-wide pt-2">Recent</p>
                {recentOrders.slice(0, 5).map(order => (
                  <div key={order.id} className="bg-white rounded-xl p-4 border border-gray-100 opacity-70 flex justify-between items-center">
                    <div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status]}`}>
                        {order.status}
                      </span>
                      <p className="text-sm font-medium mt-1">{order.customer_name}</p>
                      <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <p className="font-bold">{order.currency} {Number(order.total_amount).toFixed(2)}</p>
                  </div>
                ))}
              </>
            )}
          </div>
        ) : (
          // Stock management tab
          <div className="space-y-2">
            {products.length === 0 ? (
              <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-100">
                No products found.
              </div>
            ) : products.map(product => (
              <div key={product.id} className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{product.name}</p>
                    <p className="text-xs text-gray-400">{product.sku} · GHS {Number(product.price).toFixed(2)}</p>
                    {product.inventory_count <= 2 && (
                      <p className="text-xs text-amber-500 font-medium mt-0.5">Low stock!</p>
                    )}
                  </div>
                  {stockEditing === product.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        value={stockValue}
                        onChange={e => setStockValue(Number(e.target.value))}
                        className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center"
                      />
                      <button onClick={() => updateStock(product.id)}
                        className="px-3 py-1.5 bg-black text-white text-xs rounded-lg font-medium">
                        Save
                      </button>
                      <button onClick={() => setStockEditing(null)}
                        className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-lg font-medium">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-bold text-lg">{product.inventory_count}</p>
                        <p className="text-xs text-gray-400">in stock</p>
                      </div>
                      <button
                        onClick={() => { setStockEditing(product.id); setStockValue(product.inventory_count); }}
                        className="px-3 py-1.5 border border-gray-200 text-gray-600 text-xs rounded-lg font-medium"
                      >
                        Update
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
