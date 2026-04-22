import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth, AuthedRequest } from "@/lib/auth/middleware";

export const dynamic = "force-dynamic";

async function handler(_req: AuthedRequest) {
  const payouts = await prisma.payout.findMany({
    orderBy: { id: "desc" },
    include: { commissions: { select: { influencerId: true, influencer: { select: { handle: true, payoutDetailsRef: true } } }, take: 1 } },
  });
  return NextResponse.json(payouts);
}

export const GET = withAuth(handler as any, "admin", "operator");
