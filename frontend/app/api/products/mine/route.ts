import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth, AuthedRequest } from "@/lib/auth/middleware";

export const dynamic = "force-dynamic";

async function handler(req: AuthedRequest) {
  if (req.user.role === "vendor") {
    const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.id } });
    if (!vendor) return NextResponse.json([]);
    const products = await prisma.product.findMany({ where: { vendorId: vendor.id } });
    return NextResponse.json(products);
  }
  if (req.user.role === "influencer") {
    const influencer = await prisma.influencer.findUnique({ where: { userId: req.user.id } });
    if (!influencer) return NextResponse.json([]);
    const products = await prisma.product.findMany({
      where: {
        campaignLinks: {
          some: { active: true, campaign: { influencerId: influencer.id, status: "active" } },
        },
      },
    });
    return NextResponse.json(products);
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export const GET = withAuth(handler as any, "vendor", "influencer", "admin", "operator");
