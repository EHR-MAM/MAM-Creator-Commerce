import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth, AuthedRequest } from "@/lib/auth/middleware";

export const dynamic = "force-dynamic";

async function remove(_req: AuthedRequest, { params }: { params: { id: string; productId: string } }) {
  await prisma.productCampaignLink.updateMany({
    where: { campaignId: params.id, productId: params.productId },
    data: { active: false },
  });
  return NextResponse.json({ ok: true });
}

export const DELETE = withAuth(remove as any, "admin", "operator");
