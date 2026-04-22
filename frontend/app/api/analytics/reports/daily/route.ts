import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth, AuthedRequest } from "@/lib/auth/middleware";

export const dynamic = "force-dynamic";

async function handler(req: AuthedRequest) {
  const { searchParams } = new URL(req.url);
  const days = Math.min(parseInt(searchParams.get("days") || "14"), 90);
  const since = new Date(Date.now() - days * 86400000);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true, total: true },
  });

  const events = await prisma.analyticsEvent.findMany({
    where: { occurredAt: { gte: since }, eventName: { in: ["storefront.viewed", "link.clicked"] } },
    select: { occurredAt: true, eventName: true },
  });

  // Group by date
  const byDay: Record<string, { date: string; orders: number; gmvGHS: number; storefrontViews: number; linkClicks: number }> = {};
  const dateStr = (d: Date) => d.toISOString().slice(0, 10);

  for (const o of orders) {
    const d = dateStr(o.createdAt);
    if (!byDay[d]) byDay[d] = { date: d, orders: 0, gmvGHS: 0, storefrontViews: 0, linkClicks: 0 };
    byDay[d].orders++;
    byDay[d].gmvGHS += Number(o.total);
  }
  for (const e of events) {
    const d = dateStr(e.occurredAt);
    if (!byDay[d]) byDay[d] = { date: d, orders: 0, gmvGHS: 0, storefrontViews: 0, linkClicks: 0 };
    if (e.eventName === "storefront.viewed") byDay[d].storefrontViews++;
    if (e.eventName === "link.clicked") byDay[d].linkClicks++;
  }

  const result = Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date));
  return NextResponse.json(result);
}

export const GET = withAuth(handler as any, "admin", "operator");
