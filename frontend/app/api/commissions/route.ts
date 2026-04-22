import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth, AuthedRequest } from "@/lib/auth/middleware";

export const dynamic = "force-dynamic";

async function handler(req: AuthedRequest) {
  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status");
  const where = statusFilter ? { commissionStatus: statusFilter as any } : {};

  const commissions = await prisma.commission.findMany({
    where,
    orderBy: { calculatedAt: "desc" },
    take: 200,
    include: {
      influencer: { select: { handle: true } },
      order: { select: { customerName: true, total: true, createdAt: true } },
    },
  });
  return NextResponse.json(commissions);
}

export const GET = withAuth(handler as any, "admin", "operator");
