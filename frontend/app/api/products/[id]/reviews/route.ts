import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth, AuthedRequest } from "@/lib/auth/middleware";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const reviews = await prisma.productReview.findMany({
    where: { productId: params.id, status: "approved" },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(reviews);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { customerName, customerPhone, rating, headline, body, orderId } = await req.json();
    if (!customerName || !rating) {
      return NextResponse.json({ error: "customerName and rating required" }, { status: 400 });
    }
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "rating must be 1-5" }, { status: 400 });
    }

    const phoneLast4 = customerPhone ? customerPhone.replace(/\D/g, "").slice(-4) : null;

    const review = await prisma.$transaction(async (tx) => {
      const r = await tx.productReview.create({
        data: {
          productId: params.id,
          orderId: orderId || null,
          customerName,
          customerPhoneLast4: phoneLast4,
          rating,
          headline: headline || null,
          body: body || null,
          status: "approved", // auto-approve for pilot
        },
      });
      // Recalculate product rating
      const agg = await tx.productReview.aggregate({
        where: { productId: params.id, status: "approved" },
        _avg: { rating: true },
        _count: { rating: true },
      });
      await tx.product.update({
        where: { id: params.id },
        data: { rating: agg._avg.rating || 0, reviewCount: agg._count.rating },
      });
      return r;
    });

    return NextResponse.json(review, { status: 201 });
  } catch (err) {
    console.error("[POST /api/products/:id/reviews]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
