import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("refresh_token")?.value;
    if (token) {
      await prisma.refreshToken.deleteMany({ where: { token } }).catch(() => {});
    }
    const res = NextResponse.json({ ok: true });
    res.cookies.delete("access_token");
    res.cookies.delete("refresh_token");
    return res;
  } catch (err) {
    console.error("[POST /api/auth/logout]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
