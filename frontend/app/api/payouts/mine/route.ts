import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth, AuthedRequest } from "@/lib/auth/middleware";

export const dynamic = "force-dynamic";

async function handler(req: AuthedRequest) {
  const influencer = await prisma.influencer.findFirst({ where: { userId: req.user.id } });
  if (!influencer) return NextResponse.json([]);

  const payouts = await prisma.payout.findMany({
    where: { payeeType: "influencer", payeeId: influencer.id },
    orderBy: { id: "desc" },
  });
  return NextResponse.json(payouts);
}

export const GET = withAuth(handler as any, "influencer");
