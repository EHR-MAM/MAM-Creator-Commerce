"use client";
// withAuth — route guard HOC for MAM protected pages (Sprint III)
// Usage: export default withAuth(MyPage, { roles: ["admin"] })

import { useEffect, ComponentType } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "/mam";

interface WithAuthOptions {
  // If provided, only these roles can access the page. Others are redirected.
  roles?: string[];
}

export function withAuth<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: WithAuthOptions = {}
) {
  return function AuthGuarded(props: P) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
      if (loading) return;

      if (!user) {
        // Not logged in — redirect to login with return path
        router.replace(`${BASE}/login?next=${encodeURIComponent(pathname)}`);
        return;
      }

      if (options.roles && !options.roles.includes(user.role)) {
        // Wrong role — redirect to appropriate dashboard
        if (user.role === "admin" || user.role === "operator") {
          router.replace(`${BASE}/admin`);
        } else {
          router.replace(`${BASE}/dashboard`);
        }
      }
    }, [user, loading, router, pathname]);

    // Show spinner while checking auth
    if (loading || !user) {
      return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0A0A" }}>
          <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    // Role check failed — show nothing while redirect fires
    if (options.roles && !options.roles.includes(user.role)) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}
