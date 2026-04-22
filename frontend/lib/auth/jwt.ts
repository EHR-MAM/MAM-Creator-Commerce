import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET!;
const ACCESS_TTL = 60 * 60; // 1 hour
const REFRESH_TTL = 60 * 60 * 24 * 7; // 7 days

export function signAccessToken(userId: string, role: string): string {
  return jwt.sign({ sub: userId, role, type: "access" }, SECRET, {
    expiresIn: ACCESS_TTL,
  });
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId, type: "refresh" }, SECRET, {
    expiresIn: REFRESH_TTL,
  });
}

export function verifyToken(token: string): { sub: string; role?: string; type: string } {
  return jwt.verify(token, SECRET) as { sub: string; role?: string; type: string };
}

export function refreshExpiresAt(): Date {
  return new Date(Date.now() + REFRESH_TTL * 1000);
}
