// MAM Admin — Back-office Reporting Dashboard (Sprint G)
"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

const API = "/api";

// ── Types ─────────────────────────────────────────────────────────────────────
interface KpiData {
  total_revenue?: number;
  total_orders?: number;
  total_commissions?: number;
  delivered_orders?: number;
  pending_orders?: number;
  cancelled_orders?: number;
  conversion_rate?: number;
  avg_order_value?: number;
}

interface Order {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  influencer_id?: string;
  vendor_id?: string;
  items?: Array<{ product_id: string; quantity: number; price: number }>;
}

interface Creator {
  id: string;
  handle: string;
  name: string;
  platform: string;
  status: string;
}

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock_quantity: number;
  status: string;
  vendor_id?: string;
}

interface Commission {
  id: string;
  order_id: string;
  influencer_id: string;
  amount: number;
  status: string;
  created_at: string;
}

// ── Utility ───────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", maximumFractionDigits: 0 }).format(n);
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function pct(n: number, total: number) {
  if (!total) return "0%";
  return `${Math.round((n / total) * 100)}%`;
}

// ── Mini bar chart (CSS/SVG, no library) ─────────────────────────────────────
function BarChart({ data, color = "#C9A84C", height = 120 }: {
  data: Array<{ label: string; value: number }>;
  color?: string;
  height?: number;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="w-full">
      <div className="flex items-end gap-1.5" style={{ height }}>
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 group">
            <div
              className="w-full rounded-t-md transition-all duration-500 relative"
              style={{
                height: `${Math.max((d.value / max) * height, 4)}px`,
                background: `linear-gradient(180deg, ${color}dd, ${color}88)`,
              }}
            >
              {/* Tooltip on hover */}
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {d.value}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-1.5 mt-2">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center text-[9px] text-white/30 truncate">
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Donut chart (SVG) ─────────────────────────────────────────────────────────
function DonutChart({ segments, size = 120 }: {
  segments: Array<{ label: string; value: number; color: string }>;
  size?: number;
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const radius = size * 0.38;
  const cx = size / 2;
  const cy = size / 2;
  const stroke = size * 0.12;

  if (!total) {
    return (
      <svg width={size} height={size}>
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#ffffff10" strokeWidth={stroke} />
        <text x={cx} y={cy + 5} textAnchor="middle" fill="#ffffff30" fontSize="11">No data</text>
      </svg>
    );
  }

  let cumPct = 0;
  const circumference = 2 * Math.PI * radius;

  return (
    <svg width={size} height={size}>
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#ffffff08" strokeWidth={stroke} />
      {segments.map((seg, i) => {
        const segPct = seg.value / total;
        const dasharray = `${segPct * circumference} ${circumference}`;
        const rotation = cumPct * 360 - 90;
        cumPct += segPct;
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={stroke}
            strokeDasharray={dasharray}
            strokeDashoffset={0}
            transform={`rotate(${rotation} ${cx} ${cy})`}
            strokeLinecap="round"
          />
        );
      })}
      <text x={cx} y={cy - 4} textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">
        {total}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#ffffff50" fontSize="9">
        orders
      </text>
    </svg>
  );
}

// ── Trend line (SVG polyline) ─────────────────────────────────────────────────
function SparkLine({ values, color = "#C9A84C", width = 120, height = 40 }: {
  values: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const pad = 4;
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (width - pad * 2);
    const y = pad + ((max - v) / range) * (height - pad * 2);
    return `${x},${y}`;
  });
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points={`${pad},${height - pad} ${pts.join(" ")} ${width - pad},${height - pad}`}
        fill={`${color}18`}
        stroke="none"
      />
    </svg>
  );
}

