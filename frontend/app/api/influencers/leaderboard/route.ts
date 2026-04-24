import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const limit = 20;

  // Tier 1: influencers with earnings (via orders -> commissions)
  const withEarnings = await prisma.influencer.findMany({
    where: {
      status: "active",
      orders: { some: { commission: { commissionStatus: { in: ["payable", "paid"] } } } },
    },
    include: {
      orders: {
        include: {
          commission: { select: { influencerAmount: true, commissionStatus: true } },
        },
      },
      _count: { select: { orders: true } },
    },
    take: limit,
  });

  const tier1 = withEarnings
    .map((inf) => ({
      id: inf.id,
      handle: inf.handle,
      platformName: inf.platformName,
      avatarUrl: inf.avatarUrl,
      bio: inf.bio,
      templateId: inf.templateId,
      totalEarned: inf.orders.reduce((s, o) => {
        if (o.commission && ["payable", "paid"].includes(o.commission.commissionStatus)) {
          return s + Number(o.commission.influencerAmount);
        }
        return s;
      }, 0),
      ordersCount: inf._count.orders,
    }))
    .sort((a, b) => b.totalEarned - a.totalEarned);

  const remaining = limit - tier1.length;
  const tier1Ids = tier1.map((i) => i.id);

  // Tier 2: active influencers with assigned products but no earnings
  const tier2Raw = remaining > 0
    ? await prisma.influencer.findMany({
        where: {
          status: "active",
          id: { notIn: tier1Ids },
          campaigns: { some: { status: "active", productLinks: { some: { active: true } } } },
        },
        take: remaining,
      })
    : [];

  const tier2 = tier2Raw.map((inf) => ({
    id: inf.id,
    handle: inf.handle,
    platformName: inf.platformName,
    avatarUrl: inf.avatarUrl,
    bio: inf.bio,
    templateId: inf.templateId,
    totalEarned: 0,
    ordersCount: 0,
  }));

  return NextResponse.json([...tier1, ...tier2]);
}
