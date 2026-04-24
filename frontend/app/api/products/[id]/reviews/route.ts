import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params: _params }: { params: { id: string } }) {
  return NextResponse.json([]);
}

export async function POST(_req: NextRequest, { params: _params }: { params: { id: string } }) {
  return NextResponse.json({ error: "Reviews not yet available" }, { status: 501 });
}
