import Link from "next/link";

interface Product {
  id: string;
  name: string;
  price: number;
  currency: string;
  category: string;
  media_urls?: string[];
  inventory_count: number;
}

export default function ProductCard({
  product,
  creatorHandle,
}: {
  product: Product;
  creatorHandle: string;
}) {
  const isAvailable = product.inventory_count > 0;
  const imageUrl = product.media_urls?.[0] || "/placeholder-product.jpg";

  return (
    <Link href={`/${creatorHandle}/${product.id}`}>
      <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 active:scale-95 transition-transform">
        {/* Product image */}
        <div className="aspect-square bg-gray-100 overflow-hidden">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="text-xs text-gray-400 uppercase tracking-wide">
            {product.category}
          </p>
          <p className="font-semibold text-sm mt-0.5 line-clamp-2">
            {product.name}
          </p>
          <div className="flex items-center justify-between mt-2">
            <p className="font-bold text-black">
              {product.currency} {Number(product.price).toFixed(2)}
            </p>
            {!isAvailable && (
              <span className="text-xs text-red-500 font-medium">Sold out</span>
            )}
          </div>

          {isAvailable && (
            <button className="mt-2 w-full bg-black text-white text-sm py-2 rounded-lg font-medium">
              Order Now
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
