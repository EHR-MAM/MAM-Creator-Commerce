// Admin — Payout Management (Sprint XVI)
// Route: /admin/payouts
// Shows pending payout requests; admin marks completed or failed
// HUMAN APPROVAL required before any money moves
"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8200";
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "/mam";

interface Payout {
  id: string;
  payee_id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method?: string;
  external_reference?: string;
  period_end?: string;
  influencer_handle?: string;
  influencer_momo?: string;
}

export default function AdminPayouts() {
  const [token, setToken] = useState("");
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<Record<string, string>>({});
  // Per-payout reference inputs for Mark Completed flow
  const [refInputs, setRefInputs] = useState<Record<string, string>>({});

  // Pick up token from sessionStorage (set by main admin page login)
  useEffect(() => {
    const stored = sessionStorage.getItem("mam_admin_token");
    if (stored) setToken(stored);
  }, []);

  const fetchPayouts = useCallback(async (t: string) => {
    if (!t) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/payouts`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.ok) setPayouts(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (token) fetchPayouts(token);
  }, [token, fetchPayouts]);

  async function updateStatus(payoutId: string, status: string, externalRef?: string) {
    setActionMsg(m => ({ ...m, [payoutId]: "…" }));
    try {
      const body: Record<string, string> = { status };
      if (externalRef?.trim()) body.external_reference = externalRef.trim();
      const res = await fetch(`${API_URL}/payouts/${payoutId}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const label = status === "completed" ? "Marked paid ✓" : status === "processing" ? "Marked processing ✓" : "Marked failed";
        setActionMsg(m => ({ ...m, [payoutId]: label }));
        // Clear reference input after successful action
        setRefInputs(r => { const next = { ...r }; delete next[payoutId]; return next; });
        await fetchPayouts(token);
      } else {
        const err = await res.json();
        setActionMsg(m => ({ ...m, [payoutId]: `Error: ${err.detail || "Failed"}` }));
      }
    } catch {
      setActionMsg(m => ({ ...m, [payoutId]: "Network error" }));
    }
  }

  const pending = payouts.filter(p => p.status === "pending");
  const processing = payouts.filter(p => p.status === "processing");
  const completed = payouts.filter(p => p.status === "completed");
  const failed = payouts.filter(p => p.status === "failed");
  const actionable = [...pending, ...processing]; // shown in the "needs action" list
  const totalPending = actionable.reduce((s, p) => s + Number(p.amount), 0);

  if (!token) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 shadow-sm w-full max-w-sm text-center">
          <p className="text-gray-600 mb-4">Please sign in via the admin dashboard first.</p>
          <Link href={`${BASE}/admin`} className="bg-black text-white px-6 py-3 rounded-xl font-bold text-sm">
            Go to Admin
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-black text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-lg">Payout Management</h1>
          <p className="text-gray-400 text-xs mt-0.5">Yes MAM — Admin</p>
        </div>
        <Link href={`${BASE}/admin`} className="text-[#C9A84C] text-sm font-medium">
          ← Back to Admin
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* Summary */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Pending", value: pending.length, color: "text-amber-600" },
            { label: "Processing", value: processing.length, color: "text-blue-600" },
            { label: "Paid", value: completed.length, color: "text-green-600" },
            { label: "Failed", value: failed.length, color: "text-red-500" },
          ].map(k => (
            <div key={k.label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
              <p className="text-xs text-gray-400 uppercase tracking-wider">{k.label}</p>
              <p className={`text-3xl font-black mt-1 ${k.color}`}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* Pending Approval Banner */}
        {actionable.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="font-semibold text-amber-800 text-sm">
              GHS {totalPending.toFixed(2)} to action across {actionable.length} request{actionable.length > 1 ? "s" : ""}
            </p>
            <p className="text-xs text-amber-700 mt-1">
              1. Transfer the amount to the creator's MoMo number.
              2. Enter the MoMo transaction ID in the reference field.
              3. Click "Mark Paid". If payment fails, click "Mark Failed" — commissions return to the creator.
            </p>
          </div>
        )}

        {/* Actionable payouts (pending + processing) */}
        <div>
          <h2 className="font-bold text-base mb-3">Needs Action ({actionable.length})</h2>
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading…</div>
          ) : actionable.length === 0 ? (
            <div className="text-center py-8 text-gray-400 bg-white rounded-xl border border-gray-100">
              No pending payout requests.
            </div>
          ) : (
            <div className="space-y-3">
              {actionable.map(p => (
                <div key={p.id} className={`bg-white rounded-xl p-4 border shadow-sm ${p.status === "processing" ? "border-blue-200 bg-blue-50/30" : "border-gray-100"}`}>
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-black text-xl">GHS {Number(p.amount).toFixed(2)}</p>
                        {p.influencer_handle && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                            @{p.influencer_handle}
                          </span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          p.status === "processing" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                        }`}>
                          {p.status}
                        </span>
                      </div>
                      {/* MoMo number — prominently shown for admin to transfer */}
                      {p.influencer_momo ? (
                        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2 mb-2">
                          <span className="text-amber-700 text-sm">📱</span>
                          <div>
                            <p className="text-[10px] text-amber-600 font-medium uppercase tracking-wider">Send MoMo to</p>
                            <p className="font-bold text-amber-800 text-sm select-all">{p.influencer_momo}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-red-400 mt-1 mb-2">⚠ No MoMo number saved — ask creator to update profile</p>
                      )}
                      <p className="text-xs text-gray-400">
                        Requested: {p.period_end ? new Date(p.period_end).toLocaleString() : "—"}
                      </p>
                      {/* MoMo transaction reference input */}
                      <div className="mt-3">
                        <label className="text-[10px] text-gray-500 uppercase tracking-wider font-medium block mb-1">
                          MoMo Transaction ID (optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. GHA-2026-123456"
                          value={refInputs[p.id] || ""}
                          onChange={e => setRefInputs(r => ({ ...r, [p.id]: e.target.value }))}
                          className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-black font-mono"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      {p.status === "pending" && (
                        <button
                          onClick={() => updateStatus(p.id, "processing", refInputs[p.id])}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                        >
                          Mark Processing
                        </button>
                      )}
                      <button
                        onClick={() => updateStatus(p.id, "completed", refInputs[p.id])}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                      >
                        Mark Paid ✓
                      </button>
                      <button
                        onClick={() => updateStatus(p.id, "failed")}
                        className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                      >
                        Mark Failed
                      </button>
                    </div>
                  </div>
                  {actionMsg[p.id] && (
                    <p className={`text-xs mt-2 font-medium ${
                      actionMsg[p.id].includes("✓") ? "text-green-600" :
                      actionMsg[p.id].includes("Error") ? "text-red-500" : "text-gray-500"
                    }`}>
                      {actionMsg[p.id]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent completed/failed payouts */}
        {(completed.length > 0 || failed.length > 0) && (
          <div>
            <h2 className="font-bold text-base mb-3">History</h2>
            <div className="space-y-2">
              {[...completed, ...failed]
                .sort((a, b) => (b.period_end || "").localeCompare(a.period_end || ""))
                .slice(0, 15)
                .map(p => (
                <div key={p.id} className="bg-white rounded-xl p-4 border border-gray-100 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-semibold">{p.currency} {Number(p.amount).toFixed(2)}{p.influencer_handle ? ` — @${p.influencer_handle}` : ""}</p>
                    <p className="text-xs text-gray-400 font-mono">{p.id.slice(0, 12)}…</p>
                    <p className="text-xs text-gray-400">
                      {p.period_end ? new Date(p.period_end).toLocaleDateString() : "—"}
                      {p.external_reference ? ` · Ref: ${p.external_reference}` : ""}
                    </p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                    p.status === "completed" ? "bg-green-100 text-green-800" :
                    p.status === "failed" ? "bg-red-100 text-red-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
