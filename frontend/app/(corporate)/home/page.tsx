"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";

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
        <a href="/mam/home" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-gold-gradient flex items-center justify-center shadow-gold-sm group-hover:scale-105 transition-transform">
            <span className="text-base font-black text-[#0A0A0A] tracking-tighter">Y</span>
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
          <a href="#how-it-works" className="hover:text-white transition-colors hover:text-[#C9A84C]">How it works</a>
          <a href="#for-creators" className="hover:text-white transition-colors hover:text-[#C9A84C]">For Creators</a>
          <a href="#for-vendors" className="hover:text-white transition-colors hover:text-[#C9A84C]">For Vendors</a>
          <a href="#proof" className="hover:text-white transition-colors hover:text-[#C9A84C]">Results</a>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/mam/dashboard" className="text-sm font-semibold text-white/60 hover:text-white transition-colors px-4 py-2">
            Creator Login
          </Link>
          <a
            href="#creator-signup"
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
    "🇬🇭 Ghana's #1 Creator Commerce Platform",
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
export default function YesMAMHomePage() {
  return (
    <div className="bg-[#0A0A0A] text-white min-h-screen">
      <Nav />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-20">
        {/* Animated background */}
        <div className="absolute inset-0 bg-animated-gradient" />

        {/* Gold radial glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-[#C9A84C]/8 blur-[100px] pointer-events-none" />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(#C9A84C 1px, transparent 1px), linear-gradient(90deg, #C9A84C 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-20 text-center">
          {/* Eyebrow badge */}
          <div className="animate-fade-in inline-flex items-center gap-2 glass-gold text-[#C9A84C] text-xs font-bold tracking-[0.15em] uppercase px-5 py-2 rounded-full mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-pulse" />
            Ghana's Creator Commerce Platform
            <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-pulse" />
          </div>

          {/* Main headline */}
          <h1 className="animate-fade-in delay-100 font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[1.0] mb-6 tracking-tight">
            <span className="block text-white">Your followers</span>
            <span className="block text-shimmer">are your shop.</span>
          </h1>

          {/* Sub */}
          <p className="animate-fade-in delay-200 text-lg md:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed mb-10">
            Yes MAM gives Ghana's TikTok creators a stunning, branded store in minutes.
            Your audience browses, orders, and pays on delivery —
            while you <strong className="text-white">earn 18% on every sale.</strong>
          </p>

          {/* CTAs */}
          <div className="animate-fade-in delay-300 flex flex-col sm:flex-row gap-3 justify-center mb-12">
            <a
              href="#creator-signup"
              className="group bg-gold-gradient text-[#0A0A0A] font-black px-8 py-4 rounded-2xl text-base hover:opacity-90 transition-all shadow-gold hover:shadow-[0_0_32px_rgba(201,168,76,0.5)] hover:-translate-y-0.5 duration-200"
            >
              Start your free store →
            </a>
            <a
              href="/mam/sweet200723"
              target="_blank"
              rel="noopener noreferrer"
              className="glass border border-white/15 text-white font-semibold px-8 py-4 rounded-2xl text-base hover:border-[#C9A84C]/40 transition-all hover:-translate-y-0.5 duration-200"
            >
              See Christiana's store ↗
            </a>
          </div>

          {/* Trust badges */}
          <div className="animate-fade-in delay-400 flex flex-wrap justify-center gap-4 text-xs text-white/35 font-medium">
            {["Free to start", "No coding needed", "Pay on delivery", "MTN MoMo accepted", "Accra delivery"].map(b => (
              <span key={b} className="flex items-center gap-1.5">
                <span className="text-[#C9A84C]">✓</span> {b}
              </span>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/20 animate-fade-in delay-600">
          <span className="text-xs tracking-widest uppercase font-medium">Scroll</span>
          <div className="w-px h-12 bg-gradient-to-b from-white/20 to-transparent" />
        </div>
      </section>

      {/* ── TICKER ───────────────────────────────────────────────────────── */}
      <Ticker />

      {/* ── STATS ────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-[#0A0A0A]">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat value="Ghana" label="Pilot market — live now" delay={0} />
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
                <Step n="2" accent="#F5A623" title="Creators promote to thousands" desc="Influencers with 10K+ followers put your products in front of their loyal, highly-engaged Ghana audience — for free." delay={100} />
                <Step n="3" accent="#F5A623" title="Fulfill orders & grow" desc="Receive pre-filled order summaries. Deliver to Accra. We handle payments and creator commissions for you." delay={200} />
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
                  "Reach Ghana's most engaged social media audiences",
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
                <p className="text-sm text-white/40 mb-6">We're onboarding Accra vendors now. Fashion, hair, beauty & accessories.</p>
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
              It's working in Ghana.
            </h2>
            <p className="text-white/40 max-w-lg mx-auto">Real creators, real vendors, real results — from Accra's first season.</p>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-5">
            <Testimonial
              quote="I posted one video and got 3 orders the same day. My followers bought because they trust me. Yes MAM made it so easy."
              name="Christiana Amankwaah"
              role="TikTok Creator · @sweet200723 · Ghana"
              initial="C"
              accent="#C9A84C"
              delay={0}
            />
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

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      <section className="py-28 px-4 relative overflow-hidden bg-[#0d0d0d]">
        <div className="absolute inset-0 bg-animated-gradient" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-[#C9A84C]/10 blur-[80px]" />
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <Reveal>
            <div className="text-6xl mb-6 animate-float inline-block">🇬🇭</div>
            <h2 className="font-display text-4xl md:text-5xl font-black text-white mb-5">
              Ghana's creator economy
              <br />
              <span className="text-shimmer">starts here.</span>
            </h2>
            <p className="text-white/40 mb-10 text-lg">
              Free for creators. Zero risk for vendors. Built for Accra.
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
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-gold-gradient flex items-center justify-center">
                  <span className="text-sm font-black text-[#0A0A0A]">Y</span>
                </div>
                <span className="font-black text-white text-lg">Yes MAM</span>
              </div>
              <p className="text-xs text-white/30 max-w-xs leading-relaxed">
                Micro-Affiliate Marketing — Ghana's creator commerce platform.
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
            <p className="text-xs text-white/20">© 2026 Yes MAM · Micro-Affiliate Marketing · Built in Ghana 🇬🇭</p>
            <div className="flex items-center gap-2 text-xs text-white/20">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
              Platform live · Accra pilot active
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
