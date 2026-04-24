import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth, AuthedRequest } from "@/lib/auth/middleware";

export const dynamic = "force-dynamic";

async function handler(req: AuthedRequest) {
  const influencer = await prisma.influencer.findFirst({
    where: { userId: req.user.id },
    include: { user: { select: { name: true, email: true } } },
  });
  if (!influencer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(influencer);
}

export const GET = withAuth(handler as any, "influencer");
