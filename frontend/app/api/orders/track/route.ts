import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

const STATUS_MESSAGES: Record<string, string> = {
  pending: "Your order has been received and is awaiting confirmation.",
  confirmed: "Your order has been confirmed and is being prepared.",
  processing: "Your order is being processed.",
  shipped: "Your order is on its way!",
  delivered: "Your order has been delivered.",
  cancelled: "This order has been cancelled.",
  refunded: "This order has been refunded.",
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("order_id");
  const phone = searchParams.get("phone");

  if (!orderId || !phone) {
    return NextResponse.json({ error: "order_id and phone required" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: { select: { name: true } } } } },
  });

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // Normalize phone comparison (digits only)
  const normalizePhone = (p: string) => p.replace(/\D/g, "");
  if (!order.customerPhone || normalizePhone(order.customerPhone) !== normalizePhone(phone)) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: order.id,
    status: order.status,
    statusMessage: STATUS_MESSAGES[order.status] || order.status,
    total: order.total,
    currency: order.currency,
    createdAt: order.createdAt,
    items: order.items.map((i) => ({ name: i.product.name, quantity: i.quantity, lineTotal: i.lineTotal })),
  });
}
