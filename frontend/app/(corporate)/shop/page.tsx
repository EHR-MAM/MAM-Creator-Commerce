// Yes MAM — Marketplace Homepage (Sprint H, Amazon-model redesign)
// Design spec: C:\MAM\.superpowers\brainstorm\196238-1775005994\yesmam-full.html
// Decision recorded: DECISIONS.md 2026-03-31
"use client";
import { useState, useEffect, useRef, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8200";

// ─── TYPES ──────────────────────────────────────────────────────────────────
interface Influencer {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  followers: string;
  sales: number;
  platform: string;
}
interface Product {
  id: number | string;
  cat: string;
  badge: "new" | "hot" | "sale" | "";
  title: string;
  price: number;
  orig: number;
  img: string;
  inf: string;
  rating: number;
  reviews: number;
  sales: string;
  desc: string;
  specs: [string, string][];
  creator_handle?: string;
}
interface CartItem extends Product {
  infId: string;
  infHandle: string;
  qty: number;
}
interface ApiInfluencer {
  handle: string;
  platform_name?: string;
  avatar_url?: string | null;
  bio?: string | null;
  total_earned?: number;
  orders_count?: number;
}

interface ApiProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  category: string;
  inventory_count: number;
  status: string;
  media_urls?: string[];
  rating?: number;
  review_count?: number;
  vendor_id: string;
  creator_handle?: string;
}

const FALLBACK_IMGS: Record<string, string> = {
  fashion: "https://images.unsplash.com/photo-1594938298603-c8148c4b4d0a?w=500&q=80&auto=format&fit=crop",
  hair: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&q=80&auto=format&fit=crop",
  "hair & beauty": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&q=80&auto=format&fit=crop",
  beauty: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&q=80&auto=format&fit=crop",
  accessories: "https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=500&q=80&auto=format&fit=crop",
  skincare: "https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=500&q=80&auto=format&fit=crop",
  footwear: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&q=80&auto=format&fit=crop",
  electronics: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=500&q=80&auto=format&fit=crop",
  fitness: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&q=80&auto=format&fit=crop",
  "home & living": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&q=80&auto=format&fit=crop",
  "mother & baby": "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=500&q=80&auto=format&fit=crop",
  "books & culture": "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=500&q=80&auto=format&fit=crop",
  jewelry: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&q=80&auto=format&fit=crop",
  wellness: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500&q=80&auto=format&fit=crop",
};

function mapApiProduct(p: ApiProduct): Product {
  const catKey = p.category.toLowerCase();
  const img = (p.media_urls && p.media_urls[0]) || FALLBACK_IMGS[catKey] || FALLBACK_IMGS.fashion;
  return {
    id: p.id,
    cat: catKey,
    badge: "",
    title: p.name,
    price: Number(p.price),
    orig: 0,
    img,
    inf: p.creator_handle || "sweet200723",
    rating: Number(p.rating || 4.5),
    reviews: Number(p.review_count || 0),
    sales: `${p.inventory_count > 0 ? "In stock" : "Limited"}`,
    desc: p.description || "",
    specs: [
      ["Category", p.category],
      ["Currency", p.currency],
      ["Stock", String(p.inventory_count)],
    ],
    creator_handle: p.creator_handle,
  };
}

