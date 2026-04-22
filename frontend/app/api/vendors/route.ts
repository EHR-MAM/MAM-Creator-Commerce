import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth, AuthedRequest } from "@/lib/auth/middleware";
import { hashPassword } from "@/lib/auth/password";

export const dynamic = "force-dynamic";

async function listVendors(_req: AuthedRequest) {
  const vendors = await prisma.vendor.findMany({
    include: { user: { select: { email: true, name: true, status: true } } },
  });
  return NextResponse.json(vendors);
}

async function createVendor(req: AuthedRequest) {
  try {
    const { name, email, password, businessName, location, contactName, contactPhone } = await req.json();
    if (!name || !email || !password || !businessName || !location) {
      return NextResponse.json({ error: "name, email, password, businessName, location required" }, { status: 400 });
    }
    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: { name, email, hashedPassword: hashed, role: "vendor" },
    });
    const vendor = await prisma.vendor.create({
      data: { userId: user.id, businessName, location, contactName, contactPhone },
    });
    return NextResponse.json({ ...vendor, email: user.email }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/vendors]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const GET = withAuth(listVendors as any, "admin", "operator");
export const POST = withAuth(createVendor as any, "admin", "operator");
