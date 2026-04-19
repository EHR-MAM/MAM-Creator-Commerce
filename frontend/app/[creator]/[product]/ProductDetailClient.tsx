"use client";
// ProductDetailClient — Sprint IV + Sprint XIX (multi-product cart) + Sprint XXVIII (reviews) + Sprint XXXIII (wishlist) + Sprint XXXIV (multi-currency) + Sprint LXXVIII (image optimization)
// Image carousel, Add to Cart, cart drawer, affiliate CTA, related products, reviews, save for later
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import WhatsAppFallback from "@/components/WhatsAppFallback";
import CartDrawer from "@/components/CartDrawer";
import WishlistDrawer from "@/components/WishlistDrawer";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { currencySymbol } from "@/lib/currency";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "/mam";
const WHATSAPP = process.env.NEXT_PUBLIC_CREATOR_WHATSAPP || "13107763650";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8200";

const CATEGORY_EMOJI: Record<string, string> = {
  hair: "💆‍♀️",
  "hair & beauty": "💆‍♀️",
  beauty: "💄",
  fashion: "👗",
  accessories: "👜",
  skincare: "🧴",
  wellness: "🌿",
  electronics: "📱",
  footwear: "👟",
  fitness: "🏋️",
  "home & living": "🏡",
  "mother & baby": "🍼",
  "books & culture": "📚",
  jewelry: "💎",
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
  video_url?: string;
  sizes?: string[];
  color?: string;
  size?: string;
  vendor_id: string;
  affiliate_url?: string;
  image_alt_text?: string;
  rating?: number;
  review_count?: number;
  creator_handle?: string | null;
}

interface Influencer {
  id: string;
  handle: string;
  name?: string;
  bio?: string;
  avatar_url?: string;
  payout_details_ref?: string | null;
}

// ─── Image Carousel ──────────────────────────────────────────────────────────

