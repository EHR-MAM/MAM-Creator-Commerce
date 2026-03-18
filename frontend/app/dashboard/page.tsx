// Influencer (Creator) Dashboard — earnings + commission summary (FE-11)
// Route: /dashboard
// Christiana logs in here to see her commissions, order counts, and payout history
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Commission {
  id: string;
  order_id: string;
  influencer_amount: number;
  currency: string;
  commission_status: string;
  calculated_at: string;
}

interface KPI {
  total_orders: number;
  delivered_orders: number;
  total_influencer_earnings: number;
  pending_commission: number;
  paid_out: number;
  currency: string;
}

export default function InfluencerDashboard() {
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [kpi, setKpi] = useState<KPI | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: (e.target as any).email.value, password: (e.target as any).password.value }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setToken(data.access_token);
      setAuthed(true);
    } catch {
      setError("Login failed. Check your email and password.");
    }
  }

  async function fetchData() {
    setLoading(true);
    try {
      const [cRes, kpiRes] = await Promise.all([
        fetch(`${API_URL}/commissions/me`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/reports/kpis/me`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (cRes.ok) setCommissions(await cRes.json());
      if (kpiRes.ok) setKpi(await kpiRes.json());
    } catch {
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (authed) fetchData(); }, [authed]);

  if (!authed) {
    return (
      <main className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 shadow-sm w-full max-w-sm">
          {/* Book banner */}
          <div className="bg-[#C9A84C] rounded-lg p-3 mb-6 flex items-center gap-2">
            <span className="text-xl">🐎</span>
            <div>
              <p className="text-xs font-bold text-black">MAM — Micro-Affiliate Marketing</p>
              <p className="text-xs text-black opacity-70">Creator Dashboard</p>
            </div>
          </div>
          <h1 className="text-xl font-bold mb-1">Creator Login</h1>
          <p className="text-sm text-gray-500 mb-6">Track your earnings and orders</p>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <form onSubmit={login} className="space-y-4">
            <input name="email" type="email" required placeholder="Your email"
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

  const pending = commissions.filter(c => c.commission_status === "pending");
  const paid = commissions.filter(c => c.commission_status === "paid");

  return (
    <main className="min-h-screen bg-[#FAF7F2]">
      {/* Header */}
      <div className="bg-black text-white px-4 py-5">
        <div className="max-w-lg mx-auto">
          <div>
            <p className="text-[#C9A84C] text-xs font-medium tracking-widest uppercase">Creator Dashboard</p>
            <h1 className="text-xl font-bold mt-1">Your Earnings</h1>
            <p className="text-gray-400 text-xs mt-0.5">MAM — Micro-Affiliate Marketing</p>
          </div>
          <Link href="/dashboard/links"
            className="text-[#C9A84C] text-sm font-medium border border-[#C9A84C]/40 px-3 py-1.5 rounded-lg hover:bg-[#C9A84C]/10 transition-colors">
            🔗 Links
          </Link>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

        {/* KPI cards */}
        {kpi ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <p className="text-xs text-gray-400 uppercase tracking-wide">Total Orders</p>
              <p className="text-2xl font-bold mt-1">{kpi.total_orders}</p>
              <p className="text-xs text-gray-400">{kpi.delivered_orders} delivered</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <p className="text-xs text-gray-400 uppercase tracking-wide">Total Earned</p>
              <p className="text-2xl font-bold mt-1">GHS {Number(kpi.total_influencer_earnings).toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <p className="text-xs text-gray-400 uppercase tracking-wide">Pending Payout</p>
              <p className="text-2xl font-bold mt-1 text-yellow-600">GHS {Number(kpi.pending_commission).toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <p className="text-xs text-gray-400 uppercase tracking-wide">Paid Out</p>
              <p className="text-2xl font-bold mt-1 text-green-600">GHS {Number(kpi.paid_out).toFixed(2)}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {[0,1,2,3].map(i => (
              <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 h-20 animate-pulse" />
            ))}
          </div>
        )}

        {/* Commission history */}
        <div>
          <h2 className="font-bold text-base mb-3">Commission History</h2>

          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading…</div>
          ) : commissions.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-xl border border-gray-100">
              <p className="text-gray-500">No commissions yet.</p>
              <p className="text-sm text-gray-400 mt-1">Commissions appear when orders are delivered.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {commissions.map(c => (
                <div key={c.id} className="bg-white rounded-xl p-4 border border-gray-100 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-mono text-gray-400">Order #{c.order_id.slice(0, 8)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(c.calculated_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">GHS {Number(c.influencer_amount).toFixed(2)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      c.commission_status === "paid" ? "bg-green-100 text-green-800" :
                      c.commission_status === "pending" ? "bg-yellow-100 text-yellow-800" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {c.commission_status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payout info */}
        <div className="bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-xl p-4">
          <p className="text-sm font-semibold">Payout via MoMo</p>
          <p className="text-xs text-gray-600 mt-1">
            Commissions are paid to your MoMo number after order delivery is confirmed.
            Payouts are processed weekly. Contact admin for any queries.
          </p>
        </div>

      </div>
    </main>
  );
}
