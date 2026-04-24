import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth, AuthedRequest } from "@/lib/auth/middleware";

export const dynamic = "force-dynamic";

async function handler(req: AuthedRequest, { params }: { params: { id: string } }) {
  const { adminNotes } = await req.json();
  const order = await prisma.order.update({ where: { id: params.id }, data: { specialInstructions: adminNotes } });
  return NextResponse.json(order);
}

export const PATCH = withAuth(handler as any, "admin", "operator");
