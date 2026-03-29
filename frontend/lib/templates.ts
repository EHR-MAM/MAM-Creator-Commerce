/**
 * MAM Storefront Template Registry
 *
 * 4 selectable design themes for influencer storefronts.
 * Adding a new template = add one entry here + matching StorefrontTheme component.
 *
 * Template IDs are stored in the influencer record (template_id field).
 * Default: "glow" (clean modern with gold accents — works for all niches).
 */

export type TemplateId = "glow" | "kente" | "noir" | "bloom";

export interface TemplateConfig {
  id: TemplateId;
  name: string;
  tagline: string;
  // CSS classes applied to the storefront shell
  bg: string;           // page background
  headerBg: string;     // top banner background
  headerText: string;   // header text color
  accent: string;       // primary accent color (Tailwind class)
  accentHex: string;    // accent hex for inline styles
  cardBg: string;       // product card background
  cardBorder: string;   // product card border
  btnBg: string;        // primary CTA button background
  btnText: string;      // CTA button text color
  badgeBg: string;      // "Creator Store" badge background
  badgeText: string;    // badge text color
  priceBold: string;    // price text color
  footerText: string;   // "Powered by MAM" text style
  divider: string;      // header divider gradient
}

export const TEMPLATES: Record<TemplateId, TemplateConfig> = {
  /**
   * GLOW — Clean modern with warm gold accents.
   * Best for: fashion, beauty, accessories, general
   * Feel: Premium, aspirational, trust-building
   */
  glow: {
    id: "glow",
    name: "Glow",
    tagline: "Clean & modern with gold accents",
    bg: "bg-[#FAF7F2]",
    headerBg: "bg-[#111111]",
    headerText: "text-white",
    accent: "text-[#C9A84C]",
    accentHex: "#C9A84C",
    cardBg: "bg-white",
    cardBorder: "border-gray-100",
    btnBg: "bg-[#111111]",
    btnText: "text-white",
    badgeBg: "bg-[#C9A84C]",
    badgeText: "text-black",
    priceBold: "text-black",
    footerText: "text-gray-400",
    divider: "from-[#C9A84C] via-[#E8C97A] to-[#C9A84C]",
  },

  /**
   * KENTE — Bold Afrocentric. Warm earth tones + kente-inspired pattern accents.
   * Best for: Ankara fashion, African print, cultural lifestyle
   * Feel: Proud, vibrant, cultural identity
   */
  kente: {
    id: "kente",
    name: "Kente",
    tagline: "Bold Afrocentric with earth tones",
    bg: "bg-[#FDF6EC]",
    headerBg: "bg-[#8B2500]",
    headerText: "text-[#FDF6EC]",
    accent: "text-[#F5A623]",
    accentHex: "#F5A623",
    cardBg: "bg-white",
    cardBorder: "border-[#F5A623]/20",
    btnBg: "bg-[#8B2500]",
    btnText: "text-white",
    badgeBg: "bg-[#F5A623]",
    badgeText: "text-[#8B2500]",
    priceBold: "text-[#8B2500]",
    footerText: "text-[#8B2500]/50",
    divider: "from-[#F5A623] via-[#FFD580] to-[#F5A623]",
  },

  /**
   * NOIR — Sleek all-dark luxury. Deep black with rose gold.
   * Best for: hair wigs, premium beauty, luxury accessories
   * Feel: High-end, editorial, aspirational luxury
   */
  noir: {
    id: "noir",
    name: "Noir",
    tagline: "Luxury dark with rose gold",
    bg: "bg-[#0F0F0F]",
    headerBg: "bg-[#1A1A1A]",
    headerText: "text-white",
    accent: "text-[#D4A0A0]",
    accentHex: "#D4A0A0",
    cardBg: "bg-[#1A1A1A]",
    cardBorder: "border-[#2A2A2A]",
    btnBg: "bg-[#D4A0A0]",
    btnText: "text-[#0F0F0F]",
    badgeBg: "bg-[#D4A0A0]",
    badgeText: "text-[#0F0F0F]",
    priceBold: "text-[#D4A0A0]",
    footerText: "text-gray-600",
    divider: "from-[#D4A0A0] via-[#E8BEBE] to-[#D4A0A0]",
  },

  /**
   * BLOOM — Fresh pastel. Soft green and blush pink.
   * Best for: skincare, wellness, baby products, natural beauty
   * Feel: Fresh, natural, gentle, trustworthy
   */
  bloom: {
    id: "bloom",
    name: "Bloom",
    tagline: "Fresh pastel for beauty & wellness",
    bg: "bg-[#F4F9F4]",
    headerBg: "bg-[#2D6A4F]",
    headerText: "text-white",
    accent: "text-[#F4A5AE]",
    accentHex: "#F4A5AE",
    cardBg: "bg-white",
    cardBorder: "border-[#D8E8D8]",
    btnBg: "bg-[#2D6A4F]",
    btnText: "text-white",
    badgeBg: "bg-[#F4A5AE]",
    badgeText: "text-[#2D6A4F]",
    priceBold: "text-[#2D6A4F]",
    footerText: "text-[#2D6A4F]/40",
    divider: "from-[#F4A5AE] via-[#F9D0D5] to-[#F4A5AE]",
  },
};

export const DEFAULT_TEMPLATE: TemplateId = "glow";

export function getTemplate(id?: string | null): TemplateConfig {
  if (id && id in TEMPLATES) return TEMPLATES[id as TemplateId];
  return TEMPLATES[DEFAULT_TEMPLATE];
}
