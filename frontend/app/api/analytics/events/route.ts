import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { actorType, actorId, eventName, entityType, entityId, payloadJson } = await req.json();
    if (!eventName) return NextResponse.json({ error: "eventName required" }, { status: 400 });
    const event = await prisma.analyticsEvent.create({
      data: {
        actorType: actorType || "external",
        actorId: actorId || null,
        eventName,
        entityType: entityType || null,
        entityId: entityId || null,
        payloadJson: payloadJson || null,
      },
    });
    return NextResponse.json(event, { status: 201 });
  } catch (err) {
    console.error("[POST /api/analytics/events]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
