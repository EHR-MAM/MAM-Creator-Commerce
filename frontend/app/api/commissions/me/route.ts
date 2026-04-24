import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth, AuthedRequest } from "@/lib/auth/middleware";

export const dynamic = "force-dynamic";

async function handler(req: AuthedRequest) {
  const influencer = await prisma.influencer.findFirst({ where: { userId: req.user.id } });
  if (!influencer) return NextResponse.json([]);

  const commissions = await prisma.commission.findMany({
    where: { order: { influencerId: influencer.id } },
    orderBy: { calculatedAt: "desc" },
    include: { order: { select: { customerName: true, total: true, createdAt: true, status: true } } },
  });
  return NextResponse.json(commissions);
}

export const GET = withAuth(handler as any, "influencer");
