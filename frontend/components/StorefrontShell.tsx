"use client";
// StorefrontShell — Sprint XIX + Sprint XXXI (bio/share) + Sprint XXXIII (wishlist hearts) + Sprint XXXIV (multi-currency) + Sprint LXXVIII (image optimization)
import Link from "next/link";
import Image from "next/image";
import { type TemplateConfig, TEMPLATES, type TemplateId } from "@/lib/templates";
import { useState, useCallback } from "react";
import CartDrawer from "@/components/CartDrawer";
import WishlistDrawer from "@/components/WishlistDrawer";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { currencySymbol } from "@/lib/currency";

const OPS_WHATSAPP = process.env.NEXT_PUBLIC_CREATOR_WHATSAPP || "13107763650";

/** Convert a Ghana local number (0244...) to international E.164 (233244...).
 *  Falls back to the ops number if the ref is null/empty or non-numeric. */
function resolveWhatsApp(payoutRef: string | null | undefined): string {
  if (!payoutRef) return OPS_WHATSAPP;
  const digits = payoutRef.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("0")) return "233" + digits.slice(1);
  if (digits.length >= 10) return digits; // already international or close enough
  return OPS_WHATSAPP;
}

interface Product {
  id: string;
  name: string;
  price: number;
  currency: string;
  category: string;
  color?: string;
  media_urls?: string[];
  video_url?: string;
  image_alt_text?: string;
  inventory_count: number;
}

interface Creator {
  id: string;
  handle: string;
  name?: string;
  bio?: string;
  campaign_id?: string;
  campaign_name?: string;
  template_id?: string;
  avatar_url?: string;
  platform_name?: string;
  payout_details_ref?: string | null;
}

const CATEGORY_EMOJI: Record<string, string> = {
  hair: "💆‍♀️",
  "hair & beauty": "💆‍♀️",
  beauty: "💄",
  fashion: "👗",
  accessories: "👜",
  skincare: "🧴",
  wellness: "🌿",
  electronics: "📱",
  fitness: "🏋️",
  "home & living": "🏡",
  "mother & baby": "🍼",
  "books & culture": "📚",
  jewelry: "💎",
  footwear: "👟",
};

const PLATFORM_ICON: Record<string, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube: "YouTube",
  twitter: "Twitter",
  facebook: "Facebook",
  snapchat: "Snapchat",
};

const PLATFORM_COLOR: Record<string, string> = {
  tiktok: "#000000",
  instagram: "#E1306C",
  youtube: "#FF0000",
  twitter: "#1DA1F2",
  facebook: "#1877F2",
  snapchat: "#FFFC00",
};

const CATEGORY_GRADIENT: Record<string, string> = {
  hair: "from-purple-900/40 to-purple-700/20",
  beauty: "from-pink-900/40 to-pink-700/20",
  fashion: "from-amber-900/40 to-amber-700/20",
  accessories: "from-yellow-900/40 to-yellow-700/20",
  skincare: "from-green-900/40 to-green-700/20",
  wellness: "from-teal-900/40 to-teal-700/20",
};

