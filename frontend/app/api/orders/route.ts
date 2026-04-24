import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth, AuthedRequest } from "@/lib/auth/middleware";
import { notifyOps, sendWhatsApp } from "@/lib/notifications/whatsapp";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      influencerId, vendorId, campaignId,
      customerName, customerPhone, customerEmail, deliveryAddress,
      sizeVariant, specialInstructions, items, sourceChannel,
    } = body;

    if (!vendorId || !items?.length) {
      return NextResponse.json({ error: "vendorId and items are required" }, { status: 400 });
    }

    // Validate inventory and build line items
    let subtotal = 0;
    const lineItems: { productId: string; quantity: number; unitPrice: number; lineTotal: number }[] = [];
    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product || product.status === "out_of_stock") {
        return NextResponse.json({ error: `Product ${item.productId} unavailable` }, { status: 400 });
      }
      if (product.inventoryCount < item.quantity) {
        return NextResponse.json({ error: `Insufficient inventory for ${product.name}` }, { status: 400 });
      }
      const unitPrice = Number(product.price);
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;
      lineItems.push({ productId: item.productId, quantity: item.quantity, unitPrice, lineTotal });
    }

    const total = subtotal; // delivery fee = 0 for pilot

    const order = await prisma.$transaction(async (tx) => {
      const o = await tx.order.create({
        data: {
          influencerId: influencerId || null,
          vendorId,
          campaignId: campaignId || null,
          customerName, customerPhone, customerEmail,
          deliveryAddress, sizeVariant, specialInstructions,
          subtotal, total, sourceChannel: sourceChannel || "tiktok",
          items: { create: lineItems },
        },
        include: { items: true },
      });
      // Decrement inventory
      for (const item of lineItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            inventoryCount: { decrement: item.quantity },
          },
        });
        const updated = await tx.product.findUnique({ where: { id: item.productId }, select: { inventoryCount: true } });
        if (updated && updated.inventoryCount <= 0) {
          await tx.product.update({ where: { id: item.productId }, data: { status: "out_of_stock" } });
        }
      }
      return o;
    });

    // Log analytics event (fire and forget)
    prisma.analyticsEvent.create({
      data: { actorType: "customer", eventName: "order.created", entityType: "order", entityId: order.id },
    }).catch(() => {});

    // Notify ops (fire and forget)
    const msg = `New order #${order.id.slice(0, 8)} — ${customerName || "Guest"} — GHS ${total.toFixed(2)} — ${customerPhone || "no phone"}`;
    notifyOps(msg).catch(() => {});

    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    console.error("[POST /api/orders]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function listOrders(req: AuthedRequest) {
  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status");
  const where = statusFilter ? { status: statusFilter as any } : {};
  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      items: { include: { product: { select: { name: true } } } },
      influencer: { select: { handle: true } },
      vendor: { select: { businessName: true } },
    },
  });
  return NextResponse.json(orders);
}

export const GET = withAuth(listOrders as any, "admin", "operator");
