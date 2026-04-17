"use client";
import { useRef, useEffect, useState } from "react";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add("visible"); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useReveal();
  return (
    <div ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

const CREATOR_STEPS = [
  {
    n: "01",
    title: "Sign up — it's free",
    desc: "Create your Yes MAM account with your TikTok handle. No credit card, no contract.",
    icon: "✍️",
    accent: "#C9A84C",
  },
  {
    n: "02",
    title: "Get your store",
    desc: "Your branded storefront goes live within 24 hours. Pick your theme — Glow, Kente, Noir, or Bloom.",
    icon: "🏪",
    accent: "#C9A84C",
  },
  {
    n: "03",
    title: "Products are loaded for you",
    desc: "We curate products from our Accra vendor network and add them to your catalog. Fashion, hair, beauty, accessories.",
    icon: "🛍️",
    accent: "#C9A84C",
  },
  {
    n: "04",
    title: "Share your store link in TikTok bio",
    desc: "Drop your Yes MAM link in your bio. Use your dashboard to create trackable links for each video.",
    icon: "📱",
    accent: "#C9A84C",
  },
  {
    n: "05",
    title: "Followers order through your store",
    desc: "Customers fill in their details, or WhatsApp you directly. Every order is tracked to your account.",
    icon: "📦",
    accent: "#C9A84C",
  },
  {
    n: "06",
    title: "Earn 18% on every delivered order",
    desc: "When the vendor confirms delivery, your commission is recorded. Payout via MTN MoMo or bank transfer.",
    icon: "💰",
    accent: "#C9A84C",
  },
];

const VENDOR_STEPS = [
  {
    n: "01",
    title: "Apply to list your products",
    desc: "Tell us about your business — fashion, hair, beauty, or accessories. We onboard vendors with quality stock.",
    icon: "📋",
    accent: "#F5A623",
  },
  {
    n: "02",
    title: "Upload your catalog",
    desc: "Add up to 50 SKUs with photos, prices, and stock levels. Our ops team reviews and activates your products.",
    icon: "🗂️",
    accent: "#F5A623",
  },
  {
    n: "03",
    title: "Creators promote your products",
    desc: "Our network of TikTok creators showcase your products to their engaged audiences. You reach buyers you never could through ads.",
    icon: "📣",
    accent: "#F5A623",
  },
  {
    n: "04",
    title: "Orders arrive pre-formatted",
    desc: "When a customer orders, you receive a pre-filled WhatsApp summary: name, phone, address, product, size, quantity.",
    icon: "📩",
    accent: "#F5A623",
  },
  {
    n: "05",
    title: "You fulfill and confirm delivery",
    desc: "Pack and deliver the order your usual way. Mark it delivered in the vendor portal — this triggers commission.",
    icon: "🚚",
    accent: "#F5A623",
  },
  {
    n: "06",
    title: "Pay commission only on success",
    desc: "Platform fee deducted only on confirmed deliveries. Zero risk — you never pay for cancelled or undelivered orders.",
    icon: "✅",
    accent: "#F5A623",
  },
];

const FAQS = [
  {
    q: "How much does it cost for creators?",
    a: "Yes MAM is completely free for creators. You earn 18% commission on every order that gets delivered through your store. No monthly fees, no setup cost.",
  },
  {
    q: "What products are available?",
    a: "Our Accra vendor network carries fashion, hair, beauty, accessories, and select lifestyle products. As we grow, so does the catalog.",
  },
  {
    q: "How do customers pay?",
    a: "Currently, customers contact the creator via WhatsApp and pay via MTN MoMo or Telecel Cash on delivery. Paystack (card + mobile money) integration is coming in Q3 2026.",
  },
  {
    q: "How fast can I start selling?",
    a: "Your storefront is live within 24 hours of signing up. Products are loaded by our ops team — you don't need to manage a catalog.",
  },
  {
    q: "When do vendors pay commission?",
    a: "Commission is only triggered when you mark an order as delivered. Cancelled or undelivered orders are never charged.",
  },
  {
    q: "Can I use Yes MAM alongside other platforms?",
    a: "Absolutely. Yes MAM doesn't require exclusivity. Most creators use it alongside their regular content and other brand deals.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-white/8 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-white/3 transition-colors"
      >
        <span className="font-semibold text-white text-sm pr-4">{q}</span>
        <span className={`text-[#C9A84C] text-xl font-light shrink-0 transition-transform duration-300 ${open ? "rotate-45" : ""}`}>+</span>
      </button>
      {open && (
        <div className="px-5 pb-5">
          <p className="text-sm text-white/50 leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function HowItWorksPage() {
  const [mode, setMode] = useState<"creator" | "vendor">("creator");
  const steps = mode === "creator" ? CREATOR_STEPS : VENDOR_STEPS;
  const accentColor = mode === "creator" ? "#C9A84C" : "#F5A623";

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <MarketingNav activePage="How it works" />

      {/* ── HERO ── */}
      <section className="pt-32 pb-16 px-4 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full bg-[#C9A84C]/7 blur-[100px] pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Reveal>
            <span className="text-[#C9A84C] text-xs font-bold tracking-[0.25em] uppercase block mb-4">Simple by design</span>
            <h1 className="font-display text-5xl md:text-6xl font-black text-white mb-5 leading-tight">
              How Yes MAM works
            </h1>
            <p className="text-white/50 text-lg max-w-xl mx-auto leading-relaxed">
              Whether you're a creator or a vendor, getting started takes less than a day.
              Here's exactly how the platform works.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── MODE TOGGLE ── */}
      <section className="pb-16 px-4">
        <div className="max-w-xs mx-auto">
          <div className="bg-[#1A1A1A] rounded-2xl p-1.5 flex">
            <button
              onClick={() => setMode("creator")}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                mode === "creator"
                  ? "bg-[#C9A84C] text-black shadow-gold-sm"
                  : "text-white/40 hover:text-white"
              }`}
            >
              For Creators
            </button>
            <button
              onClick={() => setMode("vendor")}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                mode === "vendor"
                  ? "bg-[#F5A623] text-black"
                  : "text-white/40 hover:text-white"
              }`}
            >
              For Vendors
            </button>
          </div>
        </div>
      </section>

      {/* ── STEPS ── */}
      <section className="pb-24 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative pl-8 space-y-8">
            {/* Connecting line */}
            <div className="absolute left-3 top-5 bottom-5 w-px bg-white/8" />
            {steps.map((step, i) => (
              <Reveal key={step.n} delay={i * 80}>
                <div className="relative flex gap-6 items-start">
                  {/* Step number badge */}
                  <div
                    className="absolute -left-[38px] w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs text-black shrink-0 shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${step.accent}cc, ${step.accent})` }}
                  >
                    {step.n}
                  </div>
                  <div className="glass rounded-2xl p-5 border border-white/8 hover:border-white/15 transition-all w-full flex gap-4 items-start">
                    <span className="text-2xl shrink-0">{step.icon}</span>
                    <div>
                      <p className="font-bold text-white mb-1">{step.title}</p>
                      <p className="text-sm text-white/50 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLATFORM DIAGRAM ── */}
      <section className="py-20 px-4 bg-[#0d0d0d]">
        <div className="max-w-4xl mx-auto">
          <Reveal className="text-center mb-12">
            <span className="text-[#C9A84C] text-xs font-bold tracking-[0.2em] uppercase block mb-3">The full picture</span>
            <h2 className="font-display text-3xl font-black text-white">How it all connects</h2>
          </Reveal>
          <Reveal delay={100}>
            <div className="glass rounded-3xl p-8 border border-white/8">
              <div className="grid md:grid-cols-3 gap-4 text-center">
                {/* Creator */}
                <div className="bg-[#C9A84C]/10 rounded-2xl p-6 border border-[#C9A84C]/20">
                  <div className="text-3xl mb-3">🎬</div>
                  <p className="font-bold text-[#C9A84C] mb-2">Creator</p>
                  <p className="text-xs text-white/50 leading-relaxed">Posts TikTok content → drives traffic → earns 18% commission per delivery</p>
                </div>
                {/* Arrow + Yes MAM */}
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="text-white/20 text-2xl font-light hidden md:block">⇄</div>
                  <div className="bg-[#1A1A1A] rounded-2xl p-5 border border-[#C9A84C]/30 w-full">
                    <p className="font-black text-white text-sm mb-1">Yes MAM</p>
                    <p className="text-[10px] text-white/40 leading-relaxed">Orders • Tracking • Commissions • Notifications • Payouts</p>
                  </div>
                  <div className="text-white/20 text-2xl font-light hidden md:block">⇄</div>
                </div>
                {/* Vendor */}
                <div className="bg-[#F5A623]/10 rounded-2xl p-6 border border-[#F5A623]/20">
                  <div className="text-3xl mb-3">🏪</div>
                  <p className="font-bold text-[#F5A623] mb-2">Vendor</p>
                  <p className="text-xs text-white/50 leading-relaxed">Receives order → fulfills → confirms delivery → pays commission only on success</p>
                </div>
              </div>
              {/* Bottom: customer */}
              <div className="mt-4 bg-white/3 rounded-2xl p-5 text-center border border-white/5">
                <span className="text-2xl">🛍️</span>
                <p className="text-sm font-bold text-white mt-2 mb-1">Customer</p>
                <p className="text-xs text-white/40">Discovers product through creator → orders via store form or WhatsApp → pays on delivery via MoMo</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 px-4 bg-[#0A0A0A]">
        <div className="max-w-2xl mx-auto">
          <Reveal className="text-center mb-12">
            <span className="text-[#C9A84C] text-xs font-bold tracking-[0.2em] uppercase block mb-3">Got questions?</span>
            <h2 className="font-display text-3xl font-black text-white">FAQ</h2>
          </Reveal>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <Reveal key={i} delay={i * 60}>
                <FaqItem q={faq.q} a={faq.a} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-4 bg-[#0d0d0d] relative overflow-hidden">
        <div className="absolute inset-0 bg-animated-gradient opacity-40" />
        <div className="relative z-10 max-w-xl mx-auto text-center">
          <Reveal>
            <h2 className="font-display text-3xl md:text-4xl font-black text-white mb-4">
              Ready to start?
            </h2>
            <p className="text-white/40 mb-8 text-base">
              Your store is free. Setup takes 24 hours. Your first commission could come this week.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="/mam/join#creators"
                className="bg-gold-gradient text-[#0A0A0A] font-black px-7 py-3.5 rounded-2xl text-sm hover:opacity-90 transition-all shadow-gold hover:-translate-y-0.5"
              >
                I'm a creator →
              </a>
              <a
                href="/mam/join#vendors"
                className="glass border border-white/15 text-white font-semibold px-7 py-3.5 rounded-2xl text-sm hover:border-[#C9A84C]/40 transition-all"
              >
                I'm a vendor
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
