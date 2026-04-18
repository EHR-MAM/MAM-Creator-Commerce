"use client";
import { useRef, useEffect, useState } from "react";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8200";

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

const CREATOR_BENEFITS = [
  { icon: "🏪", title: "Free branded storefront", desc: "Live in 24 hours. 4 premium themes." },
  { icon: "💰", title: "18% commission", desc: "On every delivered order. No cap." },
  { icon: "📊", title: "Real-time dashboard", desc: "Track orders, clicks, earnings live." },
  { icon: "📱", title: "WhatsApp orders", desc: "Customers can order by message." },
  { icon: "🔗", title: "Trackable TikTok links", desc: "Know which video drives which sale." },
  { icon: "🌍", title: "African vendor catalog", desc: "Fashion, hair, beauty, accessories." },
];

const VENDOR_BENEFITS = [
  { icon: "📣", title: "TikTok reach", desc: "Products promoted to 10K+ engaged followers." },
  { icon: "✅", title: "Zero upfront cost", desc: "Pay commission only on delivered orders." },
  { icon: "📩", title: "Pre-filled orders", desc: "Receive customer details via WhatsApp." },
  { icon: "📦", title: "Start with 5 products", desc: "No minimum catalog size required." },
  { icon: "📈", title: "Vendor portal", desc: "Track orders, manage stock, view sales." },
  { icon: "🤝", title: "Dedicated support", desc: "Our ops team handles creator coordination." },
];

function CreatorSignupForm() {
  const [form, setForm] = useState({ name: "", tiktok: "", phone: "", location: "Accra", email: "", password: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Register account via API
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          role: "influencer",
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.detail || "Registration failed. Please try again.");
        setLoading(false);
        return;
      }
    } catch {
      setError("Network error — please try again.");
      setLoading(false);
      return;
    }

    // Also send WhatsApp message so ops team knows to set up the store
    const msg = encodeURIComponent(
      `Hi! I just signed up on Yes MAM as a creator.\n\nName: ${form.name}\nTikTok: @${form.tiktok}\nPhone: ${form.phone}\nLocation: ${form.location}\nEmail: ${form.email}\n\nPlease set up my store!`
    );
    window.open(`https://wa.me/13107763650?text=${msg}`, "_blank");
    setLoading(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-4">🎉</div>
        <p className="font-bold text-white text-lg mb-2">You&apos;re in!</p>
        <p className="text-sm text-white/50 mb-3">Account created. Check WhatsApp — our team will set up your store within 24 hours.</p>
        <a
          href="/mam/login"
          className="inline-block px-6 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: "#C9A84C", color: "#0A0A0A" }}
        >
          Sign in to your dashboard →
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-900/40 border border-red-700 text-red-300 text-sm">
          {error}
        </div>
      )}
      <div>
        <label className="text-xs text-white/50 font-medium block mb-1.5">Full name</label>
        <input
          required
          value={form.name}
          onChange={set("name")}
          placeholder="Christiana Amankwaah"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#C9A84C]/60 transition-colors"
        />
      </div>
      <div>
        <label className="text-xs text-white/50 font-medium block mb-1.5">Email</label>
        <input
          required
          type="email"
          value={form.email}
          onChange={set("email")}
          placeholder="you@example.com"
          autoComplete="email"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#C9A84C]/60 transition-colors"
        />
      </div>
      <div>
        <label className="text-xs text-white/50 font-medium block mb-1.5">Password</label>
        <input
          required
          type="password"
          value={form.password}
          onChange={set("password")}
          placeholder="Min. 8 characters"
          minLength={8}
          autoComplete="new-password"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#C9A84C]/60 transition-colors"
        />
      </div>
      <div>
        <label className="text-xs text-white/50 font-medium block mb-1.5">TikTok handle</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm">@</span>
          <input
            required
            value={form.tiktok}
            onChange={set("tiktok")}
            placeholder="sweet200723"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#C9A84C]/60 transition-colors"
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-white/50 font-medium block mb-1.5">WhatsApp number</label>
        <input
          required
          value={form.phone}
          onChange={set("phone")}
          placeholder="+233 XX XXX XXXX"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#C9A84C]/60 transition-colors"
        />
      </div>
      <div>
        <label className="text-xs text-white/50 font-medium block mb-1.5">Location</label>
        <select
          value={form.location}
          onChange={set("location")}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C9A84C]/60 transition-colors"
        >
          <option value="Accra">Accra</option>
          <option value="Kumasi">Kumasi</option>
          <option value="Tamale">Tamale</option>
          <option value="Cape Coast">Cape Coast</option>
          <option value="Other">Other African location</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full font-black py-3.5 rounded-xl text-sm mt-2 hover:opacity-90 transition-opacity disabled:opacity-60"
        style={{ background: "#C9A84C", color: "#0A0A0A" }}
      >
        {loading ? "Creating account…" : "Create my free store →"}
      </button>
      <p className="text-[11px] text-white/25 text-center">Free forever for creators. No credit card needed.</p>
    </form>
  );
}

