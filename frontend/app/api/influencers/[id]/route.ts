import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth, AuthedRequest } from "@/lib/auth/middleware";

export const dynamic = "force-dynamic";

async function get(_req: AuthedRequest, { params }: { params: { id: string } }) {
  const influencer = await prisma.influencer.findFirst({
    where: { id: params.id },
    include: { user: { select: { name: true, email: true } } },
  });
  if (!influencer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(influencer);
}

async function update(req: AuthedRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const updated = await prisma.influencer.update({ where: { id: params.id }, data: body });
  return NextResponse.json(updated);
}

export const GET = withAuth(get as any, "admin", "operator");
export const PATCH = withAuth(update as any, "admin", "operator");
