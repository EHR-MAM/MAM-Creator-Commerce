import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth, AuthedRequest } from "@/lib/auth/middleware";

export const dynamic = "force-dynamic";

async function handler(req: AuthedRequest) {
  let where: Record<string, any> = {};

  if (req.user.role === "influencer") {
    const influencer = await prisma.influencer.findUnique({ where: { userId: req.user.id } });
    if (!influencer) return NextResponse.json([]);
    where = { influencerId: influencer.id };
  } else if (req.user.role === "vendor") {
    const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.id } });
    if (!vendor) return NextResponse.json([]);
    where = { vendorId: vendor.id };
  } else {
    where = { customerId: req.user.id };
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { items: { include: { product: { select: { name: true } } } } },
  });
  return NextResponse.json(orders);
}

export const GET = withAuth(handler as any);
