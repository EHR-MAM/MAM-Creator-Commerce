// Admin — Payout Readiness Dashboard (FE-10)
// Route: /admin/payouts
// Shows commissions ready for payout, runs payout batch (creates pending records only)
// HUMAN APPROVAL required before any money moves
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Commission {
  id: string;
  influencer_id: string;
  influencer_handle?: string;
  order_id: string;
  creator_amount: number;
  platform_amount: number;
  currency: string;
  commission_status: string;
  created_at: string;
}

interface Payout {
  id: string;
  influencer_id: string;
  amount: number;
  currency: string;
  status: string;
  payout_method: string;
  created_at: string;
  approved_at?: string;
  notes?: string;
}

export default function AdminPayouts() {
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [runningPayout, setRunningPayout] = useState(false);
  const [payoutMsg, setPayoutMsg] = useState("");

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
      setError("Login failed.");
    }
  }

  async function fetchData() {
    setLoading(true);
    try {
      const [cRes, pRes] = await Promise.all([
        fetch(`${API_URL}/commissions?status=pending`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/payouts`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setCommissions(cRes.ok ? await cRes.json() : []);
      setPayouts(pRes.ok ? await pRes.json() : []);
    } catch {
      setError("Failed to load payout data.");
    } finally {
      setLoading(false);
    }
  }

  async function runPayoutBatch() {
    setRunningPayout(true);
    setPayoutMsg("");
    try {
      const res = await fetch(`${API_URL}/payouts/run`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPayoutMsg(`Payout batch created — ${data.created} pending records. Requires human approval before processing.`);
      await fetchData();
    } catch {
      setPayoutMsg("Failed to run payout batch.");
    } finally {
      setRunningPayout(false);
    }
  }

  useEffect(() => { if (authed) fetchData(); }, [authed]);

  const totalPending = commissions.reduce((sum, c) => sum + Number(c.creator_amount), 0);

  if (!authed) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 shadow-sm w-full max-w-sm">
          <h1 className="text-xl font-bold mb-1">Admin Login</h1>
          <p className="text-sm text-gray-500 mb-6">EHR Creator Commerce Platform</p>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <form onSubmit={login} className="space-y-4">
            <input name="email" type="email" required placeholder="Email"
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

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-black text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-lg">Admin — Payout Readiness</h1>
          <p className="text-gray-400 text-xs mt-0.5">EHR Creator Commerce Platform</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin" className="text-[#C9A84C] text-sm font-medium">Orders</Link>
          <Link href="/dashboard" className="text-gray-300 text-sm">Creator</Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* Pending commissions summary */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <h2 className="font-bold text-base mb-1">Commissions Awaiting Payout</h2>
          <p className="text-3xl font-bold mt-2">GHS {totalPending.toFixed(2)}</p>
          <p className="text-sm text-gray-500 mt-1">{commissions.length} commission records</p>

          {/* Payout action — HUMAN GATE clearly labeled */}
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-amber-800">Human Approval Required</p>
            <p className="text-xs text-amber-700 mt-1">
              Running the payout batch creates <strong>pending</strong> payout records only.
              No money moves until each payout is manually approved in your payout provider dashboard.
            </p>
            <button
              onClick={runPayoutBatch}
              disabled={runningPayout || commissions.length === 0}
              className="mt-3 px-4 py-2 bg-amber-600 text-white text-sm rounded-lg font-bold disabled:opacity-50"
            >
              {runningPayout ? "Running…" : "Create Payout Batch (Pending)"}
            </button>
            {payoutMsg && <p className="text-xs mt-2 text-amber-800">{payoutMsg}</p>}
          </div>
        </div>

        {/* Commission list */}
        <div>
          <h2 className="font-bold text-base mb-3">Pending Commissions</h2>
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading…</div>
          ) : commissions.length === 0 ? (
            <div className="text-center py-8 text-gray-400 bg-white rounded-xl border border-gray-100">
              No pending commissions.
            </div>
          ) : (
            <div className="space-y-2">
              {commissions.map(c => (
                <div key={c.id} className="bg-white rounded-xl p-4 border border-gray-100 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-mono text-gray-400">Order #{c.order_id.slice(0, 8)}</p>
                    <p className="text-sm font-medium mt-0.5">Creator: {c.currency} {Number(c.creator_amount).toFixed(2)}</p>
                    <p className="text-xs text-gray-400">Platform: {c.currency} {Number(c.platform_amount).toFixed(2)}</p>
                    <p className="text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full font-medium">
                    {c.commission_status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent payouts */}
        <div>
          <h2 className="font-bold text-base mb-3">Recent Payouts</h2>
          {payouts.length === 0 ? (
            <div className="text-center py-8 text-gray-400 bg-white rounded-xl border border-gray-100">
              No payouts yet.
            </div>
          ) : (
            <div className="space-y-2">
              {payouts.slice(0, 10).map(p => (
                <div key={p.id} className="bg-white rounded-xl p-4 border border-gray-100 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">{p.currency} {Number(p.amount).toFixed(2)}</p>
                    <p className="text-xs text-gray-400">{p.payout_method} · {new Date(p.created_at).toLocaleDateString()}</p>
                    {p.notes && <p className="text-xs text-gray-500 mt-0.5">{p.notes}</p>}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    p.status === "completed" ? "bg-green-100 text-green-800" :
                    p.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
