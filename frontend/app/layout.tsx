import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yes MAM — Ghana's Creator Commerce Platform",
  description: "Turn your TikTok followers into real income. Yes MAM gives Ghana creators a stunning, branded store in minutes. 18% commission on every sale. Free to start.",
  keywords: "Yes MAM, Ghana creator commerce, TikTok shop Ghana, micro affiliate marketing, creator store Ghana, Accra shopping",
  openGraph: {
    title: "Yes MAM — Ghana's Creator Commerce Platform",
    description: "Your followers are your shop. Get your free creator store today.",
    siteName: "Yes MAM",
    locale: "en_GH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Yes MAM — Ghana's Creator Commerce Platform",
    description: "Turn your TikTok followers into real income. Free creator stores. 18% commission.",
  },
  themeColor: "#C9A84C",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
