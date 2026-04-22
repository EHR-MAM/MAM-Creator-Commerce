import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth, AuthedRequest } from "@/lib/auth/middleware";

export const dynamic = "force-dynamic";

async function list(_req: AuthedRequest, { params }: { params: { id: string } }) {
  const links = await prisma.productCampaignLink.findMany({
    where: { campaignId: params.id, active: true },
    include: { product: true },
    orderBy: { featuredRank: "asc" },
  });
  return NextResponse.json(links.map((l) => l.product));
}

async function add(req: AuthedRequest, { params }: { params: { id: string } }) {
  const { productId, featuredRank } = await req.json();
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });
  const link = await prisma.productCampaignLink.upsert({
    where: { campaignId_productId: { campaignId: params.id, productId } } as any,
    create: { campaignId: params.id, productId, featuredRank: featuredRank ?? 0, active: true },
    update: { active: true, featuredRank: featuredRank ?? 0 },
  });
  return NextResponse.json(link, { status: 201 });
}

export const GET = withAuth(list as any, "admin", "operator");
export const POST = withAuth(add as any, "admin", "operator");
