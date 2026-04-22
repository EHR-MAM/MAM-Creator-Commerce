import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyToken, signAccessToken, signRefreshToken, refreshExpiresAt } from "@/lib/auth/jwt";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("refresh_token")?.value;
    if (!token) return NextResponse.json({ error: "No refresh token" }, { status: 401 });

    let payload: { sub: string; type: string };
    try {
      payload = verifyToken(token) as { sub: string; type: string };
    } catch {
      return NextResponse.json({ error: "Invalid or expired refresh token" }, { status: 401 });
    }

    if (payload.type !== "refresh") {
      return NextResponse.json({ error: "Invalid token type" }, { status: 401 });
    }

    const stored = await prisma.refreshToken.findUnique({ where: { token } });
    if (!stored || stored.expiresAt < new Date()) {
      return NextResponse.json({ error: "Refresh token expired or revoked" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, status: true },
    });
    if (!user || user.status !== "active") {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // Rotate tokens
    await prisma.refreshToken.delete({ where: { token } });
    const newAccess = signAccessToken(user.id, user.role);
    const newRefresh = signRefreshToken(user.id);
    await prisma.refreshToken.create({
      data: { userId: user.id, token: newRefresh, expiresAt: refreshExpiresAt() },
    });

    const res = NextResponse.json({ ok: true });
    res.cookies.set("access_token", newAccess, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 3600 });
    res.cookies.set("refresh_token", newRefresh, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 604800 });
    return res;
  } catch (err) {
    console.error("[POST /api/auth/refresh]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
