"use client";
// AuthContext — JWT auth state for MAM platform (Sprint III)
// Stores tokens in localStorage. Provides useAuth() hook for all protected pages.

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8200";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "operator" | "influencer" | "vendor";
  status: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  register: (data: RegisterData) => Promise<{ ok: boolean; error?: string }>;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: string;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load token from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("mam_token");
    if (stored) {
      setToken(stored);
      fetchMe(stored);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchMe = useCallback(async (t: string) => {
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setToken(t);
      } else {
        // Token invalid/expired — clear
        localStorage.removeItem("mam_token");
        localStorage.removeItem("mam_refresh_token");
        setToken(null);
        setUser(null);
      }
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { ok: false, error: err.detail || "Login failed" };
      }
      const data = await res.json();
      localStorage.setItem("mam_token", data.access_token);
      localStorage.setItem("mam_refresh_token", data.refresh_token);
      setToken(data.access_token);
      await fetchMe(data.access_token);
      return { ok: true };
    } catch {
      return { ok: false, error: "Network error — please try again" };
    }
  }, [fetchMe]);

  const logout = useCallback(() => {
    const refresh = localStorage.getItem("mam_refresh_token");
    if (refresh) {
      fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refresh }),
      }).catch(() => {});
    }
    localStorage.removeItem("mam_token");
    localStorage.removeItem("mam_refresh_token");
    setToken(null);
    setUser(null);
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, role: data.role || "influencer" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { ok: false, error: err.detail || "Registration failed" };
      }
      return { ok: true };
    } catch {
      return { ok: false, error: "Network error — please try again" };
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