// ── KPI card with sparkline ───────────────────────────────────────────────────
function ReportKpi({
  label, value, sub, trend, trendColor, spark,
}: {
  label: string;
  value: string | number;
  sub?: string;
  trend?: string;
  trendColor?: string;
  spark?: number[];
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-col gap-2">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        {trend && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${trendColor || "bg-green-100 text-green-700"}`}>
            {trend}
          </span>
        )}
      </div>
      {spark && spark.length > 1 && (
        <div className="mt-1">
          <SparkLine values={spark} />
        </div>
      )}
    </div>
  );
}

// ── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ value, max, color = "#C9A84C" }: { value: number; max: number; color?: string }) {
  const pct = max ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

// ── Data processing helpers ───────────────────────────────────────────────────
function groupOrdersByDay(orders: Order[], days = 14) {
  const now = new Date();
  const result: Array<{ label: string; value: number }> = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = `${d.getDate()}/${d.getMonth() + 1}`;
    const count = orders.filter((o) => o.created_at?.slice(0, 10) === key).length;
    result.push({ label, value: count });
  }
  return result;
}

function revenueByDay(orders: Order[], days = 14) {
  const now = new Date();
  const result: Array<{ label: string; value: number }> = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = `${d.getDate()}/${d.getMonth() + 1}`;
    const rev = orders
      .filter((o) => o.created_at?.slice(0, 10) === key && o.status === "delivered")
      .reduce((s, o) => s + (o.total_amount || 0), 0);
    result.push({ label, value: Math.round(rev) });
  }
  return result;
}

function getCreatorStats(creators: Creator[], orders: Order[], commissions: Commission[]) {
  return creators.map((c) => {
    const cOrders = orders.filter((o) => o.influencer_id === c.id);
    const cCommissions = commissions.filter((cm) => cm.influencer_id === c.id);
    const revenue = cOrders.filter((o) => o.status === "delivered").reduce((s, o) => s + (o.total_amount || 0), 0);
    const earned = cCommissions.reduce((s, cm) => s + (cm.amount || 0), 0);
    const delivered = cOrders.filter((o) => o.status === "delivered").length;
    return {
      ...c,
      orderCount: cOrders.length,
      deliveredCount: delivered,
      revenue,
      earned,
      convRate: cOrders.length ? Math.round((delivered / cOrders.length) * 100) : 0,
    };
  }).sort((a, b) => b.revenue - a.revenue);
}

function getProductStats(products: Product[], orders: Order[]) {
  return products.map((p) => {
    // Count orders referencing this product via items array
    const unitsSold = orders
      .filter((o) => o.status === "delivered")
      .reduce((s, o) => {
        const item = o.items?.find((it) => it.product_id === p.id);
        return s + (item?.quantity || 0);
      }, 0);
    const revenue = unitsSold * (p.price || 0);
    return { ...p, unitsSold, revenue };
  }).sort((a, b) => b.unitsSold - a.unitsSold);
}

// ── CSV Export ────────────────────────────────────────────────────────────────
function exportCsv(rows: Record<string, string | number>[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? "")).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Date range filter ─────────────────────────────────────────────────────────
type DateRange = "7d" | "30d" | "90d" | "all";

