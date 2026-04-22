"use client";
// WishlistDrawer — Sprint XXXIII
// Slide-up panel showing saved/wishlisted items with links to buy and remove options.
import { useWishlist } from "@/lib/wishlist";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default function WishlistDrawer({
  open,
  onClose,
  creatorHandle,
}: {
  open: boolean;
  onClose: () => void;
  creatorHandle: string;
}) {
  const { items, remove, clear } = useWishlist();

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <span className="text-xl">❤️</span>
            <h2 className="font-black text-lg">Saved ({items.length})</h2>
          </div>
          <div className="flex items-center gap-3">
            {items.length > 0 && (
              <button
                onClick={clear}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                Clear all
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">
              ×
            </button>
          </div>
        </div>

        <div className="px-5 py-4">
          {items.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-3">🤍</p>
              <p className="font-medium">No saved items yet</p>
              <p className="text-sm mt-1">Tap the heart on any product to save it for later</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center gap-3 bg-gray-50 rounded-xl p-3"
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.productName}
                      className="w-14 h-14 object-cover rounded-lg shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-[#C9A84C]/10 flex items-center justify-center shrink-0 text-xl">
                      🛍️
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{item.productName}</p>
                    {item.category && (
                      <p className="text-[10px] text-[#C9A84C] uppercase tracking-wider font-bold">
                        {item.category}
                      </p>
                    )}
                    <p className="text-xs font-black text-gray-900 mt-0.5">
                      {item.currency} {Number(item.price).toFixed(2)}
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5 shrink-0">
                    <a
                      href={`${BASE}/${item.creatorHandle}/${item.productId}`}
                      onClick={onClose}
                      className="text-xs font-black bg-black text-white px-3 py-1.5 rounded-lg text-center"
                    >
                      Buy
                    </a>
                    <button
                      onClick={() => remove(item.productId)}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors text-center"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              <p className="text-center text-xs text-gray-400 pt-2 pb-1">
                Items saved locally on this device
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
