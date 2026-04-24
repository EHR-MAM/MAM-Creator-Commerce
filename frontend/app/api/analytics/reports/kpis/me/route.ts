import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth, AuthedRequest } from "@/lib/auth/middleware";

export const dynamic = "force-dynamic";

async function handler(req: AuthedRequest) {
  const influencer = await prisma.influencer.findFirst({ where: { userId: req.user.id } });
  if (!influencer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [totalOrders, deliveredOrders, earningsResult, pendingResult, paidResult] = await Promise.all([
    prisma.order.count({ where: { influencerId: influencer.id } }),
    prisma.order.count({ where: { influencerId: influencer.id, status: "delivered" } }),
    prisma.commission.aggregate({
      _sum: { influencerAmount: true },
      where: { order: { influencerId: influencer.id }, commissionStatus: { in: ["payable", "paid"] } },
    }),
    prisma.commission.aggregate({
      _sum: { influencerAmount: true },
      where: { order: { influencerId: influencer.id }, commissionStatus: "payable" },
    }),
    prisma.commission.aggregate({
      _sum: { influencerAmount: true },
      where: { order: { influencerId: influencer.id }, commissionStatus: "paid" },
    }),
  ]);

  return NextResponse.json({
    totalOrders,
    deliveredOrders,
    totalInfluencerEarnings: Number(earningsResult._sum.influencerAmount || 0),
    pendingCommission: Number(pendingResult._sum.influencerAmount || 0),
    paidOut: Number(paidResult._sum.influencerAmount || 0),
    currency: "GHS",
  });
}

export const GET = withAuth(handler as any, "influencer");
