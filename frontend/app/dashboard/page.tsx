// Influencer Creator Dashboard — unified tabbed app shell (Sprint C)
// Route: /dashboard  (basePath: /mam)
// Sprint III: auth gate via useAuth + redirect to /login
"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { TEMPLATES, type TemplateId } from "@/lib/templates";
import { useAuth } from "@/lib/auth";


// ─── Types ────────────────────────────────────────────────────────────────────

interface InfluencerProfile {
  id: string;
  handle: string;
  platform_name: string;
  status: string;
  template_id: string;
  bio: string | null;
  avatar_url: string | null;
  payout_method: string | null;
  payout_details_ref: string | null;
}

interface Commission {
  id: string;
  order_id: string;
  influencer_amount: number;
  currency: string;
  commission_status: string;
  calculated_at: string;
}

interface OrderItem {
  product_name: string;
  quantity: number;
  unit_price: string;
  line_total: string;
}

interface Order {
  id: string;
  status: string;
  total: number;
  subtotal: number;
  currency: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  delivery_address?: string;
  size_variant?: string;
  special_instructions?: string;
  fulfillment_status: string;
  created_at: string;
  items?: OrderItem[];
}

interface KPI {
  total_orders: number;
  delivered_orders: number;
  total_influencer_earnings: number;
  pending_commission: number;
  paid_out: number;
  currency: string;
}

interface TrackingLink {
  id: string;
  code: string;
  label: string;
  destination_path: string;
  click_count: number;
  is_active: boolean;
  created_at: string;
  short_url: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  currency: string;
  category: string;
  inventory_count: number;
  status: string;
  media_urls?: string[];
}

type Tab = "home" | "orders" | "catalog" | "links" | "store" | "analytics";

// ─── Status helpers ────────────────────────────────────────────────────────────

const ORDER_STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-purple-100 text-purple-700",
  shipped: "bg-orange-100 text-orange-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
};

const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

// ─── Login Screen ──────────────────────────────────────────────────────────────

// ─── Tab: Home ─────────────────────────────────────────────────────────────────

interface Payout {
  id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string | null;
  external_reference: string | null;
  period_end: string | null;
  influencer_handle: string | null;
  influencer_momo: string | null;
}

interface DailyEarning {
  date: string;
  revenue: number;
  orders: number;
}