function ImageCarousel({ images, name, category }: { images: string[]; name: string; category: string }) {
  const [active, setActive] = useState(0);
  const hasImages = images.length > 0;

  return (
    <div>
      <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden relative">
        {hasImages ? (
          <Image
            src={images[active]}
            alt={`${name} product image ${active > 0 ? `view ${active + 1}` : ''}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            quality={80}
            priority={active === 0}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <div className="text-5xl mb-2">{CATEGORY_EMOJI[category.toLowerCase()] || "🛍️"}</div>
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
              className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all relative ${
                active === i ? "border-[#C9A84C]" : "border-transparent opacity-50 hover:opacity-80"
              }`}
            >
              <Image src={img} alt={`${name} view ${i + 1}`} fill className="object-cover" sizes="80px" quality={70} />
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
      <div className="w-10 h-10 rounded-full overflow-hidden bg-[#C9A84C]/20 flex items-center justify-center shrink-0 relative">
        {influencer?.avatar_url ? (
          <Image src={influencer.avatar_url} alt={displayName} fill className="object-cover" sizes="40px" quality={75} />
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
  const targetHandle = product.creator_handle || handle;
  return (
    <Link href={`${BASE}/${targetHandle}/${product.id}`} className="block group">
      <div className="rounded-xl overflow-hidden border border-gray-100 bg-white hover:shadow-md transition-shadow">
        <div className="aspect-square bg-gray-50 overflow-hidden relative">
          {image ? (
            <Image src={image} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="150px" quality={70} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl">
              {CATEGORY_EMOJI[product.category.toLowerCase()] || "🛍️"}
            </div>
          )}
        </div>
        <div className="p-2.5">
          <p className="text-xs font-bold text-gray-800 line-clamp-2 leading-tight mb-1">{product.name}</p>
          <p className="text-sm font-black text-[#C9A84C]">{currencySymbol(product.currency)} {Number(product.price).toFixed(2)}</p>
        </div>
      </div>
    </Link>
  );
}

// ─── Reviews Section ─────────────────────────────────────────────────────────

interface Review {
  id: string;
  customer_name: string;
  customer_phone_last4: string | null;
  rating: number;
  headline: string | null;
  body: string | null;
  created_at: string;
}

function InteractiveStar({ index, value, onChange }: { index: number; value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  const filled = hovered ? index <= hovered : index <= value;
  return (
    <button
      type="button"
      onMouseEnter={() => setHovered(index)}
      onMouseLeave={() => setHovered(0)}
      onClick={() => onChange(index)}
      className={`text-2xl transition-colors ${filled ? "text-[#C9A84C]" : "text-gray-200"}`}
    >★</button>
  );
}

function ReviewsSection({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitDone, setSubmitDone] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Form state
  const [rating, setRating] = useState(0);
  const [name, setName] = useState("");
  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/products/${productId}/reviews`)
      .then(r => r.ok ? r.json() : [])
      .then((data: Review[]) => setReviews(Array.isArray(data) ? data : []))
      .catch(() => setReviews([]))
      .finally(() => setLoaded(true));
  }, [productId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating || !name.trim()) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch(`${API_URL}/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_name: name.trim(), rating, headline: headline.trim() || null, body: body.trim() || null }),
      });
      if (!res.ok) throw new Error("Failed");
      const newReview: Review = await res.json();
      setReviews(prev => [newReview, ...prev]);
      setSubmitDone(true);
      setShowForm(false);
      setRating(0); setName(""); setHeadline(""); setBody("");
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    }
    setSubmitting(false);
  }

  const avgRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("en-GH", { day: "numeric", month: "short", year: "numeric" });
    } catch { return ""; }
  };

  if (!loaded) return null;

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-black text-lg text-gray-900">
            Reviews {reviews.length > 0 && <span className="text-gray-400 font-normal text-base">({reviews.length})</span>}
          </h2>
          {reviews.length > 0 && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="flex">
                {[1,2,3,4,5].map(s => (
                  <span key={s} className={`text-sm ${s <= Math.round(avgRating) ? "text-[#C9A84C]" : "text-gray-200"}`}>★</span>
                ))}
              </div>
              <span className="text-xs text-gray-500">{avgRating.toFixed(1)} avg</span>
            </div>
          )}
        </div>
        {!submitDone && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-xs font-bold text-[#C9A84C] border border-[#C9A84C]/40 px-3 py-1.5 rounded-xl hover:bg-[#C9A84C]/10 transition-colors"
          >
            + Write a review
          </button>
        )}
        {submitDone && (
          <span className="text-xs text-green-700 font-semibold bg-green-50 border border-green-200 px-3 py-1.5 rounded-xl">
            ✓ Review submitted!
          </span>
        )}
      </div>

      {/* Submit form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-[#C9A84C]/30 p-5 shadow-sm">
          <p className="font-bold text-sm text-gray-800 mb-4">Share your experience</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Star picker */}
            <div>
              <p className="text-xs text-gray-500 mb-1.5">Rating *</p>
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(i => (
                  <InteractiveStar key={i} index={i} value={rating} onChange={setRating} />
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Your name *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Akua M."
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#C9A84C]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Headline</label>
              <input
                type="text"
                value={headline}
                onChange={e => setHeadline(e.target.value)}
                placeholder="e.g. Great quality, fast delivery"
                maxLength={150}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#C9A84C]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Review</label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Tell others what you think..."
                maxLength={2000}
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#C9A84C] resize-none"
              />
            </div>
            {submitError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">{submitError}</p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !rating || !name.trim()}
                className="flex-1 py-2.5 rounded-xl bg-black text-white text-sm font-bold disabled:opacity-40"
              >
                {submitting ? "Submitting…" : "Submit Review"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reviews list */}
      {reviews.length === 0 && !showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
          <p className="text-2xl mb-2">⭐</p>
          <p className="text-sm font-bold text-gray-700">No reviews yet</p>
          <p className="text-xs text-gray-400 mt-1">Be the first to share your experience!</p>
        </div>
      )}

      {reviews.length > 0 && (
        <div className="space-y-3">
          {reviews.map(r => (
            <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex gap-0.5 mb-0.5">
                    {[1,2,3,4,5].map(s => (
                      <span key={s} className={`text-sm ${s <= r.rating ? "text-[#C9A84C]" : "text-gray-200"}`}>★</span>
                    ))}
                  </div>
                  {r.headline && <p className="font-bold text-sm text-gray-800">{r.headline}</p>}
                </div>
                <span className="text-[10px] text-gray-400 shrink-0 mt-0.5">{formatDate(r.created_at)}</span>
              </div>
              {r.body && <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{r.body}</p>}
              <p className="text-xs text-gray-400 mt-2">
                {r.customer_name}{r.customer_phone_last4 ? ` · ···${r.customer_phone_last4}` : ""}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
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
  const { isSaved, toggle: toggleWishlist, count: wishlistCount } = useWishlist();
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [qty, setQty] = useState(1);
  const [shareState, setShareState] = useState<"idle" | "loading" | "copied">("idle");

  const saved = isSaved(product.id);

  async function handleShareProduct() {
    setShareState("loading");
    try {
      // Try to generate an affiliate-tracked short link if creator token exists
      const token = typeof window !== "undefined"
        ? localStorage.getItem("mam_token") || sessionStorage.getItem("mam_token")
        : null;

      let shareUrl = typeof window !== "undefined" ? window.location.href : "";

      if (token) {
        const res = await fetch(`${API_URL}/tracking/links`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ destination_path: `/${creatorHandle}/${product.id}` }),
        });
        if (res.ok) {
          const data = await res.json();
          shareUrl = data.short_url || shareUrl;
        }
      }

      const shareText = `Check out ${product.name} on Yes MAM! 🛍️\n\n${shareUrl}\n\n#YesMAM #Ghana #ShopNow`;

      if (navigator.share) {
        await navigator.share({ title: product.name, text: shareText, url: shareUrl }).catch(() => {});
      } else {
        await navigator.clipboard.writeText(shareText);
      }

      setShareState("copied");
      setTimeout(() => setShareState("idle"), 2500);
    } catch {
      setShareState("idle");
    }
  }

  function handleWishlistToggle() {
    toggleWishlist({
      productId: product.id,
      productName: product.name,
      price: Number(product.price),
      currency: product.currency,
      creatorHandle,
      imageUrl: images[0],
      category: product.category,
    });
  }

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
            {/* Wishlist heart icon with badge */}
            <button
              onClick={() => setWishlistOpen(true)}
              className="relative text-white"
              aria-label="Open wishlist"
            >
              <span className="text-xl">{wishlistCount > 0 ? "❤️" : "🤍"}</span>
              {wishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#C9A84C] text-black text-[10px] font-black rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </button>
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

        {/* ── Product Video ── */}
        {product.video_url && (() => {
          const url = product.video_url!;
          const isDirectVideo = /\.(mp4|webm|ogg)(\?|$)/i.test(url);
          const isYouTube = /youtube\.com|youtu\.be/.test(url);
          const isTikTok = /tiktok\.com/.test(url);

          if (isDirectVideo) {
            return (
              <div className="rounded-2xl overflow-hidden bg-black">
                <video
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full max-h-[480px] object-contain"
                  src={url}
                >
                  Your browser does not support video.
                </video>
              </div>
            );
          }

          const platform = isYouTube ? "YouTube" : isTikTok ? "TikTok" : "Video";
          const icon = isYouTube ? "▶" : isTikTok ? "♪" : "▶";

          return (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-black text-white rounded-2xl px-5 py-4 hover:opacity-90 transition-opacity"
            >
              <span className="text-2xl">{icon}</span>
              <div>
                <p className="font-black text-sm">Watch on {platform}</p>
                <p className="text-xs text-gray-400">See this product in action</p>
              </div>
              <span className="ml-auto text-gray-400 text-lg">→</span>
            </a>
          );
        })()}

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
              {currencySymbol(product.currency)} {Number(product.price).toFixed(2)}
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

          {/* Color / Size attribute badges */}
          {(product.color || product.size) && (
            <div className="flex flex-wrap gap-2 mt-3">
              {product.color && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                  <span>🎨</span> {product.color}
                </span>
              )}
              {product.size && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                  <span>📐</span> Size: {product.size}
                </span>
              )}
            </div>
          )}

          {/* Share row: copy link + WhatsApp share */}
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={handleShareProduct}
              disabled={shareState === "loading"}
              className="flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl border transition-all"
              style={{
                borderColor: shareState === "copied" ? "#4ade80" : "#C9A84C40",
                color: shareState === "copied" ? "#15803d" : "#C9A84C",
                backgroundColor: shareState === "copied" ? "#f0fdf4" : "#C9A84C0d",
              }}
            >
              {shareState === "loading" ? "⏳ Generating…" : shareState === "copied" ? "✓ Copied!" : "🔗 Share link"}
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Check out ${product.name} on Yes MAM! 🛍️\n\n${typeof window !== "undefined" ? window.location.href : ""}\n\n#YesMAM #Ghana #ShopNow`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-[#25D366] text-white"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </a>
          </div>
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
              {addedFeedback ? "✓ Added to cart!" : `Add to Cart — ${currencySymbol(product.currency)} ${(Number(product.price) * qty).toFixed(2)}`}
            </button>

            {/* Save for later / Wishlist toggle */}
            <button
              onClick={handleWishlistToggle}
              className={`w-full py-3 rounded-xl font-bold text-sm border transition-colors flex items-center justify-center gap-2 ${
                saved
                  ? "border-red-300 text-red-600 bg-red-50 hover:bg-red-100"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {saved ? "❤️ Saved — tap to remove" : "🤍 Save for later"}
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
            <span>🛒</span> Buy Now — {currencySymbol(product.currency)} {Number(product.price).toFixed(2)}
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
          creatorPhone={influencer?.payout_details_ref}
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

        {/* ── Reviews ── */}
        <ReviewsSection productId={product.id} />

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
      {/* Wishlist Drawer */}
      <WishlistDrawer open={wishlistOpen} onClose={() => setWishlistOpen(false)} creatorHandle={creatorHandle} />
    </main>
  );
}
