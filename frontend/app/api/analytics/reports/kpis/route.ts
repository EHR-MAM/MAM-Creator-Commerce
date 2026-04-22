import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth, AuthedRequest } from "@/lib/auth/middleware";

export const dynamic = "force-dynamic";

async function handler(_req: AuthedRequest) {
  const [totalOrders, deliveredOrders, gmvResult, commissionsResult] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: "delivered" } }),
    prisma.order.aggregate({ _sum: { total: true }, where: { status: "delivered" } }),
    prisma.commission.aggregate({
      _sum: { influencerAmount: true },
      where: { commissionStatus: { in: ["payable", "paid"] } },
    }),
  ]);

  const totalGmv = Number(gmvResult._sum.total || 0);
  const payableCommissions = Number(commissionsResult._sum.influencerAmount || 0);
  const deliveryRate = totalOrders > 0 ? ((deliveredOrders / totalOrders) * 100).toFixed(1) : "0.0";

  return NextResponse.json({
    totalOrders,
    deliveredOrders,
    totalGmvGHS: totalGmv,
    payableCreatorCommissionsGHS: payableCommissions,
    deliverySuccessRate: `${deliveryRate}%`,
  });
}

export const GET = withAuth(handler as any, "admin", "operator");
