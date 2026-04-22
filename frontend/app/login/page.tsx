"use client";
// MAM Login Page — Sprint III
// Route: /login  (after Sprint II migration: /login at root)

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

function LoginForm() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      const dest = next || (
        user.role === "admin" || user.role === "operator" ? `${BASE}/admin` :
        user.role === "vendor" ? `${BASE}/vendor` :
        `${BASE}/dashboard`
      );
      router.replace(dest);
    }
  }, [user, loading, next, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const result = await login(email, password);
    if (!result.ok) {
      setError(result.error || "Login failed");
      setSubmitting(false);
      return;
    }
    // Redirect based on role — useEffect above will fire
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0A0A" }}>
        <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0A0A0A" }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-3xl font-black tracking-tight" style={{ color: "#C9A84C" }}>
            Yes MAM
          </span>
          <p className="text-gray-400 text-sm mt-1">Africa&apos;s Creator Commerce Platform</p>
        </div>

        <div className="rounded-2xl border border-gray-800 p-8" style={{ background: "#111" }}>
          <h1 className="text-xl font-bold text-white mb-6">Sign in</h1>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-900/40 border border-red-700 text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none focus:ring-2 focus:ring-yellow-500"
                style={{ background: "#1a1a1a", border: "1px solid #333" }}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none focus:ring-2 focus:ring-yellow-500"
                style={{ background: "#1a1a1a", border: "1px solid #333" }}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
              style={{ background: "#C9A84C", color: "#0A0A0A" }}
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="text-center text-gray-500 text-xs mt-6">
            Want to join as a creator?{" "}
            <a href={`${BASE}/join`} className="text-yellow-400 hover:underline">
              Apply here
            </a>
          </p>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          &copy; {new Date().getFullYear()} Yes MAM
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
