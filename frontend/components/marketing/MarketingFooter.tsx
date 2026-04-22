import { YesMAMLogo } from "./MarketingNav";

const FOOTER_LINKS = [
  { label: "Live demo store", href: "/sweet200723" },
  { label: "Creator login", href: "/dashboard" },
  { label: "How it works", href: "/how-it-works" },
  { label: "Admin", href: "/admin" },
  { label: "Join as creator", href: "/join#creators" },
  { label: "List products", href: "/join#vendors" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "mailto:hello@yesmam.shop" },
];

export default function MarketingFooter() {
  return (
    <footer className="bg-[#050505] border-t border-white/5 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <YesMAMLogo size={32} />
              <span className="font-black text-white text-lg">Yes MAM</span>
            </div>
            <p className="text-xs text-white/30 max-w-xs leading-relaxed">
              Micro-Affiliate Marketing — Africa's creator commerce platform.
              Turning TikTok followers into real income for Accra creators and vendors.
            </p>
            <p className="text-xs text-white/20 mt-3">yesmam.shop · yesmamshop.com</p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-x-16 gap-y-3 text-sm text-white/40">
            {FOOTER_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="hover:text-[#C9A84C] transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/20">© 2026 Yes MAM · Micro-Affiliate Marketing · Built for Africa 🌍</p>
          <div className="flex items-center gap-2 text-xs text-white/20">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
            Platform live · Africa pilot active
          </div>
        </div>
      </div>
    </footer>
  );
}
