// Creator storefront — public page
// Route: /[creator] e.g. /sweet200723
import { notFound } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import WhatsAppFallback from "@/components/WhatsAppFallback";
import { Suspense } from "react";
import AnalyticsCapture from "@/components/AnalyticsCapture";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getCreatorData(handle: string) {
  try {
    const res = await fetch(`${API_URL}/influencers?handle=${handle}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getCampaignProducts(campaignId: string) {
  try {
    const res = await fetch(`${API_URL}/products?campaign_id=${campaignId}&status=active`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function CreatorStorefront({
  params,
}: {
  params: { creator: string };
}) {
  const creator = await getCreatorData(params.creator);

  // Fallback: show Christiana's page even before API is live
  const displayName = creator?.name || "Christiana";
  const handle = params.creator;
  const products = creator?.campaign_id
    ? await getCampaignProducts(creator.campaign_id)
    : [];

  return (
    <main className="min-h-screen bg-[#FAF7F2]">
      {/* Analytics — capture ref/UTM from TikTok link redirect */}
      <Suspense fallback={null}>
        <AnalyticsCapture
          eventName="storefront.viewed"
          entityType="influencer"
          creatorHandle={handle}
        />
      </Suspense>

      {/* Header */}
      <div className="bg-black text-white px-4 py-6">
        <div className="max-w-lg mx-auto">
          <p className="text-[#C9A84C] text-sm font-medium tracking-widest uppercase">
            Shop The Look
          </p>
          <h1 className="text-2xl font-bold mt-1">@{handle}</h1>
          <p className="text-gray-300 text-sm mt-1">
            Products featured in my videos — available in Accra 🇬🇭
          </p>
        </div>
      </div>

      {/* Book Banner — Black in the Saddle */}
      <div className="bg-[#C9A84C] px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <span className="text-2xl">🐎</span>
          <div>
            <p className="text-black font-semibold text-sm">
              Reading: <em>Black in the Saddle</em> by Louis Hook
            </p>
            <p className="text-black text-xs">
              Compton Cowboys coming to Accra — December 2025
            </p>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="max-w-lg mx-auto px-4 py-6">
        {products.length > 0 ? (
          <>
            <h2 className="text-lg font-bold mb-4">Featured Products</h2>
            <div className="grid grid-cols-2 gap-4">
              {products.map((product: any) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  creatorHandle={handle}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🛍️</p>
            <p className="text-gray-600 font-medium">Products coming soon!</p>
            <p className="text-gray-400 text-sm mt-1">
              Check back after my next TikTok video
            </p>
          </div>
        )}
      </div>

      {/* WhatsApp Fallback — always visible */}
      <div className="max-w-lg mx-auto px-4 pb-8">
        <WhatsAppFallback handle={handle} />
      </div>
    </main>
  );
}
