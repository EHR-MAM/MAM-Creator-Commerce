import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "MAM — Micro-Affiliate Marketing | Africa's Creator Commerce Platform",
  description:
    "MAM turns Africa's TikTok creators into commerce engines. Influencers get a beautiful store in minutes. Vendors reach thousands of loyal followers. Everyone wins.",
  openGraph: {
    title: "MAM — Micro-Affiliate Marketing",
    description: "Africa's creator commerce platform. Launch your store today.",
    siteName: "MAM",
  },
};

export default function CorporateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
