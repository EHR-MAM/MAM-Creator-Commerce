import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth, AuthedRequest } from "@/lib/auth/middleware";

export const dynamic = "force-dynamic";

async function update(req: AuthedRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const campaign = await prisma.campaign.update({ where: { id: params.id }, data: body });
  return NextResponse.json(campaign);
}

export const PATCH = withAuth(update as any, "admin", "operator");