function filterByRange(orders: Order[], range: DateRange) {
  if (range === "all") return orders;
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return orders.filter((o) => new Date(o.created_at) >= cutoff);
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminReportsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [range, setRange] = useState<DateRange>("30d");
  const [activeSection, setActiveSection] = useState<"overview" | "creators" | "products" | "commissions">("overview");

  const h = { "Content-Type": "application/json" };
  const opts = { headers: h, credentials: "include" as const };

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login?next=/admin/reports");
    else if (!authLoading && user && user.role !== "admin" && user.role !== "operator") router.replace("/dashboard");
  }, [user, authLoading, router]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [ordRes, crRes, prRes, cmRes, kpiRes] = await Promise.all([
        fetch(`${API}/orders`, opts),
        fetch(`${API}/influencers`, opts),
        fetch(`${API}/products`, opts),
        fetch(`${API}/commissions`, opts),
        fetch(`${API}/analytics/reports/kpis`, opts),
      ]);
      if (ordRes.ok) setOrders(await ordRes.json());
      if (crRes.ok) setCreators(await crRes.json());
      if (prRes.ok) setProducts(await prRes.json());
      if (cmRes.ok) setCommissions(await cmRes.json());
      if (kpiRes.ok) setKpis(await kpiRes.json());
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { if (user) load(); }, [user, load]);

  if (authLoading || !user || (user.role !== "admin" && user.role !== "operator")) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Derived data ────────────────────────────────────────────────────────────
  const filtered = filterByRange(orders, range);
  const delivered = filtered.filter((o) => o.status === "delivered");
  const pending = filtered.filter((o) => o.status === "pending");
  const cancelled = filtered.filter((o) => o.status === "cancelled");
  const totalRevenue = delivered.reduce((s, o) => s + (o.total_amount || 0), 0);
  const avgOrderValue = delivered.length ? totalRevenue / delivered.length : 0;
  const convRate = filtered.length ? Math.round((delivered.length / filtered.length) * 100) : 0;
  const totalCommissions = commissions.reduce((s, c) => s + (c.amount || 0), 0);

  const ordersByDay = groupOrdersByDay(filtered, range === "7d" ? 7 : range === "30d" ? 30 : 14);
  const revByDay = revenueByDay(filtered, range === "7d" ? 7 : range === "30d" ? 30 : 14);
  const sparkOrders = ordersByDay.map((d) => d.value);
  const sparkRevenue = revByDay.map((d) => d.value);

  const orderStatusSegments = [
    { label: "Delivered", value: delivered.length, color: "#22c55e" },
    { label: "Pending", value: pending.length, color: "#eab308" },
    { label: "Cancelled", value: cancelled.length, color: "#ef4444" },
    { label: "Other", value: filtered.length - delivered.length - pending.length - cancelled.length, color: "#6b7280" },
  ].filter((s) => s.value > 0);

  const creatorStats = getCreatorStats(creators, filtered, commissions);
  const productStats = getProductStats(products, filtered);

  // ── Main UI ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <a href="/admin" className="text-gray-400 hover:text-gray-600 text-sm">← Admin</a>
            <span className="text-gray-200">/</span>
            <h1 className="font-bold text-gray-900 text-base">Reports</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Date range selector */}
            <div className="flex bg-gray-100 rounded-xl overflow-hidden text-xs font-semibold">
              {(["7d", "30d", "90d", "all"] as DateRange[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-3 py-1.5 transition-colors ${range === r ? "bg-[#C9A84C] text-black" : "text-gray-500 hover:text-gray-800"}`}
                >
                  {r === "all" ? "All time" : r}
                </button>
              ))}
            </div>
            <button
              onClick={load}
              disabled={loading}
              className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">

        {/* ── SECTION NAV ── */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {(["overview", "creators", "products", "commissions"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setActiveSection(s)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                activeSection === s
                  ? "bg-[#111] text-white shadow-sm"
                  : "bg-white text-gray-500 border border-gray-100 hover:text-gray-800"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* ══ OVERVIEW ══════════════════════════════════════════════════════════ */}
        {activeSection === "overview" && (
          <div className="space-y-6">
            {/* KPI row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ReportKpi
                label="Revenue"
                value={fmt(totalRevenue)}
                sub={`${delivered.length} delivered orders`}
                trend={delivered.length > 0 ? `+${delivered.length}` : undefined}
                trendColor="bg-green-100 text-green-700"
                spark={sparkRevenue}
              />
              <ReportKpi
                label="Total Orders"
                value={filtered.length}
                sub={`${range === "all" ? "All time" : `Last ${range}`}`}
                spark={sparkOrders}
              />
              <ReportKpi
                label="Avg Order Value"
                value={fmt(avgOrderValue)}
                sub="Delivered only"
              />
              <ReportKpi
                label="Conversion Rate"
                value={`${convRate}%`}
                sub="Ordered → Delivered"
                trend={convRate >= 60 ? "Good" : convRate >= 40 ? "Ok" : "Low"}
                trendColor={convRate >= 60 ? "bg-green-100 text-green-700" : convRate >= 40 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}
              />
            </div>

            {/* Charts row */}
            <div className="grid md:grid-cols-3 gap-4">
              {/* Orders by day */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm md:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Orders Over Time</p>
                    <p className="text-xs text-gray-400">Daily order volume</p>
                  </div>
                </div>
                <BarChart data={ordersByDay} color="#C9A84C" height={120} />
              </div>

              {/* Order status donut */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <p className="font-semibold text-gray-900 text-sm mb-1">Order Status</p>
                <p className="text-xs text-gray-400 mb-4">Distribution</p>
                <div className="flex items-center justify-center mb-4">
                  <DonutChart segments={orderStatusSegments} size={130} />
                </div>
                <div className="space-y-2">
                  {orderStatusSegments.map((s) => (
                    <div key={s.label} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                        <span className="text-gray-600">{s.label}</span>
                      </div>
                      <span className="font-semibold text-gray-800">{s.value} <span className="text-gray-400 font-normal">({pct(s.value, filtered.length)})</span></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Revenue by day */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Revenue Over Time</p>
                  <p className="text-xs text-gray-400">Delivered orders only · GHS</p>
                </div>
                <button
                  onClick={() => exportCsv(revByDay.map((d) => ({ date: d.label, revenue_ghs: d.value })), "mam-revenue.csv")}
                  className="text-xs text-gray-400 hover:text-gray-700 border border-gray-200 px-2.5 py-1 rounded-lg transition-colors"
                >
                  Export CSV
                </button>
              </div>
              <BarChart data={revByDay} color="#22c55e" height={100} />
            </div>

            {/* Summary stats */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Platform Totals</p>
                {[
                  { label: "Total Creators", value: creators.length },
                  { label: "Active Vendors", value: new Set(orders.map((o) => o.vendor_id)).size },
                  { label: "Products Listed", value: products.length },
                  { label: "Total Commissions", value: fmt(totalCommissions) },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-500">{row.label}</span>
                    <span className="text-sm font-semibold text-gray-900">{row.value}</span>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Order Pipeline</p>
                {[
                  { label: "Pending", value: pending.length, color: "#eab308", bg: "bg-yellow-50" },
                  { label: "Delivered", value: delivered.length, color: "#22c55e", bg: "bg-green-50" },
                  { label: "Cancelled", value: cancelled.length, color: "#ef4444", bg: "bg-red-50" },
                ].map((row) => (
                  <div key={row.label} className="mb-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">{row.label}</span>
                      <span className="font-semibold" style={{ color: row.color }}>{row.value}</span>
                    </div>
                    <ProgressBar value={row.value} max={filtered.length} color={row.color} />
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Top Creators</p>
                {creatorStats.slice(0, 4).map((c, i) => (
                  <div key={c.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                    <div className="w-6 h-6 rounded-lg bg-[#C9A84C]/15 flex items-center justify-center text-[10px] font-black text-[#C9A84C]">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">@{c.handle}</p>
                      <p className="text-[10px] text-gray-400">{c.orderCount} orders</p>
                    </div>
                    <span className="text-xs font-bold text-gray-700">{fmt(c.revenue)}</span>
                  </div>
                ))}
                {!creatorStats.length && <p className="text-xs text-gray-400">No data yet</p>}
              </div>
            </div>
          </div>
        )}

        {/* ══ CREATORS ══════════════════════════════════════════════════════════ */}
        {activeSection === "creators" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-gray-900">Creator Performance</h2>
                <p className="text-xs text-gray-400">Revenue and commission by creator</p>
              </div>
              <button
                onClick={() => exportCsv(
                  creatorStats.map((c) => ({
                    handle: c.handle,
                    orders: c.orderCount,
                    delivered: c.deliveredCount,
                    revenue_ghs: Math.round(c.revenue),
                    commission_ghs: Math.round(c.earned),
                    conv_rate_pct: c.convRate,
                  })),
                  "mam-creators.csv"
                )}
                className="text-xs text-gray-400 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                Export CSV
              </button>
            </div>

            {/* Creator chart */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">Revenue by Creator</p>
              <BarChart
                data={creatorStats.slice(0, 10).map((c) => ({ label: `@${c.handle}`, value: Math.round(c.revenue) }))}
                color="#C9A84C"
                height={100}
              />
            </div>

            {/* Creator table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-400 uppercase tracking-widest">
                      <th className="text-left px-4 py-3 font-semibold">#</th>
                      <th className="text-left px-4 py-3 font-semibold">Creator</th>
                      <th className="text-right px-4 py-3 font-semibold">Orders</th>
                      <th className="text-right px-4 py-3 font-semibold">Delivered</th>
                      <th className="text-right px-4 py-3 font-semibold">Conv %</th>
                      <th className="text-right px-4 py-3 font-semibold">Revenue</th>
                      <th className="text-right px-4 py-3 font-semibold">Commission</th>
                      <th className="text-left px-4 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {creatorStats.map((c, i) => (
                      <tr key={c.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900">@{c.handle}</p>
                          <p className="text-xs text-gray-400">{c.name} · {c.platform}</p>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700">{c.orderCount}</td>
                        <td className="px-4 py-3 text-right text-green-600 font-medium">{c.deliveredCount}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                            c.convRate >= 60 ? "bg-green-100 text-green-700" :
                            c.convRate >= 40 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                          }`}>{c.convRate}%</span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">{fmt(c.revenue)}</td>
                        <td className="px-4 py-3 text-right text-[#C9A84C] font-bold">{fmt(c.earned)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            c.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                          }`}>{c.status}</span>
                        </td>
                      </tr>
                    ))}
                    {!creatorStats.length && (
                      <tr><td colSpan={8} className="text-center text-gray-400 py-8 text-sm">No creator data yet</td></tr>
                    )}
                  </tbody>
                  {creatorStats.length > 0 && (
                    <tfoot>
                      <tr className="border-t-2 border-gray-100 bg-gray-50">
                        <td colSpan={5} className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-widest">Totals</td>
                        <td className="px-4 py-3 text-right font-black text-gray-900">{fmt(creatorStats.reduce((s, c) => s + c.revenue, 0))}</td>
                        <td className="px-4 py-3 text-right font-black text-[#C9A84C]">{fmt(creatorStats.reduce((s, c) => s + c.earned, 0))}</td>
                        <td />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══ PRODUCTS ══════════════════════════════════════════════════════════ */}
        {activeSection === "products" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-gray-900">Product Performance</h2>
                <p className="text-xs text-gray-400">Units sold and revenue by product</p>
              </div>
              <button
                onClick={() => exportCsv(
                  productStats.map((p) => ({
                    name: p.name,
                    category: p.category,
                    price_ghs: p.price,
                    units_sold: p.unitsSold,
                    revenue_ghs: Math.round(p.revenue),
                    stock_remaining: p.stock_quantity,
                    status: p.status,
                  })),
                  "mam-products.csv"
                )}
                className="text-xs text-gray-400 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                Export CSV
              </button>
            </div>

            {/* Product chart */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">Top Products by Units Sold</p>
              <BarChart
                data={productStats.slice(0, 12).map((p) => ({ label: p.name.split(" ")[0], value: p.unitsSold }))}
                color="#8B2500"
                height={100}
              />
            </div>

            {/* Product table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-400 uppercase tracking-widest">
                      <th className="text-left px-4 py-3 font-semibold">#</th>
                      <th className="text-left px-4 py-3 font-semibold">Product</th>
                      <th className="text-left px-4 py-3 font-semibold">Category</th>
                      <th className="text-right px-4 py-3 font-semibold">Price</th>
                      <th className="text-right px-4 py-3 font-semibold">Units Sold</th>
                      <th className="text-right px-4 py-3 font-semibold">Revenue</th>
                      <th className="text-right px-4 py-3 font-semibold">Stock</th>
                      <th className="text-left px-4 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productStats.map((p, i) => (
                      <tr key={p.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900">{p.name}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-500 capitalize">{p.category}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{fmt(p.price)}</td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">{p.unitsSold}</td>
                        <td className="px-4 py-3 text-right font-bold text-green-700">{fmt(p.revenue)}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`text-xs font-semibold ${p.stock_quantity <= 5 ? "text-red-500" : p.stock_quantity <= 15 ? "text-yellow-600" : "text-gray-600"}`}>
                            {p.stock_quantity}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            p.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                          }`}>{p.status}</span>
                        </td>
                      </tr>
                    ))}
                    {!productStats.length && (
                      <tr><td colSpan={8} className="text-center text-gray-400 py-8 text-sm">No product data yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══ COMMISSIONS ═══════════════════════════════════════════════════════ */}
        {activeSection === "commissions" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-gray-900">Commission Ledger</h2>
                <p className="text-xs text-gray-400">All commission records</p>
              </div>
              <button
                onClick={() => exportCsv(
                  commissions.map((c) => ({
                    id: c.id,
                    order_id: c.order_id,
                    influencer_id: c.influencer_id,
                    amount_ghs: c.amount,
                    status: c.status,
                    date: fmtDate(c.created_at),
                  })),
                  "mam-commissions.csv"
                )}
                className="text-xs text-gray-400 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                Export CSV
              </button>
            </div>

            {/* Commission summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Earned", value: fmt(commissions.reduce((s, c) => s + c.amount, 0)), color: "text-green-700" },
                { label: "Pending Payout", value: fmt(commissions.filter((c) => c.status === "pending").reduce((s, c) => s + c.amount, 0)), color: "text-yellow-600" },
                { label: "Paid Out", value: fmt(commissions.filter((c) => c.status === "paid").reduce((s, c) => s + c.amount, 0)), color: "text-blue-600" },
                { label: "Total Records", value: commissions.length, color: "text-gray-900" },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                  <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">{s.label}</p>
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Commission table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-400 uppercase tracking-widest">
                      <th className="text-left px-4 py-3 font-semibold">Date</th>
                      <th className="text-left px-4 py-3 font-semibold">Order ID</th>
                      <th className="text-left px-4 py-3 font-semibold">Creator</th>
                      <th className="text-right px-4 py-3 font-semibold">Amount</th>
                      <th className="text-left px-4 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissions.slice(0, 100).map((c) => {
                      const creator = creators.find((cr) => cr.id === c.influencer_id);
                      return (
                        <tr key={c.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3 text-gray-500 text-xs">{fmtDate(c.created_at)}</td>
                          <td className="px-4 py-3 text-gray-400 text-xs font-mono">{c.order_id?.slice(0, 8)}…</td>
                          <td className="px-4 py-3 text-gray-700">
                            {creator ? `@${creator.handle}` : <span className="text-gray-400 text-xs">{c.influencer_id?.slice(0, 8)}</span>}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-[#C9A84C]">{fmt(c.amount)}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              c.status === "paid" ? "bg-blue-100 text-blue-700" :
                              c.status === "payable" ? "bg-green-100 text-green-700" :
                              "bg-yellow-100 text-yellow-700"
                            }`}>{c.status}</span>
                          </td>
                        </tr>
                      );
                    })}
                    {!commissions.length && (
                      <tr><td colSpan={5} className="text-center text-gray-400 py-8 text-sm">No commissions yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
