import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth, AuthedRequest } from "@/lib/auth/middleware";

export const dynamic = "force-dynamic";

async function handler(req: AuthedRequest, { params }: { params: { id: string } }) {
  const link = await prisma.trackingLink.findUnique({ where: { id: params.id } });
  if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (req.user.role === "influencer") {
    const influencer = await prisma.influencer.findUnique({ where: { userId: req.user.id } });
    if (!influencer || influencer.id !== link.influencerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  await prisma.trackingLink.update({ where: { id: params.id }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}

export const PATCH = withAuth(handler as any, "influencer", "admin", "operator");
