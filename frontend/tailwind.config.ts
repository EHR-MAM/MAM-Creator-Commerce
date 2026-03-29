import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: "#C9A84C",
          light: "#E8C97A",
          dark: "#A8832A",
          pale: "#FAF0D0",
        },
        cream: "#FAF7F2",
        "yes-black": "#0A0A0A",
        "yes-card": "#1A1A1A",
        kente: {
          red: "#8B2500",
          amber: "#F5A623",
          cream: "#FDF6EC",
        },
        bloom: {
          green: "#2D6A4F",
          pink: "#F4A5AE",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        display: ["Playfair Display", "Georgia", "serif"],
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(135deg, #A8832A 0%, #C9A84C 40%, #E8C97A 60%, #C9A84C 100%)",
        "hero-dark": "radial-gradient(ellipse at top, #1a1400 0%, #0A0A0A 60%)",
      },
      boxShadow: {
        gold: "0 0 24px rgba(201,168,76,0.35), 0 0 48px rgba(201,168,76,0.12)",
        "gold-sm": "0 0 10px rgba(201,168,76,0.45)",
        "card-dark": "0 4px 24px rgba(0,0,0,0.4)",
      },
      animation: {
        "fade-in-up": "fadeInUp 0.65s ease-out both",
        "fade-in": "fadeIn 0.5s ease-out both",
        "scale-in": "scaleIn 0.5s ease-out both",
        "float": "float 3.5s ease-in-out infinite",
        "pulse-gold": "pulseGold 2.2s ease-in-out infinite",
        "marquee": "marquee 22s linear infinite",
        "shimmer": "shimmer 3s linear infinite",
        "gradient-shift": "gradientShift 8s ease infinite",
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: "0", transform: "translateY(28px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.93)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":       { transform: "translateY(-10px)" },
        },
        pulseGold: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(201,168,76,0.5)" },
          "50%":       { boxShadow: "0 0 0 14px rgba(201,168,76,0)" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to:   { transform: "translateX(-50%)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        gradientShift: {
          "0%":   { backgroundPosition: "0% 50%" },
          "50%":  { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