function HomeTab({ kpi, commissions, profile }: { kpi: KPI | null; commissions: Commission[]; profile: InfluencerProfile | null }) {
  const pendingCommission = commissions.filter(c => c.commission_status === "payable");
  const pendingTotal = pendingCommission.reduce((s, c) => s + Number(c.influencer_amount), 0);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutMsg, setPayoutMsg] = useState("");
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [dailyEarnings, setDailyEarnings] = useState<DailyEarning[]>([]);

  useEffect(() => {
    // Fetch payouts
    fetch(`/api/payouts/mine`, { credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then(data => setPayouts(data))
      .catch(() => {/* silent */});
    // Fetch daily earnings for trend chart
    fetch(`/api/analytics/reports/daily/me`, { credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then(data => setDailyEarnings(data || []))
      .catch(() => {/* silent */});
  }, []);

  // Onboarding checklist — items checked against profile state
  const onboardingItems = [
    { label: "Profile set up", done: !!profile?.handle },
    { label: "Bio added", done: !!profile?.bio },
    { label: "Avatar uploaded", done: !!profile?.avatar_url },
    { label: "Payout method configured", done: !!profile?.payout_method },
  ];
  const onboardingDone = onboardingItems.filter(i => i.done).length;
  const showChecklist = onboardingDone < onboardingItems.length;

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div>
        <p className="text-[#C9A84C] text-xs font-bold tracking-widest uppercase">Welcome back</p>
        <h2 className="text-2xl font-black text-white mt-0.5">
          @{profile?.handle || "creator"}
        </h2>
        <p className="text-gray-400 text-sm mt-0.5">Here's how your store is doing</p>
      </div>

      {/* Onboarding checklist — shown until all steps complete */}
      {showChecklist && (
        <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-[#C9A84C]/20">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-white">Get started checklist</p>
            <span className="text-xs text-[#C9A84C] font-semibold">{onboardingDone}/{onboardingItems.length}</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-[#2A2A2A] rounded-full h-1.5 mb-3">
            <div
              className="h-1.5 rounded-full bg-[#C9A84C] transition-all"
              style={{ width: `${(onboardingDone / onboardingItems.length) * 100}%` }}
            />
          </div>
          <div className="space-y-2">
            {onboardingItems.map((item, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 ${
                  item.done ? "bg-green-500 text-white" : "border border-gray-600 text-gray-600"
                }`}>
                  {item.done ? "✓" : ""}
                </span>
                <span className={`text-xs ${item.done ? "line-through text-gray-600" : "text-gray-300"}`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-600 mt-3">
            Complete your profile in the{" "}
            <span className="text-[#C9A84C]">Store</span> tab
          </p>
        </div>
      )}

      {/* KPI grid */}
      {kpi ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/8">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total Orders</p>
            <p className="text-3xl font-black text-white mt-1">{kpi.total_orders}</p>
            <p className="text-xs text-gray-500 mt-1">{kpi.delivered_orders} delivered</p>
          </div>
          <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/8">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total Earned</p>
            <p className="text-3xl font-black text-[#C9A84C] mt-1">
              {Number(kpi.total_influencer_earnings).toFixed(0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">GHS</p>
          </div>
          <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/8">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Pending</p>
            <p className="text-3xl font-black text-amber-400 mt-1">
              {Number(kpi.pending_commission).toFixed(0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">GHS — awaiting payout</p>
          </div>
          <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/8">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Paid Out</p>
            <p className="text-3xl font-black text-green-400 mt-1">
              {Number(kpi.paid_out).toFixed(0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">GHS total</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="bg-[#1A1A1A] rounded-2xl h-24 animate-pulse border border-white/8" />
          ))}
        </div>
      )}

      {/* Earnings Trend */}
      {dailyEarnings.length > 0 && (() => {
        const last14 = dailyEarnings.slice(-14);
        const totalTrendRevenue = last14.reduce((s, d) => s + d.revenue, 0);
        const avgDaily = last14.length > 0 ? totalTrendRevenue / last14.length : 0;
        const maxDaily = Math.max(...last14.map(d => d.revenue), 1);
        return (
          <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-[#C9A84C]/20">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white">14-Day Earnings</h3>
              <span className="text-xs text-[#C9A84C] font-semibold">GHS {totalTrendRevenue.toFixed(0)}</span>
            </div>
            <p className="text-xs text-gray-500 mb-3">Avg: GHS {avgDaily.toFixed(0)}/day</p>
            {/* Mini bar chart */}
            <div className="flex items-end justify-between gap-1 h-12">
              {last14.map((d, i) => {
                const height = maxDaily > 0 ? (d.revenue / maxDaily) * 100 : 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-gradient-to-t from-[#C9A84C] to-[#E8C97A] rounded-t-sm transition-all hover:opacity-80"
                      style={{ height: `${Math.max(height, 4)}%` }}
                      title={`${new Date(d.date).toLocaleDateString("en-GH", { month: "short", day: "numeric" })}: GHS ${d.revenue.toFixed(0)}`}
                    />
                    <span className="text-[8px] text-gray-600 text-center leading-tight">
                      {new Date(d.date).toLocaleDateString("en-GH", { month: "short", day: "numeric" }).split(" ")[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Payout request card */}
      {pendingTotal > 0 && (
        <div className="bg-amber-900/20 border border-amber-500/30 rounded-2xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                <p className="text-amber-400 text-sm font-bold">
                  GHS {pendingTotal.toFixed(2)} ready for payout
                </p>
              </div>
              <p className="text-xs text-amber-400/70">
                {pendingCommission.length} commission{pendingCommission.length > 1 ? "s" : ""} · Paid to MoMo after admin confirmation
              </p>
              {payoutMsg && (
                <p className={`text-xs mt-2 font-medium ${payoutMsg.startsWith("Error") ? "text-red-400" : "text-green-400"}`}>
                  {payoutMsg}
                </p>
              )}
            </div>
            <button
              disabled={payoutLoading || !!payoutMsg}
              onClick={async () => {
                setPayoutLoading(true);
                setPayoutMsg("");
                try {
                  const res = await fetch(`/api/payouts/request`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" }, credentials: "include",
                  });
                  const data = await res.json();
                  if (res.ok) {
                    setPayoutMsg(`Requested GHS ${Number(data.total_GHS).toFixed(2)}`);
                  } else {
                    setPayoutMsg(`Error: ${data.detail || "Request failed"}`);
                  }
                } catch {
                  setPayoutMsg("Error: Network error");
                }
                setPayoutLoading(false);
              }}
              className="shrink-0 bg-amber-500 disabled:bg-amber-800 text-black font-bold text-xs px-3 py-2 rounded-xl transition-colors"
            >
              {payoutLoading ? "…" : "Request Payout"}
            </button>
          </div>
        </div>
      )}

      {/* Commission history */}
      <div>
        <h3 className="text-sm font-bold text-white mb-3">Commission History</h3>
        {commissions.length === 0 ? (
          <div className="text-center py-8 bg-[#1A1A1A] rounded-2xl border border-white/8">
            <p className="text-4xl mb-3">💰</p>
            <p className="text-gray-400 text-sm">No commissions yet</p>
            <p className="text-xs text-gray-600 mt-1">Commissions appear when orders are delivered</p>
          </div>
        ) : (
          <div className="space-y-2">
            {commissions.slice(0, 8).map(c => (
              <div key={c.id} className="bg-[#1A1A1A] rounded-xl p-4 border border-white/8 flex justify-between items-center">
                <div>
                  <p className="text-xs font-mono text-gray-500">#{c.order_id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{new Date(c.calculated_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-white">GHS {Number(c.influencer_amount).toFixed(2)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    c.commission_status === "paid" ? "bg-green-900/40 text-green-400 border border-green-500/30" :
                    c.commission_status === "payable" ? "bg-amber-900/40 text-amber-400 border border-amber-500/30" :
                    "bg-white/5 text-gray-400"
                  }`}>
                    {c.commission_status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payout History */}
      <div>
        <h3 className="text-sm font-bold text-white mb-3">Payout History</h3>
        {payouts.length === 0 ? (
          <div className="text-center py-6 bg-[#1A1A1A] rounded-2xl border border-white/8">
            <p className="text-3xl mb-2">🏦</p>
            <p className="text-gray-400 text-sm">No payouts yet</p>
            <p className="text-xs text-gray-600 mt-1">Completed payouts will appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {payouts.map(p => {
              const statusStyle =
                p.status === "paid" ? "bg-green-900/40 text-green-400 border border-green-500/30" :
                p.status === "pending" ? "bg-amber-900/40 text-amber-400 border border-amber-500/30" :
                p.status === "processing" ? "bg-blue-900/40 text-blue-400 border border-blue-500/30" :
                "bg-white/5 text-gray-400";
              return (
                <div key={p.id} className="bg-[#1A1A1A] rounded-xl p-4 border border-white/8">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-base">GHS {Number(p.amount).toFixed(2)}</p>
                      {p.period_end && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          Period ending {new Date(p.period_end).toLocaleDateString("en-GH", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      )}
                      {p.payment_method && (
                        <p className="text-xs text-gray-600 mt-0.5 capitalize">{p.payment_method.replace(/_/g, " ")}</p>
                      )}
                      {p.external_reference && (
                        <p className="text-xs text-gray-600 font-mono mt-0.5">Ref: {p.external_reference}</p>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${statusStyle}`}>
                      {p.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Your Store Link */}
      {profile?.handle && (() => {
        const storeUrl = typeof window !== "undefined"
          ? `${window.location.origin}/${profile.handle}`
          : `/${profile.handle}`;
        return (
          <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-[#C9A84C]/20">
            <p className="text-sm font-bold text-white mb-1">Your Store Link</p>
            <p className="text-xs text-gray-500 mb-3">Share on TikTok, Instagram, and WhatsApp to drive sales</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-[#111] border border-white/10 rounded-xl px-3 py-2.5 overflow-hidden">
                <p className="text-xs text-[#C9A84C] font-mono truncate">{storeUrl}</p>
              </div>
              <StoreLinkCopyButton url={storeUrl} />
            </div>
          </div>
        );
      })()}

      {/* Payout footer note */}
      <div className="bg-[#111] rounded-2xl p-3 border border-white/5">
        <p className="text-xs text-gray-600 leading-relaxed text-center">
          Payouts sent via MTN MoMo · Questions?{" "}
          <a href="https://wa.me/13107763650" target="_blank" rel="noopener noreferrer" className="text-[#C9A84C]">
            WhatsApp admin
          </a>
        </p>
      </div>
    </div>
  );
}

function StoreLinkCopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }
  return (
    <button
      onClick={copy}
      className={`shrink-0 text-xs font-bold px-3 py-2.5 rounded-xl transition-all ${
        copied ? "bg-green-500 text-white" : "bg-[#C9A84C] text-black hover:bg-[#E8C97A]"
      }`}
    >
      {copied ? "✓ Copied!" : "Copy"}
    </button>
  );
}

// ─── Tab: Orders ───────────────────────────────────────────────────────────────

function OrdersTab({ orders }: { orders: Order[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const newCount = orders.filter(o => o.status === "pending").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white">Orders</h2>
          <p className="text-xs text-gray-500 mt-0.5">{orders.length} total</p>
        </div>
        {newCount > 0 && (
          <span className="bg-red-500 text-white text-xs font-black px-2.5 py-1 rounded-full">
            {newCount} NEW
          </span>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12 bg-[#1A1A1A] rounded-2xl border border-white/8">
          <p className="text-4xl mb-3">📦</p>
          <p className="text-gray-400 text-sm">No orders yet</p>
          <p className="text-xs text-gray-600 mt-1">Share your store link to get your first sale!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(o => {
            const isNew = o.status === "pending";
            const isOpen = expanded === o.id;

            return (
              <div
                key={o.id}
                className={`rounded-2xl border transition-all ${
                  isNew
                    ? "bg-amber-900/10 border-amber-500/30"
                    : "bg-[#1A1A1A] border-white/8"
                }`}
              >
                {/* Card header — always visible */}
                <button
                  onClick={() => setExpanded(isOpen ? null : o.id)}
                  className="w-full text-left p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {isNew && (
                          <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                        )}
                        <p className="font-bold text-white text-sm truncate">
                          {o.customer_name || "Customer"}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 font-mono">#{o.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {new Date(o.created_at).toLocaleDateString("en-GH", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-black text-white text-base">GHS {Number(o.total).toFixed(2)}</p>
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-1 ${ORDER_STATUS_STYLE[o.status] || "bg-white/5 text-gray-400"}`}>
                        {ORDER_STATUS_LABEL[o.status] || o.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    {o.size_variant ? (
                      <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-lg">
                        Size: {o.size_variant}
                      </span>
                    ) : <span />}
                    <span className="text-xs text-gray-600">{isOpen ? "▲ Less" : "▼ Details"}</span>
                  </div>
                </button>

                {/* Expanded details */}
                {isOpen && (
                  <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
                    {/* Contact */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Phone</p>
                        <a
                          href={`tel:${o.customer_phone}`}
                          className="text-sm text-[#C9A84C] font-medium"
                        >
                          {o.customer_phone || "—"}
                        </a>
                      </div>
                      {o.customer_email && (
                        <div>
                          <p className="text-xs text-gray-500 mb-0.5">Email</p>
                          <p className="text-sm text-gray-300 truncate">{o.customer_email}</p>
                        </div>
                      )}
                    </div>

                    {/* Delivery address */}
                    {o.delivery_address && (
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Delivery Address</p>
                        <p className="text-sm text-gray-300 leading-snug">{o.delivery_address}</p>
                      </div>
                    )}

                    {/* Special instructions */}
                    {o.special_instructions && (
                      <div className="bg-amber-900/20 border border-amber-500/20 rounded-xl px-3 py-2">
                        <p className="text-xs text-amber-400/70 mb-0.5">Customer note</p>
                        <p className="text-sm text-amber-300">{o.special_instructions}</p>
                      </div>
                    )}

                    {/* Items ordered */}
                    {o.items && o.items.length > 0 && (
                      <div className="bg-white/5 rounded-xl px-3 py-2 space-y-1.5">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Items ordered</p>
                        {o.items.map((it, i) => (
                          <div key={i} className="flex items-center justify-between gap-2 text-xs">
                            <div className="flex-1 min-w-0">
                              <span className="text-gray-200 font-medium truncate block">{it.product_name}</span>
                              <span className="text-gray-500">qty {it.quantity} × GHS {Number(it.unit_price).toFixed(2)}</span>
                            </div>
                            <span className="text-white font-semibold shrink-0">GHS {Number(it.line_total).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Order total breakdown */}
                    <div className="bg-white/5 rounded-xl px-3 py-2 text-xs space-y-1">
                      <div className="flex justify-between text-gray-400">
                        <span>Subtotal</span>
                        <span>GHS {Number(o.subtotal).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Fulfillment</span>
                        <span className="capitalize">{o.fulfillment_status}</span>
                      </div>
                      <div className="flex justify-between text-white font-bold pt-1 border-t border-white/10">
                        <span>Total</span>
                        <span>GHS {Number(o.total).toFixed(2)}</span>
                      </div>
                    </div>

                    {/* WhatsApp customer quick action */}
                    {o.customer_phone && (
                      <a
                        href={`https://wa.me/${o.customer_phone.replace(/\D/g, "")}?text=Hi%20${encodeURIComponent(o.customer_name || "there")}%2C%20your%20order%20%23${o.id.slice(0, 8).toUpperCase()}%20is%20being%20processed.%20We%27ll%20update%20you%20soon!`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full bg-green-600/20 border border-green-500/30 text-green-400 text-sm font-semibold py-2.5 rounded-xl hover:bg-green-600/30 transition-colors"
                      >
                        <span className="text-base">💬</span>
                        WhatsApp Customer
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Links ────────────────────────────────────────────────────────────────

function LinksTab({ profile }: {
  profile: InfluencerProfile | null;
}) {
  const [links, setLinks] = useState<TrackingLink[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [label, setLabel] = useState("");
  const [destProduct, setDestProduct] = useState<string>(""); // "" = entire store
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [shareFor, setShareFor] = useState<string | null>(null); // link id
  const [error, setError] = useState("");

  const handle = profile?.handle || "";

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tracking/links`, {
        credentials: "include",
      });
      if (res.ok) setLinks(await res.json());
    } catch {
      setError("Failed to load links.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLinks(); }, [fetchLinks]);

  // Load influencer's assigned products for destination picker
  useEffect(() => {
    fetch(`/api/products/mine`, { credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then(data => setProducts(data))
      .catch(() => {/* silent */});
  }, []);

  async function createLink(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      const destination = destProduct
        ? `/${handle}/${destProduct}`
        : `/${handle}`;
      const res = await fetch(`/api/tracking/links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({
          label: label || undefined,
          destination_path: destination,
        }),
      });
      if (!res.ok) throw new Error();
      setLabel("");
      setDestProduct("");
      await fetchLinks();
    } catch {
      setError("Failed to create link. Try again.");
    } finally {
      setCreating(false);
    }
  }

  async function deactivateLink(id: string) {
    try {
      await fetch(`/api/tracking/links/${id}/deactivate`, {
        method: "PATCH",
        credentials: "include",
      });
      await fetchLinks();
    } catch { /* silent */ }
  }

  function copyLink(url: string) {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(url);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  function buildShareText(link: TrackingLink) {
    const prod = products.find(p => link.destination_path?.includes(p.id));
    const productName = prod ? prod.name : "my store";
    return `Check out ${productName} on Yes MAM! 🛍️\n\n${link.short_url}\n\n#YesMAM #Ghana #ShopNow`;
  }

  const totalClicks = links.reduce((s, l) => s + l.click_count, 0);
  const activeCount = links.filter(l => l.is_active).length;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-black text-white">Tracking Links</h2>
        <p className="text-xs text-gray-500 mt-0.5">Create unique links to track which TikTok posts drive sales</p>
      </div>

      {/* Stats banner */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#C9A84C]/10 border border-[#C9A84C]/20 rounded-2xl p-4">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Total Clicks</p>
          <p className="text-3xl font-black text-[#C9A84C]">{totalClicks.toLocaleString()}</p>
        </div>
        <div className="bg-[#1A1A1A] border border-white/8 rounded-2xl p-4">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Active Links</p>
          <p className="text-3xl font-black text-white">{activeCount}</p>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/8">
        <p className="text-sm font-bold text-white mb-2">How it works</p>
        <ol className="text-xs text-gray-400 space-y-1.5 list-decimal list-inside">
          <li>Create a link for each post — label it by date or product</li>
          <li>Paste the short link in your TikTok bio or video caption</li>
          <li>Every click and sale is tracked back to that post</li>
        </ol>
      </div>

      {/* Create link form */}
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <form onSubmit={createLink} className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/8 space-y-3">
        <p className="text-sm font-bold text-white">Create New Link</p>

        <div>
          <label className="text-xs text-gray-500 block mb-1">Label (optional)</label>
          <input
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="e.g. TikTok Mar 15 — Wig reveal"
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#C9A84C]/60"
          />
        </div>

        <div>
          <label className="text-xs text-gray-500 block mb-1">Destination</label>
          <select
            value={destProduct}
            onChange={e => setDestProduct(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C9A84C]/60"
          >
            <option value="">Entire store (@{handle})</option>
            {products.filter(p => p.status === "active").map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <p className="text-[10px] text-gray-600 mt-1">
            {destProduct
              ? `→ /${handle}/${destProduct.slice(0, 8)}…`
              : `→ /${handle} (full storefront)`}
          </p>
        </div>

        <button
          type="submit"
          disabled={creating}
          className="w-full py-3 bg-[#C9A84C] text-black rounded-xl text-sm font-black disabled:opacity-50"
        >
          {creating ? "Creating…" : "Generate Link"}
        </button>
      </form>

      {/* Links list */}
      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map(i => <div key={i} className="h-20 bg-[#1A1A1A] rounded-2xl animate-pulse" />)}
        </div>
      ) : links.length === 0 ? (
        <div className="text-center py-10 bg-[#1A1A1A] rounded-2xl border border-white/8">
          <p className="text-4xl mb-3">🔗</p>
          <p className="text-gray-400 text-sm">No links yet</p>
          <p className="text-xs text-gray-600 mt-1">Create your first link above</p>
        </div>
      ) : (
        <div className="space-y-3">
          {links.map(link => (
            <div
              key={link.id}
              className={`bg-[#1A1A1A] rounded-2xl p-4 border transition-opacity ${
                link.is_active ? "border-white/8" : "border-white/4 opacity-50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm truncate">{link.label || "Untitled"}</p>
                  <p className="text-xs text-gray-500 font-mono mt-0.5 truncate">{link.short_url}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-400">
                      <span className="font-black text-white">{link.click_count}</span> clicks
                    </span>
                    <span className="text-xs text-gray-600">
                      {new Date(link.created_at).toLocaleDateString("en-GH", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                </div>
                {link.is_active && (
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                      onClick={() => copyLink(link.short_url)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                        copied === link.short_url
                          ? "bg-green-900/40 text-green-400 border border-green-500/30"
                          : "bg-[#C9A84C] text-black"
                      }`}
                    >
                      {copied === link.short_url ? "Copied!" : "Copy"}
                    </button>
                    <button
                      onClick={() => setShareFor(shareFor === link.id ? null : link.id)}
                      className="px-3 py-1.5 rounded-xl text-xs text-gray-400 border border-white/10 hover:text-white"
                    >
                      Share
                    </button>
                    <button
                      onClick={() => deactivateLink(link.id)}
                      className="px-3 py-1.5 rounded-xl text-xs text-gray-600 border border-white/8 hover:text-gray-400"
                    >
                      Disable
                    </button>
                  </div>
                )}
              </div>

              {/* Share text panel */}
              {shareFor === link.id && link.is_active && (
                <div className="mt-3 bg-black/30 rounded-xl p-3 border border-white/8">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide font-bold mb-2">Share text</p>
                  <p className="text-xs text-gray-300 whitespace-pre-line">{buildShareText(link)}</p>
                  <button
                    onClick={() => navigator.clipboard.writeText(buildShareText(link)).then(() => { setCopied(link.id); setTimeout(() => setCopied(null), 2000); })}
                    className="mt-2 text-xs text-[#C9A84C] font-bold hover:underline"
                  >
                    {copied === link.id ? "Copied!" : "Copy share text"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Catalog ──────────────────────────────────────────────────────────────

function CatalogTab({ handle }: { handle: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [shareState, setShareState] = useState<Record<string, "idle" | "loading" | "copied">>({});

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/products/mine`, {
          credentials: "include",
        });
        if (res.ok) setProducts(await res.json());
        else setError("Could not load products.");
      } catch {
        setError("Network error.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function shareProduct(product: Product) {
    setShareState(prev => ({ ...prev, [product.id]: "loading" }));
    try {
      let shareUrl = `https://sensedirector.com/mam/${handle}/${product.id}`;
      const res = await fetch(`/api/tracking/links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ destination_path: `/${handle}/${product.id}` }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.short_url) shareUrl = data.short_url;
      }
      const shareText = `Check out ${product.name} on Yes MAM!\n\n${shareUrl}\n\n#YesMAM #Ghana #ShopNow`;
      await navigator.clipboard.writeText(shareText);
      setShareState(prev => ({ ...prev, [product.id]: "copied" }));
      setTimeout(() => setShareState(prev => ({ ...prev, [product.id]: "idle" })), 2500);
    } catch {
      setShareState(prev => ({ ...prev, [product.id]: "idle" }));
    }
  }

  const STATUS_STYLE: Record<string, string> = {
    active: "bg-green-900/40 text-green-400 border-green-500/30",
    inactive: "bg-white/5 text-gray-400 border-white/10",
    out_of_stock: "bg-red-900/30 text-red-400 border-red-500/20",
  };

  const CATEGORY_EMOJI: Record<string, string> = {
    hair: "💆‍♀️", beauty: "💄", fashion: "👗", accessories: "💍",
    skincare: "🧴", wellness: "🌿",
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-black text-white">My Catalog</h2>
        <p className="text-xs text-gray-500 mt-0.5">Products assigned to your store</p>
      </div>

      {loading && (
        <div className="space-y-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-20 bg-[#1A1A1A] rounded-2xl animate-pulse border border-white/8" />
          ))}
        </div>
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {!loading && products.length === 0 && (
        <div className="text-center py-12 bg-[#1A1A1A] rounded-2xl border border-white/8">
          <p className="text-4xl mb-3">🛍️</p>
          <p className="text-gray-400 text-sm">No products yet</p>
          <p className="text-xs text-gray-600 mt-1">Admin adds products to your campaign</p>
        </div>
      )}

      {!loading && products.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {products.filter(p => p.status === "active").length} active · {products.length} total
            </span>
          </div>
          <div className="space-y-3">
            {products.map(p => {
              const pShare = shareState[p.id] || "idle";
              return (
              <div key={p.id} className="bg-[#1A1A1A] rounded-2xl border border-white/8 p-4">
                <div className="flex items-center gap-4">
                  {/* Thumbnail */}
                  <div className="w-14 h-14 rounded-xl bg-[#2A2A2A] flex items-center justify-center shrink-0 overflow-hidden">
                    {p.media_urls && p.media_urls[0] ? (
                      <img src={p.media_urls[0]} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">{CATEGORY_EMOJI[p.category] || "🛍️"}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm leading-tight line-clamp-2">{p.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5 capitalize">{p.category}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="font-bold text-[#C9A84C] text-sm">
                        {p.currency} {Number(p.price).toFixed(2)}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLE[p.status] || STATUS_STYLE.inactive}`}>
                        {p.status === "out_of_stock" ? "Out of stock" : p.status}
                      </span>
                    </div>
                  </div>

                  {/* Stock */}
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-500">Stock</p>
                    <p className={`font-bold text-sm ${p.inventory_count === 0 ? "text-red-400" : p.inventory_count <= 3 ? "text-amber-400" : "text-white"}`}>
                      {p.inventory_count}
                    </p>
                  </div>
                </div>

                {/* Quick share button — only for active products */}
                {p.status === "active" && handle && (
                  <button
                    onClick={() => shareProduct(p)}
                    disabled={pShare === "loading"}
                    className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold border transition-all"
                    style={{
                      borderColor: pShare === "copied" ? "#4ade8066" : "#C9A84C40",
                      color: pShare === "copied" ? "#4ade80" : "#C9A84C",
                      backgroundColor: pShare === "copied" ? "#052e1633" : "#C9A84C0d",
                    }}
                  >
                    {pShare === "loading" ? "⏳ Generating link…" : pShare === "copied" ? "✓ Share text copied!" : "🔗 Share this product"}
                  </button>
                )}
              </div>
            );
            })}
          </div>

          <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/8">
            <p className="text-xs text-gray-600 leading-relaxed">
              Products are managed by MAM admin. To request adding a new product, <a href="https://wa.me/13107763650" target="_blank" rel="noopener noreferrer" className="text-[#C9A84C]">WhatsApp admin</a>.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Tab: Store (template + bio + avatar) ──────────────────────────────────────

function StoreTab({ profile, onProfileUpdate }: {
  profile: InfluencerProfile | null;
  onProfileUpdate: (p: InfluencerProfile) => void;
}) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>(
    (profile?.template_id as TemplateId) || "glow"
  );
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateSaved, setTemplateSaved] = useState(false);

  const [bio, setBio] = useState(profile?.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [momoNumber, setMomoNumber] = useState(profile?.payout_details_ref || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Sync when profile loads
  useEffect(() => {
    if (profile?.template_id) setSelectedTemplate(profile.template_id as TemplateId);
    if (profile?.bio !== undefined) setBio(profile.bio || "");
    if (profile?.avatar_url !== undefined) setAvatarUrl(profile.avatar_url || "");
    if (profile?.payout_details_ref !== undefined) setMomoNumber(profile.payout_details_ref || "");
  }, [profile?.template_id, profile?.bio, profile?.avatar_url, profile?.payout_details_ref]);

  async function saveTemplate() {
    setSavingTemplate(true);
    try {
      const res = await fetch(`/api/influencers/me/template`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ template_id: selectedTemplate }),
      });
      if (res.ok) {
        const updated = await res.json();
        onProfileUpdate(updated);
        setTemplateSaved(true);
        setTimeout(() => setTemplateSaved(false), 3000);
      }
    } catch { /* silent */ } finally {
      setSavingTemplate(false);
    }
  }

  async function saveProfileDetails() {
    setSavingProfile(true);
    setProfileError("");
    try {
      const res = await fetch(`/api/influencers/me/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({
          bio: bio || null,
          avatar_url: avatarUrl || null,
          payout_details_ref: momoNumber || null,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        onProfileUpdate(updated);
        setProfileSaved(true);
        setTimeout(() => setProfileSaved(false), 3000);
      } else {
        setProfileError("Save failed. Try again.");
      }
    } catch {
      setProfileError("Network error.");
    } finally {
      setSavingProfile(false);
    }
  }

  const handle = profile?.handle || "";

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-black text-white">My Store</h2>
        <p className="text-xs text-gray-500 mt-0.5">Customize how customers see you</p>
      </div>

      {/* Store link */}
      {handle && (
        <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/8">
          <p className="text-xs text-gray-500 mb-1.5">Your store link</p>
          <div className="flex items-center gap-2">
            <p className="text-sm text-[#C9A84C] font-mono flex-1 truncate">
              sensedirector.com/mam/{handle}
            </p>
            <button
              onClick={() => navigator.clipboard.writeText(`https://sensedirector.com/mam/${handle}`)}
              className="text-xs bg-[#C9A84C] text-black px-3 py-1.5 rounded-lg font-bold shrink-0"
            >
              Copy
            </button>
          </div>
          <a
            href={`/${handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center mt-3 text-xs text-gray-400 border border-white/10 rounded-xl py-2 hover:border-white/20 transition-colors"
          >
            View your store →
          </a>
        </div>
      )}

      {/* Theme picker */}
      <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-white">Store Theme</p>
            <p className="text-xs text-gray-500 mt-0.5">How your store looks to customers</p>
          </div>
          {handle && (
            <a
              href={`/${handle}?t=${selectedTemplate}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#C9A84C] border border-[#C9A84C]/30 px-3 py-1.5 rounded-lg font-semibold"
            >
              Preview
            </a>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {Object.values(TEMPLATES).map(tmpl => {
            const isSelected = selectedTemplate === tmpl.id;
            const secondDot =
              tmpl.id === "noir" ? "#1A1A1A" :
              tmpl.id === "bloom" ? "#2D6A4F" :
              tmpl.id === "kente" ? "#8B2500" : "#111111";

            return (
              <button
                key={tmpl.id}
                onClick={() => setSelectedTemplate(tmpl.id as TemplateId)}
                className={`relative p-3.5 rounded-2xl border-2 text-left transition-all ${
                  isSelected
                    ? "border-[#C9A84C] bg-[#C9A84C]/8"
                    : "border-white/8 bg-black/20 hover:border-white/20"
                }`}
              >
                {/* Colour swatches */}
                <div className="flex gap-1.5 mb-2.5">
                  <div className="w-5 h-5 rounded-full border border-white/20" style={{ backgroundColor: tmpl.accentHex }} />
                  <div className="w-5 h-5 rounded-full border border-white/20" style={{ backgroundColor: secondDot }} />
                </div>
                <p className="font-bold text-white text-sm">{tmpl.name}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-tight">{tmpl.tagline}</p>
                {isSelected && (
                  <div className="absolute top-2.5 right-2.5 w-5 h-5 bg-[#C9A84C] rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={saveTemplate}
          disabled={savingTemplate}
          className="w-full bg-[#C9A84C] text-black py-3 rounded-xl text-sm font-black disabled:opacity-50 hover:bg-[#E8C97A] transition-colors"
        >
          {savingTemplate ? "Saving…" : templateSaved ? "✓ Theme saved!" : "Save Theme"}
        </button>
      </div>

      {/* Bio + Avatar editing */}
      <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/8 space-y-4">
        <div>
          <p className="text-sm font-bold text-white">Profile Details</p>
          <p className="text-xs text-gray-500 mt-0.5">Shown on your storefront</p>
        </div>

        {/* Avatar URL */}
        <div>
          <label className="text-xs text-gray-400 font-medium block mb-1.5">
            Profile Photo URL
          </label>
          {avatarUrl && (
            <div className="mb-2 flex justify-center">
              <img
                src={avatarUrl}
                alt="Avatar preview"
                className="w-16 h-16 rounded-full object-cover border-2 border-white/10"
                onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
          )}
          <input
            type="url"
            value={avatarUrl}
            onChange={e => setAvatarUrl(e.target.value)}
            placeholder="https://... (paste your photo link)"
            className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#C9A84C]/60 transition-colors"
          />
          <p className="text-[10px] text-gray-600 mt-1">Tip: upload to Imgur or use your TikTok profile photo link</p>
        </div>

        {/* Bio */}
        <div>
          <label className="text-xs text-gray-400 font-medium block mb-1.5">
            Bio <span className="text-gray-600">({bio.length}/200)</span>
          </label>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value.slice(0, 200))}
            rows={3}
            placeholder="Tell customers about yourself and what you sell..."
            className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#C9A84C]/60 transition-colors resize-none"
          />
        </div>

        {/* MoMo / Payout Number */}
        <div>
          <label className="text-xs text-gray-400 font-medium block mb-1.5">
            MoMo / Payout Number
          </label>
          <input
            type="tel"
            value={momoNumber}
            onChange={e => setMomoNumber(e.target.value)}
            placeholder="e.g. 0244123456 (MTN MoMo)"
            className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#C9A84C]/60 transition-colors"
          />
          <p className="text-[10px] text-gray-600 mt-1">Admin sends your earnings to this number when you request a payout</p>
        </div>

        {profileError && <p className="text-red-400 text-xs">{profileError}</p>}

        <button
          onClick={saveProfileDetails}
          disabled={savingProfile}
          className="w-full bg-[#C9A84C] text-black py-3 rounded-xl text-sm font-black disabled:opacity-50 hover:bg-[#E8C97A] transition-colors"
        >
          {savingProfile ? "Saving…" : profileSaved ? "✓ Profile saved!" : "Save Profile"}
        </button>
      </div>

      {/* Account info (read-only) */}
      {profile && (
        <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/8 space-y-3">
          <p className="text-sm font-bold text-white">Account Info</p>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-gray-500 mb-0.5">Handle</p>
              <p className="text-white font-medium">@{profile.handle}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-0.5">Platform</p>
              <p className="text-white font-medium capitalize">{profile.platform_name}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-0.5">Status</p>
              <p className={`font-medium capitalize ${profile.status === "active" ? "text-green-400" : "text-amber-400"}`}>
                {profile.status}
              </p>
            </div>
            <div>
              <p className="text-gray-500 mb-0.5">Payout</p>
              <p className="text-white font-medium">{profile.payout_method || "MoMo"}</p>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            To change your handle or payout details, <a href="https://wa.me/13107763650" target="_blank" rel="noopener noreferrer" className="text-[#C9A84C]">contact admin</a>
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Bottom Nav ────────────────────────────────────────────────────────────────

// ─── Tab: Analytics ────────────────────────────────────────────────────────────

function AnalyticsTab() {
  const [daily, setDaily] = useState<{ date: string; orders: number; gmv_GHS: string }[]>([]);
  const [attribution, setAttribution] = useState<{ source: string; views: number }[]>([]);
  const [linkTotal, setLinkTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const opts = { credentials: "include" as const };
    Promise.all([
      fetch(`/api/analytics/reports/daily/me?days=14`, opts)
        .then(r => r.ok ? r.json() : []),
      fetch(`/api/analytics/reports/attribution/me`, opts)
        .then(r => r.ok ? r.json() : []),
      fetch(`/api/tracking/links`, opts)
        .then(r => r.ok ? r.json() : []),
    ]).then(([d, a, links]) => {
      setDaily(d);
      setAttribution(a);
      const total = (links as { click_count: number }[]).reduce((s, l) => s + (l.click_count || 0), 0);
      setLinkTotal(total);
      setLoading(false);
    });
  }, []);

  const maxOrders = Math.max(...daily.map(d => d.orders), 1);
  const totalOrders = daily.reduce((s, d) => s + d.orders, 0);
  const totalGMV = daily.reduce((s, d) => s + parseFloat(d.gmv_GHS || "0"), 0);
  const totalViews = attribution.reduce((s, a) => s + a.views, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 rounded-full border-2 border-[#C9A84C] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      {/* Summary KPI row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Orders (14d)", value: totalOrders },
          { label: "GMV (14d)", value: `GHS ${totalGMV.toFixed(0)}` },
          { label: "Link Clicks", value: linkTotal },
        ].map(k => (
          <div key={k.label} className="bg-[#1A1A1A] rounded-2xl border border-white/8 p-3 text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{k.label}</p>
            <p className="text-lg font-black text-white">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Orders bar chart (14 days) */}
      <div className="bg-[#1A1A1A] rounded-2xl border border-white/8 p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Orders — Last 14 Days</p>
        {daily.length === 0 ? (
          <p className="text-xs text-gray-600 text-center py-6">No orders in this period yet</p>
        ) : (
          <div className="flex items-end gap-1 h-20">
            {daily.map(d => {
              const pct = Math.max((d.orders / maxOrders) * 100, d.orders > 0 ? 8 : 2);
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-sm transition-all"
                    style={{
                      height: `${pct}%`,
                      backgroundColor: d.orders > 0 ? "#C9A84C" : "#2A2A2A",
                    }}
                    title={`${d.date}: ${d.orders} orders`}
                  />
                  {daily.length <= 7 && (
                    <span className="text-[8px] text-gray-600 rotate-45 origin-left">{d.date.slice(5)}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Traffic sources */}
      <div className="bg-[#1A1A1A] rounded-2xl border border-white/8 p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Traffic Sources {totalViews > 0 ? `(${totalViews} views)` : ""}
        </p>
        {attribution.length === 0 ? (
          <p className="text-xs text-gray-600 text-center py-4">
            No storefront views tracked yet. Share your store link to start seeing data.
          </p>
        ) : (
          <div className="space-y-2">
            {attribution.map(a => {
              const pct = totalViews > 0 ? Math.round((a.views / totalViews) * 100) : 0;
              const sourceIcon: Record<string, string> = {
                tiktok: "🎵", instagram: "📸", direct: "🔗", unknown: "❓", other: "🌐",
              };
              return (
                <div key={a.source} className="flex items-center gap-3">
                  <span className="text-sm w-5">{sourceIcon[a.source] || "🌐"}</span>
                  <span className="text-xs text-gray-300 capitalize w-20">{a.source}</span>
                  <div className="flex-1 bg-[#2A2A2A] rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full bg-[#C9A84C]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-10 text-right">{pct}%</span>
                  <span className="text-xs text-gray-600 w-8 text-right">{a.views}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tip */}
      <div className="bg-[#111] rounded-2xl border border-white/5 p-4">
        <p className="text-xs text-gray-600 leading-relaxed">
          Tip: Use the <span className="text-[#C9A84C]">Links</span> tab to create TikTok tracking links.
          Each link captures clicks so you can see which posts drive the most sales.
        </p>
      </div>
    </div>
  );
}

function BottomNav({ tab, setTab, newOrderCount }: { tab: Tab; setTab: (t: Tab) => void; newOrderCount: number }) {
  const items: { id: Tab; label: string; icon: string }[] = [
    { id: "home", label: "Home", icon: "⬡" },
    { id: "orders", label: "Orders", icon: "📦" },
    { id: "catalog", label: "Catalog", icon: "🛍️" },
    { id: "links", label: "Links", icon: "🔗" },
    { id: "analytics", label: "Stats", icon: "📊" },
    { id: "store", label: "Store", icon: "✦" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-white/10 px-2 pb-safe">
      <div className="max-w-lg mx-auto flex">
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-3 relative transition-colors ${
              tab === item.id ? "text-[#C9A84C]" : "text-gray-600 hover:text-gray-400"
            }`}
          >
            <span className="text-xl leading-none">{item.icon}</span>
            <span className="text-[10px] font-bold tracking-wide uppercase">{item.label}</span>
            {item.id === "orders" && newOrderCount > 0 && (
              <span className="absolute top-2 right-1/4 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-black flex items-center justify-center">
                {newOrderCount > 9 ? "9+" : newOrderCount}
              </span>
            )}
            {tab === item.id && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#C9A84C] rounded-full" />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────────

export default function InfluencerDashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("home");
  const [loading, setLoading] = useState(false);

  const [profile, setProfile] = useState<InfluencerProfile | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [kpi, setKpi] = useState<KPI | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/login?next=${encodeURIComponent("/dashboard")}`);
    }
  }, [user, authLoading, router]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const h = { "Content-Type": "application/json" };
      const opts = { headers: h, credentials: "include" as const };
      const [cRes, kpiRes, ordRes, meRes] = await Promise.all([
        fetch(`/api/commissions/me`, opts),
        fetch(`/api/analytics/reports/kpis/me`, opts),
        fetch(`/api/orders/mine`, opts),
        fetch(`/api/influencers/me`, opts),
      ]);
      if (cRes.ok) setCommissions(await cRes.json());
      if (kpiRes.ok) setKpi(await kpiRes.json());
      if (ordRes.ok) setOrders(await ordRes.json());
      if (meRes.ok) setProfile(await meRes.json());
    } catch { /* silent — partial data is fine */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  // Show spinner while auth loads or redirecting
  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0A0A" }}>
        <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const newOrderCount = orders.filter(o => o.status === "pending").length;

  return (
    <main className="min-h-screen bg-[#0A0A0A] pb-20">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-[#0A0A0A]/90 backdrop-blur border-b border-white/8 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#C9A84C] rounded-lg flex items-center justify-center">
              <span className="text-xs font-black text-black">M</span>
            </div>
            <div>
              <p className="text-white text-sm font-bold leading-none">Creator Hub</p>
              {profile?.handle && (
                <p className="text-gray-500 text-[10px] mt-0.5">@{profile.handle}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {loading && (
              <div className="w-4 h-4 border-2 border-[#C9A84C]/30 border-t-[#C9A84C] rounded-full animate-spin" />
            )}
            {profile?.handle && (
              <a
                href={`/${profile.handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#C9A84C] hover:text-[#E8C97A] font-semibold border border-[#C9A84C]/30 px-2.5 py-1 rounded-lg transition-colors"
              >
                My Store
              </a>
            )}
            <button
              onClick={handleLogout}
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-lg mx-auto px-4 py-6">
        {tab === "home" && <HomeTab kpi={kpi} commissions={commissions} profile={profile} />}
        {tab === "orders" && <OrdersTab orders={orders} />}
        {tab === "catalog" && <CatalogTab handle={profile?.handle ?? ""} />}
        {tab === "analytics" && <AnalyticsTab />}
        {tab === "links" && <LinksTab profile={profile} />}
        {tab === "store" && (
          <StoreTab
            profile={profile}
            onProfileUpdate={setProfile}
          />
        )}
      </div>

      <BottomNav tab={tab} setTab={setTab} newOrderCount={newOrderCount} />
    </main>
  );
}
