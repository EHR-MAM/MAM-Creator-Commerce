// Vendor Dashboard — Sprint XX + Sprint XXXII (image upload)
// Order queue, product catalog, add/edit products
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8200";
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "/mam";

const CATEGORIES = ["hair", "beauty", "fashion", "accessories", "skincare", "wellness", "electronics", "footwear"];

interface Order {
  id: string;
  status: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  total: number;
  currency: string;
  created_at: string;
  items?: { product_id: string; product_name: string; quantity: number; unit_price: number }[];
}

interface Product {
  id: string;
  vendor_id: string;
  name: string;
  sku: string;
  description?: string;
  category: string;
  price: number;
  currency: string;
  inventory_count: number;
  status: string;
  media_urls?: string[];
  affiliate_url?: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-600",
  refunded: "bg-red-100 text-red-700",
};

const NEXT_STATUS: Record<string, string | null> = {
  pending: "confirmed",
  confirmed: "processing",
  processing: "shipped",
  shipped: "delivered",
  delivered: null,
  cancelled: null,
};

// ─── Empty product form ───────────────────────────────────────────────────────

function emptyForm() {
  return {
    sku: "",
    name: "",
    description: "",
    category: "fashion",
    price: "",
    currency: "GHS",
    inventory_count: "0",
    media_url: "",
    affiliate_url: "",
  };
}

// ─── Add / Edit Product Form ──────────────────────────────────────────────────

