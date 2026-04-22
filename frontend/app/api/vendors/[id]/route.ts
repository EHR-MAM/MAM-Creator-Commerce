import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth, AuthedRequest } from "@/lib/auth/middleware";

export const dynamic = "force-dynamic";

async function getVendor(_req: AuthedRequest, { params }: { params: { id: string } }) {
  const vendor = await prisma.vendor.findUnique({
    where: { id: params.id },
    include: { user: { select: { email: true, name: true } } },
  });
  if (!vendor) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(vendor);
}

async function updateVendor(req: AuthedRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const vendor = await prisma.vendor.update({ where: { id: params.id }, data: body });
    return NextResponse.json(vendor);
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const GET = withAuth(getVendor as any, "admin", "operator");
export const PATCH = withAuth(updateVendor as any, "admin", "operator");
