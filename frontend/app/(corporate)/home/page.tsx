"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8200";
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "/mam";

// ── Scroll reveal hook ─────────────────────────────────────────────────────────
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add("visible"); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

// ── Reveal wrapper ─────────────────────────────────────────────────────────────
function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useReveal();
  return (
    <div ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

// ── Yes MAM SVG Logo ───────────────────────────────────────────────────────────
function YesMAMLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Yes MAM">
      <defs>
        <linearGradient id="logoGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A8832A"/>
          <stop offset="0.5" stopColor="#C9A84C"/>
          <stop offset="1" stopColor="#E8C97A"/>
        </linearGradient>
      </defs>
      <rect width="36" height="36" rx="10" fill="url(#logoGrad)"/>
      <path d="M10 8L18 19V28M18 19L26 8" stroke="#0A0A0A" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── Nav ────────────────────────────────────────────────────────────────────────
function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#0A0A0A]/95 backdrop-blur-md shadow-[0_2px_20px_rgba(0,0,0,0.5)]" : "bg-transparent"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <a href="/mam/home" className="flex items-center gap-2.5 group">
          <div className="group-hover:scale-105 transition-transform drop-shadow-[0_2px_8px_rgba(201,168,76,0.4)]">
            <YesMAMLogo size={36} />
          </div>
          <div className="leading-none">
            <span className="text-white font-black text-lg tracking-tight">Yes MAM</span>
            <span className="block text-[9px] text-[#C9A84C] font-bold tracking-[0.2em] uppercase -mt-0.5">
              Creator Commerce
            </span>
          </div>
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
          <a href="/mam/how-it-works" className="hover:text-white transition-colors hover:text-[#C9A84C]">How it works</a>
          <a href="/mam/about" className="hover:text-white transition-colors hover:text-[#C9A84C]">About</a>
          <a href="/mam/join#creators" className="hover:text-white transition-colors hover:text-[#C9A84C]">For Creators</a>
          <a href="/mam/join#vendors" className="hover:text-white transition-colors hover:text-[#C9A84C]">For Vendors</a>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/mam/dashboard" className="text-sm font-semibold text-white/60 hover:text-white transition-colors px-4 py-2">
            Creator Login
          </Link>
          <a
            href="/mam/join#creators"
            className="bg-gold-gradient text-[#0A0A0A] text-sm font-black px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity shadow-gold-sm"
          >
            Start for free →
          </a>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setOpen(!open)} className="md:hidden p-2 text-white/70" aria-label="Menu">
          <div className={`w-5 h-0.5 bg-current transition-all ${open ? "rotate-45 translate-y-1.5" : ""}`} />
          <div className={`w-5 h-0.5 bg-current my-1 transition-all ${open ? "opacity-0" : ""}`} />
          <div className={`w-5 h-0.5 bg-current transition-all ${open ? "-rotate-45 -translate-y-1.5" : ""}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-[#0A0A0A]/98 border-t border-white/10 px-4 py-5 space-y-4 text-sm font-medium">
          {["How it works|#how-it-works", "For Creators|#for-creators", "For Vendors|#for-vendors", "Results|#proof"].map(item => {
            const [label, href] = item.split("|");
            return (
              <a key={label} href={href} className="block text-white/70 hover:text-[#C9A84C] transition-colors" onClick={() => setOpen(false)}>
                {label}
              </a>
            );
          })}
          <div className="pt-3 border-t border-white/10 space-y-3">
            <Link href="/mam/dashboard" className="block text-center text-white/60 py-2 border border-white/15 rounded-xl" onClick={() => setOpen(false)}>
              Creator Login
            </Link>
            <a href="#creator-signup" className="block text-center bg-gold-gradient text-[#0A0A0A] font-black py-3 rounded-xl" onClick={() => setOpen(false)}>
              Start for free →
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}

// ── Marquee ticker ─────────────────────────────────────────────────────────────
function Ticker() {
  const items = [
    "🇬🇭 Africa's #1 Creator Commerce Platform",
    "💰 18% Commission on Every Sale",
    "📱 50,000+ TikTok Followers Reached",
    "⚡ Store Live in Under 24 Hours",
    "💬 WhatsApp Orders Supported",
    "🛍️ Fashion · Hair · Beauty · Accessories",
    "🏆 MTN MoMo & Telecel Cash Accepted",
    "✨ 4 Premium Storefront Templates",
  ];
  const doubled = [...items, ...items];

  return (
    <div className="w-full overflow-hidden bg-[#C9A84C] py-2.5">
      <div className="flex animate-marquee gap-8 whitespace-nowrap">
        {doubled.map((item, i) => (
          <span key={i} className="text-xs font-bold text-[#0A0A0A] tracking-wide shrink-0 px-6">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────────────────────────
function Stat({ value, label, delay = 0 }: { value: string; label: string; delay?: number }) {
  return (
    <Reveal delay={delay}>
      <div className="text-center glass-gold rounded-2xl p-6 hover:border-[#C9A84C]/50 transition-colors">
        <p className="text-4xl md:text-5xl font-black text-shimmer mb-2">{value}</p>
        <p className="text-sm text-white/50 leading-snug">{label}</p>
      </div>
    </Reveal>
  );
}

// ── Step card ──────────────────────────────────────────────────────────────────
function Step({ n, title, desc, accent, delay = 0 }: { n: string; title: string; desc: string; accent: string; delay?: number }) {
  return (
    <Reveal delay={delay} className="flex gap-4">
      <div
        className="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-lg"
        style={{ background: `linear-gradient(135deg, ${accent}dd, ${accent})`, color: "#0A0A0A" }}
      >
        {n}
      </div>
      <div className="pt-0.5">
        <p className="font-bold text-white text-base mb-1">{title}</p>
        <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
      </div>
    </Reveal>
  );
}

// ── Feature card ───────────────────────────────────────────────────────────────
function Feature({ icon, title, desc, delay = 0 }: { icon: string; title: string; desc: string; delay?: number }) {
  return (
    <Reveal delay={delay}>
      <div className="glass rounded-2xl p-6 border border-white/8 hover:border-[#C9A84C]/30 transition-all hover:-translate-y-1 duration-300 h-full">
        <div className="text-3xl mb-4">{icon}</div>
        <p className="font-bold text-white mb-2">{title}</p>
        <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
      </div>
    </Reveal>
  );
}

// ── Testimonial ────────────────────────────────────────────────────────────────
function Testimonial({ quote, name, role, initial, accent, delay = 0 }: {
  quote: string; name: string; role: string; initial: string; accent: string; delay?: number;
}) {
  return (
    <Reveal delay={delay}>
      <div className="glass rounded-2xl p-6 border border-white/8 hover:border-[#C9A84C]/25 transition-colors h-full flex flex-col">
        <div className="flex gap-1 mb-4">
          {[...Array(5)].map((_, i) => <span key={i} className="text-[#C9A84C] text-sm">★</span>)}
        </div>
        <p className="text-white/70 leading-relaxed italic mb-5 flex-1">"{quote}"</p>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0"
            style={{ background: `linear-gradient(135deg, ${accent}aa, ${accent})` }}
          >
            {initial}
          </div>
          <div>
            <p className="font-bold text-sm text-white">{name}</p>
            <p className="text-xs text-white/40">{role}</p>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

// ── Template preview card ──────────────────────────────────────────────────────
function TemplateCard({ name, emoji, bg, accent, textColor, delay = 0 }: {
  name: string; emoji: string; bg: string; accent: string; textColor: string; delay?: number;
}) {
  return (
    <Reveal delay={delay}>
      <div className={`${bg} rounded-2xl overflow-hidden border border-white/10 hover:-translate-y-2 transition-transform duration-300 shadow-card-dark`}>
        {/* Mock header */}
        <div className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg" style={{ background: accent }}>
            {emoji}
          </div>
          <div>
            <p className={`font-bold text-sm ${textColor}`}>@creator</p>
            <p className="text-xs opacity-50 text-gray-400">Creator Store</p>
          </div>
        </div>
        {/* Mock products */}
        <div className="px-4 pb-4 grid grid-cols-2 gap-2">
          {["👗 Dress", "💄 Lipstick", "💍 Ring", "🧴 Serum"].map((item) => (
            <div key={item} className="bg-white/10 rounded-xl p-3 text-xs text-center">
              <div className="text-2xl mb-1">{item.split(" ")[0]}</div>
              <div className="text-white/70 font-medium text-[10px]">{item.split(" ")[1]}</div>
              <div className="mt-1 font-black" style={{ color: accent }}>GH₵ 85</div>
            </div>
          ))}
        </div>
        <div className="px-4 pb-4">
          <div className="rounded-xl py-2 text-center text-xs font-black" style={{ background: accent, color: "#0A0A0A" }}>
            Order Now
          </div>
        </div>
        <div className="px-4 pb-3 text-center">
          <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: accent }}>{name}</span>
        </div>
      </div>
    </Reveal>
  );
}

// ── Signup forms ───────────────────────────────────────────────────────────────
function CreatorSignupForm() {
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const msg = encodeURIComponent(`Hi Yes MAM team! I want to join as a creator.\n\nName: ${name}\nTikTok: @${handle}\nPhone: ${phone}\n\nPlease set up my store!`);
    window.open(`https://wa.me/13107763650?text=${msg}`, "_blank");
    setSubmitted(true);
  }

  if (submitted) return (
    <div className="text-center py-4 animate-scale-in">
      <div className="text-5xl mb-3 animate-float">🎉</div>
      <p className="font-black text-white text-xl mb-2">Request sent!</p>
      <p className="text-white/50 text-sm">We'll WhatsApp you within 24 hours to set up your store.</p>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-3 max-w-sm mx-auto">
      {[
        { val: name, set: setName, ph: "Your full name", type: "text" },
        { val: handle, set: setHandle, ph: "TikTok handle (without @)", type: "text" },
        { val: phone, set: setPhone, ph: "WhatsApp number (+233...)", type: "tel" },
      ].map(({ val, set, ph, type }) => (
        <input
          key={ph}
          type={type}
          required
          value={val}
          onChange={e => set(e.target.value)}
          placeholder={ph}
          className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C9A84C] transition-colors"
        />
      ))}
      <button type="submit" className="w-full bg-gold-gradient text-[#0A0A0A] font-black py-3.5 rounded-xl text-sm hover:opacity-90 transition-opacity shadow-gold">
        Send request via WhatsApp →
      </button>
      <p className="text-xs text-white/30 text-center">Free to join · No tech skills needed · We reply in 24 hours</p>
    </form>
  );
}