function ProductForm({
  initial,
  vendorId,
  token,
  onSaved,
  onCancel,
  editProductId,
}: {
  initial?: Partial<ReturnType<typeof emptyForm>>;
  vendorId: string;
  token: string;
  onSaved: () => void;
  onCancel?: () => void;
  editProductId?: string;
}) {
  const [form, setForm] = useState({ ...emptyForm(), ...(initial || {}) });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API_URL}/uploads/image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Upload failed");
      }
      const data = await res.json();
      set("media_url", data.url);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  const isEdit = !!editProductId;

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);

    const mediaUrls = form.media_url.trim() ? [form.media_url.trim()] : undefined;

    try {
      let res: Response;
      if (isEdit) {
        res = await fetch(`${API_URL}/products/${editProductId}`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            description: form.description || undefined,
            price: Number(form.price),
            inventory_count: Number(form.inventory_count),
            media_urls: mediaUrls,
            affiliate_url: form.affiliate_url || undefined,
          }),
        });
      } else {
        res = await fetch(`${API_URL}/products?vendor_id=${vendorId}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            sku: form.sku,
            name: form.name,
            description: form.description || undefined,
            category: form.category,
            price: Number(form.price),
            currency: form.currency,
            inventory_count: Number(form.inventory_count),
            media_urls: mediaUrls,
            affiliate_url: form.affiliate_url || undefined,
          }),
        });
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Save failed");
      }

      setSuccess(true);
      if (!isEdit) setForm(emptyForm());
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black";
  const labelCls = "text-sm font-medium text-gray-700 block mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <h3 className="font-black text-base">{isEdit ? "Edit Product" : "Add New Product"}</h3>

      {!isEdit && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>SKU <span className="text-red-400">*</span></label>
            <input required value={form.sku} onChange={e => set("sku", e.target.value)}
              placeholder="e.g. WIG-001" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Category <span className="text-red-400">*</span></label>
            <select value={form.category} onChange={e => set("category", e.target.value)} className={inputCls}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      )}

      <div>
        <label className={labelCls}>Product Name <span className="text-red-400">*</span></label>
        <input required value={form.name} onChange={e => set("name", e.target.value)}
          placeholder="e.g. Straight Lace Front Wig 24in" className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Description</label>
        <textarea value={form.description} onChange={e => set("description", e.target.value)}
          rows={3} placeholder="Product details, materials, care instructions…"
          className={`${inputCls} resize-none`} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Price (GHS) <span className="text-red-400">*</span></label>
          <input required type="number" min="0" step="0.01" value={form.price}
            onChange={e => set("price", e.target.value)} placeholder="0.00" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Stock Qty <span className="text-red-400">*</span></label>
          <input required type="number" min="0" value={form.inventory_count}
            onChange={e => set("inventory_count", e.target.value)} placeholder="0" className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Product Image</label>
        {/* Upload button */}
        <div className="flex items-center gap-2 mb-2">
          <label className={`flex items-center gap-1.5 cursor-pointer px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
            uploading ? "bg-gray-50 text-gray-400 border-gray-200" : "bg-black text-white border-black hover:bg-gray-800"
          }`}>
            {uploading ? "Uploading…" : "⬆ Upload photo"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              disabled={uploading}
              onChange={handleImageUpload}
            />
          </label>
          <span className="text-xs text-gray-400">or paste URL below · max 8 MB</span>
        </div>
        {uploadError && (
          <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-1.5 mb-2">{uploadError}</p>
        )}
        {/* URL text field (auto-filled by upload, or manual paste) */}
        <input type="url" value={form.media_url} onChange={e => set("media_url", e.target.value)}
          placeholder="https://…/photo.jpg" className={inputCls} />
        {form.media_url && (
          <div className="mt-2 flex items-start gap-3">
            <div className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200 shrink-0">
              <img src={form.media_url} alt="preview" className="w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
            </div>
            <button type="button" onClick={() => set("media_url", "")}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors mt-1">
              Remove
            </button>
          </div>
        )}
      </div>

      <div>
        <label className={labelCls}>Affiliate URL (optional)</label>
        <input type="url" value={form.affiliate_url} onChange={e => set("affiliate_url", e.target.value)}
          placeholder="https://jumia.com.gh/product/…" className={inputCls} />
        <p className="text-xs text-gray-400 mt-0.5">Jumia, SHEIN, or other affiliate link — earns commission on clicks</p>
      </div>

      {error && <p className="text-red-500 text-xs bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      {success && !isEdit && <p className="text-green-600 text-xs bg-green-50 rounded-lg px-3 py-2">✓ Product saved successfully!</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={saving}
          className="flex-1 bg-black text-white py-3 rounded-xl font-bold text-sm disabled:opacity-50">
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Product"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel}
            className="px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function VendorDashboard() {
  const { user, token: authToken, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const token = authToken || "";

  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [tab, setTab] = useState<"orders" | "products" | "add">("orders");
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [vendorId, setVendorId] = useState<string>("");

  // Redirect if not authenticated or wrong role
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
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch { /* silently fail */ }
  }

  async function fetchProducts() {
    try {
      const res = await fetch(`${API_URL}/products/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data: Product[] = await res.json();
        setProducts(data);
        // Grab vendor_id from first product for new product creation
        if (data.length > 0 && !vendorId) {
          setVendorId(data[0].vendor_id);
        }
      }
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
    } catch { /* show nothing — order will just not update */ }
    finally { setUpdatingId(null); }
  }

  async function toggleStatus(product: Product) {
    const newStatus = product.status === "active" ? "inactive" : "active";
    try {
      const res = await fetch(`${API_URL}/products/${product.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) await fetchProducts();
    } catch { /* silently fail */ }
  }

  useEffect(() => { if (user && token) fetchData(); }, [user, token]);

  const activeOrders = orders.filter(o => !["delivered", "cancelled", "refunded"].includes(o.status));
  const recentOrders = orders.filter(o => ["delivered", "cancelled", "refunded"].includes(o.status));
  const lowStock = products.filter(p => p.inventory_count <= 3 && p.status === "active").length;

  // Auth gate spinner
  if (authLoading || !user || (user.role !== "vendor" && user.role !== "admin")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-gray-800 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-black text-white px-4 py-4 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <p className="text-[#C9A84C] text-[10px] font-bold tracking-widest uppercase">Yes MAM · Vendor</p>
            <h1 className="text-lg font-black leading-tight">Vendor Dashboard</h1>
          </div>
          <button
            onClick={() => { logout(); router.replace(`${BASE}/login`); }}
            className="text-xs text-gray-400 hover:text-white border border-gray-700 rounded-lg px-3 py-1.5 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5">

        {/* KPI cards */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
            <p className="text-xl font-black">{activeOrders.length}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Active Orders</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
            <p className="text-xl font-black">{orders.filter(o => o.status === "delivered").length}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Delivered</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
            <p className="text-xl font-black">{products.filter(p => p.status === "active").length}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Active Products</p>
          </div>
          <div className={`rounded-xl p-3 border text-center ${lowStock > 0 ? "bg-amber-50 border-amber-200" : "bg-white border-gray-100"}`}>
            <p className={`text-xl font-black ${lowStock > 0 ? "text-amber-600" : ""}`}>{lowStock}</p>
            <p className={`text-[10px] mt-0.5 ${lowStock > 0 ? "text-amber-500" : "text-gray-400"}`}>Low Stock</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {(["orders", "products", "add"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-colors ${
                tab === t ? "bg-black text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-gray-400"
              }`}>
              {t === "orders" ? `Orders (${activeOrders.length})` : t === "products" ? "My Products" : "+ Add Product"}
            </button>
          ))}
        </div>

        {/* ── ORDERS TAB ── */}
        {tab === "orders" && (
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-12 text-gray-400">Loading…</div>
            ) : activeOrders.length === 0 && recentOrders.length === 0 ? (
              <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-100">
                <p className="text-4xl mb-3">📦</p>
                <p className="font-medium">No orders yet</p>
                <p className="text-sm mt-1">Orders will appear here when customers purchase your products</p>
              </div>
            ) : (
              <>
                {activeOrders.map(order => (
                  <div key={order.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600"}`}>
                            {order.status}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(order.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="font-semibold text-sm">{order.customer_name}</p>
                        <p className="text-xs text-gray-500">{order.customer_phone}</p>
                        <p className="text-xs text-gray-400 truncate mt-0.5">{order.delivery_address}</p>
                        {order.items && (
                          <div className="mt-2 space-y-0.5">
                            {order.items.map((item, i) => (
                              <p key={i} className="text-xs text-gray-600">
                                {item.quantity}× {item.product_name} — GHS {Number(item.unit_price).toFixed(2)}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-base">{order.currency} {Number(order.total).toFixed(2)}</p>
                        {NEXT_STATUS[order.status] && (
                          <button
                            onClick={() => advanceStatus(order)}
                            disabled={updatingId === order.id}
                            className="mt-2 px-3 py-1.5 bg-black text-white text-xs rounded-lg font-medium disabled:opacity-50 whitespace-nowrap"
                          >
                            {updatingId === order.id ? "…" : `Mark ${NEXT_STATUS[order.status]}`}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {recentOrders.length > 0 && (
                  <>
                    <p className="text-xs text-gray-400 uppercase tracking-wide pt-2">Completed</p>
                    {recentOrders.slice(0, 5).map(order => (
                      <div key={order.id} className="bg-white rounded-xl p-4 border border-gray-100 opacity-70 flex justify-between items-center">
                        <div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600"}`}>
                            {order.status}
                          </span>
                          <p className="text-sm font-medium mt-1">{order.customer_name}</p>
                          <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                        <p className="font-bold">{order.currency} {Number(order.total).toFixed(2)}</p>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* ── MY PRODUCTS TAB ── */}
        {tab === "products" && (
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-12 text-gray-400">Loading…</div>
            ) : products.length === 0 ? (
              <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-100">
                <p className="text-4xl mb-3">🛍️</p>
                <p className="font-medium">No products yet</p>
                <button onClick={() => setTab("add")}
                  className="mt-3 text-sm text-black font-bold underline">
                  Add your first product →
                </button>
              </div>
            ) : (
              <>
                {products.map(product => (
                  <div key={product.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    {editingId === product.id ? (
                      <div className="p-4">
                        <ProductForm
                          initial={{
                            name: product.name,
                            description: product.description || "",
                            price: String(product.price),
                            inventory_count: String(product.inventory_count),
                            media_url: product.media_urls?.[0] || "",
                            affiliate_url: product.affiliate_url || "",
                          }}
                          vendorId={vendorId}
                          token={token}
                          editProductId={product.id}
                          onSaved={async () => { await fetchProducts(); setEditingId(null); }}
                          onCancel={() => setEditingId(null)}
                        />
                      </div>
                    ) : (
                      <div className="flex items-start gap-3 p-4">
                        {/* Product image */}
                        {product.media_urls?.[0] ? (
                          <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                            <img src={product.media_urls[0]} alt={product.name}
                              className="w-full h-full object-cover"
                              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 text-2xl">
                            🛍️
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm truncate">{product.name}</p>
                              <p className="text-xs text-gray-400">{product.sku} · {product.category}</p>
                              <div className="flex items-center gap-3 mt-1.5">
                                <p className="text-sm font-black text-[#C9A84C]">
                                  {product.currency} {Number(product.price).toFixed(2)}
                                </p>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  product.inventory_count <= 3 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                                }`}>
                                  {product.inventory_count} in stock
                                </span>
                              </div>
                            </div>

                            {/* Status toggle + Edit */}
                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                product.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                              }`}>
                                {product.status}
                              </span>
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => { setEditingId(product.id); }}
                                  className="px-2.5 py-1 border border-gray-200 text-gray-600 text-xs rounded-lg font-medium hover:bg-gray-50"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => toggleStatus(product)}
                                  className={`px-2.5 py-1 text-xs rounded-lg font-medium ${
                                    product.status === "active"
                                      ? "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                      : "bg-green-100 text-green-700 hover:bg-green-200"
                                  }`}
                                >
                                  {product.status === "active" ? "Deactivate" : "Activate"}
                                </button>
                              </div>
                            </div>
                          </div>

                          {product.affiliate_url && (
                            <p className="text-[10px] text-blue-500 mt-1 truncate">
                              🔗 Affiliate link set
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* ── ADD PRODUCT TAB ── */}
        {tab === "add" && (
          vendorId ? (
            <ProductForm
              vendorId={vendorId}
              token={token}
              onSaved={async () => { await fetchProducts(); }}
            />
          ) : products.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center">
              <p className="text-2xl mb-2">⚠️</p>
              <p className="font-bold text-sm text-amber-800">No vendor profile found</p>
              <p className="text-xs text-amber-600 mt-1">
                Your account needs to be linked to a vendor profile by the admin team before you can add products.
              </p>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          )
        )}

      </div>
    </main>
  );
}