function VendorSignupForm() {
  const [form, setForm] = useState({
    business: "", contact: "", phone: "", location: "Accra", category: "fashion", email: "", password: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/auth/register-vendor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: form.business,
          contact_name: form.contact,
          contact_phone: form.phone,
          location: form.location,
          category: form.category,
          email: form.email,
          password: form.password,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.detail || "Registration failed. Please try again.");
        setLoading(false);
        return;
      }
    } catch {
      setError("Network error — please try again.");
      setLoading(false);
      return;
    }

    setLoading(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-4">🤝</div>
        <p className="font-bold text-white text-lg mb-2">Vendor account created!</p>
        <p className="text-sm text-white/50 mb-3">Your account is live. Sign in to the vendor portal to add products and track orders.</p>
        <a
          href="/mam/login"
          className="inline-block px-6 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
          style={{ background: "#F5A623", color: "#0A0A0A" }}
        >
          Sign in to vendor portal →
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-900/40 border border-red-700 text-red-300 text-sm">
          {error}
        </div>
      )}
      <div>
        <label className="text-xs text-white/50 font-medium block mb-1.5">Business name</label>
        <input
          required
          value={form.business}
          onChange={set("business")}
          placeholder="Accra Style Hub"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#F5A623]/60 transition-colors"
        />
      </div>
      <div>
        <label className="text-xs text-white/50 font-medium block mb-1.5">Contact name</label>
        <input
          required
          value={form.contact}
          onChange={set("contact")}
          placeholder="Your name"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#F5A623]/60 transition-colors"
        />
      </div>
      <div>
        <label className="text-xs text-white/50 font-medium block mb-1.5">Email</label>
        <input
          required
          type="email"
          value={form.email}
          onChange={set("email")}
          placeholder="you@example.com"
          autoComplete="email"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#F5A623]/60 transition-colors"
        />
      </div>
      <div>
        <label className="text-xs text-white/50 font-medium block mb-1.5">Password</label>
        <input
          required
          type="password"
          value={form.password}
          onChange={set("password")}
          placeholder="Min. 8 characters"
          minLength={8}
          autoComplete="new-password"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#F5A623]/60 transition-colors"
        />
      </div>
      <div>
        <label className="text-xs text-white/50 font-medium block mb-1.5">WhatsApp number</label>
        <input
          required
          value={form.phone}
          onChange={set("phone")}
          placeholder="+233 XX XXX XXXX"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#F5A623]/60 transition-colors"
        />
      </div>
      <div>
        <label className="text-xs text-white/50 font-medium block mb-1.5">Location</label>
        <select
          value={form.location}
          onChange={set("location")}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#F5A623]/60 transition-colors"
        >
          <option value="Accra">Accra</option>
          <option value="Kumasi">Kumasi</option>
          <option value="Tamale">Tamale</option>
          <option value="Cape Coast">Cape Coast</option>
          <option value="Other">Other African location</option>
        </select>
      </div>
      <div>
        <label className="text-xs text-white/50 font-medium block mb-1.5">Product category</label>
        <select
          value={form.category}
          onChange={set("category")}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#F5A623]/60 transition-colors"
        >
          <option value="fashion">Fashion &amp; Clothing</option>
          <option value="hair">Hair &amp; Wigs</option>
          <option value="beauty">Beauty &amp; Skincare</option>
          <option value="accessories">Accessories &amp; Jewelry</option>
          <option value="other">Other</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#F5A623] text-black font-black py-3.5 rounded-xl text-sm mt-2 hover:opacity-90 transition-opacity disabled:opacity-60"
      >
        {loading ? "Creating account…" : "Apply as Vendor →"}
      </button>
      <p className="text-[11px] text-white/25 text-center">Commission only on successful deliveries. Zero upfront.</p>
    </form>
  );
}

