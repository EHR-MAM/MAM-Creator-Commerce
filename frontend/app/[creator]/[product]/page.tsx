// Product detail page — Sprint IV
// Full redesign: image carousel, affiliate CTA, related products, SEO metadata
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Suspense } from "react";
import ProductDetailClient from "./ProductDetailClient";

const API_URL = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8200";

async function getProduct(productId: string) {
  try {
    const res = await fetch(`${API_URL}/products/${productId}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getInfluencer(handle: string) {
  try {
    const res = await fetch(`${API_URL}/influencers?handle=${handle}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? data[0] : data;
  } catch {
    return null;
  }
}

async function getRelatedProducts(category: string, excludeId: string) {
  try {
    const res = await fetch(
      `${API_URL}/products?status=active&limit=4&category=${encodeURIComponent(category)}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return [];
    const all = await res.json();
    const items = Array.isArray(all) ? all : (all.items || []);
    return items.filter((p: { id: string }) => p.id !== excludeId).slice(0, 3);
  } catch {
    return [];
  }
}

// Dynamic SEO metadata
export async function generateMetadata({
  params,
}: {
  params: { creator: string; product: string };
}): Promise<Metadata> {
  const product = await getProduct(params.product);
  if (!product) return { title: "Product | Yes MAM" };

  const creator = await getInfluencer(params.creator);
  const image = product.media_urls?.[0];
  const title = `${product.name} — @${params.creator} | Yes MAM`;
  const description = product.description
    ? `${product.description} · ${product.currency} ${Number(product.price).toFixed(2)} · Order from @${params.creator} on Yes MAM`
    : `${product.name} · ${product.currency} ${Number(product.price).toFixed(2)} · Ordered from @${params.creator}'s Yes MAM store. Pay on delivery.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: image ? [{ url: image, width: 800, height: 800, alt: product.name }] : [],
      siteName: "Yes MAM",
      type: "website",
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : [],
    },
    other: {
      "product:price:amount": String(product.price),
      "product:price:currency": product.currency || "GHS",
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: { creator: string; product: string };
}) {
  const [product, influencer] = await Promise.all([
    getProduct(params.product),
    getInfluencer(params.creator),
  ]);

  if (!product) notFound();

  const related = product.category
    ? await getRelatedProducts(product.category, params.product)
    : [];

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-800 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ProductDetailClient
        product={product}
        influencer={influencer}
        related={related}
        creatorHandle={params.creator}
      />
    </Suspense>
  );
}
