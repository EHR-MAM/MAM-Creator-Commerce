import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth, AuthedRequest } from "@/lib/auth/middleware";

export const dynamic = "force-dynamic";

const VALID_TEMPLATES = ["glow", "kente", "noir", "bloom"];

async function handler(req: AuthedRequest) {
  const { templateId } = await req.json();
  if (!VALID_TEMPLATES.includes(templateId)) {
    return NextResponse.json({ error: `templateId must be one of: ${VALID_TEMPLATES.join(", ")}` }, { status: 400 });
  }
  const influencer = await prisma.influencer.findUnique({ where: { userId: req.user.id } });
  if (!influencer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const updated = await prisma.influencer.update({ where: { id: influencer.id }, data: { templateId } });
  return NextResponse.json(updated);
}

export const PATCH = withAuth(handler as any, "influencer");
