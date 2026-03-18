import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MAM — Micro-Affiliate Marketing",
  description: "Shop curated products from your favourite Ghana creators",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900 antialiased">{children}</body>
    </html>
  );
}
