"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

export function YesMAMLogo({ size = 36 }: { size?: number }) {
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

interface NavLink {
  label: string;
  href: string;
  external?: boolean;
}

const NAV_LINKS: NavLink[] = [
  { label: "How it works", href: "/how-it-works" },
  { label: "About", href: "/about" },
  { label: "For Creators", href: "/join#creators" },
  { label: "For Vendors", href: "/join#vendors" },
];

export default function MarketingNav({ activePage = "" }: { activePage?: string }) {
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
        <a href="/home" className="flex items-center gap-2.5 group">
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
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={`transition-colors ${
                activePage === link.label
                  ? "text-[#C9A84C] font-semibold"
                  : "text-white/60 hover:text-[#C9A84C]"
              }`}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-white/60 hover:text-white transition-colors px-4 py-2"
          >
            Creator Login
          </Link>
          <a
            href="/join#creators"
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
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={`block transition-colors ${
                activePage === link.label ? "text-[#C9A84C]" : "text-white/70 hover:text-[#C9A84C]"
              }`}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="pt-3 border-t border-white/10 space-y-3">
            <Link
              href="/dashboard"
              className="block text-center text-white/60 py-2 border border-white/15 rounded-xl"
              onClick={() => setOpen(false)}
            >
              Creator Login
            </Link>
            <a
              href="/join#creators"
              className="block text-center bg-gold-gradient text-[#0A0A0A] font-black py-3 rounded-xl"
              onClick={() => setOpen(false)}
            >
              Start for free →
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
