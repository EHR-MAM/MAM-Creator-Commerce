import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EHR Creator Commerce",
  description: "Shop looks by your favourite Ghana creators",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900 antialiased">{children}</body>
    </html>
  );
}