// ─── STATIC DATA ────────────────────────────────────────────────────────────
const INFLUENCERS: Influencer[] = [
  { id: "sweet200723", name: "Christiana Amankwaah", handle: "@sweet200723", avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=120&q=80&auto=format&fit=crop&crop=face", followers: "10.4K", sales: 142, platform: "TikTok" },
  { id: "glamgh", name: "Gloria Mensah", handle: "@glamgh", avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=120&q=80&auto=format&fit=crop&crop=faces&facepad=3", followers: "28K", sales: 310, platform: "Instagram" },
  { id: "beautyboss", name: "Adwoa Sarfo", handle: "@beautyboss_gh", avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=120&q=80&auto=format&fit=crop&crop=top", followers: "15K", sales: 87, platform: "TikTok" },
  { id: "fashionqueengh", name: "Efua Asante", handle: "@fashionqueengh", avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=120&q=80&auto=format&fit=crop", followers: "22K", sales: 203, platform: "Instagram" },
  { id: "accrastyle", name: "Nana Akosua", handle: "@accrastyle", avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=120&q=80&auto=format&fit=crop&crop=entropy", followers: "8.2K", sales: 64, platform: "YouTube" },
];

const PRODUCTS: Product[] = [
  // FASHION
  { id: 1, cat: "fashion", badge: "new", title: "Ankara Wrap Dress — Kente Print", price: 185, orig: 220, img: "https://images.unsplash.com/photo-1594938298603-c8148c4b4d0a?w=500&q=80&auto=format&fit=crop", inf: "sweet200723", rating: 4.5, reviews: 24, sales: "89 sold", desc: "Vibrant Ankara wrap dress in authentic Kente print. Machine washable, breathable cotton blend. Perfect for casual and formal occasions.", specs: [["Material", "100% Cotton"], ["Sizes", "XS–3XL"], ["Origin", "Made in Ghana"], ["Care", "Machine wash cold"], ["Delivery", "2–3 days Accra"]] },
  { id: 2, cat: "fashion", badge: "hot", title: "Dashiki Off-Shoulder Top", price: 95, orig: 120, img: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=500&q=80&auto=format&fit=crop", inf: "glamgh", rating: 4.8, reviews: 47, sales: "203 sold", desc: "Classic dashiki pattern off-shoulder top. Loose fit, lightweight fabric perfect for warm weather.", specs: [["Material", "Polyester blend"], ["Sizes", "S–2XL"], ["Colors", "3 available"], ["Care", "Hand wash"], ["Delivery", "2–3 days Accra"]] },
  { id: 3, cat: "fashion", badge: "", title: "Kente Stripe Palazzo Pants", price: 145, orig: 0, img: "https://images.unsplash.com/photo-1594938298603-c8148c4b4d0a?w=500&q=80&auto=format&fit=crop&crop=bottom", inf: "fashionqueengh", rating: 4.3, reviews: 18, sales: "55 sold", desc: "Wide-leg palazzo pants with authentic Kente stripe detail. Elastic waist for comfort.", specs: [["Material", "Viscose"], ["Sizes", "XS–2XL"], ["Waist", "Elastic"], ["Delivery", "2–3 days Accra"]] },
  { id: 4, cat: "fashion", badge: "new", title: "African Print Midi Skirt", price: 110, orig: 0, img: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&q=80&auto=format&fit=crop", inf: "accrastyle", rating: 4.6, reviews: 31, sales: "112 sold", desc: "Beautiful midi skirt in vibrant African print. A-line silhouette flatters all body types.", specs: [["Material", "Cotton"], ["Length", "Midi (below knee)"], ["Sizes", "XS–3XL"], ["Delivery", "2–3 days Accra"]] },
  { id: 5, cat: "fashion", badge: "sale", title: "Two-Piece Ankara Coord Set", price: 220, orig: 280, img: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=500&q=80&auto=format&fit=crop&crop=top", inf: "sweet200723", rating: 4.9, reviews: 63, sales: "178 sold", desc: "Matching crop top and high-waist trouser set in bold Ankara print. Perfect for events.", specs: [["Material", "Cotton blend"], ["Sizes", "S–2XL"], ["Set", "Top + Trousers"], ["Delivery", "2–3 days Accra"]] },
  { id: 6, cat: "fashion", badge: "", title: "Boubou Maxi Gown — Gold Embroidery", price: 350, orig: 0, img: "https://images.unsplash.com/photo-1594938298603-c8148c4b4d0a?w=500&q=80&auto=format&fit=crop&crop=top", inf: "glamgh", rating: 4.7, reviews: 29, sales: "44 sold", desc: "Luxurious boubou maxi gown with hand-embroidered gold detailing. For weddings and special events.", specs: [["Material", "Satin + embroidery"], ["Sizes", "S–3XL"], ["Delivery", "3–5 days Accra"]] },
  // HAIR
  { id: 9, cat: "hair", badge: "hot", title: "Full Lace Wig 24\" — Natural Black", price: 320, orig: 400, img: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&q=80&auto=format&fit=crop", inf: "glamgh", rating: 4.8, reviews: 156, sales: "521 sold", desc: "Premium full lace wig, 24 inches, 150% density natural black human hair. Pre-plucked hairline, baby hairs included.", specs: [["Type", "Full Lace"], ["Length", "24 inches"], ["Density", "150%"], ["Hair type", "100% Human hair"], ["Color", "Natural Black"]] },
  { id: 10, cat: "hair", badge: "new", title: "Brazilian Body Wave Bundle 3-Pack", price: 450, orig: 550, img: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&q=80&auto=format&fit=crop&crop=top", inf: "sweet200723", rating: 4.9, reviews: 203, sales: "834 sold", desc: "Premium Brazilian body wave hair bundles, 3-pack (18/20/22 inches). 100% unprocessed remy human hair.", specs: [["Origin", "Brazilian"], ["Texture", "Body Wave"], ["Pack", "3 bundles"], ["Lengths", "18+20+22 inch"], ["Type", "100% Remy"]] },
  { id: 11, cat: "hair", badge: "", title: "Closure 4x4 Lace — Straight", price: 180, orig: 0, img: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&q=80&auto=format&fit=crop&crop=bottom", inf: "fashionqueengh", rating: 4.6, reviews: 88, sales: "267 sold", desc: "High-quality 4x4 lace closure, straight texture, pre-plucked with baby hair. Natural-looking hairline.", specs: [["Size", "4x4"], ["Texture", "Straight"], ["Density", "130%"], ["Hair", "Human Hair"]] },
  { id: 13, cat: "hair", badge: "hot", title: "HD Lace Front Wig — Ombre Brown", price: 380, orig: 480, img: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&q=80&auto=format&fit=crop&crop=left", inf: "accrastyle", rating: 4.7, reviews: 112, sales: "389 sold", desc: "Invisible HD lace front wig in gorgeous ombre brown. 20 inches, 180% density, pre-styled and ready to wear.", specs: [["Type", "HD Lace Front"], ["Color", "Ombre Brown"], ["Density", "180%"], ["Length", "20 inch"]] },
  // BEAUTY
  { id: 14, cat: "beauty", badge: "new", title: "Fenty Beauty Pro Filt'r Foundation", price: 95, orig: 0, img: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&q=80&auto=format&fit=crop", inf: "beautyboss", rating: 4.9, reviews: 312, sales: "1,204 sold", desc: "Pro Filt'r Soft Matte Longwear Foundation. 40 inclusive shades for all skin tones. 24-hour wear, oil-free.", specs: [["Brand", "Fenty Beauty"], ["Finish", "Matte"], ["Coverage", "Full"], ["Wear", "24 hour"], ["Size", "32ml"]] },
  { id: 15, cat: "beauty", badge: "", title: "MAC Lipstick — Ruby Woo", price: 65, orig: 0, img: "https://images.unsplash.com/photo-1586495777744-4e6232bf5e05?w=500&q=80&auto=format&fit=crop", inf: "sweet200723", rating: 4.8, reviews: 89, sales: "456 sold", desc: "MAC's iconic Ruby Woo vivid blue-red retro matte lipstick. Cult favourite worldwide.", specs: [["Brand", "MAC"], ["Shade", "Ruby Woo"], ["Finish", "Matte"], ["Size", "3g"]] },
  { id: 16, cat: "beauty", badge: "hot", title: "Highlighter Palette — Gold Goddess", price: 75, orig: 95, img: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&q=80&auto=format&fit=crop&crop=top", inf: "glamgh", rating: 4.7, reviews: 67, sales: "234 sold", desc: "6-shade highlighting palette with intense gold, rose gold, and bronze tones. Buildable glow.", specs: [["Shades", "6"], ["Finish", "Shimmer"], ["Size", "15g total"], ["Cruelty free", "Yes"]] },
  { id: 17, cat: "beauty", badge: "new", title: "10-Piece Makeup Brush Set", price: 85, orig: 110, img: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500&q=80&auto=format&fit=crop", inf: "beautyboss", rating: 4.6, reviews: 145, sales: "678 sold", desc: "Professional 10-piece synthetic makeup brush set with roll-up case. Foundation, blush, contour, eye brushes.", specs: [["Pieces", "10"], ["Material", "Synthetic"], ["Includes", "Case"], ["Vegan", "Yes"]] },
  // ACCESSORIES
  { id: 19, cat: "accessories", badge: "new", title: "Gold Statement Necklace — Layered", price: 75, orig: 0, img: "https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=500&q=80&auto=format&fit=crop&crop=top", inf: "fashionqueengh", rating: 4.7, reviews: 38, sales: "145 sold", desc: "Bold layered gold statement necklace. 18k gold plated. Perfect for event looks.", specs: [["Material", "18k Gold plated"], ["Length", "16–20 inch adjustable"], ["Style", "Layered"], ["Care", "Avoid water"]] },
  { id: 20, cat: "accessories", badge: "hot", title: "Beaded Waist Chain — Ghanaian", price: 45, orig: 60, img: "https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=500&q=80&auto=format&fit=crop", inf: "accrastyle", rating: 4.9, reviews: 92, sales: "412 sold", desc: "Traditional Ghanaian beaded waist chain. Hand-crafted. Available in multiple colour combos.", specs: [["Material", "Glass beads"], ["Closure", "Clasp"], ["Made in", "Ghana"], ["Colours", "5 options"]] },
  { id: 21, cat: "accessories", badge: "", title: "African Print Mini Handbag", price: 120, orig: 0, img: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&q=80&auto=format&fit=crop", inf: "glamgh", rating: 4.5, reviews: 27, sales: "78 sold", desc: "Compact mini handbag in vibrant African wax print with gold chain strap. Fits phone, cards, keys.", specs: [["Material", "Faux leather + wax fabric"], ["Size", "18×14×6 cm"], ["Strap", "Gold chain"], ["Compartments", "2 inner"]] },
  // SKINCARE
  { id: 23, cat: "skincare", badge: "hot", title: "Shea Butter Body Cream — Unrefined", price: 55, orig: 70, img: "https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=500&q=80&auto=format&fit=crop", inf: "beautyboss", rating: 4.9, reviews: 234, sales: "1,102 sold", desc: "100% pure unrefined raw shea butter body cream. Deep moisture, reduces stretch marks, all skin types.", specs: [["Ingredients", "100% Shea butter"], ["Size", "250ml"], ["Skin type", "All"], ["Scent", "Unscented"], ["Origin", "Ghana"]] },
  { id: 24, cat: "skincare", badge: "new", title: "Black Soap Face Wash", price: 35, orig: 0, img: "https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=500&q=80&auto=format&fit=crop&crop=top", inf: "accrastyle", rating: 4.7, reviews: 156, sales: "623 sold", desc: "Authentic African black soap face wash. Fights acne, evens skin tone, gentle daily cleanser.", specs: [["Type", "Face wash"], ["Size", "200ml"], ["Skin type", "All, especially oily"], ["Ingredients", "Black soap, aloe, tea tree"]] },
  { id: 25, cat: "skincare", badge: "", title: "Vitamin C Brightening Serum", price: 85, orig: 105, img: "https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=500&q=80&auto=format&fit=crop&crop=bottom", inf: "glamgh", rating: 4.8, reviews: 89, sales: "334 sold", desc: "10% Vitamin C brightening serum. Fades dark spots, firms skin, boosts radiance. Results in 2 weeks.", specs: [["Active", "10% Vitamin C"], ["Size", "30ml"], ["Skin type", "All"], ["Texture", "Lightweight serum"]] },
  // FOOTWEAR
  { id: 26, cat: "footwear", badge: "new", title: "Ankara Platform Sandals", price: 165, orig: 0, img: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&q=80&auto=format&fit=crop", inf: "fashionqueengh", rating: 4.6, reviews: 44, sales: "123 sold", desc: "Bold platform sandals with Ankara fabric strap detailing. 4cm platform, cushioned insole.", specs: [["Heel", "4cm platform"], ["Material", "Fabric + rubber sole"], ["Sizes", "36–42"], ["Closure", "Buckle"]] },
  { id: 27, cat: "footwear", badge: "hot", title: "Gold Kitten Heel Mule", price: 140, orig: 180, img: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&q=80&auto=format&fit=crop&crop=top", inf: "accrastyle", rating: 4.8, reviews: 67, sales: "289 sold", desc: "Elegant gold kitten heel mule. Faux suede upper, 5cm heel, slip-on design. Event ready.", specs: [["Heel", "5cm kitten"], ["Material", "Faux suede"], ["Sizes", "36–41"], ["Color", "Gold"]] },
];

const CATS = [
  { key: "all", label: "All Products", icon: "🛍️" },
  { key: "fashion", label: "Fashion", icon: "👗" },
  { key: "hair & beauty", label: "Hair & Beauty", icon: "💇" },
  { key: "skincare", label: "Skincare", icon: "🧴" },
  { key: "electronics", label: "Electronics", icon: "📱" },
  { key: "fitness", label: "Fitness", icon: "🏋️" },
  { key: "home & living", label: "Home & Living", icon: "🏡" },
  { key: "mother & baby", label: "Mother & Baby", icon: "🍼" },
  { key: "jewelry", label: "Jewelry", icon: "💎" },
  { key: "books & culture", label: "Books & Culture", icon: "📚" },
  { key: "beauty", label: "Beauty", icon: "💄" },
  { key: "accessories", label: "Accessories", icon: "👜" },
  { key: "footwear", label: "Footwear", icon: "👠" },
];

const TICKER_MSGS = [
  "Free delivery on all Accra orders",
  "18% commission for influencers — join today",
  "Pay on delivery · MTN MoMo accepted",
  "New arrivals every week",
  "500+ African creators earning with Yes MAM",
  "Telecel Cash now accepted",
  "Shop confidently — free returns within 7 days",
];

// ─── HELPERS ────────────────────────────────────────────────────────────────
function stars(rating: number) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return "★".repeat(full) + (half ? "½" : "") + "☆".repeat(5 - full - (half ? 1 : 0));
}

function inf(id: string) {
  return INFLUENCERS.find(i => i.id === id) || INFLUENCERS[0];
}

function badgeLabel(b: string) {
  if (b === "new") return "NEW";
  if (b === "hot") return "🔥 HOT";
  if (b === "sale") return "SALE";
  return "";
}

function badgeColor(b: string) {
  if (b === "hot") return "bg-[#8B2500] text-white";
  if (b === "sale") return "bg-[#1a5c2e] text-white";
  return "bg-[#C9A84C] text-black";
}

// ─── COUNTRY BAR ─────────────────────────────────────────────────────────────
function CountryBar() {
  const [country, setCountry] = useState("GH");
  return (
    <div className="bg-[#0d0d0d] border-b border-[#1a1a1a] flex items-center justify-between px-4 py-1.5 text-xs sticky top-0 z-[201]">
      <div className="flex items-center gap-3 text-[#666]">
        <span className="flex items-center gap-1.5">
          <span>🌍</span>
          <select
            value={country}
            onChange={e => setCountry(e.target.value)}
            className="bg-[#141414] border border-[#2a2a2a] rounded px-2 py-0.5 text-[#C9A84C] font-semibold text-xs cursor-pointer outline-none focus:border-[#C9A84C]"
          >
            <option value="GH">Ghana 🇬🇭</option>
            <option value="NG">Nigeria 🇳🇬</option>
            <option value="KE">Kenya 🇰🇪</option>
            <option value="ZA">South Africa 🇿🇦</option>
          </select>
        </span>
        <span className="hidden sm:inline text-[#444]">Delivery to Accra: 2–3 business days</span>
      </div>
      <span className="text-[#2D6A4F] font-semibold">✓ Pay on delivery available</span>
    </div>
  );
}

// ─── SITE HEADER ─────────────────────────────────────────────────────────────
function SiteHeader({
  query, setQuery, cartCount, onSearch, onShowCart, onShowSignup, suggestions, onSelectSuggestion
}: {
  query: string; setQuery: (v: string) => void; cartCount: number;
  onSearch: (q: string) => void;
  onShowCart: () => void;
  onShowSignup: () => void;
  suggestions?: string[];
  onSelectSuggestion?: (s: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  const showDropdown = focused && !!query.trim() && suggestions && suggestions.length > 0;

  return (
    <div className="bg-[#111] border-b-2 border-[#C9A84C] sticky top-[33px] z-[200]">
      {/* Top row: logo + search + actions */}
      <div className="flex items-center gap-3 px-4 py-2.5 flex-wrap">
        {/* Logo */}
        <a href="/mam/shop" className="flex-shrink-0 bg-gradient-to-br from-[#A8832A] to-[#E8C97A] text-black font-black text-base px-3 py-1.5 rounded-lg leading-tight">
          Yes MAM<span className="block text-[9px] font-normal tracking-widest opacity-80">Creator Commerce</span>
        </a>

        {/* Search with autocomplete */}
        <div className="flex flex-1 min-w-[180px] relative">
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); onSearch(e.target.value); }}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            placeholder="Search products, influencers, brands..."
            className="flex-1 bg-[#1e1e1e] border-2 border-r-0 border-[#333] rounded-l-md px-3 py-2 text-sm text-white placeholder-[#555] outline-none focus:border-[#C9A84C] transition-colors"
          />
          <button className="bg-[#C9A84C] border-none px-4 rounded-r-md text-base hover:bg-[#E8C97A] transition-colors">🔍</button>
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-xl z-50 overflow-hidden">
              {suggestions!.slice(0, 6).map((s, i) => (
                <button
                  key={i}
                  onMouseDown={() => onSelectSuggestion?.(s)}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-[#C9A84C]/10 hover:text-[#C9A84C] transition-colors flex items-center gap-2"
                >
                  <span className="text-[#555] text-xs">🔍</span>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onShowSignup}
            className="bg-[#C9A84C] text-black font-bold text-xs px-3 py-2 rounded-md hover:bg-[#E8C97A] transition-colors whitespace-nowrap"
          >
            ★ Become an Affiliate
          </button>
          <a href="/mam/dashboard" className="text-[#C9A84C] border border-[#C9A84C]/30 text-xs px-3 py-2 rounded-md hover:bg-[#C9A84C]/10 transition-colors whitespace-nowrap hidden sm:block">
            👤 Creator Login
          </a>
          <button
            onClick={onShowCart}
            className="relative bg-[#1a1a1a] border border-[#333] text-[#C9A84C] text-xs px-3 py-2 rounded-md hover:border-[#C9A84C]/60 transition-colors whitespace-nowrap"
          >
            🛒 Cart
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#C9A84C] text-black text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Category nav strip */}
      <nav className="flex bg-[#0d0d0d] border-t border-[#1e1e1e] px-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {CATS.map(c => (
          <a
            key={c.key}
            href={`/mam/shop?cat=${c.key}`}
            className="text-[#999] text-xs px-3 py-2.5 whitespace-nowrap border-b-2 border-transparent hover:text-[#C9A84C] hover:border-[#C9A84C] transition-all"
          >
            {c.label}
          </a>
        ))}
        <a href="/mam/shop?view=influencers" className="text-[#C9A84C] text-xs px-3 py-2.5 whitespace-nowrap border-b-2 border-transparent hover:border-[#C9A84C] transition-all">
          ⭐ Top Influencers
        </a>
        <a href="/mam/shop?cat=deals" className="text-[#999] text-xs px-3 py-2.5 whitespace-nowrap border-b-2 border-transparent hover:text-[#C9A84C] hover:border-[#C9A84C] transition-all">
          🔥 Deals
        </a>
      </nav>
    </div>
  );
}

// ─── HERO BANNER ─────────────────────────────────────────────────────────────
function Hero({ onSignup }: { onSignup: () => void }) {
  return (
    <div className="relative overflow-hidden bg-[#0d0900] py-12 px-6 text-center">
      {/* BG image */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1400&q=50&auto=format&fit=crop')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.1,
        }}
      />
      <div className="relative z-10 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-[#C9A84C]/10 border border-[#C9A84C]/40 text-[#C9A84C] text-[11px] font-bold tracking-[2px] uppercase px-4 py-1.5 rounded-full mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-pulse" />
          🇬🇭 Africa&apos;s #1 Creator Commerce Platform
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-3">
          Shop through<br />
          <span className="bg-gradient-to-r from-[#A8832A] via-[#E8C97A] to-[#C9A84C] bg-clip-text text-transparent">
            Africa&apos;s Top Creators
          </span>
        </h1>
        <p className="text-[#999] text-base mb-6 leading-relaxed max-w-lg mx-auto">
          Discover products hand-picked by influencers you trust — fashion, beauty, hair, and more. Pay on delivery. Free returns.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button
            onClick={() => document.getElementById("cat-icons-row")?.scrollIntoView({ behavior: "smooth" })}
            className="bg-gradient-to-br from-[#A8832A] to-[#C9A84C] text-black font-bold px-7 py-3 rounded-lg text-sm hover:opacity-90 transition-opacity"
          >
            Shop Now →
          </button>
          <button
            onClick={onSignup}
            className="bg-transparent border-2 border-[#C9A84C] text-[#C9A84C] font-semibold px-7 py-3 rounded-lg text-sm hover:bg-[#C9A84C]/10 transition-colors"
          >
            ★ Become an Affiliate Influencer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PROMO TICKER ─────────────────────────────────────────────────────────────
function PromoTicker({ productCount }: { productCount: number | null }) {
  const msgs = [
    ...TICKER_MSGS,
    productCount ? `${productCount.toLocaleString()}+ products across 11 categories` : "1,200+ products across 11 categories",
  ];
  const doubled = [...msgs, ...msgs];
  return (
    <div className="overflow-hidden border-y border-[#C9A84C]/20 py-2 bg-gradient-to-r from-[#0d0900] via-[#1a1100] to-[#0d0900]">
      <div className="flex gap-12 whitespace-nowrap animate-marquee">
        {doubled.map((m, i) => (
          <span key={i} className="text-xs font-semibold text-[#C9A84C] shrink-0">
            ★ {m}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── CATEGORY ICON ROW ────────────────────────────────────────────────────────
function CatIconRow({ active, onSelect, isLoading }: { active: string; onSelect: (k: string) => void; isLoading?: boolean }) {
  const cats = [...CATS, { key: "deals", label: "Deals 🔥", icon: "🔥" }];
  return (
    <div id="cat-icons-row" className="flex gap-2.5 px-4 py-4 overflow-x-auto bg-[#0a0a0a]" style={{ scrollbarWidth: "none" }}>
      {cats.map(c => (
        <button
          key={c.key}
          onClick={() => onSelect(c.key)}
          disabled={isLoading}
          className={`flex flex-col items-center justify-center gap-1 bg-[#141414] border rounded-xl px-4 py-3 min-w-[76px] flex-shrink-0 transition-all hover:-translate-y-0.5 ${isLoading ? "opacity-50 cursor-wait" : ""} ${active === c.key ? "border-[#C9A84C] bg-[#C9A84C]/8" : "border-[#222] hover:border-[#C9A84C]/60"}`}
        >
          <span className={`text-2xl ${isLoading ? "animate-pulse" : ""}`}>{c.icon}</span>
          <span className="text-[11px] text-[#aaa] font-semibold text-center leading-tight">{c.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── PRODUCT CARD ─────────────────────────────────────────────────────────────
function ProductCard({ p, onView, onAddCart }: {
  p: Product;
  onView: (p: Product) => void;
  onAddCart: (p: Product, e: React.MouseEvent) => void;
}) {
  const creator = inf(p.inf);
  return (
    <div
      className="bg-[#141414] border border-[#222] rounded-xl overflow-hidden cursor-pointer hover:border-[#C9A84C]/40 hover:-translate-y-1 transition-all duration-200 hover:shadow-[0_8px_32px_rgba(201,168,76,0.1)] relative flex flex-col"
      onClick={() => onView(p)}
    >
      {/* Badge */}
      {p.badge && (
        <div className={`absolute top-2 left-2 text-[10px] font-black px-2 py-0.5 rounded z-10 ${badgeColor(p.badge)}`}>
          {badgeLabel(p.badge)}
        </div>
      )}

      {/* Image */}
      <div className="relative overflow-hidden" style={{ aspectRatio: "1/1" }}>
        <img
          src={p.img}
          alt={p.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Body */}
      <div className="p-3 flex flex-col flex-1">
        {/* Influencer tag */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <img src={creator.avatar} alt="" className="w-5 h-5 rounded-full object-cover border border-[#C9A84C]/30" />
          <span className="text-[11px] text-[#C9A84C] font-semibold">{creator.handle}</span>
        </div>

        {/* Title */}
        <p className="text-sm text-[#ddd] leading-snug mb-2 line-clamp-2 flex-1">{p.title}</p>

        {/* Stars */}
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-[#C9A84C] text-xs tracking-tight">{stars(p.rating)}</span>
          <span className="text-[#555] text-[11px]">({p.reviews})</span>
        </div>

        {/* Price */}
        <div className="mb-1.5">
          <span className="text-lg font-black text-[#C9A84C]">GH₵ {p.price}</span>
          {p.orig > 0 && <span className="text-xs text-[#444] line-through ml-2">GH₵ {p.orig}</span>}
        </div>

        {/* Delivery */}
        <p className="text-[11px] text-[#2D6A4F] mb-2.5">✓ Free delivery · 2–3 days</p>

        {/* Actions */}
        <div className="flex gap-1.5">
          <button
            className="flex-1 bg-[#C9A84C] text-black font-bold text-xs py-2 rounded-md hover:bg-[#E8C97A] transition-colors"
            onClick={e => onAddCart(p, e)}
          >
            Add to Cart
          </button>
          <button
            className="bg-[#1e1e1e] border border-[#2a2a2a] text-[#888] text-sm px-2.5 rounded-md hover:text-[#C9A84C] hover:border-[#C9A84C]/40 transition-colors"
            onClick={e => { e.stopPropagation(); }}
            title="Save for later"
          >
            ♡
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PRODUCT DETAIL MODAL ────────────────────────────────────────────────────
function ProductDetail({ p, onBack, onAddCart }: {
  p: Product;
  onBack: () => void;
  onAddCart: (p: Product, qty: number) => void;
}) {
  const [qty, setQty] = useState(1);
  const [copied, setCopied] = useState(false);
  const creator = inf(p.inf);
  const shareLink = `yesmam.shop/${p.id}?ref=${creator.id}`;
  const related = PRODUCTS.filter(x => x.id !== p.id && (x.cat === p.cat || x.inf === p.inf)).slice(0, 4);

  function copyLink() {
    navigator.clipboard.writeText(shareLink).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="text-xs text-[#666] mb-5 flex items-center gap-1.5">
        <button onClick={onBack} className="text-[#C9A84C] hover:underline">Home</button>
        <span>›</span>
        <span className="capitalize">{p.cat}</span>
        <span>›</span>
        <span className="text-[#888] truncate max-w-[200px]">{p.title}</span>
      </nav>

      {/* Main grid */}
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* Images */}
        <div>
          <img src={p.img} alt={p.title} className="w-full rounded-xl border border-[#222]" style={{ aspectRatio: "1/1", objectFit: "cover" }} />
          <div className="flex gap-2 mt-2.5">
            {[p.img, p.img.replace("?w=500", "?w=500&crop=top"), p.img.replace("?w=500", "?w=500&crop=bottom")].map((src, i) => (
              <img key={i} src={src} alt="" className="w-16 h-16 rounded-lg object-cover border-2 border-[#222] cursor-pointer hover:border-[#C9A84C] transition-colors" />
            ))}
          </div>
        </div>

        {/* Info */}
        <div>
          <h1 className="text-xl font-black text-white leading-snug mb-3">{p.title}</h1>

          {/* Influencer tag */}
          <div className="flex items-center gap-3 bg-[#C9A84C]/8 border border-[#C9A84C]/20 rounded-lg px-3 py-2.5 mb-3 cursor-pointer hover:bg-[#C9A84C]/12 transition-colors">
            <img src={creator.avatar} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
            <div>
              <p className="text-[11px] text-[#666]">Recommended by</p>
              <p className="text-sm font-bold text-[#C9A84C]">{creator.name} · {creator.handle}</p>
            </div>
            <span className="ml-auto text-xs text-[#C9A84C]">View store →</span>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[#C9A84C] text-sm">{stars(p.rating)}</span>
            <span className="text-sm text-[#aaa]">({p.reviews} reviews)</span>
            <span className="text-xs text-[#2D6A4F] ml-2">{p.sales}</span>
          </div>

          {/* Price */}
          <div className="mb-2">
            <span className="text-3xl font-black text-[#C9A84C]">GH₵ {p.price}</span>
            {p.orig > 0 && <span className="text-lg text-[#444] line-through ml-3">GH₵ {p.orig}</span>}
          </div>

          {/* Delivery */}
          <div className="bg-[#0d1a10] border border-[#2D6A4F]/30 rounded-lg px-3 py-2.5 mb-4 text-[13px] leading-relaxed text-[#aaa]">
            <strong className="text-[#2D6A4F]">✓ Free delivery</strong> to Accra · Estimated 2–3 business days<br />
            <strong className="text-[#2D6A4F]">✓ Pay on delivery</strong> · MTN MoMo · Telecel Cash accepted
          </div>

          {/* Qty */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm text-[#777]">Qty:</span>
            <div className="flex items-center gap-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-1.5">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="text-[#C9A84C] text-lg font-bold w-5 text-center hover:text-[#E8C97A]">−</button>
              <span className="font-bold text-white min-w-[24px] text-center">{qty}</span>
              <button onClick={() => setQty(q => q + 1)} className="text-[#C9A84C] text-lg font-bold w-5 text-center hover:text-[#E8C97A]">+</button>
            </div>
            <span className="text-xs text-[#2D6A4F]">✓ In stock</span>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2.5 mb-4">
            <button
              onClick={() => onAddCart(p, qty)}
              className="w-full bg-gradient-to-r from-[#A8832A] to-[#C9A84C] text-black font-black text-base py-3.5 rounded-lg hover:opacity-90 transition-opacity"
            >
              🛒 Add to Cart
            </button>
            <button className="w-full bg-white text-black font-bold text-base py-3.5 rounded-lg hover:bg-gray-100 transition-colors">
              ⚡ Buy Now
            </button>
            <button className="w-full bg-[#141414] border border-[#2a2a2a] text-[#C9A84C] text-sm py-2.5 rounded-lg hover:border-[#C9A84C]/60 transition-colors">
              ♡ Save for Later
            </button>
          </div>

          {/* Affiliate share link */}
          <div className="text-xs text-[#555] border-t border-[#1a1a1a] pt-3">
            <span className="block mb-1 text-[#444]">Affiliate tracking link:</span>
            <div className="flex items-center gap-2">
              <span className="text-[#C9A84C] break-all">{shareLink}</span>
              <button onClick={copyLink} className="flex-shrink-0 bg-[#1a1a1a] border border-[#2a2a2a] text-[#aaa] text-[10px] px-2 py-1 rounded hover:border-[#C9A84C]/60 transition-colors">
                {copied ? "✓ Copied" : "Copy"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-5 mb-4">
        <h3 className="text-sm font-bold text-[#C9A84C] mb-3 pb-2 border-b border-[#1e1e1e]">Product Description</h3>
        <p className="text-sm text-[#999] leading-relaxed">{p.desc}</p>
      </div>

      {/* Specs */}
      <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-5 mb-8">
        <h3 className="text-sm font-bold text-[#C9A84C] mb-3 pb-2 border-b border-[#1e1e1e]">Product Details</h3>
        {p.specs.map(([k, v]) => (
          <div key={k} className="flex gap-3 py-2 border-b border-[#1a1a1a] text-sm last:border-0">
            <span className="text-[#555] w-32 flex-shrink-0">{k}</span>
            <span className="text-[#ddd]">{v}</span>
          </div>
        ))}
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-white">More from <span className="text-[#C9A84C]">{creator.name}</span></h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {related.map(r => (
              <ProductCard key={r.id} p={r} onView={() => {}} onAddCart={() => {}} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CART PANEL ───────────────────────────────────────────────────────────────
function CartPage({ cart, onUpdateQty, onRemove, onBack }: {
  cart: CartItem[];
  onUpdateQty: (id: number | string, infId: string, d: number) => void;
  onRemove: (id: number | string, infId: string) => void;
  onBack: () => void;
}) {
  const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-[#C9A84C] text-sm hover:underline">← Back to shopping</button>
        <h1 className="text-2xl font-black text-white">Your Cart</h1>
        {cart.length > 0 && <span className="text-[#777] text-sm">({cart.reduce((s, c) => s + c.qty, 0)} items)</span>}
      </div>

      {cart.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🛒</div>
          <p className="text-[#666] text-lg mb-4">Your cart is empty</p>
          <button onClick={onBack} className="bg-[#C9A84C] text-black font-bold px-8 py-3 rounded-lg hover:bg-[#E8C97A] transition-colors">
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-[1fr_320px] gap-6">
          {/* Items */}
          <div className="space-y-3">
            {cart.map(item => (
              <div key={`${item.id}-${item.infId}`} className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-4 flex gap-4">
                <img src={item.img} alt={item.title} className="w-24 h-24 rounded-lg object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#ddd] mb-1 truncate">{item.title}</p>
                  <p className="text-xs text-[#C9A84C] mb-1">via {item.infHandle}</p>
                  <div className="inline-flex items-center gap-1 bg-[#2D6A4F]/15 border border-[#2D6A4F]/30 text-[#2D6A4F] text-[10px] px-1.5 py-0.5 rounded mb-2">✓ Affiliate tracked</div>
                  <p className="text-lg font-black text-[#C9A84C] mb-2">GH₵ {item.price * item.qty}</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 bg-[#1e1e1e] border border-[#333] rounded-md px-2.5 py-1">
                      <button onClick={() => onUpdateQty(item.id, item.infId, -1)} className="text-[#C9A84C] font-bold">−</button>
                      <span className="text-sm font-bold min-w-[20px] text-center">{item.qty}</span>
                      <button onClick={() => onUpdateQty(item.id, item.infId, 1)} className="text-[#C9A84C] font-bold">+</button>
                    </div>
                    <button onClick={() => onRemove(item.id, item.infId)} className="text-xs text-[#555] hover:text-red-400 transition-colors">✕ Remove</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order summary */}
          <div className="bg-[#141414] border border-[#C9A84C]/20 rounded-xl p-5 sticky top-[90px] h-fit">
            <h3 className="text-base font-black text-[#C9A84C] mb-4 pb-3 border-b border-[#222]">Order Summary</h3>
            <div className="space-y-2.5 text-sm mb-4">
              <div className="flex justify-between text-[#aaa]">
                <span>Items ({cart.reduce((s, c) => s + c.qty, 0)})</span>
                <span>GH₵ {subtotal}</span>
              </div>
              <div className="flex justify-between text-[#aaa]">
                <span>Delivery</span>
                <span className="text-[#2D6A4F]">Free</span>
              </div>
              <div className="flex justify-between font-black text-white text-base border-t border-[#333] pt-2.5">
                <span>Total</span>
                <span className="text-[#C9A84C]">GH₵ {subtotal}</span>
              </div>
            </div>
            <button className="w-full bg-gradient-to-r from-[#A8832A] to-[#C9A84C] text-black font-black py-3.5 rounded-lg hover:opacity-90 transition-opacity text-sm">
              Proceed to Checkout →
            </button>
            <p className="text-[11px] text-[#444] text-center mt-2.5">Pay on delivery · MTN MoMo · Telecel Cash</p>
            {/* Payment methods */}
            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-[#1a1a1a]">
              {["MTN MoMo", "Telecel Cash", "Pay on Delivery", "Card"].map(m => (
                <span key={m} className="text-[10px] bg-[#1a1a1a] border border-[#2a2a2a] text-[#888] px-2 py-0.5 rounded">{m}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AFFILIATE SIGNUP PAGE ────────────────────────────────────────────────────
type Tier = "basic" | "storefront" | "premiere";
function SignupPage({ onBack }: { onBack: () => void }) {
  const [tier, setTier] = useState<Tier>("storefront");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("Ghana");
  const [tiktok, setTiktok] = useState("");
  const [instagram, setInstagram] = useState("");
  const [niche, setNiche] = useState("fashion");
  const [submitted, setSubmitted] = useState(false);

  const TIERS = [
    { key: "basic" as Tier, label: "Basic", price: "Free", badge: "FREE", badgeColor: "bg-[#2D6A4F]", features: ["Affiliate links", "Commission tracking", "MoMo payouts", "5 products max"] },
    { key: "storefront" as Tier, label: "Storefront", price: "GH₵ 25/mo", badge: "POPULAR", badgeColor: "bg-[#8B2500]", features: ["Your own store page", "Unlimited products", "Priority support", "Analytics dashboard"] },
    { key: "premiere" as Tier, label: "Premiere", price: "GH₵ 50/mo", badge: "GOLD", badgeColor: "bg-[#A8832A]", features: ["Featured on homepage", "Ad placement bumps", "Dedicated manager", "Custom branding"] },
  ];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const msg = encodeURIComponent(`Hi Yes MAM! I want to join as an affiliate influencer.\n\nName: ${name}\nEmail: ${email}\nWhatsApp: ${phone}\nTikTok: @${tiktok}\nInstagram: @${instagram}\nCountry: ${country}\nNiche: ${niche}\nTier: ${tier.charAt(0).toUpperCase() + tier.slice(1)}\n\nPlease set up my account!`);
    window.open(`https://wa.me/13107763650?text=${msg}`, "_blank");
    setSubmitted(true);
  }

  if (submitted) return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <div className="text-6xl mb-4">🎉</div>
      <h2 className="text-3xl font-black text-white mb-3">Application submitted!</h2>
      <p className="text-[#999] mb-6">We&apos;ll WhatsApp you within 24 hours to set up your creator account and store.</p>
      <button onClick={onBack} className="bg-[#C9A84C] text-black font-bold px-8 py-3 rounded-lg hover:bg-[#E8C97A] transition-colors">Back to Shop</button>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <button onClick={onBack} className="text-[#C9A84C] text-sm mb-4 hover:underline">← Back to shop</button>
      <h1 className="text-3xl font-black text-white mb-2">Become an <span className="text-[#C9A84C]">Affiliate Influencer</span></h1>
      <p className="text-[#777] mb-6 text-sm">Join Yes MAM and earn 18% commission on every sale through your links.</p>

      <div className="bg-[#141414] border border-[#C9A84C]/20 rounded-xl p-4 mb-6 text-sm text-[#aaa]">
        Already an influencer? <a href="/mam/dashboard" className="text-[#C9A84C] font-bold hover:underline">Sign in to your dashboard →</a>
      </div>

      {/* Tier selector */}
      <h3 className="text-base font-black text-[#C9A84C] mb-3 border-b border-[#222] pb-2">Choose Your Tier</h3>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {TIERS.map(t => (
          <button
            key={t.key}
            onClick={() => setTier(t.key)}
            className={`text-left bg-[#141414] border-2 rounded-xl p-3 transition-all ${tier === t.key ? "border-[#C9A84C] bg-[#C9A84C]/8" : "border-[#222] hover:border-[#C9A84C]/40"}`}
          >
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full text-white inline-block mb-2 ${t.badgeColor}`}>{t.badge}</span>
            <p className="font-black text-white text-sm mb-1">{t.label}</p>
            <p className="text-[#C9A84C] font-black text-base mb-2">{t.price}</p>
            <ul className="space-y-0.5">
              {t.features.map(f => (
                <li key={f} className="text-[11px] text-[#777]"><span className="text-[#C9A84C]">✓ </span>{f}</li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <h3 className="text-base font-black text-[#C9A84C] border-b border-[#222] pb-2">Your Details</h3>
        {[
          { label: "Full Name", val: name, set: setName, ph: "Christiana Amankwaah", type: "text" },
          { label: "Email", val: email, set: setEmail, ph: "you@example.com", type: "email" },
          { label: "WhatsApp / Phone", val: phone, set: setPhone, ph: "+233 XX XXX XXXX", type: "tel" },
        ].map(f => (
          <div key={f.label}>
            <label className="block text-[11px] font-bold text-[#C9A84C] tracking-widest uppercase mb-1">{f.label}</label>
            <input type={f.type} required value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
              className="w-full bg-[#141414] border border-[#333] rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-[#C9A84C] placeholder-[#444] transition-colors" />
          </div>
        ))}
        <div>
          <label className="block text-[11px] font-bold text-[#C9A84C] tracking-widest uppercase mb-1">Country</label>
          <select value={country} onChange={e => setCountry(e.target.value)}
            className="w-full bg-[#141414] border border-[#333] rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-[#C9A84C] transition-colors">
            {["Ghana", "Nigeria", "Kenya", "South Africa", "Other"].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <h3 className="text-base font-black text-[#C9A84C] border-b border-[#222] pb-2 pt-2">Social Accounts</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-[#C9A84C] tracking-widest uppercase mb-1">TikTok</label>
            <input type="text" value={tiktok} onChange={e => setTiktok(e.target.value)} placeholder="@yourhandle"
              className="w-full bg-[#141414] border border-[#333] rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-[#C9A84C] placeholder-[#444] transition-colors" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#C9A84C] tracking-widest uppercase mb-1">Instagram</label>
            <input type="text" value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@yourhandle"
              className="w-full bg-[#141414] border border-[#333] rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-[#C9A84C] placeholder-[#444] transition-colors" />
          </div>
        </div>

        <h3 className="text-base font-black text-[#C9A84C] border-b border-[#222] pb-2 pt-2">Your Niche</h3>
        <div>
          <label className="block text-[11px] font-bold text-[#C9A84C] tracking-widest uppercase mb-1">Primary Category</label>
          <select value={niche} onChange={e => setNiche(e.target.value)}
            className="w-full bg-[#141414] border border-[#333] rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-[#C9A84C] transition-colors">
            {["fashion|Fashion", "beauty|Beauty", "hair|Hair", "accessories|Accessories", "skincare|Skincare", "lifestyle|Lifestyle", "mixed|Mixed"].map(o => {
              const [v, l] = o.split("|");
              return <option key={v} value={v}>{l}</option>;
            })}
          </select>
        </div>

        <button type="submit" className="w-full bg-gradient-to-r from-[#A8832A] to-[#C9A84C] text-black font-black py-4 rounded-xl text-sm mt-2 hover:opacity-90 transition-opacity">
          Create My Influencer Account →
        </button>
        <p className="text-xs text-[#444] text-center">Free to start · No credit card required · We reply within 24 hours</p>
      </form>
    </div>
  );
}

// ─── INFLUENCER SECTION ───────────────────────────────────────────────────────
function InfluencerBand({ onSignup }: { onSignup: () => void }) {
  return (
    <div className="bg-gradient-to-r from-[#1a1200] via-[#0d0800] to-[#1a1200] border-y border-[#C9A84C]/20 px-6 py-8 flex gap-6 flex-wrap items-center mx-4 my-6 rounded-2xl">
      <div className="flex-1 min-w-[220px]">
        <h3 className="text-xl font-black text-white mb-2">Earn with <span className="text-[#C9A84C]">Yes MAM</span></h3>
        <p className="text-[#777] text-sm leading-relaxed mb-4">Turn your TikTok, Instagram, or YouTube audience into income. Paste any affiliate product link — we build your storefront. 18% commission on every sale.</p>
        <button onClick={onSignup} className="bg-gradient-to-br from-[#A8832A] to-[#C9A84C] text-black font-bold text-xs px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity">
          ★ Become an Affiliate Influencer
        </button>
      </div>
      <div className="flex gap-3 flex-wrap">
        {[
          { name: "Basic", price: "Free", desc: "Links only" },
          { name: "Storefront", price: "GH₵ 25", desc: "/mo · Your own store", gold: true },
          { name: "Premiere", price: "GH₵ 50", desc: "/mo · Featured + ads" },
        ].map(t => (
          <div key={t.name} className={`bg-[#1a1a1a] border rounded-lg px-4 py-3 text-center min-w-[100px] ${t.gold ? "border-[#C9A84C]/40" : "border-[#2a2a2a]"}`}>
            <p className="text-[11px] font-black text-[#C9A84C] tracking-widest uppercase mb-1">{t.name}</p>
            <p className="text-lg font-black text-white">{t.price}</p>
            <p className="text-[10px] text-[#555] mt-0.5">{t.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const PLATFORM_ICON: Record<string, string> = {
  tiktok: "TikTok", instagram: "Instagram", youtube: "YouTube", twitter: "Twitter", facebook: "Facebook",
};

function InfluencerRow({ liveInfluencers, onGoToStore, onFilter }: {
  liveInfluencers: ApiInfluencer[];
  onGoToStore: (handle: string) => void;
  onFilter: (id: string) => void;
}) {
  // Merge: live creators first, then fill with demo placeholders up to 5
  const liveHandles = new Set(liveInfluencers.map(i => i.handle));
  const demoFallbacks = INFLUENCERS.filter(i => !liveHandles.has(i.id));

  return (
    <>
      <div className="flex items-center justify-between px-4 pt-6 pb-3">
        <h2 className="text-lg font-black text-white">Top <span className="text-[#C9A84C]">Influencers</span></h2>
        <a href="/mam/home#join" className="text-xs text-[#C9A84C] hover:underline">Become a creator →</a>
      </div>
      <div className="flex gap-3 px-4 pb-6 overflow-x-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "#333 transparent" }}>
        {/* Real creators from API */}
        {liveInfluencers.map(i => {
          const initial = (i.handle[0] || "?").toUpperCase();
          const platform = PLATFORM_ICON[i.platform_name || ""] || i.platform_name || "";
          const ordersLabel = i.orders_count ? `${i.orders_count} order${i.orders_count !== 1 ? "s" : ""}` : "Active creator";
          return (
            <button
              key={i.handle}
              onClick={() => onGoToStore(i.handle)}
              className="bg-[#141414] border border-[#C9A84C]/30 rounded-xl p-4 text-center min-w-[148px] flex-shrink-0 hover:border-[#C9A84C]/70 hover:-translate-y-0.5 transition-all"
            >
              {i.avatar_url ? (
                <img src={i.avatar_url} alt={i.handle} className="w-16 h-16 rounded-full object-cover border-2 border-[#C9A84C]/50 mx-auto mb-2" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#C9A84C]/30 to-[#8B6914]/30 border-2 border-[#C9A84C]/50 mx-auto mb-2 flex items-center justify-center">
                  <span className="text-2xl font-black text-[#C9A84C]">{initial}</span>
                </div>
              )}
              <p className="text-sm font-bold text-white mb-0.5">@{i.handle}</p>
              {platform && <p className="text-[10px] text-[#888] mb-1">{platform}</p>}
              <p className="text-[10px] text-[#C9A84C]">{ordersLabel}</p>
              <div className="mt-2 w-full bg-[#C9A84C]/20 border border-[#C9A84C]/50 text-[#C9A84C] text-[11px] font-bold py-1 rounded-md">
                Visit Store →
              </div>
            </button>
          );
        })}
        {/* Demo placeholders to fill remaining slots */}
        {demoFallbacks.slice(0, Math.max(0, 5 - liveInfluencers.length)).map(i => (
          <button
            key={i.id}
            onClick={() => onFilter(i.id)}
            className="bg-[#141414] border border-[#222] rounded-xl p-4 text-center min-w-[148px] flex-shrink-0 hover:border-[#C9A84C]/40 hover:-translate-y-0.5 transition-all opacity-70"
          >
            <div className="w-16 h-16 rounded-full bg-[#222] border-2 border-[#333] mx-auto mb-2 flex items-center justify-center">
              <span className="text-2xl font-black text-[#444]">{i.name[0]}</span>
            </div>
            <p className="text-sm font-bold text-white mb-0.5">{i.name.split(" ")[0]}</p>
            <p className="text-xs text-[#555] mb-1.5">{i.handle}</p>
            <p className="text-[10px] text-[#444]">{i.followers} followers</p>
            <div className="mt-2 w-full bg-[#1a1a1a] border border-[#2a2a2a] text-[#555] text-[11px] font-semibold py-1 rounded-md">
              Coming soon
            </div>
          </button>
        ))}
      </div>
    </>
  );
}

// ─── PAYMENT STRIP ────────────────────────────────────────────────────────────
function PaymentStrip() {
  return (
    <div className="bg-[#0d0d0d] border-y border-[#1a1a1a] px-4 py-3 flex items-center gap-3 flex-wrap">
      <span className="text-[11px] font-bold text-[#555] whitespace-nowrap">Accepted payments:</span>
      {["MTN MoMo", "Telecel Cash", "Pay on Delivery", "Visa / MC", "Paystack"].map(m => (
        <span key={m} className="bg-[#1a1a1a] border border-[#2a2a2a] text-[#aaa] text-[11px] font-semibold px-2.5 py-1 rounded">
          {m}
        </span>
      ))}
    </div>
  );
}

// ─── TOAST ───────────────────────────────────────────────────────────────────
function Toast({ msg, visible }: { msg: string; visible: boolean }) {
  return (
    <div className={`fixed bottom-6 right-6 bg-[#C9A84C] text-black font-bold text-sm px-5 py-3.5 rounded-xl shadow-xl z-[999] flex items-center gap-2 transition-all duration-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
      {msg}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
type View = "home" | "product" | "cart" | "signup";

export default function ShopPage() {
  const [view, setView] = useState<View>("home");
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [activeCat, setActiveCat] = useState("all");
  const [activeInfFilter, setActiveInfFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [toast, setToast] = useState({ msg: "", visible: false });
  const [apiProducts, setApiProducts] = useState<Product[]>([]);
  const [apiLoading, setApiLoading] = useState(true);
  const [liveInfluencers, setLiveInfluencers] = useState<ApiInfluencer[]>([]);
  const [totalProductCount, setTotalProductCount] = useState<number | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load products + influencer leaderboard from real API
  useEffect(() => {
    async function fetchInitial() {
      setApiLoading(true);
      try {
        const [prodRes, infRes, countRes] = await Promise.all([
          fetch(`${API_URL}/products?status=active&limit=60`),
          fetch(`${API_URL}/influencers/leaderboard?limit=10`),
          fetch(`${API_URL}/products?status=active&limit=1`),
        ]);
        if (prodRes.ok) {
          const data: ApiProduct[] = await prodRes.json();
          setApiProducts(data.map(mapApiProduct));
        }
        if (infRes.ok) {
          const infs: ApiInfluencer[] = await infRes.json();
          setLiveInfluencers(infs);
        }
        // Get total count: fetch with limit=1 and check if more results available
        // For now, use 1203 as the known count; in future add proper count endpoint
        setTotalProductCount(1203);
      } catch { /* silent — PRODUCTS fallback used */ } finally {
        setApiLoading(false);
      }
    }
    fetchInitial();
  }, []);

  // Debounced search against real API — preserves active category filter
  function handleLiveSearch(q: string, cat?: string) {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    const effectiveCat = cat !== undefined ? cat : activeCat;
    searchTimerRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ status: "active", limit: "60" });
        if (q.trim()) params.set("search", q.trim());
        if (effectiveCat && effectiveCat !== "all" && effectiveCat !== "deals") params.set("category", effectiveCat);
        const res = await fetch(`${API_URL}/products?${params}`);
        if (res.ok) setApiProducts((await res.json()).map(mapApiProduct));
      } catch { /* silent */ }
    }, 400);
  }

  const showToast = useCallback((msg: string) => {
    setToast({ msg, visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
  }, []);

  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  function addToCart(p: Product, qty = 1, e?: React.MouseEvent) {
    e?.stopPropagation();
    const creator = inf(p.inf);
    setCart(prev => {
      const existing = prev.find(c => c.id === p.id && c.infId === p.inf);
      if (existing) return prev.map(c => c.id === p.id && c.infId === p.inf ? { ...c, qty: c.qty + qty } : c);
      return [...prev, { ...p, infId: p.inf, infHandle: creator.handle, qty }];
    });
    showToast(`🛒 ${p.title.substring(0, 28)}… added!`);
  }

  function updateCartQty(id: number | string, infId: string, d: number) {
    setCart(prev => prev.map(c => c.id === id && c.infId === infId ? { ...c, qty: Math.max(1, c.qty + d) } : c));
  }

  function removeFromCart(id: number | string, infId: string) {
    setCart(prev => prev.filter(c => !(c.id === id && c.infId === infId)));
  }

  function handleSearch(q: string) {
    // Keep current category — search within the active category
    setActiveInfFilter(null);
    handleLiveSearch(q);
  }

  async function filterCat(k: string) {
    setActiveCat(k);
    setActiveInfFilter(null);
    setView("home");
    // Keep current search query — fetch category + search combined
    handleLiveSearch(searchQuery, k);
    setTimeout(() => document.getElementById("product-grid-section")?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  function filterInfluencer(id: string) {
    setActiveInfFilter(id);
    setActiveCat("all");
    setSearchQuery("");
    setView("home");
    setTimeout(() => document.getElementById("product-grid-section")?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  function goToCreatorStore(handle: string) {
    window.location.href = `/mam/${handle}`;
  }

  // Compute visible products — use real API products with demo fallback
  const baseProducts = apiProducts.length > 0 ? apiProducts : PRODUCTS;
  let visibleProducts = baseProducts;
  if (activeInfFilter) {
    // Influencer filter: use demo products filtered by influencer (real API doesn't have inf filter yet)
    visibleProducts = PRODUCTS.filter(p => p.inf === activeInfFilter);
  } else if (searchQuery.trim()) {
    // Search: API already filtered via handleLiveSearch; local filter as backup
    const q = searchQuery.toLowerCase();
    visibleProducts = baseProducts.filter(p => p.title.toLowerCase().includes(q) || p.cat.includes(q) || p.desc.toLowerCase().includes(q));
  } else if (activeCat === "deals") {
    visibleProducts = baseProducts.filter(p => p.orig > 0);
  } else if (activeCat !== "all") {
    visibleProducts = baseProducts.filter(p => p.cat === activeCat);
  }

  // Autocomplete suggestions from in-memory products
  const searchSuggestions = searchQuery.trim().length >= 2
    ? Array.from(new Set(
        baseProducts
          .filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
          .map(p => p.title)
      )).slice(0, 6)
    : [];

  function handleSelectSuggestion(title: string) {
    setSearchQuery(title);
    handleLiveSearch(title);
  }

  const gridTitle = activeInfFilter
    ? <>{inf(activeInfFilter).name}&apos;s <span className="text-[#C9A84C]">Store</span></>
    : searchQuery && activeCat !== "all" && activeCat !== "deals"
      ? <>&quot;<span className="text-[#C9A84C]">{searchQuery}</span>&quot; in <span className="text-[#C9A84C] capitalize">{activeCat}</span> <span className="text-[#555] text-sm font-normal">({visibleProducts.length})</span></>
    : searchQuery ? <>Results for &quot;<span className="text-[#C9A84C]">{searchQuery}</span>&quot; <span className="text-[#555] text-sm font-normal">({visibleProducts.length})</span></>
    : activeCat === "all" ? <>Featured by <span className="text-[#C9A84C]">Influencers</span> <span className="text-[#555] text-sm font-normal">({visibleProducts.length} products)</span></>
    : activeCat === "deals" ? <>🔥 <span className="text-[#C9A84C]">Deals</span></>
    : <><span className="text-[#C9A84C] capitalize">{activeCat}</span> Products <span className="text-[#555] text-sm font-normal">({visibleProducts.length})</span></>;

  return (
    <div className="bg-[#0A0A0A] text-white min-h-screen">
      <CountryBar />
      <SiteHeader
        query={searchQuery}
        setQuery={setSearchQuery}
        cartCount={cartCount}
        onSearch={handleSearch}
        onShowCart={() => setView("cart")}
        onShowSignup={() => setView("signup")}
        suggestions={searchSuggestions}
        onSelectSuggestion={handleSelectSuggestion}
      />

      {view === "cart" && (
        <CartPage
          cart={cart}
          onUpdateQty={updateCartQty}
          onRemove={removeFromCart}
          onBack={() => setView("home")}
        />
      )}

      {view === "signup" && <SignupPage onBack={() => setView("home")} />}

      {view === "product" && activeProduct && (
        <ProductDetail
          p={activeProduct}
          onBack={() => setView("home")}
          onAddCart={(p, qty) => { addToCart(p, qty); showToast(`🛒 Added to cart!`); }}
        />
      )}

      {view === "home" && (
        <>
          <Hero onSignup={() => setView("signup")} />
          <PromoTicker productCount={totalProductCount} />
          <CatIconRow active={activeCat} onSelect={filterCat} isLoading={apiLoading} />

          {/* Product section */}
          <div id="product-grid-section">
            <div className="flex items-center justify-between px-4 pt-5 pb-3">
              <h2 className="text-lg font-black text-white">{gridTitle}</h2>
              <div className="flex gap-3">
                {searchQuery && (
                  <button onClick={() => { setSearchQuery(""); handleLiveSearch(""); }} className="text-xs text-[#C9A84C] hover:underline">
                    × clear search
                  </button>
                )}
                {activeInfFilter && (
                  <button onClick={() => { setActiveInfFilter(null); setActiveCat("all"); }} className="text-xs text-[#C9A84C] hover:underline">
                    Clear filter ×
                  </button>
                )}
              </div>
            </div>
            {apiLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 px-4 pb-6">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="bg-[#141414] border border-[#222] rounded-xl overflow-hidden animate-pulse">
                    <div className="bg-[#222]" style={{ aspectRatio: "1/1" }} />
                    <div className="p-3 space-y-2">
                      <div className="h-3 bg-[#222] rounded w-3/4" />
                      <div className="h-3 bg-[#222] rounded w-1/2" />
                      <div className="h-5 bg-[#222] rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : visibleProducts.length === 0 ? (
              <div className="text-center py-12 text-[#555]">
                <div className="text-4xl mb-3">🔍</div>
                <p>No products found{searchQuery ? ` for "${searchQuery}"` : ""}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 px-4 pb-6">
                {visibleProducts.map(p => (
                  <ProductCard
                    key={p.id}
                    p={p}
                    onView={prod => {
                      if (prod.creator_handle) {
                        window.location.href = `/mam/${prod.creator_handle}/${prod.id}`;
                      } else {
                        setActiveProduct(prod);
                        setView("product");
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }
                    }}
                    onAddCart={(prod, e) => addToCart(prod, 1, e)}
                  />
                ))}
              </div>
            )}
          </div>

          <InfluencerBand onSignup={() => setView("signup")} />
          <InfluencerRow liveInfluencers={liveInfluencers} onGoToStore={goToCreatorStore} onFilter={filterInfluencer} />
          <PaymentStrip />

          {/* Footer */}
          <footer className="bg-[#080808] border-t border-[#C9A84C]/15 px-6 py-10 mt-4">
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
                <div>
                  <div className="bg-gradient-to-br from-[#A8832A] to-[#E8C97A] bg-clip-text text-transparent font-black text-lg mb-2">Yes MAM</div>
                  <p className="text-[12px] text-[#444] leading-relaxed">Ghana&apos;s creator commerce platform. Shop through influencers you trust.</p>
                </div>
                <div>
                  <h4 className="text-[#C9A84C] text-xs font-bold mb-3">Shop</h4>
                  {[
                    ["Fashion", "fashion"],
                    ["Hair & Beauty", "hair & beauty"],
                    ["Skincare", "skincare"],
                    ["Electronics", "electronics"],
                    ["Fitness", "fitness"],
                    ["Home & Living", "home & living"],
                    ["Jewelry", "jewelry"],
                  ].map(([label, key]) => (
                    <button key={key} onClick={() => filterCat(key)} className="block text-[#555] text-xs mb-2 hover:text-[#C9A84C] transition-colors text-left">{label}</button>
                  ))}
                </div>
                <div>
                  <h4 className="text-[#C9A84C] text-xs font-bold mb-3">Creators</h4>
                  {[["Become an Affiliate", () => setView("signup")], ["Creator Login", () => window.location.href = "/mam/dashboard"]].map(([l, fn]) => (
                    <button key={l as string} onClick={fn as () => void} className="block text-[#555] text-xs mb-2 hover:text-[#C9A84C] transition-colors text-left">{l as string}</button>
                  ))}
                  <p className="text-[10px] text-[#444] mt-1">18% commission · MoMo payouts</p>
                </div>
                <div>
                  <h4 className="text-[#C9A84C] text-xs font-bold mb-3">Help</h4>
                  {["Track Order", "Returns", "Contact Us", "FAQs"].map(c => (
                    <a key={c} href="#" className="block text-[#555] text-xs mb-2 hover:text-[#C9A84C] transition-colors">{c}</a>
                  ))}
                </div>
              </div>
              <div className="border-t border-[#1a1a1a] pt-5 flex justify-between items-center flex-wrap gap-3">
                <p className="text-[11px] text-[#333]">© 2026 Yes MAM · Micro-Affiliate Marketing · Built for Africa 🌍</p>
                <p className="text-[11px] text-[#333]">MTN MoMo · Telecel Cash · Pay on Delivery</p>
              </div>
            </div>
          </footer>
        </>
      )}

      <Toast msg={toast.msg} visible={toast.visible} />
    </div>
  );
}
