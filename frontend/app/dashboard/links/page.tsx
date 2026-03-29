// Redirect /dashboard/links → /dashboard
// The links tab is now part of the unified Creator Hub dashboard (Sprint C)
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LinksRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/dashboard"); }, [router]);
  return null;
}