// ── Template-aware product card ─────────────────────────────────────────────
function ProductCard({ product, handle, t }: { product: Product; handle: string; t: TemplateConfig }) {
  const isDark = t.id === "noir";
  const textMain = isDark ? "text-white" : "text-gray-900";
  const textSub = isDark ? "text-gray-400" : "text-gray-500";
  const gradientClass = CATEGORY_GRADIENT[product.category] || "from-gray-900/40 to-gray-700/20";
  const { isSaved, toggle: toggleWishlist } = useWishlist();
  const saved = isSaved(product.id);

  function handleHeartClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist({
      productId: product.id,
      productName: product.name,
      price: Number(product.price),
      currency: product.currency,
      creatorHandle: handle,
      imageUrl: product.media_urls?.[0],
      category: product.category,
    });
  }

  return (
    <Link href={`/${handle}/${product.id}`} className="block group">
      <div
        className={`${t.cardBg} rounded-2xl overflow-hidden border ${t.cardBorder} transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl relative`}
        style={isDark ? { boxShadow: "0 4px 20px rgba(0,0,0,0.4)" } : undefined}
      >
        {/* Product image / placeholder */}
        <div className={`aspect-[4/5] overflow-hidden relative ${isDark ? "bg-[#222]" : "bg-gradient-to-br from-gray-50 to-gray-100"}`}>
          {product.media_urls && product.media_urls[0] ? (
            <Image
              src={product.media_urls[0]}
              alt={product.image_alt_text || `${product.name}${product.color ? ` in ${product.color}` : ''} product image`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              quality={75}
            />
          ) : (
            // Rich placeholder when no image
            <div className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br ${gradientClass} relative`}>
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg mb-2"
                style={{ backgroundColor: `${t.accentHex}22`, border: `1px solid ${t.accentHex}44` }}
              >
                {CATEGORY_EMOJI[product.category.toLowerCase()] || "🛍️"}
              </div>
              <p className="text-xs font-medium opacity-50 uppercase tracking-widest" style={{ color: t.accentHex }}>
                {product.category}
              </p>
            </div>
          )}

          {/* Sold out overlay */}
          {product.inventory_count === 0 && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="bg-white/90 text-gray-800 text-xs font-bold px-3 py-1.5 rounded-full tracking-wider uppercase">
                Sold Out
              </span>
            </div>
          )}

          {/* Wishlist heart button */}
          <button
            onClick={handleHeartClick}
            className="absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-transform active:scale-90 z-10"
            style={{ backgroundColor: saved ? "#fff0f0" : "rgba(255,255,255,0.85)" }}
            aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
          >
            <span className="text-base leading-none">{saved ? "❤️" : "🤍"}</span>
          </button>

          {/* Low stock badge */}
          {product.inventory_count > 0 && product.inventory_count <= 3 && (
            <div className="absolute top-2.5 right-2.5">
              <span
                className="text-xs font-black px-2.5 py-1 rounded-full shadow-md"
                style={{ backgroundColor: t.accentHex, color: "#0A0A0A" }}
              >
                {product.inventory_count} left!
              </span>
            </div>
          )}

          {/* New badge (placeholder — shows for first 2 products) */}
          {product.inventory_count > 3 && !product.video_url && (
            <div className="absolute top-2.5 left-2.5">
              <span
                className="text-[10px] font-black px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${t.accentHex}dd`, color: "#0A0A0A" }}
              >
                NEW
              </span>
            </div>
          )}

          {/* Video badge */}
          {product.video_url && (
            <div className="absolute top-2.5 left-2.5">
              <span
                className="text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5"
                style={{ backgroundColor: "rgba(0,0,0,0.75)", color: "#fff" }}
              >
                ▶ Video
              </span>
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="p-3">
          {product.category && (
            <p className={`text-[10px] uppercase tracking-widest font-bold mb-1 ${textSub}`} style={{ color: t.accentHex }}>
              {product.category}
            </p>
          )}
          <p className={`font-bold text-sm leading-tight line-clamp-2 mb-1 ${textMain}`}>
            {product.name}
          </p>
          {product.color && (
            <p className={`text-xs ${textSub}`}>{product.color}</p>
          )}
          <div className="flex items-center justify-between mt-2">
            <p className={`font-black text-base ${t.priceBold}`}>
              {currencySymbol(product.currency)} {Number(product.price).toFixed(2)}
            </p>
          </div>
          {product.inventory_count > 0 && (
            <div
              className={`mt-2.5 w-full ${t.btnBg} ${t.btnText} text-xs py-2.5 rounded-xl font-black text-center tracking-wide transition-opacity group-hover:opacity-90`}
            >
              Order Now
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── Main StorefrontShell ────────────────────────────────────────────────────
export default function StorefrontShell({
  creator,
  handle,
  products,
  template,
  previewMode,
}: {
  creator: Creator;
  handle: string;
  products: Product[];
  template: TemplateConfig;
  previewMode: boolean;
}) {
  const [activeTemplate, setActiveTemplate] = useState<TemplateId>(template.id);
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [shareCopied, setShareCopied] = useState(false);
  const { count } = useCart();
  const { count: wishlistCount } = useWishlist();

  const handleShare = useCallback(() => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      navigator.share({ title: `@${handle}'s store`, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      }).catch(() => {});
    }
  }, [handle]);
  const t = TEMPLATES[activeTemplate];
  const creatorWA = resolveWhatsApp(creator.payout_details_ref);

  const displayName = creator.name || `@${handle}`;
  const inStock = products.filter((p) => p.inventory_count > 0).length;
  const initial = displayName.charAt(0).toUpperCase();
  const isDark = t.id === "noir";
  const textMain = isDark ? "text-white" : "text-gray-900";
  const textSub = isDark ? "text-gray-400" : "text-gray-500";

  // Derive unique categories from products (only if >1 category present)
  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
  const showFilter = categories.length > 1;

  // Apply search + category filter
  const displayProducts = products.filter((p) => {
    const matchCat = activeCategory === "all" || p.category === activeCategory;
    const matchSearch = !searchQ || p.name.toLowerCase().includes(searchQ.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <main className={`min-h-screen ${t.bg} transition-colors duration-300`}>

      {/* ── Template preview bar ── */}
      {previewMode && (
        <div className="bg-[#0A0A0A] border-b border-white/10 px-4 py-2.5 flex items-center gap-2 overflow-x-auto">
          <span className="text-white/40 text-[10px] whitespace-nowrap shrink-0 font-bold tracking-widest uppercase">Template:</span>
          {(Object.values(TEMPLATES) as TemplateConfig[]).map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => setActiveTemplate(tmpl.id)}
              className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                activeTemplate === tmpl.id
                  ? "bg-[#C9A84C] text-[#0A0A0A]"
                  : "bg-white/10 text-white/60 hover:bg-white/20"
              }`}
            >
              {tmpl.name}
            </button>
          ))}
        </div>
      )}

      {/* ── Hero Banner ── */}
      <div className={`${t.headerBg} relative overflow-hidden`}>
        {/* Decorative background glow */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: `radial-gradient(ellipse at top center, ${t.accentHex}40 0%, transparent 70%)`,
          }}
        />

        {/* Kente texture on kente template */}
        {t.id === "kente" && (
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, #F5A623 0px, #F5A623 2px, transparent 2px, transparent 10px), repeating-linear-gradient(-45deg, #8B2500 0px, #8B2500 2px, transparent 2px, transparent 10px)",
            }}
          />
        )}

        <div className="relative max-w-lg mx-auto px-5 pt-8 pb-6">
          {/* Top row: avatar + name */}
          <div className="flex items-center gap-4 mb-5">
            {/* Avatar */}
            <div
              className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center font-black text-3xl shrink-0 shadow-2xl ring-2"
              style={{
                backgroundColor: `${t.accentHex}22`,
                border: `2px solid ${t.accentHex}`,
              }}
            >
              {creator.avatar_url ? (
                <Image
                  src={creator.avatar_url}
                  alt={displayName}
                  fill
                  className="object-cover"
                  loading="eager"
                  quality={85}
                />
              ) : (
                <span style={{ color: t.accentHex }}>{initial}</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              {/* "Creator Store" badge */}
              <span
                className="inline-block text-[10px] font-black tracking-[0.2em] uppercase px-3 py-0.5 rounded-full mb-2"
                style={{ backgroundColor: `${t.accentHex}22`, color: t.accentHex, border: `1px solid ${t.accentHex}44` }}
              >
                Creator Store
              </span>
              <h1 className={`text-2xl font-black leading-tight ${t.headerText}`}>{displayName}</h1>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <p className="text-sm opacity-50" style={{ color: t.accentHex }}>
                  @{handle}
                </p>
                {creator.platform_name && PLATFORM_ICON[creator.platform_name] && (
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${PLATFORM_COLOR[creator.platform_name] || t.accentHex}22`,
                      color: PLATFORM_COLOR[creator.platform_name] || t.accentHex,
                      border: `1px solid ${PLATFORM_COLOR[creator.platform_name] || t.accentHex}44`,
                    }}
                  >
                    {PLATFORM_ICON[creator.platform_name]}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Bio */}
          {creator.bio && (
            <p className={`text-sm leading-relaxed mb-4 ${t.headerText} opacity-70`}>
              {creator.bio}
            </p>
          )}

          {/* Share button */}
          <button
            onClick={handleShare}
            className="mb-4 flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
            style={{
              backgroundColor: shareCopied ? `${t.accentHex}30` : `${t.accentHex}15`,
              color: t.accentHex,
              border: `1px solid ${t.accentHex}30`,
            }}
          >
            {shareCopied ? "✓ Link copied!" : "⬆ Share store"}
          </button>

          {/* Stats row */}
          <div className="flex gap-5">
            <div className="text-center">
              <p className={`text-2xl font-black ${t.headerText}`}>{products.length}</p>
              <p className="text-[10px] uppercase tracking-widest font-bold opacity-40" style={{ color: t.accentHex }}>
                Products
              </p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-black ${t.headerText}`}>{inStock}</p>
              <p className="text-[10px] uppercase tracking-widest font-bold opacity-40" style={{ color: t.accentHex }}>
                In Stock
              </p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-black`} style={{ color: "#4ade80" }}>72h</p>
              <p className="text-[10px] uppercase tracking-widest font-bold opacity-40" style={{ color: t.accentHex }}>
                Delivery
              </p>
            </div>
          </div>

          {/* Campaign name if set */}
          {creator.campaign_name && (
            <div
              className="mt-4 px-4 py-2.5 rounded-xl text-sm font-bold"
              style={{ backgroundColor: `${t.accentHex}15`, color: t.accentHex, border: `1px solid ${t.accentHex}25` }}
            >
              ✨ {creator.campaign_name}
            </div>
          )}
        </div>

        {/* Accent divider */}
        <div className={`h-0.5 bg-gradient-to-r ${t.divider}`} />
      </div>

      {/* ── Quick Order via WhatsApp (sticky top strip) ── */}
      <div
        className="sticky top-0 z-30 px-4 py-2.5 flex items-center justify-between shadow-lg"
        style={{ backgroundColor: t.id === "noir" ? "#111" : "#fff", borderBottom: `1px solid ${t.accentHex}22` }}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full inline-block animate-pulse"
            style={{ backgroundColor: "#4ade80" }}
          />
          <span className={`text-xs font-bold ${textSub}`}>
            {inStock} items available · Pay on delivery
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Wishlist heart icon with badge */}
          <button
            onClick={() => setWishlistOpen(true)}
            className="relative text-gray-700"
            aria-label="Open wishlist"
          >
            <span className="text-lg">{wishlistCount > 0 ? "❤️" : "🤍"}</span>
            {wishlistCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#C9A84C] text-black text-[10px] font-black rounded-full flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </button>
          {/* Cart icon with badge */}
          <button
            onClick={() => setCartOpen(true)}
            className="relative text-gray-700"
            aria-label="Open cart"
          >
            <span className="text-lg">🛒</span>
            {count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#C9A84C] text-black text-[10px] font-black rounded-full flex items-center justify-center">
                {count}
              </span>
            )}
          </button>
          <a
            href={`https://wa.me/${creatorWA}?text=${encodeURIComponent(`Hi @${handle}! I found your Yes MAM store and want to order. Can you help?`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-[#25D366] text-white text-xs font-black px-3 py-1.5 rounded-xl"
          >
            <span>💬</span> WhatsApp
          </a>
        </div>
      </div>

      {/* ── Product Grid ── */}
      <div className="max-w-lg mx-auto px-4 py-6">
        {products.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`font-black text-lg ${textMain}`}>
                {creator.campaign_name || "Featured Products"}
              </h2>
              <span className={`text-xs font-bold ${textSub}`}>
                {displayProducts.filter(p => p.inventory_count > 0).length} in stock
              </span>
            </div>

            {/* ── Search bar ── */}
            <div className="relative mb-3">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none opacity-40">🔍</span>
              <input
                type="search"
                placeholder="Search products…"
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border focus:outline-none transition-colors"
                style={{
                  backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                  borderColor: isDark ? "rgba(255,255,255,0.1)" : `${t.accentHex}20`,
                  color: isDark ? "#fff" : "#111",
                }}
              />
              {searchQ && (
                <button
                  onClick={() => setSearchQ("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs opacity-40 hover:opacity-70"
                  style={{ color: isDark ? "#fff" : "#111" }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* ── Category pills ── */}
            {showFilter && (
              <div className="flex gap-2 flex-wrap mb-5">
                <button
                  onClick={() => setActiveCategory("all")}
                  className="text-xs font-bold px-3 py-1 rounded-full transition-all"
                  style={
                    activeCategory === "all"
                      ? { backgroundColor: t.accentHex, color: "#0A0A0A" }
                      : { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : `${t.accentHex}15`, color: isDark ? "rgba(255,255,255,0.6)" : t.accentHex }
                  }
                >
                  All ({products.length})
                </button>
                {categories.map(cat => {
                  const catCount = products.filter(p => p.category === cat).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className="text-xs font-bold px-3 py-1 rounded-full transition-all capitalize"
                      style={
                        activeCategory === cat
                          ? { backgroundColor: t.accentHex, color: "#0A0A0A" }
                          : { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : `${t.accentHex}15`, color: isDark ? "rgba(255,255,255,0.6)" : t.accentHex }
                      }
                    >
                      {CATEGORY_EMOJI[cat.toLowerCase()] || ""} {cat} ({catCount})
                    </button>
                  );
                })}
              </div>
            )}

            {/* Product grid or empty-filter state */}
            {displayProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {displayProducts.map((product) => (
                  <ProductCard key={product.id} product={product} handle={handle} t={t} />
                ))}
              </div>
            ) : (
              <div className={`text-center py-10 ${t.cardBg} rounded-2xl border ${t.cardBorder}`}>
                <p className="text-2xl mb-2">🔍</p>
                <p className={`font-bold text-sm mb-1 ${textMain}`}>No products match</p>
                <button
                  onClick={() => { setSearchQ(""); setActiveCategory("all"); }}
                  className="text-xs underline opacity-50 hover:opacity-80"
                  style={{ color: t.accentHex }}
                >
                  Clear filters
                </button>
              </div>
            )}

            {/* Bottom CTA after grid */}
            <div className="mt-8 text-center">
              <p className={`text-sm ${textSub} mb-3`}>Don't see what you want?</p>
              <a
                href={`https://wa.me/${creatorWA}?text=${encodeURIComponent(`Hi @${handle}! I'm on your Yes MAM store. Can you help me find something?`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl border transition-colors"
                style={{
                  borderColor: `${t.accentHex}40`,
                  color: t.accentHex,
                  backgroundColor: `${t.accentHex}08`,
                }}
              >
                <span>💬</span>
                Ask me on WhatsApp
              </a>
            </div>
          </>
        ) : (
          /* Empty state — still looks great */
          <div className={`text-center py-16 ${t.cardBg} rounded-3xl border ${t.cardBorder}`}>
            <div className="text-5xl mb-4">🛍️</div>
            <p className={`font-black text-lg mb-2 ${textMain}`}>Products coming soon!</p>
            <p className={`text-sm mb-6 ${textSub}`}>
              Follow me on TikTok <strong>@{handle}</strong> for the drop.
            </p>
            <a
              href={`https://wa.me/${creatorWA}?text=${encodeURIComponent(`Hi @${handle}! I visited your store but there are no products yet. When will you have items?`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] text-white text-sm font-bold px-5 py-2.5 rounded-xl"
            >
              💬 Get notified on WhatsApp
            </a>
          </div>
        )}
      </div>

      {/* ── WhatsApp block ── */}
      <div className="max-w-lg mx-auto px-4 pb-6">
        <div
          className={`${t.cardBg} border ${t.cardBorder} rounded-2xl p-5`}
          style={{ borderColor: `${t.accentHex}25` }}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#25D366] rounded-2xl flex items-center justify-center shrink-0 text-white text-xl shadow-md">
              💬
            </div>
            <div className="flex-1">
              <p className={`font-black text-base mb-1 ${textMain}`}>Order via WhatsApp</p>
              <p className={`text-xs leading-relaxed mb-3 ${textSub}`}>
                Prefer chatting? Message me directly and I'll handle your order personally. I reply within 2 hours.
              </p>
              <a
                href={`https://wa.me/${creatorWA}?text=${encodeURIComponent(`Hi @${handle}! I want to order from your Yes MAM store. Can you help me?`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-[#25D366] text-white text-sm font-black px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
              >
                Start chat →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Trust signals ── */}
      <div className="max-w-lg mx-auto px-4 pb-6">
        <div className={`grid grid-cols-3 gap-2`}>
          {[
            { icon: "🚚", label: "Accra delivery", sub: "Within 72 hours" },
            { icon: "💰", label: "Pay on delivery", sub: "Cash or MoMo" },
            { icon: "🔒", label: "Secure & trusted", sub: "Yes MAM platform" },
          ].map(({ icon, label, sub }) => (
            <div
              key={label}
              className={`${t.cardBg} border ${t.cardBorder} rounded-xl p-3 text-center`}
              style={{ borderColor: `${t.accentHex}15` }}
            >
              <div className="text-xl mb-1">{icon}</div>
              <p className={`text-[11px] font-bold ${textMain}`}>{label}</p>
              <p className={`text-[10px] ${textSub} mt-0.5`}>{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer ── */}
      <div
        className="border-t py-6 px-4"
        style={{ borderColor: t.id === "noir" ? "rgba(255,255,255,0.06)" : `${t.accentHex}15` }}
      >
        <div className="max-w-lg mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #A8832A 0%, #C9A84C 40%, #E8C97A 100%)" }}
            >
              <span className="text-[10px] font-black text-[#0A0A0A]">Y</span>
            </div>
            <span className={`text-xs font-black ${t.footerText}`} style={{ color: t.accentHex }}>
              Yes MAM
            </span>
          </div>
          <p className={`text-xs ${t.footerText} mb-1`}>
            Micro-Affiliate Marketing · Africa's Creator Commerce Platform
          </p>
          <a
            href="/mam/home"
            className="text-xs underline underline-offset-2 opacity-40 hover:opacity-70 transition-opacity"
            style={{ color: t.accentHex }}
          >
            Start your free store →
          </a>
        </div>
      </div>

      {/* Cart Drawer */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      {/* Wishlist Drawer */}
      <WishlistDrawer open={wishlistOpen} onClose={() => setWishlistOpen(false)} creatorHandle={handle} />
    </main>
  );
}
