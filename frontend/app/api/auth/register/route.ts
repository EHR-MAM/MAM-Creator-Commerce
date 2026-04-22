import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { signAccessToken, signRefreshToken, refreshExpiresAt } from "@/lib/auth/jwt";
import { UserRole } from "@/lib/generated/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, role = "influencer", handle, phone } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "name, email, and password are required" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const validRoles: UserRole[] = ["influencer", "vendor", "customer"];
    const userRole: UserRole = validRoles.includes(role) ? role : "influencer";

    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: { name, email, phone: phone || null, hashedPassword: hashed, role: userRole },
    });

    // Auto-create influencer record
    if (userRole === "influencer") {
      const slug = handle || email.split("@")[0].replace(/[^a-z0-9]/gi, "").toLowerCase();
      await prisma.influencer.create({
        data: { userId: user.id, handle: slug },
      });
    }

    const accessToken = signAccessToken(user.id, user.role);
    const refreshToken = signRefreshToken(user.id);
    await prisma.refreshToken.create({
      data: { userId: user.id, token: refreshToken, expiresAt: refreshExpiresAt() },
    });

    const res = NextResponse.json(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      { status: 201 }
    );
    res.cookies.set("access_token", accessToken, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 3600 });
    res.cookies.set("refresh_token", refreshToken, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 604800 });
    return res;
  } catch (err) {
    console.error("[POST /api/auth/register]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
