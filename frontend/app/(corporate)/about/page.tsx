"use client";
import { useRef, useEffect } from "react";
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

const TEAM = [
  {
    name: "Louis Hook",
    role: "Founder & Sponsor",
    bio: "Visionary behind Yes MAM and author of Black in the Saddle. Louis brings two decades of community-building experience and a deep belief in Africa's creator economy.",
    initial: "L",
    accent: "#C9A84C",
    email: "louis@educatedhoodrat.com",
  },
  {
    name: "David Bezar",
    role: "COO / CTO / PMO Director",
    bio: "David architects the platform and leads technical execution. He bridges product, engineering, and operations to make Yes MAM fast, reliable, and scalable.",
    initial: "D",
    accent: "#8B2500",
    email: "airatpack@gmail.com",
  },
  {
    name: "Christiana Amankwaah",
    role: "Africa Pilot Creator · @sweet200723",
    bio: "TikTok creator with 10K+ loyal followers across Africa. Christiana is the first Yes MAM creator — her store at sensedirector.com/mam/sweet200723 is already live.",
    initial: "C",
    accent: "#2D6A4F",
    email: "uchik9935@gmail.com",
  },
  {
    name: "Miguel Flores Gayle",
    role: "Compton Cowboys Content Manager",
    bio: "Miguel leads content strategy for the Compton Cowboys Africa partnership and the Black in the Saddle book campaign with Christiana.",
    initial: "M",
    accent: "#5B4FCF",
    email: "directorgayle@gmail.com",
  },
];

const VALUES = [
  {
    icon: "🇬🇭",
    title: "Africa First",
    desc: "We didn't build a Western platform and bolt Africa on. We built for African creators — MTN MoMo, WhatsApp orders, TikTok discovery, local vendors across the continent.",
  },
  {
    icon: "⚡",
    title: "Creator Ownership",
    desc: "Creators keep 18% commission on every sale. Their audience, their income — we just provide the infrastructure.",
  },
  {
    icon: "🤝",
    title: "Zero Risk for Vendors",
    desc: "Vendors only pay when an order is delivered. No ad spend, no upfront fees. You bring the product; creators bring the buyers.",
  },
  {
    icon: "📱",
    title: "Mobile Native",
    desc: "Everything — ordering, tracking, payouts — works on a basic Android. Africa's economy runs on mobile and so do we.",
  },
  {
    icon: "🔍",
    title: "Full Transparency",
    desc: "Every click, view, and order is tracked. Creators see their earnings in real time. Vendors see exactly what sold and when.",
  },
  {
    icon: "🚀",
    title: "Pilot Before Scale",
    desc: "We're proving the model in Accra first. When the Africa pilot succeeds, we take the playbook to Lagos, Nairobi, and beyond.",
  },
];

