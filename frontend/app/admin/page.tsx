// MAM Admin Dashboard -- full 7-tab back-office
// Sprint III: auth gate via useAuth + redirect to /login
// Sprint XXX: Reviews moderation tab
"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8200";
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "/mam";

type Tab = "overview" | "orders" | "creators" | "vendors" | "products" | "campaigns" | "commissions" | "reviews";

function useAdminData(token: string) {
  const [kpis, setKpis] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [creators, setCreators] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const h = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [kpiRes, ordRes, crRes, vnRes, prRes, cpRes, cmRes] = await Promise.all([
        fetch(`${API}/analytics/reports/kpis`, { headers: h }),
        fetch(`${API}/orders`, { headers: h }),
        fetch(`${API}/influencers`, { headers: h }),
        fetch(`${API}/vendors`, { headers: h }),
        fetch(`${API}/products?status=active&limit=200`, { headers: h }),
        fetch(`${API}/campaigns`, { headers: h }),
        fetch(`${API}/commissions`, { headers: h }),
      ]);
      if (kpiRes.ok) setKpis(await kpiRes.json());
      if (ordRes.ok) setOrders(await ordRes.json());
      if (crRes.ok) setCreators(await crRes.json());
      if (vnRes.ok) setVendors(await vnRes.json());
      if (prRes.ok) setProducts(await prRes.json());
      if (cpRes.ok) setCampaigns(await cpRes.json());
      if (cmRes.ok) setCommissions(await cmRes.json());
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);
  return { kpis, orders, creators, vendors, products, campaigns, commissions, loading, error, reload: load };
}

function KpiCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
      <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    delivered: "bg-blue-100 text-blue-700",
    paid: "bg-purple-100 text-purple-700",
    cancelled: "bg-red-100 text-red-700",
    refunded: "bg-gray-100 text-gray-500",
    draft: "bg-gray-100 text-gray-500",
    payable: "bg-green-100 text-green-700",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors[status] || "bg-gray-100 text-gray-500"}`}>
      {status}
    </span>
  );
}

function AdminLoginScreen({ onLogin }: { onLogin: (token: string) => void }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = e.currentTarget;
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: (form.elements.namedItem("email") as HTMLInputElement).value,
          password: (form.elements.namedItem("password") as HTMLInputElement).value,
        }),
      });
      if (!res.ok) throw new Error("bad_creds");
      const data = await res.json();
      // Verify role
      const meRes = await fetch(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      if (meRes.ok) {
        const me = await meRes.json();
        if (me.role !== "admin" && me.role !== "operator") {
          setError("Access denied — admin accounts only.");
          setLoading(false);
          return;
        }
      }
      sessionStorage.setItem("mam_admin_token", data.access_token);
      onLogin(data.access_token);
    } catch {
      setError("Incorrect email or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#C9A84C] rounded-2xl mb-4 shadow-lg">
            <span className="text-2xl font-black text-black">M</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">MAM Admin</h1>
          <p className="text-gray-400 text-sm mt-1">Operations Dashboard</p>
        </div>

        <div className="bg-[#1A1A1A] rounded-2xl p-6 border border-white/10">
          {error && (
            <div className="bg-red-900/40 border border-red-500/30 text-red-300 text-sm px-4 py-3 rounded-xl mb-5">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 font-medium block mb-1.5">Email</label>
              <input
                name="email"
                type="email"
                required
                autoComplete="username"
                placeholder="admin@example.com"
                className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#C9A84C]/60 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 font-medium block mb-1.5">Password</label>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#C9A84C]/60 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C9A84C] text-black py-3.5 rounded-xl font-bold text-sm mt-2 disabled:opacity-60 hover:bg-[#E8C97A] transition-colors"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { user, token: authToken, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const token = authToken || "";
  const [tab, setTab] = useState<Tab>("overview");
  const [msg, setMsg] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [vendorSearch, setVendorSearch] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");
  const [orderDateFilter, setOrderDateFilter] = useState<string>("all");

  // Redirect to login if not authenticated or wrong role
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`${BASE}/login?next=${encodeURIComponent("/mam/admin")}`);
    } else if (!authLoading && user && user.role !== "admin" && user.role !== "operator") {
      router.replace(`${BASE}/dashboard`);
    }
  }, [user, authLoading, router]);

  const { kpis, orders, creators, vendors, products, campaigns, commissions, loading, error, reload } =
    useAdminData(token);

  const h = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  async function advanceOrder(orderId: string, newStatus: string) {
    await fetch(`${API}/orders/${orderId}/status`, {
      method: "PATCH",
      headers: h,
      body: JSON.stringify({ status: newStatus }),
    });
    reload();
  }

  async function createUser(role: string, body: object) {
    const r = await fetch(`${API}/auth/register`, { method: "POST", headers: h, body: JSON.stringify({ ...body, role }) });
    if (!r.ok) { setMsg("Error: " + (await r.text())); return; }
    setMsg("Created successfully");
    reload();
  }

  async function createProduct(body: object) {
    const r = await fetch(`${API}/products`, { method: "POST", headers: h, body: JSON.stringify(body) });
    if (!r.ok) { setMsg("Error creating product: " + (await r.text())); return; }
    setMsg("Product created successfully");
    reload();
  }

  async function toggleProductStatus(productId: string, currentStatus: string) {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const r = await fetch(`${API}/products/${productId}`, { method: "PATCH", headers: h, body: JSON.stringify({ status: newStatus }) });
    if (!r.ok) { setMsg("Error updating product"); return; }
    reload();
  }

  async function updateProductStock(productId: string, qty: number) {
    const r = await fetch(`${API}/products/${productId}`, { method: "PATCH", headers: h, body: JSON.stringify({ inventory_count: qty }) });
    if (!r.ok) { setMsg("Error updating stock"); return; }
    reload();
  }

  async function updateProductPrice(productId: string, price: number) {
    const r = await fetch(`${API}/products/${productId}`, { method: "PATCH", headers: h, body: JSON.stringify({ price }) });
    if (!r.ok) { setMsg("Error updating price"); return; }
    reload();
  }

  async function bulkUpdateProductStatus(newStatus: "active" | "inactive") {
    const ids = Array.from(selectedProducts);
    if (ids.length === 0) return;
    setMsg(`Updating ${ids.length} products…`);
    await Promise.all(
      ids.map(id => fetch(`${API}/products/${id}`, { method: "PATCH", headers: h, body: JSON.stringify({ status: newStatus }) }))
    );
    setSelectedProducts(new Set());
    setMsg(`${ids.length} products set to ${newStatus}`);
    reload();
  }

  async function toggleVendorStatus(vendorId: string, currentStatus: string) {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const r = await fetch(`${API}/vendors/${vendorId}`, { method: "PATCH", headers: h, body: JSON.stringify({ status: newStatus }) });
    if (!r.ok) { setMsg("Error updating vendor"); return; }
    reload();
  }

  // Show spinner while auth loads or redirecting
  if (authLoading || !user || (user.role !== "admin" && user.role !== "operator")) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0A0A" }}>
        <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "orders", label: "Orders" },
    { id: "creators", label: "Creators" },
    { id: "vendors", label: "Vendors" },
    { id: "products", label: "Products" },
    { id: "campaigns", label: "Campaigns" },
    { id: "commissions", label: "Commissions" },
    { id: "reviews", label: "Reviews" },
  ];

  const payableTotal = commissions
    .filter((c: any) => c.commission_status === "payable")
    .reduce((s: number, c: any) => s + Number(c.influencer_amount || 0), 0);

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      {/* Header */}
      <div className="bg-[#111111] text-white">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[#C9A84C] font-bold text-lg">MAM</span>
            <span className="text-gray-400 text-sm">Admin Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/mam/admin/reports" className="text-xs text-[#C9A84C] hover:text-[#E8C97A] font-semibold border border-[#C9A84C]/30 px-3 py-1.5 rounded-lg transition-colors">
              Reports →
            </a>
            <button onClick={() => { logout(); router.replace(`${BASE}/login`); }} className="text-xs text-gray-400 hover:text-white">
              Sign out
            </button>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 pb-0 flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                tab === t.id
                  ? "text-[#C9A84C] border-b-2 border-[#C9A84C]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {loading && <p className="text-gray-400 text-sm">Loading...</p>}
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        {msg && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-2 rounded-xl">
            {msg}
          </div>
        )}

        {/* OVERVIEW */}
        {tab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiCard label="Total Orders" value={orders.length} />
              <KpiCard label="Delivered" value={orders.filter((o: any) => o.status === "delivered").length} />
              <KpiCard
                label="GMV"
                value={`GHS ${orders.reduce((s: number, o: any) => s + Number(o.total || 0), 0).toFixed(2)}`}
              />
              <KpiCard label="Creator Owed" value={`GHS ${payableTotal.toFixed(2)}`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiCard label="Active Creators" value={creators.filter((c: any) => c.status === "active").length} />
              <KpiCard label="Active Vendors" value={vendors.filter((v: any) => v.status === "active").length} />
              <KpiCard label="Live Campaigns" value={campaigns.filter((c: any) => c.status === "active").length} />
              <KpiCard
                label="Platform Revenue"
                value={`GHS ${commissions.reduce((s: number, c: any) => s + Number(c.platform_amount || 0), 0).toFixed(2)}`}
                sub="all-time platform fees"
              />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 mb-3">Recent Orders</h2>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-50">
                      <th className="text-left px-4 py-3 text-xs text-gray-400 font-semibold uppercase">Order</th>
                      <th className="text-left px-4 py-3 text-xs text-gray-400 font-semibold uppercase">Amount</th>
                      <th className="text-left px-4 py-3 text-xs text-gray-400 font-semibold uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 5).map((o: any) => (
                      <tr key={o.id} className="border-b border-gray-50 last:border-0">
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{o.id?.slice(0, 8)}…</td>
                        <td className="px-4 py-3 font-semibold">GHS {Number(o.total).toFixed(2)}</td>
                        <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400 text-sm">No orders yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ORDERS */}
        {tab === "orders" && (
          <div className="space-y-4">
            {/* Header + filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <h2 className="font-bold text-gray-900">All Orders ({orders.length})</h2>
              <div className="flex gap-2 w-full sm:w-auto flex-wrap">
                <input
                  type="search"
                  placeholder="Search name or phone…"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="flex-1 sm:w-48 border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:border-gray-400"
                />
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:border-gray-400 bg-white"
                >
                  <option value="all">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
            </div>
            {/* Date range + export row */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex gap-1.5 flex-wrap">
                {[["all", "All time"], ["today", "Today"], ["7d", "Last 7d"], ["30d", "Last 30d"]].map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setOrderDateFilter(val)}
                    className={`text-xs px-3 py-1 rounded-full font-medium border transition-colors ${
                      orderDateFilter === val
                        ? "bg-[#C9A84C] text-black border-[#C9A84C]"
                        : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                    }`}
                  >{label}</button>
                ))}
              </div>
              <button
                onClick={() => {
                  const now = Date.now();
                  const cutoff: Record<string, number> = { today: 86400000, "7d": 7 * 86400000, "30d": 30 * 86400000 };
                  const ms = cutoff[orderDateFilter] || Infinity;
                  const rows = orders.filter((o: any) => {
                    if (!o.created_at) return true;
                    return now - new Date(o.created_at).getTime() <= ms;
                  });
                  const headers = ["Order ID", "Date", "Customer", "Phone", "Address", "Total", "Status", "Items"];
                  const lines = [headers.join(","), ...rows.map((o: any) => [
                    o.id,
                    o.created_at ? new Date(o.created_at).toISOString().slice(0, 10) : "",
                    `"${(o.customer_name || "").replace(/"/g, '""')}"`,
                    o.customer_phone || "",
                    `"${(o.delivery_address || "").replace(/"/g, '""')}"`,
                    o.total,
                    o.status,
                    `"${(o.items || []).map((it: any) => `${it.product_name} x${it.quantity}`).join("; ")}"`,
                  ].join(","))];
                  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url; a.download = `mam-orders-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
                  URL.revokeObjectURL(url);
                }}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors border border-gray-200"
              >
                ↓ Export CSV
              </button>
            </div>
            {/* Status tab pills */}
            <div className="flex gap-2 flex-wrap">
              {["all", "pending", "confirmed", "processing", "shipped", "delivered", "cancelled"].map(s => {
                const count = s === "all" ? orders.length : orders.filter((o: any) => o.status === s).length;
                return (
                  <button
                    key={s}
                    onClick={() => setOrderStatusFilter(s)}
                    className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                      orderStatusFilter === s
                        ? "bg-[#111] text-white"
                        : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)} ({count})
                  </button>
                );
              })}
            </div>
            {/* Order list */}
            {(() => {
              const q = orderSearch.toLowerCase();
              const now = Date.now();
              const dateCutoff: Record<string, number> = { today: 86400000, "7d": 7 * 86400000, "30d": 30 * 86400000 };
              const dateCutoffMs = dateCutoff[orderDateFilter] || Infinity;
              const filtered = orders.filter((o: any) => {
                const matchStatus = orderStatusFilter === "all" || o.status === orderStatusFilter;
                const matchSearch = !q || (o.customer_name || "").toLowerCase().includes(q) || (o.customer_phone || "").includes(q);
                const matchDate = !o.created_at || now - new Date(o.created_at).getTime() <= dateCutoffMs;
                return matchStatus && matchSearch && matchDate;
              });
              if (filtered.length === 0) return (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">
                  {orders.length === 0 ? "No orders yet" : "No orders match your search/filter"}
                </div>
              );
              // Build influencer_id → handle map for creator attribution
              const handleMap: Record<string, string> = {};
              creators.forEach((c: any) => { if (c.id && c.handle) handleMap[c.id] = c.handle; });
              return filtered.map((o: any) => (
                <OrderCard key={o.id} order={o} onAdvance={advanceOrder} token={token} h={h} creatorHandle={o.influencer_id ? (handleMap[o.influencer_id] || null) : null} />
              ));
            })()}
          </div>
        )}

        {/* CREATORS */}
        {tab === "creators" && (
          <CreatorsTab
            creators={creators}
            products={products}
            commissions={commissions}
            token={token}
            h={h}
            onCreateCreator={(data) => createUser("influencer", data)}
            onReload={reload}
          />
        )}

        {/* VENDORS */}
        {tab === "vendors" && (
          <div className="space-y-6">
            <div>
              {(() => {
                const filteredVendors = vendorSearch.trim()
                  ? vendors.filter((v: any) =>
                      (v.business_name || "").toLowerCase().includes(vendorSearch.toLowerCase()) ||
                      (v.contact_name || "").toLowerCase().includes(vendorSearch.toLowerCase()) ||
                      (v.email || "").toLowerCase().includes(vendorSearch.toLowerCase()) ||
                      (v.location || "").toLowerCase().includes(vendorSearch.toLowerCase())
                    )
                  : vendors;
                return (
                  <>
                    <div className="flex items-center gap-3 mb-3">
                      <h2 className="font-bold text-gray-900 whitespace-nowrap">Vendors ({filteredVendors.length}{vendorSearch ? ` of ${vendors.length}` : ""})</h2>
                      <div className="flex-1">
                        <input
                          value={vendorSearch}
                          onChange={e => setVendorSearch(e.target.value)}
                          placeholder="Search by name, email, or location…"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                        />
                      </div>
                      {vendorSearch && (
                        <button onClick={() => setVendorSearch("")} className="text-xs text-gray-400 hover:text-gray-700 px-2 py-2 border border-gray-200 rounded-lg">✕</button>
                      )}
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-50">
                            <th className="text-left px-4 py-3 text-xs text-gray-400 font-semibold uppercase">Business</th>
                            <th className="text-left px-4 py-3 text-xs text-gray-400 font-semibold uppercase">Contact</th>
                            <th className="text-left px-4 py-3 text-xs text-gray-400 font-semibold uppercase">Email</th>
                            <th className="text-left px-4 py-3 text-xs text-gray-400 font-semibold uppercase">Location</th>
                            <th className="text-left px-4 py-3 text-xs text-gray-400 font-semibold uppercase">Status</th>
                            <th className="text-left px-4 py-3 text-xs text-gray-400 font-semibold uppercase">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredVendors.map((v: any) => (
                            <tr key={v.id} className="border-b border-gray-50 last:border-0">
                              <td className="px-4 py-3 font-semibold">{v.business_name || "—"}</td>
                              <td className="px-4 py-3 text-gray-500 text-xs">
                                <div>{v.contact_name || "—"}</div>
                                {v.contact_phone && <div className="text-gray-400">{v.contact_phone}</div>}
                              </td>
                              <td className="px-4 py-3 text-gray-400 text-xs">{v.email || "—"}</td>
                              <td className="px-4 py-3 text-gray-400">{v.location || "—"}</td>
                              <td className="px-4 py-3"><StatusBadge status={v.status || "active"} /></td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => toggleVendorStatus(v.id, v.status || "active")}
                                  className={`px-2.5 py-1 text-xs rounded-lg font-medium ${
                                    v.status === "active"
                                      ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                      : "bg-green-100 text-green-700 hover:bg-green-200"
                                  }`}
                                >
                                  {v.status === "active" ? "Deactivate" : "Activate"}
                                </button>
                              </td>
                            </tr>
                          ))}
                          {filteredVendors.length === 0 && (
                            <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                              {vendorSearch ? `No vendors match "${vendorSearch}"` : "No vendors yet"}
                            </td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                );
              })()}
            </div>
            <AddVendorForm onSubmit={(data) => createUser("vendor", data)} />
          </div>
        )}

        {/* PRODUCTS */}
        {tab === "products" && (
          <div className="space-y-6">
            <div>
              {(() => {
                const filteredProducts = productSearch.trim()
                  ? products.filter((p: any) =>
                      (p.name || "").toLowerCase().includes(productSearch.toLowerCase()) ||
                      (p.sku || "").toLowerCase().includes(productSearch.toLowerCase()) ||
                      (p.category || "").toLowerCase().includes(productSearch.toLowerCase())
                    )
                  : products;
                return (
                  <>
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <h2 className="font-bold text-gray-900">Products ({filteredProducts.length}{productSearch ? ` of ${products.length}` : ""})</h2>
                      <div className="flex-1 min-w-40">
                        <input
                          value={productSearch}
                          onChange={e => setProductSearch(e.target.value)}
                          placeholder="Search by name, SKU, or category…"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                        />
                      </div>
                      {productSearch && (
                        <button onClick={() => setProductSearch("")} className="text-xs text-gray-400 hover:text-gray-700 px-2 py-2 border border-gray-200 rounded-lg">✕</button>
                      )}
                      {/* Bulk action bar — shown when 1+ products selected */}
                      {selectedProducts.size > 0 && (
                        <div className="flex items-center gap-2 bg-black text-white rounded-lg px-3 py-2">
                          <span className="text-xs font-bold">{selectedProducts.size} selected</span>
                          <button
                            onClick={() => bulkUpdateProductStatus("active")}
                            className="text-xs bg-green-500 hover:bg-green-400 text-black font-bold px-2 py-1 rounded transition-colors"
                          >
                            Activate
                          </button>
                          <button
                            onClick={() => bulkUpdateProductStatus("inactive")}
                            className="text-xs bg-red-500 hover:bg-red-400 text-white font-bold px-2 py-1 rounded transition-colors"
                          >
                            Deactivate
                          </button>
                          <button
                            onClick={() => setSelectedProducts(new Set())}
                            className="text-xs text-gray-400 hover:text-white px-1"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
              {/* Low stock summary banner */}
              {(() => {
                const outOfStock = products.filter((p: any) => p.inventory_count === 0 || p.status === "out_of_stock").length;
                const lowStock = products.filter((p: any) => p.inventory_count > 0 && p.inventory_count <= 10).length;
                if (outOfStock === 0 && lowStock === 0) return null;
                return (
                  <div className="flex gap-3 flex-wrap mb-1">
                    {outOfStock > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-600 font-semibold">
                        🚫 {outOfStock} product{outOfStock > 1 ? "s" : ""} out of stock
                      </div>
                    )}
                    {lowStock > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-700 font-semibold">
                        ⚠️ {lowStock} product{lowStock > 1 ? "s" : ""} low stock (≤10 units)
                      </div>
                    )}
                  </div>
                );
              })()}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-50">
                      <th className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={filteredProducts.length > 0 && filteredProducts.every(p => selectedProducts.has(p.id))}
                          onChange={e => {
                            if (e.target.checked) setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
                            else setSelectedProducts(new Set());
                          }}
                          className="cursor-pointer"
                          title="Select all"
                        />
                      </th>
                      <th className="text-left px-4 py-3 text-xs text-gray-400 font-semibold uppercase">Name</th>
                      <th className="text-left px-4 py-3 text-xs text-gray-400 font-semibold uppercase">SKU</th>
                      <th className="text-left px-4 py-3 text-xs text-gray-400 font-semibold uppercase">Vendor</th>
                      <th className="text-left px-4 py-3 text-xs text-gray-400 font-semibold uppercase">Price (GHS)</th>
                      <th className="text-left px-4 py-3 text-xs text-gray-400 font-semibold uppercase">Stock</th>
                      <th className="text-left px-4 py-3 text-xs text-gray-400 font-semibold uppercase">Status</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((p: any) => {
                      const stockQty = p.inventory_count ?? 0;
                      const stockStyle = stockQty === 0
                        ? "font-bold text-red-500"
                        : stockQty <= 10
                          ? "font-semibold text-amber-600"
                          : "text-gray-700";
                      return (
                        <tr key={p.id} className={`border-b border-gray-50 last:border-0 ${selectedProducts.has(p.id) ? "bg-blue-50" : stockQty === 0 ? "bg-red-50/30" : stockQty <= 10 ? "bg-amber-50/30" : ""}`}>
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedProducts.has(p.id)}
                              onChange={e => {
                                const next = new Set(selectedProducts);
                                if (e.target.checked) next.add(p.id);
                                else next.delete(p.id);
                                setSelectedProducts(next);
                              }}
                              className="cursor-pointer"
                            />
                          </td>
                          <td className="px-4 py-3 font-semibold">
                            <div>{p.name}</div>
                            <div className="text-xs text-gray-400 capitalize">{p.category}</div>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-gray-400">{p.sku}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            {vendors.find((v: any) => v.id === p.vendor_id)?.business_name || <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              defaultValue={Number(p.price).toFixed(2)}
                              key={`${p.id}-price-${p.price}`}
                              onBlur={e => {
                                const newPrice = parseFloat(e.target.value);
                                if (!isNaN(newPrice) && newPrice !== Number(p.price)) updateProductPrice(p.id, newPrice);
                              }}
                              onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                              className="w-20 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-black text-gray-700"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="0"
                              defaultValue={stockQty}
                              key={`${p.id}-${stockQty}`}
                              onBlur={e => {
                                const newQty = parseInt(e.target.value, 10);
                                if (!isNaN(newQty) && newQty !== stockQty) updateProductStock(p.id, newQty);
                              }}
                              onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                              className={`w-16 border rounded px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-black ${
                                stockQty === 0 ? "border-red-300 text-red-600 bg-red-50" :
                                stockQty <= 10 ? "border-amber-300 text-amber-700 bg-amber-50" :
                                "border-gray-200 text-gray-700"
                              }`}
                            />
                          </td>
                          <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => toggleProductStatus(p.id, p.status)}
                              className="text-xs text-gray-400 hover:text-gray-700 border border-gray-200 px-2 py-1 rounded-lg"
                            >
                              {p.status === "active" ? "Deactivate" : "Activate"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredProducts.length === 0 && (
                      <tr><td colSpan={8} className="px-4 py-6 text-center text-gray-400">
                        {productSearch ? `No products match "${productSearch}"` : "No products yet"}
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
                  </>
                );
              })()}
            </div>
            <AddProductForm vendors={vendors} onSubmit={createProduct} />
          </div>
        )}

        {/* CAMPAIGNS */}
        {tab === "campaigns" && (
          <div>
            <h2 className="font-bold text-gray-900 mb-3">Campaigns ({campaigns.length})</h2>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="text-left px-4 py-3 text-xs text-gray-400 font-semibold uppercase">Campaign</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-400 font-semibold uppercase">Creator</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-400 font-semibold uppercase">Orders</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-400 font-semibold uppercase">GMV</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-400 font-semibold uppercase">Creator %</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-400 font-semibold uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c: any) => {
                    const creator = creators.find((cr: any) => cr.id === c.influencer_id);
                    const campOrders = orders.filter((o: any) =>
                      o.campaign_id === c.id || o.influencer_id === c.influencer_id
                    );
                    const campGMV = campOrders.reduce((s: number, o: any) => s + Number(o.total || 0), 0);
                    return (
                      <tr key={c.id} className="border-b border-gray-50 last:border-0">
                        <td className="px-4 py-3 font-semibold">
                          <div>{c.name}</div>
                          {c.start_at && <div className="text-xs text-gray-400">{new Date(c.start_at).toLocaleDateString()}{c.end_at ? ` – ${new Date(c.end_at).toLocaleDateString()}` : ""}</div>}
                        </td>
                        <td className="px-4 py-3">
                          {creator ? (
                            <div>
                              <div className="font-medium text-xs">@{creator.handle}</div>
                              {creator.display_name && <div className="text-xs text-gray-400">{creator.display_name}</div>}
                            </div>
                          ) : <span className="text-gray-300 text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3 font-semibold">{campOrders.length}</td>
                        <td className="px-4 py-3 font-semibold">{campGMV > 0 ? `GHS ${campGMV.toFixed(2)}` : "—"}</td>
                        <td className="px-4 py-3 text-gray-500">{c.creator_commission_pct != null ? `${c.creator_commission_pct}%` : "—"}</td>
                        <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                      </tr>
                    );
                  })}
                  {campaigns.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">No campaigns</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* COMMISSIONS */}
        {tab === "reviews" && <ReviewsTab token={token} h={h} />}

        {tab === "commissions" && (
          <div className="space-y-4">
            {payableTotal > 0 && (
              <div className="bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900">GHS {payableTotal.toFixed(2)} payable</p>
                  <p className="text-xs text-gray-500 mt-0.5">Requires David Bezar approval before payout</p>
                </div>
                <a href="/admin/payouts"
                  className="bg-[#111111] text-white text-xs font-bold px-4 py-2 rounded-xl">
                  Manage Payouts
                </a>
              </div>
            )}
            <h2 className="font-bold text-gray-900">All Commissions</h2>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="text-left px-4 py-3 text-xs text-gray-400 font-semibold uppercase">Order</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-400 font-semibold uppercase">Creator</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-400 font-semibold uppercase">Customer</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-400 font-semibold uppercase">Amount</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-400 font-semibold uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((c: any) => (
                    <tr key={c.id} className="border-b border-gray-50 last:border-0">
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">#{c.order_id_short || c.order_id?.slice(0, 8)}…</td>
                      <td className="px-4 py-3 text-xs font-semibold text-[#C9A84C]">{c.creator_handle ? `@${c.creator_handle}` : "—"}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{c.customer_name || "—"}</td>
                      <td className="px-4 py-3 font-bold">GHS {Number(c.influencer_amount).toFixed(2)}</td>
                      <td className="px-4 py-3"><StatusBadge status={c.commission_status} /></td>
                    </tr>
                  ))}
                  {commissions.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">No commissions yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sprint XXX: Reviews Moderation Tab ──────────────────────────────────────

function ReviewsTab({ token, h }: { token: string; h: Record<string, string> }) {
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "rejected">("pending");
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<Record<string, string>>({});

  async function fetchReviews(st: "pending" | "approved" | "rejected") {
    setLoading(true);
    try {
      const res = await fetch(`${API}/products/reviews/admin?status=${st}&limit=50`, { headers: h });
      setReviews(res.ok ? await res.json() : []);
    } catch { setReviews([]); }
    setLoading(false);
  }

  useEffect(() => { fetchReviews(statusFilter); }, [statusFilter, token]);

  async function setStatus(reviewId: string, newStatus: "approved" | "rejected") {
    setActionMsg(prev => ({ ...prev, [reviewId]: "Saving…" }));
    try {
      const res = await fetch(`${API}/products/reviews/${reviewId}/status?new_status=${newStatus}`, { method: "PATCH", headers: h });
      if (res.ok) {
        setReviews(prev => prev.filter(r => r.id !== reviewId));
        setActionMsg(prev => ({ ...prev, [reviewId]: newStatus === "approved" ? "Approved!" : "Rejected" }));
      } else {
        setActionMsg(prev => ({ ...prev, [reviewId]: "Error" }));
      }
    } catch {
      setActionMsg(prev => ({ ...prev, [reviewId]: "Error" }));
    }
  }

  const formatDate = (iso: string) => {
    try { return new Date(iso).toLocaleDateString("en-GH", { day: "numeric", month: "short", year: "numeric" }); }
    catch { return ""; }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-gray-900">Customer Reviews</h2>
        <div className="flex gap-1">
          {(["pending", "approved", "rejected"] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors ${
                statusFilter === s
                  ? s === "pending" ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                    : s === "approved" ? "bg-green-100 text-green-800 border border-green-200"
                    : "bg-red-100 text-red-800 border border-red-200"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-10">
          <div className="w-6 h-6 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && reviews.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <p className="text-3xl mb-2">✓</p>
          <p className="font-bold text-gray-700">No {statusFilter} reviews</p>
        </div>
      )}

      {!loading && reviews.map((r: any) => (
        <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex">
                  {[1,2,3,4,5].map(s => (
                    <span key={s} className={`text-sm ${s <= r.rating ? "text-[#C9A84C]" : "text-gray-200"}`}>★</span>
                  ))}
                </div>
                <span className="text-xs text-gray-400">{formatDate(r.created_at)}</span>
              </div>
              {r.headline && <p className="font-bold text-sm text-gray-800 mb-1">{r.headline}</p>}
              {r.body && <p className="text-sm text-gray-600 leading-relaxed mb-2">{r.body}</p>}
              <p className="text-xs text-gray-400">
                {r.customer_name}{r.customer_phone_last4 ? ` · ···${r.customer_phone_last4}` : ""}
              </p>
              <p className="text-[10px] text-gray-300 font-mono mt-0.5">{r.id}</p>
            </div>
            {statusFilter === "pending" && (
              <div className="flex flex-col gap-2 shrink-0">
                {actionMsg[r.id] ? (
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-xl ${
                    actionMsg[r.id] === "Approved!" ? "text-green-700 bg-green-50" : "text-red-700 bg-red-50"
                  }`}>{actionMsg[r.id]}</span>
                ) : (
                  <>
                    <button
                      onClick={() => setStatus(r.id, "approved")}
                      className="text-xs font-bold px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => setStatus(r.id, "rejected")}
                      className="text-xs font-bold px-4 py-2 rounded-xl bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function OrderCard({ order: o, onAdvance, token, h, creatorHandle }: { order: any; onAdvance: (id: string, status: string) => void; token: string; h: Record<string, string>; creatorHandle?: string | null }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [notesText, setNotesText] = useState<string>(o.admin_notes || "");
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  const orderIdShort = (o.id || "").slice(0, 8).toUpperCase();

  async function saveNotes() {
    setNotesSaving(true);
    try {
      await fetch(`${API}/orders/${o.id}/notes`, {
        method: "PATCH",
        headers: { ...h, "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesText }),
      });
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    } catch { /* silent */ }
    setNotesSaving(false);
  }

  // Build vendor summary text for copy-paste / WhatsApp forward
  function buildVendorSummary() {
    const itemLines = (o.items || []).map((it: any) =>
      `  • ${it.product_name} × ${it.quantity} — GHS ${Number(it.line_total).toFixed(2)}`
    );
    const lines = [
      `📦 ORDER TO FULFIL — #${orderIdShort}`,
      ``,
      `Hello,`,
      `Please prepare the following order for MAM delivery:`,
      ``,
      `Customer: ${o.customer_name || "—"}`,
      `Phone: ${o.customer_phone || "—"}`,
      `Delivery: ${o.delivery_address || "—"}`,
      o.size_variant ? `Size/Variant: ${o.size_variant}` : null,
      o.special_instructions ? `Instructions: ${o.special_instructions}` : null,
      ``,
      ...(itemLines.length > 0 ? ["Items:", ...itemLines, ""] : []),
      `Total: GHS ${Number(o.total).toFixed(2)}`,
      `SLA: Dispatch within 48 hours`,
      ``,
      `Order ID: ${orderIdShort}`,
      `MAM Operations Team`,
    ].filter((l) => l !== null).join("\n");
    return lines;
  }

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(buildVendorSummary());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text
    }
  }

  function openVendorWhatsApp() {
    const text = encodeURIComponent(buildVendorSummary());
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      {/* Order header */}
      <div
        className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-gray-400">#{orderIdShort}</span>
          <div>
            {creatorHandle && (
              <span className="text-[10px] font-semibold text-[#C9A84C] bg-[#C9A84C]/10 px-1.5 py-0.5 rounded mr-1">@{creatorHandle}</span>
            )}
            <span className="font-semibold text-sm">{o.customer_name || "—"}</span>
            <span className="text-xs text-gray-400 ml-2">{o.customer_phone || ""}</span>
            {o.created_at && (
              <span className="text-xs text-gray-300 ml-2">
                {new Date(o.created_at).toLocaleDateString("en-GH", { day: "numeric", month: "short" })}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm">GHS {Number(o.total).toFixed(2)}</span>
          <StatusBadge status={o.status} />
          <span className="text-gray-400 text-xs">{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-gray-50 px-4 py-4 space-y-4">
          {/* Customer details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Customer</p>
              <p className="font-medium">{o.customer_name || "—"}</p>
              <p className="text-gray-500">{o.customer_phone || "—"}</p>
              {o.customer_email && <p className="text-gray-400 text-xs">{o.customer_email}</p>}
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Delivery</p>
              <p className="text-gray-700 text-sm">{o.delivery_address || "—"}</p>
            </div>
            {o.size_variant && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Size/Variant</p>
                <p className="font-medium">{o.size_variant}</p>
              </div>
            )}
            {o.special_instructions && (
              <div className="col-span-2">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Special Instructions</p>
                <p className="text-amber-700 bg-amber-50 rounded-lg px-3 py-2 text-sm">{o.special_instructions}</p>
              </div>
            )}
          </div>

          {/* Order items */}
          {o.items && o.items.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Items ({o.items.length})</p>
              <div className="space-y-1.5">
                {o.items.map((it: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-gray-800 truncate block">{it.product_name}</span>
                      <span className="text-xs text-gray-400">qty {it.quantity} × GHS {Number(it.unit_price).toFixed(2)}</span>
                    </div>
                    <span className="font-semibold text-gray-900 shrink-0 ml-3">GHS {Number(it.line_total).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Order totals */}
          <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span>GHS {Number(o.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Delivery</span>
              <span>GHS {Number(o.delivery_fee).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold border-t border-gray-200 pt-1">
              <span>Total</span>
              <span>GHS {Number(o.total).toFixed(2)}</span>
            </div>
          </div>

          {/* Vendor order summary — semi-auto */}
          <div className="border border-dashed border-gray-200 rounded-xl p-3">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              Vendor Order Summary
            </p>
            <pre className="text-xs text-gray-600 whitespace-pre-wrap bg-gray-50 rounded-lg p-3 font-mono leading-relaxed">
              {buildVendorSummary()}
            </pre>
            <div className="flex gap-2 mt-3">
              <button
                onClick={copySummary}
                className={`flex-1 text-xs font-semibold px-3 py-2 rounded-lg border transition-colors ${
                  copied
                    ? "bg-green-50 text-green-600 border-green-200"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {copied ? "✓ Copied!" : "Copy to Clipboard"}
              </button>
              <button
                onClick={openVendorWhatsApp}
                className="flex-1 text-xs font-semibold px-3 py-2 rounded-lg bg-[#25D366] text-white hover:bg-[#1ebe5d] transition-colors"
              >
                Send via WhatsApp
              </button>
            </div>
          </div>

          {/* Status actions */}
          <div className="flex flex-wrap gap-2">
            {o.status === "pending" && (
              <button
                onClick={() => onAdvance(o.id, "confirmed")}
                className="text-sm bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold"
              >
                Confirm Order
              </button>
            )}
            {o.status === "confirmed" && (
              <button
                onClick={() => onAdvance(o.id, "processing")}
                className="text-sm bg-purple-600 text-white px-4 py-2 rounded-xl font-semibold"
              >
                Mark Processing
              </button>
            )}
            {o.status === "processing" && (
              <button
                onClick={() => onAdvance(o.id, "shipped")}
                className="text-sm bg-orange-500 text-white px-4 py-2 rounded-xl font-semibold"
              >
                Mark Shipped
              </button>
            )}
            {o.status === "shipped" && (
              <button
                onClick={() => onAdvance(o.id, "delivered")}
                className="text-sm bg-green-600 text-white px-4 py-2 rounded-xl font-semibold"
              >
                Mark Delivered
              </button>
            )}
            {["pending", "confirmed", "processing"].includes(o.status) && (
              <button
                onClick={() => onAdvance(o.id, "cancelled")}
                className="text-sm bg-red-50 text-red-500 border border-red-200 px-4 py-2 rounded-xl font-semibold"
              >
                Cancel Order
              </button>
            )}
          </div>

          {/* Internal notes */}
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Internal Notes</p>
            <textarea
              value={notesText}
              onChange={e => setNotesText(e.target.value)}
              placeholder="Add internal notes for this order (visible to ops only)…"
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 resize-none focus:outline-none focus:border-gray-400 placeholder-gray-300"
            />
            <button
              onClick={saveNotes}
              disabled={notesSaving}
              className="mt-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40 transition-colors"
            >
              {notesSaved ? "✓ Saved" : notesSaving ? "Saving…" : "Save note"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sprint XXIII: Full Creators Tab ─────────────────────────────────────────
function CreatorsTab({ creators, products, commissions, token, h, onCreateCreator, onReload }: {
  creators: any[];
  products: any[];
  commissions: any[];
  token: string;
  h: Record<string, string>;
  onCreateCreator: (data: object) => void;
  onReload?: () => void;
}) {
  const [search, setSearch] = useState("");
  const [inviteResult, setInviteResult] = useState<{ handle: string; email: string; loginUrl: string } | null>(null);

  const filtered = creators.filter((c: any) => {
    const q = search.toLowerCase();
    return !q || (c.handle || "").toLowerCase().includes(q) || (c.display_name || "").toLowerCase().includes(q);
  });

  async function handleInvite(data: object) {
    onCreateCreator(data);
    const d = data as any;
    const loginUrl = `${window.location.origin}${BASE}/login`;
    setInviteResult({ handle: d.handle, email: d.email, loginUrl });
  }

  return (
    <div className="space-y-6">
      {/* Invite result banner */}
      {inviteResult && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-bold text-green-800 text-sm">Creator account created for @{inviteResult.handle}</p>
              <p className="text-xs text-green-600 mt-0.5">Share this login link with them:</p>
            </div>
            <button onClick={() => setInviteResult(null)} className="text-green-400 hover:text-green-600 text-lg leading-none">×</button>
          </div>
          <div className="bg-white rounded-xl border border-green-200 px-3 py-2 flex items-center gap-2">
            <span className="text-xs font-mono text-gray-700 flex-1 break-all">{inviteResult.loginUrl}</span>
            <button
              onClick={() => navigator.clipboard.writeText(inviteResult.loginUrl)}
              className="text-xs bg-green-600 text-white px-2 py-1 rounded-lg font-semibold shrink-0"
            >
              Copy
            </button>
          </div>
          <p className="text-xs text-green-600">
            Email: <span className="font-mono">{inviteResult.email}</span> — forward their password separately.
          </p>
        </div>
      )}

      {/* Header + search */}
      <div className="flex items-center gap-3">
        <h2 className="font-bold text-gray-900 shrink-0">Creators ({creators.length})</h2>
        <input
          type="search"
          placeholder="Search by handle or name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:border-gray-400"
        />
      </div>

      {/* Creator rows */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center text-gray-400">
            {creators.length === 0 ? "No creators yet" : "No creators match your search"}
          </div>
        )}
        {filtered.map((c: any) => {
          const creatorCommissions = commissions.filter((cm: any) => {
            // Best-effort match — commissions don't have influencer_id directly, use order attribution
            return cm.influencer_id === c.id || cm.influencer_handle === c.handle;
          });
          const earned = creatorCommissions.reduce((s: number, cm: any) => s + Number(cm.influencer_amount || 0), 0);
          return (
            <CreatorRow
              key={c.id}
              creator={c}
              allProducts={products}
              token={token}
              h={h}
              earnedTotal={earned}
              commissionCount={creatorCommissions.length}
              onReload={onReload}
            />
          );
        })}
      </div>

      {/* Add / Invite creator form */}
      <AddCreatorForm onSubmit={handleInvite} />
    </div>
  );
}

function CreatorRow({ creator, allProducts, token, h, earnedTotal, commissionCount, onReload }: {
  creator: any;
  allProducts: any[];
  token: string;
  h: Record<string, string>;
  earnedTotal: number;
  commissionCount: number;
  onReload?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [assigned, setAssigned] = useState<any[]>([]);
  const [loadingCamp, setLoadingCamp] = useState(false);
  const [msg, setMsg] = useState("");
  // Bulk assign state
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAssigning, setBulkAssigning] = useState(false);
  // Product search within panel
  const [productSearch, setProductSearch] = useState("");
  // Category bulk-assign state
  const [categories, setCategories] = useState<{ category: string; count: number }[]>([]);
  const [selectedCat, setSelectedCat] = useState("");
  const [catAssigning, setCatAssigning] = useState(false);
  const [catMsg, setCatMsg] = useState("");
  // Status toggle state
  const [creatorStatus, setCreatorStatus] = useState<string>(creator.status || "active");
  const [statusToggling, setStatusToggling] = useState(false);
  // Profile edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    handle: creator.handle || "",
    bio: creator.bio || "",
    payout_method: creator.payout_method || "",
    payout_details_ref: creator.payout_details_ref || "",
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editMsg, setEditMsg] = useState("");

  async function toggleStatus(e: React.MouseEvent) {
    e.stopPropagation();
    setStatusToggling(true);
    const newStatus = creatorStatus === "active" ? "inactive" : "active";
    try {
      const res = await fetch(`${API}/influencers/${creator.id}`, {
        method: "PATCH",
        headers: h,
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setCreatorStatus(newStatus);
        onReload?.();
      }
    } catch { /* silent */ }
    setStatusToggling(false);
  }

  async function saveProfile(e: React.MouseEvent) {
    e.stopPropagation();
    setEditSaving(true);
    setEditMsg("");
    try {
      const res = await fetch(`${API}/influencers/${creator.id}`, {
        method: "PATCH",
        headers: h,
        body: JSON.stringify({
          handle: editForm.handle.trim() || undefined,
          bio: editForm.bio.trim() || undefined,
          payout_method: editForm.payout_method || undefined,
          payout_details_ref: editForm.payout_details_ref.trim() || undefined,
        }),
      });
      if (res.ok) {
        setEditMsg("Saved ✓");
        setEditOpen(false);
        onReload?.();
      } else {
        const err = await res.json().catch(() => ({}));
        setEditMsg(err.detail || "Save failed");
      }
    } catch { setEditMsg("Network error"); }
    setEditSaving(false);
  }

  async function openPanel() {
    if (open) { setOpen(false); return; }
    setOpen(true);
    setLoadingCamp(true);
    setMsg("");
    setSelected(new Set());
    setProductSearch("");
    setCatMsg("");
    setSelectedCat("");
    try {
      const cpRes = await fetch(`${API}/campaigns/ensure-for-influencer`, {
        method: "POST",
        headers: h,
        body: JSON.stringify({ influencer_id: creator.id, name: `${creator.handle} Default Campaign` }),
      });
      if (!cpRes.ok) { setMsg("Could not load campaign"); setLoadingCamp(false); return; }
      const cp = await cpRes.json();
      setCampaignId(cp.id);
      const [prRes, catRes] = await Promise.all([
        fetch(`${API}/campaigns/${cp.id}/products`, { headers: h }),
        fetch(`${API}/campaigns/product-categories`, { headers: h }),
      ]);
      if (prRes.ok) setAssigned(await prRes.json());
      if (catRes.ok) setCategories(await catRes.json());
    } catch { setMsg("Network error"); }
    setLoadingCamp(false);
  }

  async function assignProduct(productId: string) {
    if (!campaignId) return;
    const res = await fetch(`${API}/campaigns/${campaignId}/products`, {
      method: "POST",
      headers: h,
      body: JSON.stringify({ product_id: productId, featured_rank: 0 }),
    });
    if (res.ok) {
      const prRes = await fetch(`${API}/campaigns/${campaignId}/products`, { headers: h });
      if (prRes.ok) setAssigned(await prRes.json());
    }
  }

  async function bulkAssign() {
    if (!campaignId || selected.size === 0) return;
    setBulkAssigning(true);
    setMsg("");
    let count = 0;
    for (const pid of Array.from(selected)) {
      const res = await fetch(`${API}/campaigns/${campaignId}/products`, {
        method: "POST",
        headers: h,
        body: JSON.stringify({ product_id: pid, featured_rank: 0 }),
      });
      if (res.ok) count++;
    }
    const prRes = await fetch(`${API}/campaigns/${campaignId}/products`, { headers: h });
    if (prRes.ok) setAssigned(await prRes.json());
    setSelected(new Set());
    setMsg(`${count} product${count !== 1 ? "s" : ""} assigned`);
    setBulkAssigning(false);
  }

  async function removeProduct(productId: string) {
    if (!campaignId) return;
    setMsg("");
    const res = await fetch(`${API}/campaigns/${campaignId}/products/${productId}`, {
      method: "DELETE",
      headers: h,
    });
    if (res.ok) {
      setAssigned((prev) => prev.filter((p: any) => p.id !== productId));
      setMsg("Product removed");
    } else { setMsg("Failed to remove"); }
  }

  async function bulkAssignByCategory() {
    if (!campaignId || !selectedCat) return;
    setCatAssigning(true);
    setCatMsg("");
    try {
      const res = await fetch(`${API}/campaigns/${campaignId}/products/bulk-category`, {
        method: "POST",
        headers: h,
        body: JSON.stringify({ category: selectedCat }),
      });
      if (res.ok) {
        const data = await res.json();
        // Refresh assigned list
        const prRes = await fetch(`${API}/campaigns/${campaignId}/products`, { headers: h });
        if (prRes.ok) setAssigned(await prRes.json());
        setCatMsg(`Assigned ${data.assigned} product${data.assigned !== 1 ? "s" : ""} (${data.skipped} already linked)`);
        setSelectedCat("");
      } else {
        setCatMsg("Bulk assign failed");
      }
    } catch {
      setCatMsg("Network error");
    }
    setCatAssigning(false);
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const assignedIds = new Set(assigned.map((p: any) => p.id));
  const unassigned = allProducts.filter((p: any) => !assignedIds.has(p.id));
  const filteredUnassigned = productSearch
    ? unassigned.filter((p: any) => p.name.toLowerCase().includes(productSearch.toLowerCase()))
    : unassigned;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <button
        onClick={openPanel}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
      >
        <span className="font-mono text-sm font-semibold text-gray-900 w-28 shrink-0">@{creator.handle}</span>
        <span className="flex-1 text-sm text-gray-700 truncate">{creator.display_name || creator.handle}</span>
        <span className="text-xs text-gray-400 capitalize hidden sm:block shrink-0">{creator.platform_name || creator.platform || "—"}</span>
        {commissionCount > 0 && (
          <span className="text-xs bg-[#C9A84C]/10 text-[#8B6914] font-semibold px-2 py-0.5 rounded-full shrink-0">
            GHS {earnedTotal.toFixed(0)} earned
          </span>
        )}
        <StatusBadge status={creatorStatus} />
        <button
          onClick={toggleStatus}
          disabled={statusToggling}
          className={`text-xs font-bold px-2 py-0.5 rounded-lg border transition-colors shrink-0 ${
            creatorStatus === "active"
              ? "border-red-200 text-red-500 hover:bg-red-50"
              : "border-green-200 text-green-600 hover:bg-green-50"
          } disabled:opacity-40`}
        >
          {statusToggling ? "…" : creatorStatus === "active" ? "Deactivate" : "Activate"}
        </button>
        <button
          onClick={e => { e.stopPropagation(); setEditOpen(v => !v); setEditMsg(""); }}
          className="text-xs font-bold px-2 py-0.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors shrink-0"
        >
          Edit
        </button>
        <span className="text-gray-300 text-xs ml-1 shrink-0">{open ? "▲" : "▼"}</span>
      </button>

      {/* Inline profile edit panel */}
      {editOpen && (
        <div className="border-t border-[#C9A84C]/30 bg-amber-50 p-4 space-y-3" onClick={e => e.stopPropagation()}>
          <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Edit Creator Profile</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">Handle</label>
              <input
                type="text"
                value={editForm.handle}
                onChange={e => setEditForm(f => ({ ...f, handle: e.target.value }))}
                placeholder="e.g. sweet200723"
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-amber-400 bg-white"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">Payout Method</label>
              <select
                value={editForm.payout_method}
                onChange={e => setEditForm(f => ({ ...f, payout_method: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-amber-400 bg-white"
              >
                <option value="">— none —</option>
                <option value="momo_mtn">MTN MoMo</option>
                <option value="momo_telecel">Telecel Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">MoMo / Account Number</label>
            <input
              type="text"
              value={editForm.payout_details_ref}
              onChange={e => setEditForm(f => ({ ...f, payout_details_ref: e.target.value }))}
              placeholder="e.g. 0241234567"
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-amber-400 bg-white"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Bio</label>
            <textarea
              value={editForm.bio}
              onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
              placeholder="Short bio shown on storefront…"
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-amber-400 bg-white resize-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={saveProfile}
              disabled={editSaving}
              className="text-sm font-bold px-4 py-1.5 rounded-lg bg-[#C9A84C] text-black hover:bg-[#E8C97A] disabled:opacity-50 transition-colors"
            >
              {editSaving ? "Saving…" : "Save Changes"}
            </button>
            <button
              onClick={e => { e.stopPropagation(); setEditOpen(false); setEditMsg(""); }}
              className="text-sm text-gray-500 hover:text-gray-700 font-medium"
            >
              Cancel
            </button>
            {editMsg && (
              <span className={`text-xs font-medium ${editMsg.includes("✓") ? "text-green-600" : "text-red-500"}`}>
                {editMsg}
              </span>
            )}
          </div>
        </div>
      )}

      {open && (
        <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-4">
          {loadingCamp && <p className="text-xs text-gray-400">Loading catalog…</p>}
          {msg && (
            <p className={`text-xs font-medium ${msg.includes("Failed") || msg.includes("error") ? "text-red-500" : "text-green-600"}`}>
              {msg}
            </p>
          )}

          {!loadingCamp && (
            <>
              {/* Assigned products */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Assigned Products ({assigned.length})
                </p>
                {assigned.length === 0 && (
                  <p className="text-xs text-gray-400 italic">No products assigned yet.</p>
                )}
                <div className="space-y-1">
                  {assigned.map((p: any) => (
                    <div key={p.id} className="flex items-center gap-3 bg-white rounded-xl px-3 py-2 border border-gray-100">
                      <span className="text-sm flex-1 font-medium text-gray-800 truncate">{p.name}</span>
                      <span className="text-xs text-gray-400 shrink-0">GHS {Number(p.price).toFixed(2)}</span>
                      <button
                        onClick={() => removeProduct(p.id)}
                        className="text-xs text-red-400 hover:text-red-600 font-semibold px-2 py-0.5 rounded shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assign by Category — server-side bulk assign entire category */}
              {categories.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">
                    Assign Entire Category
                  </p>
                  <p className="text-xs text-amber-600 mb-2">
                    Instantly assign all products from a category to this creator&apos;s store.
                    Already-linked products are skipped automatically.
                  </p>
                  <div className="flex gap-2 items-center flex-wrap">
                    <select
                      value={selectedCat}
                      onChange={e => setSelectedCat(e.target.value)}
                      className="flex-1 min-w-0 border border-amber-300 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="">Choose a category…</option>
                      {categories.map(c => (
                        <option key={c.category} value={c.category}>
                          {c.category} ({c.count} products)
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={bulkAssignByCategory}
                      disabled={!selectedCat || catAssigning}
                      className="text-xs bg-amber-600 text-white font-bold px-3 py-1.5 rounded-lg disabled:opacity-50 hover:bg-amber-700 transition-colors shrink-0"
                    >
                      {catAssigning ? "Assigning…" : "Assign All"}
                    </button>
                  </div>
                  {catMsg && (
                    <p className={`text-xs mt-2 font-medium ${catMsg.includes("failed") || catMsg.includes("error") ? "text-red-600" : "text-green-700"}`}>
                      {catMsg}
                    </p>
                  )}
                </div>
              )}

              {/* Add products — with search + bulk select */}
              {unassigned.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider shrink-0">
                      Add Products ({filteredUnassigned.length}{productSearch ? ` of ${unassigned.length}` : ""})
                    </p>
                    {selected.size > 0 && (
                      <button
                        onClick={bulkAssign}
                        disabled={bulkAssigning}
                        className="text-xs bg-[#111] text-white font-bold px-3 py-1 rounded-lg disabled:opacity-50 shrink-0"
                      >
                        {bulkAssigning ? "Assigning…" : `Assign Selected (${selected.size})`}
                      </button>
                    )}
                  </div>
                  {/* Product search */}
                  <input
                    type="search"
                    placeholder="Filter products…"
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-1.5 text-xs mb-2 focus:outline-none focus:border-gray-400"
                  />
                  {/* Select all row */}
                  {filteredUnassigned.length > 1 && (
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <input
                        type="checkbox"
                        id={`select-all-${creator.id}`}
                        checked={filteredUnassigned.length > 0 && filteredUnassigned.every(p => selected.has(p.id))}
                        onChange={(e) => {
                          if (e.target.checked) setSelected(new Set(filteredUnassigned.map((p: any) => p.id)));
                          else setSelected(new Set());
                        }}
                        className="accent-[#C9A84C]"
                      />
                      <label htmlFor={`select-all-${creator.id}`} className="text-xs text-gray-500 cursor-pointer">
                        Select all {filteredUnassigned.length > 0 ? `(${filteredUnassigned.length})` : ""}
                      </label>
                    </div>
                  )}
                  <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                    {filteredUnassigned.map((p: any) => (
                      <div key={p.id} className="flex items-center gap-3 bg-white rounded-xl px-3 py-2 border border-gray-100">
                        <input
                          type="checkbox"
                          checked={selected.has(p.id)}
                          onChange={() => toggleSelect(p.id)}
                          className="accent-[#C9A84C] shrink-0"
                        />
                        <span className="text-sm flex-1 text-gray-700 truncate">{p.name}</span>
                        <span className="text-xs text-gray-400 shrink-0">GHS {Number(p.price).toFixed(2)}</span>
                        <button
                          onClick={() => { assignProduct(p.id); setSelected(prev => { const n = new Set(prev); n.delete(p.id); return n; }); }}
                          className="text-xs bg-[#C9A84C] text-black font-bold px-2 py-0.5 rounded-lg hover:bg-[#E8C97A] transition-colors shrink-0"
                        >
                          + Add
                        </button>
                      </div>
                    ))}
                    {filteredUnassigned.length === 0 && productSearch && (
                      <p className="text-xs text-gray-400 px-2 py-2">No products match "{productSearch}"</p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function AddCreatorForm({ onSubmit }: { onSubmit: (data: object) => void }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", handle: "", platform: "tiktok" });
  const [open, setOpen] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function generatePassword() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  }

  function handleOpen() {
    setOpen(o => !o);
    if (!form.password) setForm(f => ({ ...f, password: generatePassword() }));
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <button
        onClick={handleOpen}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
      >
        <span className="font-bold text-gray-900 text-sm">Invite New Creator</span>
        <span className="text-xs text-[#C9A84C] font-semibold">{open ? "Cancel" : "+ Invite"}</span>
      </button>

      {open && (
        <div className="border-t border-gray-100 px-5 pb-5 pt-4">
          <p className="text-xs text-gray-400 mb-3">Creates their account and generates a login link to share.</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input placeholder="Full name" value={form.name} onChange={set("name")}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm" />
            <input placeholder="Handle (no @)" value={form.handle} onChange={set("handle")}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm" />
            <input placeholder="Email" type="email" value={form.email} onChange={set("email")}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm" />
            <div className="flex gap-2">
              <input placeholder="Temp password" value={form.password} onChange={set("password")}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm flex-1 font-mono text-xs" />
              <button
                onClick={() => setForm(f => ({ ...f, password: generatePassword() }))}
                className="text-xs border border-gray-200 rounded-xl px-2 text-gray-400 hover:text-gray-700 shrink-0"
                title="Regenerate password"
              >
                ↺
              </button>
            </div>
            <select value={form.platform} onChange={set("platform")}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm col-span-2">
              <option value="tiktok">TikTok</option>
              <option value="instagram">Instagram</option>
              <option value="youtube">YouTube</option>
            </select>
          </div>
          <div className="flex gap-3 items-center">
            <button
              onClick={() => { onSubmit(form); setForm({ name: "", email: "", password: generatePassword(), handle: "", platform: "tiktok" }); setOpen(false); }}
              disabled={!form.name || !form.email || !form.password || !form.handle}
              className="bg-[#111111] text-white px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-40"
            >
              Create + Get Invite Link
            </button>
            <p className="text-xs text-gray-400">Password is shown once — copy it before sharing.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function AddVendorForm({ onSubmit }: { onSubmit: (data: object) => void }) {
  const [form, setForm] = useState({ name: "", business_name: "", email: "", password: "", location: "Accra" });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h3 className="font-bold text-gray-900 mb-4">Add Vendor</h3>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <input placeholder="Contact name" value={form.name} onChange={set("name")}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm" />
        <input placeholder="Business name" value={form.business_name} onChange={set("business_name")}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm" />
        <input placeholder="Email" value={form.email} onChange={set("email")}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm" />
        <input placeholder="Password" type="password" value={form.password} onChange={set("password")}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm" />
        <input placeholder="Location" value={form.location} onChange={set("location")}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm col-span-2" />
      </div>
      <button onClick={() => onSubmit(form)}
        className="bg-[#111111] text-white px-4 py-2 rounded-xl text-sm font-semibold">
        Create Vendor Account
      </button>
    </div>
  );
}

const SCRAPER_URL = process.env.NEXT_PUBLIC_BASE_PATH
  ? `${process.env.NEXT_PUBLIC_BASE_PATH.replace(/\/mam$/, "")}/mam-scraper`
  : "https://sensedirector.com/mam-scraper";

function AddProductForm({ vendors, onSubmit }: { vendors: any[]; onSubmit: (data: object) => void }) {
  const [form, setForm] = useState({
    vendor_id: "",
    name: "",
    sku: "",
    category: "fashion",
    description: "",
    price: "",
    currency: "GHS",
    inventory_count: "10",
    color: "",
    size: "",
    affiliate_url: "",
    image_url: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [scrapeMsg, setScrapeMsg] = useState("");

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleScrape() {
    if (!scrapeUrl.trim()) return;
    setScraping(true);
    setScrapeMsg("");
    try {
      const res = await fetch(`${SCRAPER_URL}/scrape?url=${encodeURIComponent(scrapeUrl)}`);
      if (!res.ok) throw new Error("Scrape failed");
      const data = await res.json();
      setForm(f => ({
        ...f,
        name: data.title || f.name,
        category: data.category || f.category,
        price: data.price ? String(data.price) : f.price,
        image_url: data.image || f.image_url,
        affiliate_url: scrapeUrl,
        description: f.description,
      }));
      setScrapeMsg(`Scraped: ${data.title?.slice(0, 40) || "OK"}`);
    } catch (e: any) {
      setScrapeMsg("Scrape failed — fill manually");
    }
    setScraping(false);
  }

  async function handleSubmit() {
    if (!form.vendor_id || !form.name || !form.sku || !form.price) return;
    setSubmitting(true);
    await onSubmit({
      vendor_id: form.vendor_id,
      name: form.name,
      sku: form.sku,
      category: form.category,
      description: form.description || undefined,
      price: parseFloat(form.price),
      currency: form.currency,
      inventory_count: parseInt(form.inventory_count) || 0,
      color: form.color || undefined,
      size: form.size || undefined,
      affiliate_url: form.affiliate_url || undefined,
      media_urls: form.image_url ? [form.image_url] : undefined,
    });
    setForm({ vendor_id: form.vendor_id, name: "", sku: "", category: "fashion", description: "", price: "", currency: "GHS", inventory_count: "10", color: "", size: "", affiliate_url: "", image_url: "" });
    setScrapeUrl("");
    setScrapeMsg("");
    setSubmitting(false);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h3 className="font-bold text-gray-900 mb-4">Add Product</h3>
      {vendors.length === 0 && (
        <p className="text-sm text-amber-600 mb-3">No vendors yet — create a vendor first in the Vendors tab.</p>
      )}

      {/* URL scraper */}
      <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-dashed border-gray-200">
        <p className="text-xs font-semibold text-gray-500 mb-2">Auto-fill from URL (Jumia, SHEIN, Amazon…)</p>
        <div className="flex gap-2">
          <input
            type="url"
            placeholder="Paste product URL…"
            value={scrapeUrl}
            onChange={e => setScrapeUrl(e.target.value)}
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
          />
          <button
            onClick={handleScrape}
            disabled={scraping || !scrapeUrl.trim()}
            className="bg-[#C9A84C] text-black px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-40 whitespace-nowrap"
          >
            {scraping ? "Scraping…" : "Auto-fill"}
          </button>
        </div>
        {scrapeMsg && (
          <p className={`text-xs mt-1.5 ${scrapeMsg.includes("failed") ? "text-red-500" : "text-green-600"}`}>
            {scrapeMsg}
          </p>
        )}
        {form.image_url && (
          <div className="mt-2 flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={form.image_url} alt="preview" className="w-12 h-12 object-cover rounded-lg border border-gray-200" />
            <p className="text-xs text-gray-400 truncate">{form.image_url.slice(0, 50)}…</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <select value={form.vendor_id} onChange={set("vendor_id")}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm col-span-2">
          <option value="">— Select vendor —</option>
          {vendors.map((v: any) => (
            <option key={v.id} value={v.id}>{v.business_name || v.name || v.id}</option>
          ))}
        </select>
        <input placeholder="Product name *" value={form.name} onChange={set("name")}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm" />
        <input placeholder="SKU * (e.g. DRESS-001)" value={form.sku} onChange={set("sku")}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm" />
        <select value={form.category} onChange={set("category")}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm">
          <option value="fashion">Fashion</option>
          <option value="beauty">Beauty</option>
          <option value="food">Food</option>
          <option value="accessories">Accessories</option>
          <option value="home">Home</option>
          <option value="health">Health</option>
          <option value="electronics">Electronics</option>
          <option value="other">Other</option>
        </select>
        <div className="flex gap-2">
          <input placeholder="Price *" type="number" step="0.01" min="0" value={form.price} onChange={set("price")}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm flex-1" />
          <select value={form.currency} onChange={set("currency")}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-20">
            <option value="GHS">GHS</option>
            <option value="USD">USD</option>
          </select>
        </div>
        <input placeholder="Stock qty" type="number" min="0" value={form.inventory_count} onChange={set("inventory_count")}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm" />
        <input placeholder="Color (optional)" value={form.color} onChange={set("color")}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm" />
        <textarea placeholder="Description (optional)" value={form.description} onChange={set("description")}
          rows={2}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm col-span-2 resize-none" />
      </div>
      <button
        onClick={handleSubmit}
        disabled={submitting || !form.vendor_id || !form.name || !form.sku || !form.price}
        className="bg-[#111111] text-white px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-40"
      >
        {submitting ? "Adding…" : "Add Product"}
      </button>
    </div>
  );
}
