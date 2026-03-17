// Creator Link Generator — /dashboard/links
// Christiana generates TikTok attribution links here.
// Each link tracks clicks and routes through the backend redirect so we
// know exactly which TikTok post drove each storefront visit.
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

export default function LinkGenerator() {
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [links, setLinks] = useState<TrackingLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  // New link form
  const [label, setLabel] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: (e.target as any).email.value,
          password: (e.target as any).password.value,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setToken(data.access_token);
      setAuthed(true);
    } catch {
      setError("Login failed. Check credentials.");
    }
  }

  async function fetchLinks() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/tracking/links`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setLinks(await res.json());
    } catch {
      setError("Failed to load links.");
    } finally {
      setLoading(false);
    }
  }

  async function createLink(e: React.FormEvent) {
    e.preventDefault();
    setCreateError("");
    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/tracking/links`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ label: label || undefined }),
      });
      if (!res.ok) throw new Error();
      setLabel("");
      await fetchLinks();
    } catch {
      setCreateError("Failed to create link. Try again.");
    } finally {
      setCreating(false);
    }
  }

  async function deactivateLink(id: string) {
    try {
      await fetch(`${API_URL}/tracking/links/${id}/deactivate`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchLinks();
    } catch {
      setError("Failed to deactivate link.");
    }
  }

  function copyLink(url: string) {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(url);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  useEffect(() => {
    if (authed) fetchLinks();
  }, [authed]);

  if (!authed) {
    return (
      <main className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 shadow-sm w-full max-w-sm">
          <div className="bg-[#C9A84C] rounded-lg p-3 mb-6 flex items-center gap-2">
            <span className="text-xl">🔗</span>
            <div>
              <p className="text-xs font-bold text-black">Link Generator</p>
              <p className="text-xs text-black opacity-70">TikTok Attribution</p>
            </div>
          </div>
          <h1 className="text-xl font-bold mb-1">Creator Login</h1>
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
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

  return (
    <main className="min-h-screen bg-[#FAF7F2]">
      {/* Header */}
      <div className="bg-black text-white px-4 py-5">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <p className="text-[#C9A84C] text-xs font-medium tracking-widest uppercase">Attribution Links</p>
            <h1 className="text-xl font-bold mt-1">TikTok Link Generator</h1>
          </div>
          <Link href="/dashboard" className="text-gray-400 text-sm">← Dashboard</Link>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">

        {/* How it works */}
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm font-semibold mb-2">How it works</p>
          <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
            <li>Create a link for each TikTok post or product you promote</li>
            <li>Copy the short link and put it in your TikTok bio / caption</li>
            <li>Every click is tracked — you can see which posts drive the most sales</li>
            <li>The link sends viewers to your storefront automatically</li>
          </ol>
        </div>

        {/* Create new link */}
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <h2 className="font-bold text-sm mb-3">Create New Link</h2>
          {createError && <p className="text-red-500 text-xs mb-3">{createError}</p>}
          <form onSubmit={createLink} className="flex gap-2">
            <input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="Label (e.g. TikTok post Mar 15)"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
            />
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2.5 bg-black text-white rounded-lg text-sm font-bold disabled:opacity-50 shrink-0"
            >
              {creating ? "…" : "+ Create"}
            </button>
          </form>
        </div>

        {/* Links list */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm">Your Links</h2>
            <span className="text-xs text-gray-400">{links.filter(l => l.is_active).length} active</span>
          </div>

          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

          {loading ? (
            <div className="text-center py-8 text-gray-400 text-sm">Loading…</div>
          ) : links.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-xl border border-gray-100">
              <p className="text-2xl mb-2">🔗</p>
              <p className="text-gray-500 text-sm">No links yet.</p>
              <p className="text-xs text-gray-400 mt-1">Create your first link above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {links.map(link => (
                <div
                  key={link.id}
                  className={`bg-white rounded-xl p-4 border ${link.is_active ? "border-gray-100" : "border-gray-200 opacity-60"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{link.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5 font-mono truncate">{link.short_url}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-gray-500">
                          <span className="font-bold text-black">{link.click_count}</span> clicks
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(link.created_at).toLocaleDateString()}
                        </span>
                        {!link.is_active && (
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">inactive</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      {link.is_active && (
                        <>
                          <button
                            onClick={() => copyLink(link.short_url)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                              copied === link.short_url
                                ? "bg-green-100 text-green-700"
                                : "bg-black text-white"
                            }`}
                          >
                            {copied === link.short_url ? "Copied!" : "Copy"}
                          </button>
                          <button
                            onClick={() => deactivateLink(link.id)}
                            className="px-3 py-1.5 rounded-lg text-xs text-gray-500 border border-gray-200 hover:bg-gray-50"
                          >
                            Disable
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats summary */}
        {links.length > 0 && (
          <div className="bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-xl p-4">
            <p className="text-sm font-semibold">Total Clicks</p>
            <p className="text-2xl font-bold mt-1">
              {links.reduce((sum, l) => sum + l.click_count, 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Across {links.length} link{links.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}

      </div>
    </main>
  );
}
