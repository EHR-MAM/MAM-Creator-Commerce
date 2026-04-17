"use client";
// ProductDetailClient — Sprint IV + Sprint XIX (multi-product cart)
// Image carousel, Add to Cart, cart drawer, affiliate CTA, related products
import { useState } from "react";
import Link from "next/link";
import WhatsAppFallback from "@/components/WhatsAppFallback";
import CartDrawer from "@/components/CartDrawer";
import { useCart } from "@/lib/cart";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "/mam";
const WHATSAPP = process.env.NEXT_PUBLIC_CREATOR_WHATSAPP || "13107763650";

const CATEGORY_EMOJI: Record<string, string> = {
  hair: "💆‍♀️",
  beauty: "💄",
  fashion: "👗",
  accessories: "💍",
  skincare: "🧴",
  wellness: "🌿",
  electronics: "📱",
  footwear: "👟",
};

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  category: string;
  inventory_count: number;
  media_urls?: string[];
  sizes?: string[];
  vendor_id: string;
  affiliate_url?: string;
  rating?: number;
  review_count?: number;
}

interface Influencer {
  id: string;
  handle: string;
  name?: string;
  bio?: string;
  avatar_url?: string;
}

// ─── Image Carousel ──────────────────────────────────────────────────────────

function ImageCarousel({ images, name, category }: { images: string[]; name: string; category: string }) {
  const [active, setActive] = useState(0);
  const hasImages = images.length > 0;

  return (
    <div>
      <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden relative">
        {hasImages ? (
          <img
            src={images[active]}
            alt={`${name} - image ${active + 1}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <div className="text-5xl mb-2">{CATEGORY_EMOJI[category] || "🛍️"}</div>
            <p className="text-xs text-gray-400 uppercase tracking-widest">{category}</p>
          </div>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                active === i ? "border-[#C9A84C]" : "border-transparent opacity-50 hover:opacity-80"
              }`}
            >
              <img src={img} alt={`${name} view ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Star Rating ─────────────────────────────────────────────────────────────

function StarRating({ rating, count }: { rating: number; count: number }) {
  const stars = Math.round(rating);
  return (
    <div className="flex items-center gap-1.5 mt-1">
      <div className="flex">
        {[1,2,3,4,5].map((s) => (
          <span key={s} className={`text-base ${s <= stars ? "text-[#C9A84C]" : "text-gray-200"}`}>★</span>
        ))}
      </div>
      <span className="text-xs text-gray-500">{rating.toFixed(1)} ({count} reviews)</span>
    </div>
  );
}

// ─── Influencer Badge ─────────────────────────────────────────────────────────

function InfluencerBadge({ influencer, handle }: { influencer: Influencer | null; handle: string }) {
  const displayHandle = influencer?.handle || handle;
  const displayName = influencer?.name || `@${displayHandle}`;
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <Link href={`${BASE}/${displayHandle}`} className="flex items-center gap-3 bg-[#FAF7F2] border border-[#E8D9C0] rounded-xl p-3 hover:border-[#C9A84C]/40 transition-colors group">
      <div className="w-10 h-10 rounded-full overflow-hidden bg-[#C9A84C]/20 flex items-center justify-center shrink-0">
        {influencer?.avatar_url ? (
          <img src={influencer.avatar_url} alt={displayName} className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm font-black text-[#C9A84C]">{initial}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 leading-none mb-0.5">Recommended by</p>
        <p className="font-bold text-sm text-gray-900 truncate">{displayName}</p>
        <p className="text-xs text-[#C9A84C]">@{displayHandle} · View full store →</p>
      </div>
    </Link>
  );
}

// ─── Related Product Card ────────────────────────────────────────────────────

function RelatedCard({ product, handle }: { product: Product; handle: string }) {
  const image = product.media_urls?.[0];
  return (
    <Link href={`${BASE}/${handle}/${product.id}`} className="block group">
      <div className="rounded-xl overflow-hidden border border-gray-100 bg-white hover:shadow-md transition-shadow">
        <div className="aspect-square bg-gray-50 overflow-hidden">
          {image ? (
            <img src={image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl">
              {CATEGORY_EMOJI[product.category] || "🛍️"}
            </div>
          )}
        </div>
        <div className="p-2.5">
          <p className="text-xs font-bold text-gray-800 line-clamp-2 leading-tight mb-1">{product.name}</p>
          <p className="text-sm font-black text-[#C9A84C]">{product.currency} {Number(product.price).toFixed(2)}</p>
        </div>
      </div>
    </Link>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ProductDetailClient({
  product,
  influencer,
  related,
  creatorHandle,
}: {
  product: Product;
  influencer: Influencer | null;
  related: Product[];
  creatorHandle: string;
}) {
  const images = product.media_urls || [];
  const inStock = product.inventory_count > 0;
  const influencerId = influencer?.id || null;

  const { addItem, count } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [qty, setQty] = useState(1);

  function handleAddToCart() {
    addItem({
      productId: product.id,
      productName: product.name,
      price: Number(product.price),
      currency: product.currency,
      vendorId: product.vendor_id,
      influencerId,
      creatorHandle,
      imageUrl: images[0],
    }, qty);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2000);
  }

  return (
    <main className="min-h-screen bg-[#FAF7F2]">
      {/* Back nav + cart icon */}
      <div className="bg-black px-4 py-3 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link href={`${BASE}/${creatorHandle}`} className="text-[#C9A84C] text-sm font-semibold">
            ← @{creatorHandle}
          </Link>
          <div className="flex items-center gap-3">
            {/* Cart icon with badge */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative text-white"
              aria-label="Open cart"
            >
              <span className="text-xl">🛒</span>
              {count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#C9A84C] text-black text-[10px] font-black rounded-full flex items-center justify-center">
                  {count}
                </span>
              )}
            </button>
            <a
              href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hi! I want to order ${product.name} from @${creatorHandle}'s Yes MAM store.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-[#25D366] text-white text-xs font-bold px-3 py-1.5 rounded-xl"
            >
              💬 WhatsApp
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-6">

        {/* ── Image Carousel ── */}
        <ImageCarousel images={images} name={product.name} category={product.category} />

        {/* ── Product Info ── */}
        <div>
          <p className="text-[10px] text-[#C9A84C] uppercase tracking-[0.2em] font-bold mb-1">
            {product.category}
          </p>
          <h1 className="text-2xl font-black text-gray-900 leading-tight">{product.name}</h1>

          {product.rating && product.review_count ? (
            <StarRating rating={product.rating} count={product.review_count} />
          ) : null}

          <div className="flex items-baseline gap-3 mt-3">
            <p className="text-3xl font-black text-gray-900">
              {product.currency} {Number(product.price).toFixed(2)}
            </p>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <span className={`w-2 h-2 rounded-full ${inStock ? "bg-green-500" : "bg-red-400"}`} />
            <span className={`text-sm font-medium ${inStock ? "text-green-700" : "text-red-600"}`}>
              {inStock
                ? product.inventory_count <= 3
                  ? `Only ${product.inventory_count} left!`
                  : "In stock · Accra delivery in 72h"
                : "Currently sold out"}
            </span>
          </div>

          {product.description && (
            <p className="text-gray-600 text-sm leading-relaxed mt-3 border-t border-gray-100 pt-3">
              {product.description}
            </p>
          )}
        </div>

        {/* ── Add to Cart section ── */}
        {inStock && (
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
            {/* Quantity selector */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Quantity</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-full border border-gray-200 font-bold text-lg flex items-center justify-center hover:bg-gray-50"
                >
                  −
                </button>
                <span className="font-bold text-base w-6 text-center">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty(q => q + 1)}
                  className="w-8 h-8 rounded-full border border-gray-200 font-bold text-lg flex items-center justify-center hover:bg-gray-50"
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to Cart button */}
            <button
              onClick={handleAddToCart}
              className={`w-full py-4 rounded-xl font-black text-base transition-all ${
                addedFeedback
                  ? "bg-green-600 text-white"
                  : "bg-black text-white hover:bg-gray-900"
              }`}
            >
              {addedFeedback ? "✓ Added to cart!" : `Add to Cart — ${product.currency} ${(Number(product.price) * qty).toFixed(2)}`}
            </button>

            {/* View cart shortcut if items in cart */}
            {count > 0 && (
              <button
                onClick={() => setCartOpen(true)}
                className="w-full py-3 rounded-xl font-bold text-sm border border-black text-black hover:bg-gray-50 transition-colors"
              >
                View Cart ({count} item{count !== 1 ? "s" : ""}) → Checkout
              </button>
            )}
          </div>
        )}

        {!inStock && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center">
            <p className="text-2xl mb-2">😔</p>
            <p className="text-red-600 font-bold">Currently sold out</p>
            <p className="text-sm text-gray-500 mt-1">
              Message @{creatorHandle} on WhatsApp to be notified when it&apos;s back.
            </p>
          </div>
        )}

        {/* ── Affiliate Buy Now CTA (if affiliate_url present) ── */}
        {product.affiliate_url && (
          <a
            href={product.affiliate_url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-black text-base transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #A8832A 0%, #C9A84C 50%, #E8C97A 100%)", color: "#0A0A0A" }}
          >
            <span>🛒</span> Buy Now — {product.currency} {Number(product.price).toFixed(2)}
          </a>
        )}

        {/* ── Influencer Badge ── */}
        <InfluencerBadge influencer={influencer} handle={creatorHandle} />

        {/* ── WhatsApp fallback ── */}
        <WhatsAppFallback
          handle={creatorHandle}
          productName={product.name}
          productPrice={Number(product.price).toFixed(2)}
          currency={product.currency}
          productId={product.id}
        />

        {/* ── Trust signals ── */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: "🚚", label: "72h delivery", sub: "Accra & surroundings" },
            { icon: "💰", label: "Pay on delivery", sub: "Cash or MoMo" },
            { icon: "🔄", label: "Easy returns", sub: "Same day exchange" },
          ].map(({ icon, label, sub }) => (
            <div key={label} className="bg-white border border-gray-100 rounded-xl p-3 text-center shadow-sm">
              <div className="text-xl mb-1">{icon}</div>
              <p className="text-[11px] font-bold text-gray-800">{label}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        {/* ── Related Products ── */}
        {related.length > 0 && (
          <div>
            <h2 className="font-black text-lg text-gray-900 mb-3">You might also like</h2>
            <div className="grid grid-cols-3 gap-2">
              {related.map((p) => (
                <RelatedCard key={p.id} product={p} handle={creatorHandle} />
              ))}
            </div>
          </div>
        )}

        {/* ── Footer badge ── */}
        <div className="border-t border-gray-100 pt-4 pb-2 text-center">
          <Link href={`${BASE}/home`} className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors">
            <span className="w-4 h-4 rounded bg-[#C9A84C] flex items-center justify-center text-[8px] font-black text-black">Y</span>
            Powered by Yes MAM · Africa&apos;s Creator Commerce Platform
          </Link>
        </div>

      </div>

      {/* Cart Drawer */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </main>
  );
}
