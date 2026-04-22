import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth, AuthedRequest } from "@/lib/auth/middleware";

export const dynamic = "force-dynamic";

async function handler(req: AuthedRequest, { params }: { params: { id: string } }) {
  try {
    const { status } = await req.json();
    const payout = await prisma.payout.findUnique({
      where: { id: params.id },
      include: { commissions: true },
    });
    if (!payout) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.payout.update({ where: { id: params.id }, data: { status } });
      // If payout failed, reverse commissions back to payable
      if (status === "failed") {
        await tx.commission.updateMany({
          where: { payoutBatchId: params.id },
          data: { commissionStatus: "payable", payoutBatchId: null },
        });
      }
      return p;
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /api/payouts/:id/status]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const PATCH = withAuth(handler as any, "admin", "operator");