function VendorSignupForm() {
  const [biz, setBiz] = useState("");
  const [category, setCategory] = useState("fashion");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const msg = encodeURIComponent(`Hi Yes MAM team! I want to list as a vendor.\n\nBusiness: ${biz}\nCategory: ${category}\nPhone: ${phone}`);
    window.open(`https://wa.me/13107763650?text=${msg}`, "_blank");
    setSubmitted(true);
  }

  if (submitted) return (
    <div className="text-center py-4 animate-scale-in">
      <div className="text-5xl mb-3">✅</div>
      <p className="font-black text-[#8B2500] text-xl mb-2">Request sent!</p>
      <p className="text-sm text-gray-500">Our team will WhatsApp you within 24 hours.</p>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text" required value={biz} onChange={e => setBiz(e.target.value)}
        placeholder="Business name"
        className="w-full border border-[#F5A623]/30 bg-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#8B2500] transition-colors"
      />
      <select
        value={category} onChange={e => setCategory(e.target.value)}
        className="w-full border border-[#F5A623]/30 bg-white rounded-xl px-4 py-3 text-sm focus:outline-none text-gray-700"
      >
        {["fashion|Fashion / Clothing", "hair|Hair / Wigs", "beauty|Beauty / Cosmetics", "accessories|Accessories & Jewelry", "skincare|Skincare / Wellness", "other|Other"].map(o => {
          const [v, l] = o.split("|");
          return <option key={v} value={v}>{l}</option>;
        })}
      </select>
      <input
        type="tel" required value={phone} onChange={e => setPhone(e.target.value)}
        placeholder="WhatsApp number"
        className="w-full border border-[#F5A623]/30 bg-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#8B2500] transition-colors"
      />
      <button type="submit" className="w-full bg-[#8B2500] text-white font-bold py-3 rounded-xl text-sm hover:bg-[#6B1A00] transition-colors">
        Send vendor request →
      </button>
      <p className="text-xs text-gray-400 text-center">No upfront cost · Onboarded within 48 hours</p>
    </form>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
// ── Creator Leaderboard ────────────────────────────────────────────────────────
const RANK_CONFIG = [
  { medal: "🥇", bg: "from-[#C9A84C]/20 to-[#C9A84C]/5", border: "border-[#C9A84C]/40", label: "#1" },
  { medal: "🥈", bg: "from-white/10 to-white/5",           border: "border-white/20",      label: "#2" },
  { medal: "🥉", bg: "from-[#CD7F32]/15 to-[#CD7F32]/5",  border: "border-[#CD7F32]/30",  label: "#3" },
];

interface LeaderEntry {
  handle: string;
  name?: string;
  avatar_url?: string;
  orders_count?: number;
  earnings?: number;
  platform_name?: string;
}

// Placeholder entries shown while loading or when API has no data
const PLACEHOLDERS: LeaderEntry[] = [
  { handle: "sweet200723", name: "Christiana A.", orders_count: 24, earnings: 312, platform_name: "tiktok" },
  { handle: "glowbyakua",  name: "Akua Mensah",   orders_count: 17, earnings: 221, platform_name: "instagram" },
  { handle: "afrobeautygh", name: "Ama Owusu",    orders_count: 11, earnings: 143, platform_name: "tiktok" },
];

function CreatorLeaderboard() {
  const [creators, setCreators] = useState<LeaderEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/influencers?status=active&limit=10`)
      .then(r => r.ok ? r.json() : [])
      .then((data: any[]) => {
        if (data && data.length > 0) {
          // Sort by orders_count desc, take top 3
          // Falls back to placeholder when orders_count not available
          const sorted = [...data]
            .sort((a, b) => (b.orders_count || 0) - (a.orders_count || 0))
            .slice(0, 3);
          const hasMetrics = sorted.some(c => (c.orders_count || 0) > 0);
          if (hasMetrics) setCreators(sorted);
          // else: leave creators empty → fallback to PLACEHOLDERS
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const display = (loaded && creators.length >= 1) ? creators : PLACEHOLDERS;

  return (
    <section className="py-24 px-4 bg-[#0A0A0A]">
      <div className="max-w-6xl mx-auto">
        <Reveal className="text-center mb-14">
          <span className="text-[#C9A84C] text-xs font-bold tracking-[0.2em] uppercase block mb-3">Top Creators</span>
          <h2 className="font-display text-4xl md:text-5xl font-black text-white mb-4">
            Meet the{" "}
            <span className="text-shimmer">leaderboard.</span>
          </h2>
          <p className="text-white/40 max-w-lg mx-auto">
            Our highest-earning creators — turning their audiences into income on Yes MAM.
          </p>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-5 mb-10">
          {display.slice(0, 3).map((creator, i) => {
            const cfg = RANK_CONFIG[i] || RANK_CONFIG[2];
            const initial = (creator.name || creator.handle).charAt(0).toUpperCase();
            const displayName = creator.name || `@${creator.handle}`;
            const orders = creator.orders_count || 0;
            const earnings = creator.earnings || 0;

            return (
              <Reveal key={creator.handle} delay={i * 100}>
                <div className={`glass bg-gradient-to-b ${cfg.bg} border ${cfg.border} rounded-2xl p-6 flex flex-col h-full hover:border-opacity-80 transition-all hover:-translate-y-1 duration-200`}>
                  {/* Rank + medal */}
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-2xl">{cfg.medal}</span>
                    <span className="text-[10px] font-black text-white/20 tracking-widest uppercase">{cfg.label} This Month</span>
                  </div>

                  {/* Avatar + name */}
                  <div className="flex items-center gap-3 mb-5">
                    <div
                      className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center font-black text-xl shrink-0 border-2 border-[#C9A84C]/30"
                      style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)" }}
                    >
                      {creator.avatar_url ? (
                        <img src={creator.avatar_url} alt={displayName} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <span style={{ color: "#C9A84C" }}>{initial}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-black text-white text-sm">{displayName}</p>
                      <p className="text-xs text-white/40">@{creator.handle}</p>
                      {creator.platform_name && (
                        <p className="text-[10px] text-white/25 capitalize mt-0.5">{creator.platform_name}</p>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="bg-white/5 rounded-xl p-3 text-center">
                      <p className="font-black text-white text-lg">{orders}</p>
                      <p className="text-[10px] text-white/30 uppercase tracking-wider">Orders</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 text-center">
                      <p className="font-black text-[#C9A84C] text-lg">GHS {earnings}</p>
                      <p className="text-[10px] text-white/30 uppercase tracking-wider">Earned</p>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="mt-auto">
                    <a
                      href={`${BASE}/${creator.handle}`}
                      className="block w-full text-center text-xs font-bold py-2.5 rounded-xl border border-[#C9A84C]/30 text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-colors"
                    >
                      Visit store →
                    </a>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* Join prompt */}
        <Reveal>
          <div className="text-center">
            <p className="text-white/30 text-sm mb-4">Want to be on the leaderboard?</p>
            <a
              href="#creator-signup"
              className="inline-block bg-gold-gradient text-[#0A0A0A] font-black px-6 py-3 rounded-xl text-sm hover:opacity-90 transition-opacity shadow-gold"
            >
              Start your free store →
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default function YesMAMHomePage() {
  return (
    <div className="bg-[#0A0A0A] text-white min-h-screen">
      <Nav />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-20">
        {/* Animated background */}
        <div className="absolute inset-0 bg-animated-gradient" />

        {/* Gold radial glow */}
        <div className="absolute top-1/3 right-0 w-[700px] h-[600px] rounded-full bg-[#C9A84C]/6 blur-[120px] pointer-events-none" />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(#C9A84C 1px, transparent 1px), linear-gradient(90deg, #C9A84C 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">

            {/* LEFT — Text content */}
            <div>
              {/* Eyebrow badge */}
              <div className="animate-fade-in inline-flex items-center gap-2 glass-gold text-[#C9A84C] text-xs font-bold tracking-[0.15em] uppercase px-5 py-2 rounded-full mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-pulse" />
                Africa&apos;s Creator Commerce Platform
              </div>

              {/* Main headline */}
              <h1 className="animate-fade-in delay-100 font-display text-5xl sm:text-6xl md:text-6xl lg:text-7xl font-black leading-[1.0] mb-6 tracking-tight">
                <span className="block text-white">Your followers</span>
                <span className="block text-shimmer">are your shop.</span>
              </h1>

              {/* Sub */}
              <p className="animate-fade-in delay-200 text-lg text-white/50 max-w-lg leading-relaxed mb-10">
                Yes MAM gives Africa&apos;s TikTok creators a stunning, branded store in minutes.
                Your audience browses, orders, pays on delivery —
                you <strong className="text-white">earn 18% on every sale.</strong>
              </p>

              {/* CTAs */}
              <div className="animate-fade-in delay-300 flex flex-col sm:flex-row gap-3 mb-10">
                <a
                  href="#creator-signup"
                  className="group bg-gold-gradient text-[#0A0A0A] font-black px-8 py-4 rounded-2xl text-base hover:opacity-90 transition-all shadow-gold hover:shadow-[0_0_32px_rgba(201,168,76,0.5)] hover:-translate-y-0.5 duration-200 text-center"
                >
                  Start your free store →
                </a>
                <a
                  href="/mam/sweet200723"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass border border-white/15 text-white font-semibold px-8 py-4 rounded-2xl text-base hover:border-[#C9A84C]/40 transition-all hover:-translate-y-0.5 duration-200 text-center"
                >
                  See a live store ↗
                </a>
              </div>

              {/* Trust badges */}
              <div className="animate-fade-in delay-400 flex flex-wrap gap-4 text-xs text-white/35 font-medium">
                {["Free to start", "No coding needed", "Pay on delivery", "MTN MoMo accepted"].map(b => (
                  <span key={b} className="flex items-center gap-1.5">
                    <span className="text-[#C9A84C]">✓</span> {b}
                  </span>
                ))}
              </div>
            </div>

            {/* RIGHT — Creator photo + floating store card */}
            <div className="relative hidden md:block">
              {/* Main creator photo */}
              <div className="relative rounded-3xl overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,0.6)]" style={{ aspectRatio: "4/5" }}>
                <img
                  src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&q=80&auto=format&fit=crop"
                  alt="African TikTok creator"
                  className="w-full h-full object-cover"
                  loading="eager"
                />
                {/* Gold overlay gradient at bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent opacity-60" />
                {/* Creator badge overlay */}
                <div className="absolute bottom-5 left-5 right-5">
                  <div className="glass-gold rounded-2xl px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-white font-bold text-sm">@sweet200723</p>
                      <p className="text-[#C9A84C] text-xs font-medium">10K followers · GH₵ 240 earned today</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#C9A84C] flex items-center justify-center">
                      <span className="text-xs font-black text-[#0A0A0A]">✓</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating product card — top right */}
              <div className="absolute -top-4 -right-4 glass rounded-2xl p-3 shadow-xl border border-white/10 w-36 animate-fade-in delay-500">
                <div className="rounded-xl overflow-hidden mb-2" style={{ aspectRatio: "1/1" }}>
                  <img
                    src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=200&q=75&auto=format&fit=crop"
                    alt="Fashion product"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <p className="text-white text-[11px] font-semibold leading-tight mb-1">Kente Wrap Dress</p>
                <p className="text-[#C9A84C] text-xs font-black">GH₵ 185</p>
              </div>

              {/* Floating stat card — bottom left */}
              <div className="absolute -bottom-4 -left-4 glass rounded-2xl p-4 shadow-xl border border-white/10 animate-fade-in delay-600">
                <p className="text-3xl font-black text-shimmer mb-0.5">18%</p>
                <p className="text-white/50 text-xs">commission per sale</p>
                <div className="flex gap-1 mt-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-1.5 rounded-full bg-[#C9A84C]" style={{ width: `${[60,80,50,90,70][i]}%`, opacity: 0.7 + i * 0.06 }} />
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/20 animate-fade-in delay-600">
          <span className="text-xs tracking-widest uppercase font-medium">Scroll</span>
          <div className="w-px h-12 bg-gradient-to-b from-white/20 to-transparent" />
        </div>
      </section>

      {/* ── PRODUCT PHOTO STRIP ──────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-[#0A0A0A] overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center mb-10">
            <span className="text-[#C9A84C] text-xs font-bold tracking-[0.2em] uppercase block mb-2">Products on Yes MAM</span>
            <h2 className="font-display text-3xl md:text-4xl font-black text-white">African fashion. African beauty.</h2>
          </Reveal>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { url: "https://images.unsplash.com/photo-1594938298603-c8148c4b4d0a?w=400&q=75&auto=format&fit=crop", label: "Ankara Dress", price: "GH₵ 185" },
              { url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=75&auto=format&fit=crop", label: "Makeup Set", price: "GH₵ 95" },
              { url: "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400&q=75&auto=format&fit=crop", label: "Hair Bundle", price: "GH₵ 320" },
              { url: "https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=400&q=75&auto=format&fit=crop", label: "Accessories Set", price: "GH₵ 75" },
            ].map((p) => (
              <Reveal key={p.label}>
                <div className="rounded-2xl overflow-hidden relative group cursor-pointer">
                  <div style={{ aspectRatio: "4/5" }}>
                    <img
                      src={p.url}
                      alt={p.label}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/80 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-white text-sm font-bold">{p.label}</p>
                    <p className="text-[#C9A84C] text-xs font-black">{p.price}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={200} className="text-center mt-8">
            <a href="/mam/sweet200723" className="inline-flex items-center gap-2 text-sm font-semibold text-[#C9A84C] hover:text-[#E8C97A] transition-colors">
              Browse all products in Christiana&apos;s store ↗
            </a>
          </Reveal>
        </div>
      </section>

      {/* ── TICKER ───────────────────────────────────────────────────────── */}
      <Ticker />

      {/* ── STATS ────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-[#0A0A0A]">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat value="Africa" label="Live across the continent" delay={0} />
          <Stat value="18%" label="Creator commission rate" delay={100} />
          <Stat value="72hr" label="Max Accra delivery" delay={200} />
          <Stat value="Free" label="Zero cost to start" delay={300} />
        </div>
      </section>

      {/* ── TEMPLATES SHOWCASE ───────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-[#0A0A0A]">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center mb-14">
            <span className="text-[#C9A84C] text-xs font-bold tracking-[0.2em] uppercase block mb-3">4 Premium Templates</span>
            <h2 className="font-display text-4xl md:text-5xl font-black text-white mb-4">
              Your brand. Your vibe.
            </h2>
            <p className="text-white/40 max-w-xl mx-auto">
              Choose from four stunning storefront themes — from sleek gold luxury to bold Afrocentric.
              Switch anytime, preview live.
            </p>
          </Reveal>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <TemplateCard name="Glow" emoji="✨" bg="bg-[#111111]" accent="#C9A84C" textColor="text-white" delay={0} />
            <TemplateCard name="Kente" emoji="🎨" bg="bg-[#1a0800]" accent="#F5A623" textColor="text-orange-100" delay={100} />
            <TemplateCard name="Noir" emoji="🖤" bg="bg-[#0F0F0F]" accent="#D4A0A0" textColor="text-white" delay={200} />
            <TemplateCard name="Bloom" emoji="🌸" bg="bg-[#0a1a12]" accent="#52c78a" textColor="text-green-100" delay={300} />
          </div>

          <Reveal delay={400} className="text-center mt-10">
            <a
              href="/mam/sweet200723?t=glow"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#C9A84C] hover:text-[#E8C97A] transition-colors"
            >
              Preview all templates live ↗
            </a>
          </Reveal>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-4 bg-[#0d0d0d]">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center mb-16">
            <span className="text-[#C9A84C] text-xs font-bold tracking-[0.2em] uppercase block mb-3">The Process</span>
            <h2 className="font-display text-4xl md:text-5xl font-black text-white mb-4">
              From TikTok to paid
              <br />
              <span className="text-shimmer">in 3 steps.</span>
            </h2>
            <p className="text-white/40 max-w-xl mx-auto">
              No coding. No inventory. No upfront cost. Just your audience and your hustle.
            </p>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-16 items-start">
            {/* Creator flow */}
            <div className="glass rounded-3xl p-8 border border-white/8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 rounded-xl bg-gold-gradient flex items-center justify-center text-sm">📱</div>
                <p className="text-xs font-bold tracking-[0.18em] uppercase text-[#C9A84C]">For Creators</p>
              </div>
              <div className="space-y-7">
                <Step n="1" accent="#C9A84C" title="Get your store link — same day" desc="We set you up with a stunning branded store at your TikTok handle. Drop the link in your bio and start promoting within 24 hours." delay={0} />
                <Step n="2" accent="#C9A84C" title="Feature products in your videos" desc="Show products in your TikToks. Your followers tap your bio link, browse, and order in under 60 seconds on their phone." delay={100} />
                <Step n="3" accent="#C9A84C" title="Get paid straight to MoMo" desc="When an order is delivered, your 18% commission hits your MoMo wallet. Weekly payouts. See earnings in real time." delay={200} />
              </div>
            </div>

            {/* Vendor flow */}
            <div className="kente-pattern rounded-3xl p-8 border border-[#F5A623]/15">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 rounded-xl bg-[#8B2500] flex items-center justify-center text-sm">🏪</div>
                <p className="text-xs font-bold tracking-[0.18em] uppercase text-[#F5A623]">For Vendors</p>
              </div>
              <div className="space-y-7">
                <Step n="1" accent="#F5A623" title="List your products with us" desc="Our team adds your products to the MAM catalog with quality photos, descriptions, and pricing. Start with just 5 items." delay={0} />
                <Step n="2" accent="#F5A623" title="Creators promote to thousands" desc="Influencers with 10K+ followers put your products in front of their loyal, highly-engaged African audience — for free." delay={100} />
                <Step n="3" accent="#F5A623" title="Fulfill orders & grow" desc="Receive pre-filled order summaries. Deliver to your local area. We handle payments and creator commissions for you." delay={200} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOR CREATORS ─────────────────────────────────────────────────── */}
      <section id="for-creators" className="py-24 px-4 bg-[#0A0A0A]">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center mb-14">
            <span className="text-[#C9A84C] text-xs font-bold tracking-[0.2em] uppercase block mb-3">For Creators</span>
            <h2 className="font-display text-4xl md:text-5xl font-black text-white mb-4">
              Your audience is already buying.
            </h2>
            <p className="text-2xl text-shimmer font-black">Are you getting paid?</p>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-4 mb-14">
            <Feature icon="🏪" title="Stunning branded store" desc="4 premium themes. Your store matches your personal brand — gold luxury, Afrocentric, dark editorial, or fresh pastel." delay={0} />
            <Feature icon="📱" title="Built for Ghana phones" desc="Mobile-first, fast on 3G. Every customer in Accra can browse and order without WiFi struggles." delay={100} />
            <Feature icon="💬" title="WhatsApp backup always on" desc="Customers who prefer WhatsApp can order directly. You never lose a sale because of tech." delay={200} />
            <Feature icon="📊" title="Real-time earnings dashboard" desc="See every order, commission, and payout. Know exactly what you've earned today — all on your phone." delay={300} />
            <Feature icon="🔗" title="Tracking links for TikTok" desc="Create unique links for each video. Know which content drives your biggest sales days." delay={400} />
            <Feature icon="💰" title="18% on every delivered order" desc="Fashion. Hair. Accessories. Beauty. 18% commission on everything your followers buy through you." delay={500} />
          </div>

          {/* Creator CTA box */}
          <div id="creator-signup" className="relative overflow-hidden rounded-3xl bg-[#111111] border border-[#C9A84C]/20 p-8 md:p-12">
            {/* Background glow */}
            <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-[#C9A84C]/10 blur-[80px] pointer-events-none" />
            <div className="relative z-10 text-center max-w-xl mx-auto">
              <Reveal>
                <div className="text-5xl mb-4 animate-float inline-block">🚀</div>
                <h3 className="font-display text-3xl md:text-4xl font-black text-white mb-3">
                  Ready to turn followers into income?
                </h3>
                <p className="text-white/40 mb-8 text-base">
                  Join Yes MAM free. We set up your store, add products, and you start promoting.
                  First commission in days, not months.
                </p>
                <CreatorSignupForm />
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOR VENDORS ──────────────────────────────────────────────────── */}
      <section id="for-vendors" className="py-24 px-4 bg-[#0d0d0d]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Reveal>
                <span className="text-[#F5A623] text-xs font-bold tracking-[0.2em] uppercase block mb-4">For Vendors</span>
                <h2 className="font-display text-4xl md:text-5xl font-black text-white mb-5">
                  Reach 10,000+ buyers
                  <br />
                  <span className="text-[#F5A623]">without ads.</span>
                </h2>
                <p className="text-white/50 leading-relaxed mb-6 text-base">
                  Our TikTok creators promote your products to their engaged audiences.
                  You only pay commission when an order is delivered — zero risk, zero upfront cost.
                </p>
              </Reveal>
              <div className="space-y-3">
                {[
                  "Zero upfront cost — pay only on successful delivery",
                  "Reach Africa's most engaged social media audiences",
                  "We handle order management and creator payments",
                  "Pre-filled order summaries delivered to you",
                  "Start with as few as 5 products",
                ].map((item, i) => (
                  <Reveal key={item} delay={i * 80}>
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#F5A623]/15 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[#F5A623] text-xs font-bold">✓</span>
                      </div>
                      <p className="text-sm text-white/60">{item}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>

            <Reveal delay={200}>
              <div id="vendor-signup" className="kente-pattern rounded-3xl p-8 border border-[#F5A623]/20">
                <h3 className="text-xl font-black text-[#F5A623] mb-1">List your products on Yes MAM</h3>
                <p className="text-sm text-white/40 mb-6">We're onboarding vendors across Africa now. Fashion, hair, beauty & accessories.</p>
                <VendorSignupForm />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ─────────────────────────────────────────────────── */}
      <section id="proof" className="py-24 px-4 bg-[#0A0A0A]">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center mb-14">
            <span className="text-[#C9A84C] text-xs font-bold tracking-[0.2em] uppercase block mb-3">Early Results</span>
            <h2 className="font-display text-4xl md:text-5xl font-black text-white mb-4">
              It's working across Africa.
            </h2>
            <p className="text-white/40 max-w-lg mx-auto">Real creators, real vendors, real results — from our founding pilot.</p>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-5">
            <Reveal delay={0}>
              <div className="glass rounded-2xl border border-[#C9A84C]/20 hover:border-[#C9A84C]/40 transition-colors h-full flex flex-col overflow-hidden">
                <div className="h-40 overflow-hidden relative">
                  <img
                    src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=500&q=75&auto=format&fit=crop&crop=top"
                    alt="Christiana Amankwaah"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#111]/60" />
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => <span key={i} className="text-[#C9A84C] text-sm">★</span>)}
                  </div>
                  <p className="text-white/70 leading-relaxed italic mb-5 flex-1">&ldquo;I posted one video and got 3 orders the same day. My followers bought because they trust me. Yes MAM made it so easy.&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border-2 border-[#C9A84C]/40">
                      <img src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&q=75&auto=format&fit=crop&crop=face" alt="Christiana" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white">Christiana Amankwaah</p>
                      <p className="text-xs text-white/40">TikTok Creator · @sweet200723 · Africa</p>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
            <Testimonial
              quote="Within the first week we had orders we couldn't have reached through our regular channels. The creator's audience is incredibly loyal."
              name="Accra Style Hub"
              role="Fashion Vendor · East Legon, Accra"
              initial="A"
              accent="#8B2500"
              delay={100}
            />
            <Testimonial
              quote="The dashboard is simple enough that I check it every morning on my phone. I can see what sold, what's pending, what I've earned. It just works."
              name="Ghana Wig Queen"
              role="Hair Vendor · Spintex Road, Accra"
              initial="G"
              accent="#2D6A4F"
              delay={200}
            />
          </div>
        </div>
      </section>

      {/* ── CREATOR LEADERBOARD ──────────────────────────────────────────── */}
      <CreatorLeaderboard />

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      <section className="py-28 px-4 relative overflow-hidden bg-[#0d0d0d]">
        <div className="absolute inset-0 bg-animated-gradient" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-[#C9A84C]/10 blur-[80px]" />
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <Reveal>
            <div className="text-6xl mb-6 animate-float inline-block">🇬🇭</div>
            <h2 className="font-display text-4xl md:text-5xl font-black text-white mb-5">
              Africa's creator economy
              <br />
              <span className="text-shimmer">starts here.</span>
            </h2>
            <p className="text-white/40 mb-10 text-lg">
              Free for creators. Zero risk for vendors. Built for Africa.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="#creator-signup"
                className="bg-gold-gradient text-[#0A0A0A] font-black px-8 py-4 rounded-2xl text-base hover:opacity-90 transition-all shadow-gold hover:-translate-y-0.5 duration-200"
              >
                I'm a creator — start my store →
              </a>
              <a
                href="#vendor-signup"
                className="glass border border-white/15 text-white font-semibold px-8 py-4 rounded-2xl text-base hover:border-[#C9A84C]/40 transition-all hover:-translate-y-0.5 duration-200"
              >
                I'm a vendor — list my products
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
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
                Turning TikTok followers into real income.
              </p>
              <p className="text-xs text-white/20 mt-3">yesmam.shop · yesmamshop.com</p>
            </div>

            {/* Links */}
            <div className="grid grid-cols-2 gap-x-16 gap-y-3 text-sm text-white/40">
              <a href="/mam/sweet200723" className="hover:text-[#C9A84C] transition-colors">Live demo store</a>
              <a href="/mam/dashboard" className="hover:text-[#C9A84C] transition-colors">Creator login</a>
              <a href="#how-it-works" className="hover:text-[#C9A84C] transition-colors">How it works</a>
              <a href="/mam/admin" className="hover:text-[#C9A84C] transition-colors">Admin</a>
              <a href="#creator-signup" className="hover:text-[#C9A84C] transition-colors">Join as creator</a>
              <a href="#vendor-signup" className="hover:text-[#C9A84C] transition-colors">List products</a>
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
    </div>
  );
}
