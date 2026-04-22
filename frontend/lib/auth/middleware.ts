import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./jwt";
import { prisma } from "../db/prisma";
import { UserRole } from "../generated/prisma";

export type AuthedRequest = NextRequest & {
  user: { id: string; role: UserRole; email: string; name: string };
};

type RouteHandler = (req: AuthedRequest, ctx: { params: Record<string, string> }) => Promise<NextResponse>;

export function withAuth(handler: RouteHandler, ...allowedRoles: UserRole[]): RouteHandler {
  return async (req, ctx) => {
    const authHeader = req.headers.get("authorization");
    const cookieToken = req.cookies.get("access_token")?.value;
    const rawToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : cookieToken;

    if (!rawToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let payload: { sub: string; role?: string; type: string };
    try {
      payload = verifyToken(rawToken);
    } catch {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    if (payload.type !== "access") {
      return NextResponse.json({ error: "Invalid token type" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, email: true, name: true, status: true },
    });

    if (!user || user.status !== "active") {
      return NextResponse.json({ error: "User not found or inactive" }, { status: 401 });
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    (req as AuthedRequest).user = user;
    return handler(req as AuthedRequest, ctx);
  };
}

export function apiError(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}
