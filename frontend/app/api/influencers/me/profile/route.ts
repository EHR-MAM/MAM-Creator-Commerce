import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth, AuthedRequest } from "@/lib/auth/middleware";

export const dynamic = "force-dynamic";

async function handler(req: AuthedRequest) {
  const { bio, avatarUrl } = await req.json();
  const influencer = await prisma.influencer.findUnique({ where: { userId: req.user.id } });
  if (!influencer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const updated = await prisma.influencer.update({
    where: { id: influencer.id },
    data: { bio, avatarUrl },
  });
  return NextResponse.json(updated);
}

export const PATCH = withAuth(handler as any, "influencer");
