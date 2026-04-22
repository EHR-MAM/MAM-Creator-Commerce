import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth, AuthedRequest } from "@/lib/auth/middleware";

export const dynamic = "force-dynamic";

async function handler(req: AuthedRequest) {
  try {
    const influencer = await prisma.influencer.findUnique({ where: { userId: req.user.id } });
    if (!influencer) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const payableCommissions = await prisma.commission.findMany({
      where: { influencerId: influencer.id, commissionStatus: "payable" },
    });

    if (!payableCommissions.length) {
      return NextResponse.json({ error: "No payable commissions" }, { status: 400 });
    }

    const amount = payableCommissions.reduce((s, c) => s + Number(c.influencerAmount), 0);

    const payout = await prisma.$transaction(async (tx) => {
      const p = await tx.payout.create({
        data: {
          payeeType: "influencer",
          payeeId: influencer.id,
          amount,
          currency: "GHS",
          status: "pending",
          paymentMethod: influencer.payoutMethod || "mtn_momo",
        },
      });
      await tx.commission.updateMany({
        where: { id: { in: payableCommissions.map((c) => c.id) } },
        data: { commissionStatus: "paid", payoutBatchId: p.id },
      });
      return p;
    });

    return NextResponse.json(payout, { status: 201 });
  } catch (err) {
    console.error("[POST /api/payouts/request]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const POST = withAuth(handler as any, "influencer");
