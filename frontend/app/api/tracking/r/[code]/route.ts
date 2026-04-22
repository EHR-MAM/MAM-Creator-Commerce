import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  const link = await prisma.trackingLink.findUnique({ where: { code: params.code } });

  if (!link || !link.isActive) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  if (link.expiresAt && link.expiresAt < new Date()) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Increment click count
  prisma.trackingLink.update({
    where: { id: link.id },
    data: { clickCount: { increment: 1 } },
  }).catch(() => {});

  // Log analytics event
  const { searchParams } = new URL(req.url);
  const utm = Object.fromEntries(
    ["utm_source", "utm_medium", "utm_campaign"].map((k) => [k, searchParams.get(k)])
  );
  prisma.analyticsEvent.create({
    data: {
      actorType: "external",
      eventName: "link.clicked",
      entityType: "tracking_link",
      entityId: link.id,
      payloadJson: { code: params.code, ...utm },
    },
  }).catch(() => {});

  // Build destination with UTM params appended
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://yesmam.shop";
  const dest = new URL(link.destinationPath, baseUrl);
  for (const [k, v] of Object.entries(utm)) {
    if (v) dest.searchParams.set(k, v);
  }
  dest.searchParams.set("ref", params.code);

  return NextResponse.redirect(dest.toString());
}
