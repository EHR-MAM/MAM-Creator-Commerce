import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth, AuthedRequest } from "@/lib/auth/middleware";
import { hashPassword } from "@/lib/auth/password";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const handle = searchParams.get("handle");
  const where = handle ? { handle } : {};
  const influencers = await prisma.influencer.findMany({
    where,
    include: { user: { select: { name: true, email: true } } },
  });
  return NextResponse.json(influencers);
}

async function createInfluencer(req: AuthedRequest) {
  try {
    const { name, email, password, handle, platformName, audienceRegion } = await req.json();
    if (!name || !email || !password || !handle) {
      return NextResponse.json({ error: "name, email, password, handle required" }, { status: 400 });
    }
    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: { name, email, hashedPassword: hashed, role: "influencer" },
    });
    const influencer = await prisma.influencer.create({
      data: { userId: user.id, handle, platformName: platformName || "tiktok", audienceRegion: audienceRegion || "Ghana" },
    });
    return NextResponse.json(influencer, { status: 201 });
  } catch (err) {
    console.error("[POST /api/influencers]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const POST = withAuth(createInfluencer as any, "admin", "operator");
