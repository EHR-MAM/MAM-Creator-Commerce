import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth, AuthedRequest } from "@/lib/auth/middleware";
import { canTransition, CREATOR_COMMISSION_RATE, PLATFORM_COMMISSION_RATE } from "@/lib/orders/stateMachine";
import { sendWhatsApp } from "@/lib/notifications/whatsapp";

export const dynamic = "force-dynamic";

async function handler(req: AuthedRequest, { params }: { params: { id: string } }) {
  try {
    const { status } = await req.json();
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { commission: true },
    });
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Vendor can only update their own orders
    if (req.user.role === "vendor") {
      const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.id } });
      if (!vendor || vendor.id !== order.vendorId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    if (!canTransition(order.status, status)) {
      return NextResponse.json({ error: `Cannot transition from ${order.status} to ${status}` }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const o = await tx.order.update({ where: { id: params.id }, data: { status } });

      if (status === "delivered" && order.influencerId && !order.commission) {
        const subtotal = Number(order.subtotal);
        const influencerAmount = subtotal * CREATOR_COMMISSION_RATE;
        const platformAmount = subtotal * PLATFORM_COMMISSION_RATE;
        const vendorAmount = subtotal - influencerAmount - platformAmount;
        await tx.commission.create({
          data: {
            orderId: order.id,
            influencerId: order.influencerId,
            influencerAmount,
            platformAmount,
            vendorAmount,
            commissionStatus: "payable",
          },
        });
      }

      if (status === "refunded" && order.commission) {
        await tx.commission.update({
          where: { orderId: order.id },
          data: { commissionStatus: "reversed" },
        });
      }

      return o;
    });

    // Notify customer on shipped/delivered
    if (["shipped", "delivered"].includes(status) && order.customerPhone) {
      const msg = status === "shipped"
        ? `Your MAM order #${order.id.slice(0, 8)} is on its way!`
        : `Your MAM order #${order.id.slice(0, 8)} has been delivered. Thank you!`;
      sendWhatsApp(order.customerPhone, msg).catch(() => {});
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /api/orders/:id/status]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const PATCH = withAuth(handler as any, "admin", "operator", "vendor");
