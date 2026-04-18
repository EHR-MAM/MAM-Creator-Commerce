// Storefront layout — Sprint XIX + Sprint XXXIII
// Wraps all creator storefront pages with CartProvider + WishlistProvider
import { CartProvider } from "@/lib/cart";
import { WishlistProvider } from "@/lib/wishlist";

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <WishlistProvider>{children}</WishlistProvider>
    </CartProvider>
  );
}
