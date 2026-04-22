import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth, AuthedRequest } from "@/lib/auth/middleware";

export const dynamic = "force-dynamic";

async function handler(_req: AuthedRequest, { params }: { params: { id: string } }) {
  const payout = await prisma.payout.findUnique({
    where: { id: params.id },
    include: { commissions: { select: { id: true, influencerAmount: true, commissionStatus: true } } },
  });
  if (!payout) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(payout);
}

export const GET = withAuth(handler as any, "admin", "operator");
