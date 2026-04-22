import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth, AuthedRequest } from "@/lib/auth/middleware";

export const dynamic = "force-dynamic";

async function list(_req: AuthedRequest) {
  const campaigns = await prisma.campaign.findMany({
    include: { influencer: { select: { handle: true } }, _count: { select: { productLinks: true } } },
    orderBy: { status: "asc" },
  });
  return NextResponse.json(campaigns);
}

async function create(req: AuthedRequest) {
  try {
    const { influencerId, name, startAt, endAt, status } = await req.json();
    if (!influencerId || !name) return NextResponse.json({ error: "influencerId and name required" }, { status: 400 });
    const campaign = await prisma.campaign.create({
      data: { influencerId, name, startAt, endAt, status: status || "draft" },
    });
    return NextResponse.json(campaign, { status: 201 });
  } catch (err) {
    console.error("[POST /api/campaigns]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const GET = withAuth(list as any, "admin", "operator");
export const POST = withAuth(create as any, "admin", "operator");
