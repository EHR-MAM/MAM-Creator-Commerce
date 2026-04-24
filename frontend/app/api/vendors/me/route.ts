import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth, AuthedRequest } from "@/lib/auth/middleware";

export const dynamic = "force-dynamic";

async function getMe(req: AuthedRequest) {
  const vendor = await prisma.vendor.findFirst({ where: { userId: req.user.id } });
  if (!vendor) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(vendor);
}

async function updateMe(req: AuthedRequest) {
  try {
    const body = await req.json();
    const { businessName, location, contactName, contactPhone } = body;
    const vendor = await prisma.vendor.findFirst({ where: { userId: req.user.id } });
    if (!vendor) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const updated = await prisma.vendor.update({
      where: { id: vendor.id },
      data: { businessName, location, contactName, contactPhone },
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /api/vendors/me]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const GET = withAuth(getMe as any, "vendor");
export const PATCH = withAuth(updateMe as any, "vendor");
