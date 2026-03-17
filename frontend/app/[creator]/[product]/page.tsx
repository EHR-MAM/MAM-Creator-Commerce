// Product detail + order form
import { notFound } from "next/navigation";
import OrderForm from "@/components/OrderForm";
import WhatsAppFallback from "@/components/WhatsAppFallback";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

async function getInfluencerId(handle: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/influencers?handle=${handle}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.id || null;
  } catch {
    return null;
  }
}

export default async function ProductPage({
  params,
}: {
  params: { creator: string; product: string };
}) {
  const [product, influencerId] = await Promise.all([
    getProduct(params.product),
    getInfluencerId(params.creator),
  ]);
  if (!product) notFound();

  const imageUrl = product.media_urls?.[0] || "/placeholder-product.jpg";

  return (
    <main className="min-h-screen bg-[#FAF7F2]">
      {/* Back nav */}
      <div className="bg-black px-4 py-3">
        <a href={`/${params.creator}`} className="text-[#C9A84C] text-sm">
          ← Back to @{params.creator}
        </a>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Product image */}
        <div className="rounded-xl overflow-hidden bg-gray-100 aspect-square">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Product info */}
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">
            {product.category}
          </p>
          <h1 className="text-xl font-bold mt-1">{product.name}</h1>
          {product.description && (
            <p className="text-gray-600 text-sm mt-2">{product.description}</p>
          )}
          <p className="text-2xl font-bold text-black mt-3">
            {product.currency} {Number(product.price).toFixed(2)}
          </p>
          <p className="text-xs text-green-600 mt-1">
            ✓ Available in Accra — delivery within 72 hours
          </p>
        </div>

        {/* Order form */}
        {product.inventory_count > 0 ? (
          <OrderForm product={product} creatorHandle={params.creator} influencerId={influencerId} />
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="text-red-600 font-medium">Currently sold out</p>
            <p className="text-sm text-gray-500 mt-1">
              Check back soon or ask via WhatsApp
            </p>
          </div>
        )}

        {/* WhatsApp fallback — pre-filled with product context */}
        <WhatsAppFallback
          handle={params.creator}
          productName={product.name}
          productPrice={Number(product.price).toFixed(2)}
          currency={product.currency}
          productId={product.id}
        />
      </div>
    </main>
  );
}
