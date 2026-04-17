import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Yes MAM — Africa's Creator Commerce Platform",
  description: "Turn your TikTok followers into real income. Yes MAM gives African creators a stunning, branded store in minutes. 18% commission on every sale. Free to start.",
  keywords: "Yes MAM, African creator commerce, TikTok shop Africa, micro affiliate marketing, creator store Africa, African shopping",
  openGraph: {
    title: "Yes MAM — Africa's Creator Commerce Platform",
    description: "Your followers are your shop. Get your free creator store today.",
    siteName: "Yes MAM",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Yes MAM — Africa's Creator Commerce Platform",
    description: "Turn your TikTok followers into real income. Free creator stores. 18% commission.",
  },
};

export const viewport: Viewport = {
  themeColor: "#C9A84C",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
