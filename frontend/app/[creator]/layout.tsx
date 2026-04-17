// Storefront layout — Sprint XIX
// Wraps all creator storefront pages with CartProvider
import { CartProvider } from "@/lib/cart";

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}
