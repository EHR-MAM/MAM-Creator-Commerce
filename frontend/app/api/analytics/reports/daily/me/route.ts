import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth, AuthedRequest } from "@/lib/auth/middleware";

export const dynamic = "force-dynamic";

async function handler(req: AuthedRequest) {
  const { searchParams } = new URL(req.url);
  const days = Math.min(parseInt(searchParams.get("days") || "14"), 90);
  const since = new Date(Date.now() - days * 86400000);

  const influencer = await prisma.influencer.findUnique({ where: { userId: req.user.id } });
  if (!influencer) return NextResponse.json([]);

  const orders = await prisma.order.findMany({
    where: { influencerId: influencer.id, createdAt: { gte: since } },
    select: { createdAt: true, total: true },
  });

  const byDay: Record<string, { date: string; orders: number; gmvGHS: number }> = {};
  for (const o of orders) {
    const d = o.createdAt.toISOString().slice(0, 10);
    if (!byDay[d]) byDay[d] = { date: d, orders: 0, gmvGHS: 0 };
    byDay[d].orders++;
    byDay[d].gmvGHS += Number(o.total);
  }

  return NextResponse.json(Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date)));
}

export const GET = withAuth(handler as any, "influencer");
