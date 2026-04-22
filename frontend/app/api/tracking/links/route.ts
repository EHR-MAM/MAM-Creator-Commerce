import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth, AuthedRequest } from "@/lib/auth/middleware";

export const dynamic = "force-dynamic";

function randomCode(len = 8): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

async function createLink(req: AuthedRequest) {
  try {
    const influencer = await prisma.influencer.findUnique({ where: { userId: req.user.id } });
    if (!influencer) return NextResponse.json({ error: "Influencer not found" }, { status: 404 });

    const { label, destinationPath, campaignId, expiresAt } = await req.json();

    let code: string;
    let attempts = 0;
    do {
      code = randomCode(8);
      attempts++;
      if (attempts > 10) return NextResponse.json({ error: "Could not generate unique code" }, { status: 500 });
    } while (await prisma.trackingLink.findUnique({ where: { code } }));

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://yesmam.shop";
    const link = await prisma.trackingLink.create({
      data: {
        code,
        influencerId: influencer.id,
        campaignId: campaignId || null,
        label: label || null,
        destinationPath: destinationPath || `/${influencer.handle}`,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    return NextResponse.json({ ...link, shortUrl: `${baseUrl}/api/tracking/r/${code}` }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/tracking/links]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function listLinks(req: AuthedRequest) {
  const influencer = await prisma.influencer.findUnique({ where: { userId: req.user.id } });
  if (!influencer) return NextResponse.json([]);
  const links = await prisma.trackingLink.findMany({
    where: { influencerId: influencer.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(links);
}

export const POST = withAuth(createLink as any, "influencer");
export const GET = withAuth(listLinks as any, "influencer");
