// MAM Admin Dashboard -- full 6-tab back-office
// Sprint III: auth gate via useAuth + redirect to /login
"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8200";
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "/mam";

type Tab = "overview" | "orders" | "creators" | "vendors" | "products" | "campaigns" | "commissions";

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
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");

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
            <div className="grid grid-cols-3 gap-3">
              <KpiCard label="Active Creators" value={creators.filter((c: any) => c.status === "active").length} />
              <KpiCard label="Active Vendors" value={vendors.filter((v: any) => v.status === "active").length} />
              <KpiCard label="Live Campaigns" value={campaigns.filter((c: any) => c.status === "active").length} />
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
              <div className="flex gap-2 w-full sm:w-auto">
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
              const filtered = orders.filter((o: any) => {
                const matchStatus = orderStatusFilter === "all" || o.status === orderStatusFilter;
                const matchSearch = !q || (o.customer_name || "").toLowerCase().includes(q) || (o.customer_phone || "").includes(q);
                return matchStatus && matchSearch;
              });
              if (filtered.length === 0) return (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">
                  {orders.length === 0 ? "No orders yet" : "No orders match your search/filter"}
                </div>
              );
              return filtered.map((o: any) => (
                <OrderCard key={o.id} order={o} onAdvance={advanceOrder} />
              ));
            })()}
          </div>
        )}

        {/* CREATORS */}
        {tab === "creators" && (
          <div className="space-y-6">
            <div>
              <h2 className="font-bold text-gray-900 mb-3">Creators ({creators.length})</h2>
              <div className="space-y-2">
                {creators.length === 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center text-gray-400">No creators yet</div>
                )}
                {creators.map((c: any) => (
                  <CreatorRow key={c.id} creator={c} allProducts={products} token={token} h={h} />
                ))}
              </div>
            </div>
            <AddCreatorForm onSubmit={(data) => createUser("influencer", data)} />
          </div>
        )}

        {/* VENDORS */}
        {tab === "vendors" && (
          <div className="space-y-6">
            <div>
              <h2 className="font-bold text-gray-900 mb-3">Vendors ({vendors.length})</h2>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-50">
                      <th className="text-left px-4 py-3 text-xs text-gray-400 font-semibold uppercase">Business</th>
                      <th className="text-left px-4 py-3 text-xs text-gray-400 font-semibold uppercase">Contact</th>
                      <th className="text-left px-4 py-3 text-xs text-gray-400 font-semibold uppercase">Location</th>
                      <th className="text-left px-4 py-3 text-xs text-gray-400 font-semibold uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendors.map((v: any) => (
                      <tr key={v.id} className="border-b border-gray-50 last:border-0">
                        <td className="px-4 py-3 font-semibold">{v.business_name || v.name || "—"}</td>
                        <td className="px-4 py-3 text-gray-400">{v.email || "—"}</td>
                        <td className="px-4 py-3 text-gray-400">{v.location || "—"}</td>
                        <td className="px-4 py-3"><StatusBadge status={v.status || "active"} /></td>
                      </tr>
                    ))}
                    {vendors.length === 0 && (
                      <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">No vendors yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <AddVendorForm onSubmit={(data) => createUser("vendor", data)} />
          </div>
        )}

        {/* PRODUCTS */}
        {tab === "products" && (
          <div className="space-y-6">
            <div>
              <h2 className="font-bold text-gray-900 mb-3">Products ({products.length})</h2>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-50">
                      <th className="text-left px-4 py-3 text-xs text-gray-400 font-semibold uppercase">Name</th>
                      <th className="text-left px-4 py-3 text-xs text-gray-400 font-semibold uppercase">SKU</th>
                      <th className="text-left px-4 py-3 text-xs text-gray-400 font-semibold uppercase">Category</th>
                      <th className="text-left px-4 py-3 text-xs text-gray-400 font-semibold uppercase">Price</th>
                      <th className="text-left px-4 py-3 text-xs text-gray-400 font-semibold uppercase">Stock</th>
                      <th className="text-left px-4 py-3 text-xs text-gray-400 font-semibold uppercase">Status</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p: any) => (
                      <tr key={p.id} className="border-b border-gray-50 last:border-0">
                        <td className="px-4 py-3 font-semibold">{p.name}</td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-400">{p.sku}</td>
                        <td className="px-4 py-3 text-gray-500 capitalize">{p.category}</td>
                        <td className="px-4 py-3 font-semibold">{p.currency} {Number(p.price).toFixed(2)}</td>
                        <td className="px-4 py-3">{p.inventory_count}</td>
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
                    ))}
                    {products.length === 0 && (
                      <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-400">No products yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
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
                    <th className="text-left px-4 py-3 text-xs text-gray-400 font-semibold uppercase">Name</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-400 font-semibold uppercase">Creator %</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-400 font-semibold uppercase">Platform %</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-400 font-semibold uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c: any) => (
                    <tr key={c.id} className="border-b border-gray-50 last:border-0">
                      <td className="px-4 py-3 font-semibold">{c.name}</td>
                      <td className="px-4 py-3">{c.creator_commission_pct ?? "—"}%</td>
                      <td className="px-4 py-3">{c.platform_commission_pct ?? "—"}%</td>
                      <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    </tr>
                  ))}
                  {campaigns.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">No campaigns</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* COMMISSIONS */}
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
                    <th className="text-left px-4 py-3 text-xs text-gray-400 font-semibold uppercase">Amount</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-400 font-semibold uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((c: any) => (
                    <tr key={c.id} className="border-b border-gray-50 last:border-0">
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">{c.order_id?.slice(0, 8)}…</td>
                      <td className="px-4 py-3 font-mono text-xs">{c.order_id?.slice(-8)}</td>
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

function OrderCard({ order: o, onAdvance }: { order: any; onAdvance: (id: string, status: string) => void }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const orderIdShort = (o.id || "").slice(0, 8).toUpperCase();

  // Build vendor summary text for copy-paste / WhatsApp forward
  function buildVendorSummary() {
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
            <span className="font-semibold text-sm">{o.customer_name || "—"}</span>
            <span className="text-xs text-gray-400 ml-2">{o.customer_phone || ""}</span>
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
        </div>
      )}
    </div>
  );
}

function CreatorRow({ creator, allProducts, token, h }: {
  creator: any;
  allProducts: any[];
  token: string;
  h: Record<string, string>;
}) {
  const [open, setOpen] = useState(false);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [assigned, setAssigned] = useState<any[]>([]);
  const [loadingCamp, setLoadingCamp] = useState(false);
  const [msg, setMsg] = useState("");

  async function openPanel() {
    if (open) { setOpen(false); return; }
    setOpen(true);
    setLoadingCamp(true);
    setMsg("");
    try {
      // Get or create a default campaign for this influencer
      const cpRes = await fetch(`${API}/campaigns/ensure-for-influencer`, {
        method: "POST",
        headers: h,
        body: JSON.stringify({ influencer_id: creator.id, name: `${creator.handle} Default Campaign` }),
      });
      if (!cpRes.ok) { setMsg("Could not load campaign"); setLoadingCamp(false); return; }
      const cp = await cpRes.json();
      setCampaignId(cp.id);
      // Load assigned products
      const prRes = await fetch(`${API}/campaigns/${cp.id}/products`, { headers: h });
      if (prRes.ok) setAssigned(await prRes.json());
    } catch { setMsg("Network error"); }
    setLoadingCamp(false);
  }

  async function assignProduct(productId: string) {
    if (!campaignId) return;
    setMsg("");
    const res = await fetch(`${API}/campaigns/${campaignId}/products`, {
      method: "POST",
      headers: h,
      body: JSON.stringify({ product_id: productId, featured_rank: 0 }),
    });
    if (res.ok) {
      const prRes = await fetch(`${API}/campaigns/${campaignId}/products`, { headers: h });
      if (prRes.ok) setAssigned(await prRes.json());
      setMsg("Product assigned");
    } else { setMsg("Failed to assign"); }
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

  const assignedIds = new Set(assigned.map((p: any) => p.id));
  const unassigned = allProducts.filter((p: any) => !assignedIds.has(p.id));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <button
        onClick={openPanel}
        className="w-full flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
      >
        <span className="font-mono text-sm font-semibold text-gray-900 w-32">@{creator.handle}</span>
        <span className="flex-1 text-sm text-gray-700">{creator.display_name || creator.handle}</span>
        <span className="text-xs text-gray-400 capitalize">{creator.platform_name || creator.platform || "—"}</span>
        <StatusBadge status={creator.status || "active"} />
        <span className="text-gray-300 text-xs ml-2">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-4">
          {loadingCamp && <p className="text-xs text-gray-400">Loading catalog…</p>}
          {msg && <p className="text-xs text-[#C9A84C] font-medium">{msg}</p>}

          {!loadingCamp && (
            <>
              {/* Assigned products */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Assigned Products ({assigned.length})
                </p>
                {assigned.length === 0 && (
                  <p className="text-xs text-gray-400 italic">No products assigned yet. Add from the list below.</p>
                )}
                <div className="space-y-1">
                  {assigned.map((p: any) => (
                    <div key={p.id} className="flex items-center gap-3 bg-white rounded-xl px-3 py-2 border border-gray-100">
                      <span className="text-sm flex-1 font-medium text-gray-800">{p.name}</span>
                      <span className="text-xs text-gray-400">GHS {Number(p.price).toFixed(2)}</span>
                      <button
                        onClick={() => removeProduct(p.id)}
                        className="text-xs text-red-400 hover:text-red-600 font-semibold px-2 py-0.5 rounded"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add products */}
              {unassigned.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Add Products ({unassigned.length} available)
                  </p>
                  <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                    {unassigned.map((p: any) => (
                      <div key={p.id} className="flex items-center gap-3 bg-white rounded-xl px-3 py-2 border border-gray-100">
                        <span className="text-sm flex-1 text-gray-700">{p.name}</span>
                        <span className="text-xs text-gray-400">GHS {Number(p.price).toFixed(2)}</span>
                        <button
                          onClick={() => assignProduct(p.id)}
                          className="text-xs bg-[#C9A84C] text-black font-bold px-3 py-0.5 rounded-lg hover:bg-[#E8C97A] transition-colors"
                        >
                          Assign
                        </button>
                      </div>
                    ))}
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
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h3 className="font-bold text-gray-900 mb-4">Add Creator</h3>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <input placeholder="Full name" value={form.name} onChange={set("name")}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm" />
        <input placeholder="Email" value={form.email} onChange={set("email")}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm" />
        <input placeholder="Password" type="password" value={form.password} onChange={set("password")}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm" />
        <input placeholder="Handle (no @)" value={form.handle} onChange={set("handle")}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm" />
        <select value={form.platform} onChange={set("platform")}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm col-span-2">
          <option value="tiktok">TikTok</option>
          <option value="instagram">Instagram</option>
          <option value="youtube">YouTube</option>
        </select>
      </div>
      <button onClick={() => onSubmit(form)}
        className="bg-[#111111] text-white px-4 py-2 rounded-xl text-sm font-semibold">
        Create Creator Account
      </button>
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