export default function JoinPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <MarketingNav activePage="For Creators" />

      {/* ── HERO ── */}
      <section className="pt-32 pb-16 px-4 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full bg-[#C9A84C]/7 blur-[100px] pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <Reveal>
            <div className="text-5xl mb-5 animate-float inline-block">🇬🇭</div>
            <h1 className="font-display text-5xl md:text-6xl font-black text-white mb-5 leading-tight">
              Join Yes MAM
            </h1>
            <p className="text-white/50 text-lg max-w-xl mx-auto leading-relaxed">
              Africa's creator commerce platform. Free for creators. Zero-risk for vendors.
              Built for Accra, growing across Africa.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── TWO COLUMNS ── */}
      <section id="creators" className="pb-24 px-4">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">

          {/* Creators */}
          <Reveal>
            <div className="glass rounded-3xl p-8 border border-[#C9A84C]/20 h-full flex flex-col">
              <div className="mb-6">
                <span className="text-[#C9A84C] text-xs font-bold tracking-[0.2em] uppercase block mb-2">For Creators</span>
                <h2 className="font-display text-2xl font-black text-white mb-3">Start your store. Earn commission.</h2>
                <p className="text-sm text-white/50 leading-relaxed">
                  Have a TikTok audience? Turn your influence into income. Free storefront, curated products, 18% on every sale.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-8">
                {CREATOR_BENEFITS.map((b, i) => (
                  <div key={i} className="bg-white/3 rounded-xl p-3 border border-white/5">
                    <span className="text-lg block mb-1">{b.icon}</span>
                    <p className="text-xs font-bold text-white mb-0.5">{b.title}</p>
                    <p className="text-[11px] text-white/40">{b.desc}</p>
                  </div>
                ))}
              </div>
              <div className="mt-auto">
                <h3 className="text-sm font-bold text-[#C9A84C] mb-4">Apply to be a creator</h3>
                <CreatorSignupForm />
              </div>
            </div>
          </Reveal>

          {/* Vendors */}
          <div id="vendors">
          <Reveal delay={150}>
            <div className="glass rounded-3xl p-8 border border-[#F5A623]/20 h-full flex flex-col">
              <div className="mb-6">
                <span className="text-[#F5A623] text-xs font-bold tracking-[0.2em] uppercase block mb-2">For Vendors</span>
                <h2 className="font-display text-2xl font-black text-white mb-3">Reach 10K+ buyers. Pay only on delivery.</h2>
                <p className="text-sm text-white/50 leading-relaxed">
                  List your Accra products. TikTok creators promote them for you. Commission only when an order is delivered.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-8">
                {VENDOR_BENEFITS.map((b, i) => (
                  <div key={i} className="bg-white/3 rounded-xl p-3 border border-white/5">
                    <span className="text-lg block mb-1">{b.icon}</span>
                    <p className="text-xs font-bold text-white mb-0.5">{b.title}</p>
                    <p className="text-[11px] text-white/40">{b.desc}</p>
                  </div>
                ))}
              </div>
              <div className="mt-auto">
                <h3 className="text-sm font-bold text-[#F5A623] mb-4">Apply as a vendor</h3>
                <VendorSignupForm />
              </div>
            </div>
          </Reveal>
          </div>

        </div>
      </section>

      {/* ── PROOF ── */}
      <section className="py-20 px-4 bg-[#0d0d0d]">
        <div className="max-w-3xl mx-auto">
          <Reveal className="text-center mb-10">
            <span className="text-[#C9A84C] text-xs font-bold tracking-[0.2em] uppercase block mb-3">Already working</span>
            <h2 className="font-display text-3xl font-black text-white">Christiana was first.</h2>
            <p className="text-white/40 mt-2 text-sm">Africa's first Yes MAM creator store is live today.</p>
          </Reveal>
          <Reveal delay={100}>
            <div className="glass rounded-2xl p-6 border border-[#C9A84C]/20 flex flex-col md:flex-row gap-6 items-center">
              <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border-2 border-[#C9A84C]/40">
                <img
                  src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=160&q=75&auto=format&fit=crop&crop=face"
                  alt="Christiana Amankwaah"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 text-center md:text-left">
                <p className="font-bold text-white text-lg mb-0.5">Christiana Amankwaah</p>
                <p className="text-xs text-[#C9A84C] font-semibold mb-3">@sweet200723 · 10K+ TikTok followers · Africa</p>
                <p className="text-sm text-white/50 leading-relaxed italic">
                  "I posted one video and got 3 orders the same day. My followers bought because they trust me. Yes MAM made it so easy."
                </p>
              </div>
              <a
                href="/mam/sweet200723"
                target="_blank"
                className="shrink-0 bg-gold-gradient text-black font-bold px-5 py-2.5 rounded-xl text-sm hover:opacity-90 transition-opacity shadow-gold-sm"
              >
                See her store →
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
