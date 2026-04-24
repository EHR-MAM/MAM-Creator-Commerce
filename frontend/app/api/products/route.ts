import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth, AuthedRequest } from "@/lib/auth/middleware";
import { Prisma } from "@/lib/generated/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const vendorId = searchParams.get("vendor_id");
    const influencerId = searchParams.get("influencer_id");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "60"), 100);
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};
    if (category) where.category = category;
    if (vendorId) where.vendorId = vendorId;
    if (status) where.status = status as any;
    else where.status = "active";
    if (search) where.name = { contains: search, mode: "insensitive" };
    if (influencerId) {
      where.campaignLinks = {
        some: {
          active: true,
          campaign: { influencerId, status: "active" },
        },
      };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: "desc" },
        include: {
          vendor: { select: { businessName: true } },
          campaignLinks: {
            where: { active: true },
            include: { campaign: { select: { influencerId: true, influencer: { select: { handle: true } } } } },
            take: 1,
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({ products, total, page, limit });
  } catch (err) {
    console.error("[GET /api/products]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function createProduct(req: AuthedRequest) {
  try {
    const body = await req.json();
    const { vendorId, sku, name, description, category, price, inventoryCount, ...rest } = body;
    if (!vendorId || !sku || !name || !category || price === undefined) {
      return NextResponse.json({ error: "vendorId, sku, name, category, price required" }, { status: 400 });
    }
    const product = await prisma.product.create({
      data: { vendorId, sku, name, description, category, price, inventoryCount: inventoryCount ?? 0, ...rest },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    console.error("[POST /api/products]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const POST = withAuth(createProduct as any, "admin", "operator", "vendor");