const MILESTONES = [
  { date: "Q1 2026", event: "Platform built and deployed on live infrastructure", done: true },
  { date: "Q2 2026", event: "Africa pilot live — Christiana's storefront active at /sweet200723", done: true },
  { date: "Q2 2026", event: "Compton Cowboys / Black in the Saddle Africa campaign", done: false },
  { date: "Q3 2026", event: "Paystack + MTN MoMo payment integration", done: false },
  { date: "Q3 2026", event: "10 African creators onboarded", done: false },
  { date: "Q4 2026", event: "Lagos expansion — Nigeria pilot", done: false },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <MarketingNav activePage="About" />

      {/* ── HERO ── */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-[#C9A84C]/8 blur-[100px] pointer-events-none" />
        <div className="max-w-4xl mx-auto relative z-10">
          <Reveal>
            <span className="text-[#C9A84C] text-xs font-bold tracking-[0.25em] uppercase block mb-4">Our Story</span>
            <h1 className="font-display text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
              Built for Africa's<br />
              <span className="text-shimmer">creator generation.</span>
            </h1>
            <p className="text-white/50 text-lg leading-relaxed max-w-2xl">
              Yes MAM started with a simple question: why can't a TikTok creator in Africa with 10,000 loyal followers
              turn that trust into income — without a bank account, a Shopify store, or a credit card?
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── MISSION ── */}
      <section className="py-20 px-4 bg-[#0d0d0d]">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <Reveal>
              <div>
                <span className="text-[#C9A84C] text-xs font-bold tracking-[0.2em] uppercase block mb-4">Mission</span>
                <h2 className="font-display text-3xl md:text-4xl font-black text-white mb-5">
                  Turn every follower<br />into a customer.
                </h2>
                <p className="text-white/50 leading-relaxed mb-5">
                  Africa's TikTok creators have enormous influence — but zero infrastructure to monetize it.
                  We fix that. Yes MAM gives creators a branded storefront, a product catalog curated from
                  real local vendors, and commission on every order they drive.
                </p>
                <p className="text-white/50 leading-relaxed">
                  For vendors: your products reach audiences you could never buy through ads.
                  You pay nothing until a sale is delivered. That's the Yes MAM promise.
                </p>
              </div>
            </Reveal>

            <Reveal delay={150}>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { v: "10K+", l: "Pilot followers reached" },
                  { v: "18%", l: "Creator commission" },
                  { v: "0", l: "Upfront cost for vendors" },
                  { v: "24h", l: "Time to live storefront" },
                ].map((s, i) => (
                  <div key={i} className="glass-gold rounded-2xl p-5 text-center">
                    <p className="text-3xl font-black text-shimmer mb-1">{s.v}</p>
                    <p className="text-xs text-white/40 leading-snug">{s.l}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── VALUES ── */}
      <section className="py-20 px-4 bg-[#0A0A0A]">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-14">
            <span className="text-[#C9A84C] text-xs font-bold tracking-[0.2em] uppercase block mb-3">What we stand for</span>
            <h2 className="font-display text-3xl md:text-4xl font-black text-white">
              Our values
            </h2>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-5">
            {VALUES.map((v, i) => (
              <Reveal key={v.title} delay={i * 80}>
                <div className="glass rounded-2xl p-6 border border-white/8 hover:border-[#C9A84C]/30 transition-all hover:-translate-y-1 duration-300 h-full">
                  <div className="text-3xl mb-4">{v.icon}</div>
                  <p className="font-bold text-white mb-2">{v.title}</p>
                  <p className="text-sm text-white/50 leading-relaxed">{v.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEAM ── */}
      <section className="py-20 px-4 bg-[#0d0d0d]">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-14">
            <span className="text-[#C9A84C] text-xs font-bold tracking-[0.2em] uppercase block mb-3">The People</span>
            <h2 className="font-display text-3xl md:text-4xl font-black text-white">
              Meet the team
            </h2>
          </Reveal>
          <div className="grid md:grid-cols-2 gap-6">
            {TEAM.map((member, i) => (
              <Reveal key={member.name} delay={i * 80}>
                <div className="glass rounded-2xl p-6 border border-white/8 hover:border-[#C9A84C]/25 transition-all duration-300 flex gap-5">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl text-white shrink-0 shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${member.accent}99, ${member.accent})` }}
                  >
                    {member.initial}
                  </div>
                  <div>
                    <p className="font-bold text-white text-base mb-0.5">{member.name}</p>
                    <p className="text-xs text-[#C9A84C] font-semibold mb-3">{member.role}</p>
                    <p className="text-sm text-white/50 leading-relaxed">{member.bio}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROADMAP ── */}
      <section className="py-20 px-4 bg-[#0A0A0A]">
        <div className="max-w-3xl mx-auto">
          <Reveal className="text-center mb-14">
            <span className="text-[#C9A84C] text-xs font-bold tracking-[0.2em] uppercase block mb-3">The Journey</span>
            <h2 className="font-display text-3xl md:text-4xl font-black text-white">
              Where we're going
            </h2>
          </Reveal>
          <div className="relative pl-8 space-y-6">
            {/* vertical line */}
            <div className="absolute left-3 top-2 bottom-2 w-px bg-white/10" />
            {MILESTONES.map((m, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className="relative flex gap-5 items-start">
                  <div
                    className={`absolute -left-8 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      m.done
                        ? "bg-[#C9A84C] border-[#C9A84C]"
                        : "bg-[#0A0A0A] border-white/20"
                    }`}
                  >
                    {m.done && <span className="text-black text-[10px] font-black">✓</span>}
                  </div>
                  <div className="pb-2">
                    <span className={`text-xs font-bold tracking-wider uppercase ${m.done ? "text-[#C9A84C]" : "text-white/30"}`}>
                      {m.date}
                    </span>
                    <p className={`text-sm mt-0.5 ${m.done ? "text-white/80" : "text-white/40"}`}>{m.event}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-4 bg-[#0d0d0d] relative overflow-hidden">
        <div className="absolute inset-0 bg-animated-gradient opacity-40" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[250px] rounded-full bg-[#C9A84C]/10 blur-[80px]" />
        <div className="relative z-10 max-w-xl mx-auto text-center">
          <Reveal>
            <h2 className="font-display text-3xl md:text-4xl font-black text-white mb-4">
              Ready to be part of it?
            </h2>
            <p className="text-white/40 mb-8">
              Whether you're a creator with an audience or a vendor with great products — there's a place for you on Yes MAM.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="/mam/join#creators"
                className="bg-gold-gradient text-[#0A0A0A] font-black px-7 py-3.5 rounded-2xl text-sm hover:opacity-90 transition-all shadow-gold hover:-translate-y-0.5 duration-200"
              >
                Start my store →
              </a>
              <a
                href="/mam/join#vendors"
                className="glass border border-white/15 text-white font-semibold px-7 py-3.5 rounded-2xl text-sm hover:border-[#C9A84C]/40 transition-all hover:-translate-y-0.5 duration-200"
              >
                List my products
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
