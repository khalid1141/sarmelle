import React from 'react';
import { Heart, X, ShoppingBag, Trash2 } from 'lucide-react';
import type { Product } from '../../types/product';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  wishlist: Product[];
  onAddToBag: (product: Product) => void;
  onRemove: (product: Product) => void;
}

export default function WishlistDrawer({
  isOpen,
  onClose,
  wishlist,
  onAddToBag,
  onRemove
}: WishlistDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md bg-[#121212] border-l border-[#D4AF37]/30 h-full flex flex-col p-6 shadow-2xl">
        <div className="flex justify-between items-center border-b border-[#D4AF37]/20 pb-4">
          <h3 className="text-white font-serif font-bold text-lg flex items-center gap-2">
            <Heart className="w-5 h-5 text-[#D4AF37] fill-current" /> My Wishlist ({wishlist.length})
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-grow overflow-y-auto py-4 space-y-4">
          {wishlist.length === 0 ? (
            <p className="text-gray-400 text-center py-20">Your wishlist is empty.</p>
          ) : (
            wishlist.map(product => (
              <div key={product.id} className="flex gap-3 bg-[#1A1A1A] border border-[#D4AF37]/20 p-3 rounded-lg items-start">
                <img src={product.image} alt={product.name} className="w-16 h-20 object-cover rounded shrink-0" />
                <div className="flex-grow min-w-0">
                  <h4 className="text-white font-medium text-sm truncate">{product.name}</h4>
                  <p className="text-xs text-amber-400 font-semibold mt-1">₹{product.price.toLocaleString('en-IN')}</p>
                  <button
                    onClick={() => onAddToBag(product)}
                    className="mt-2 w-full bg-[#D4AF37] hover:bg-[#E5C158] text-black font-bold text-[9px] sm:text-[10px] py-1.5 rounded-md transition-colors shadow tracking-wider uppercase flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <ShoppingBag className="w-3 h-3" /> ADD TO CART
                  </button>
                </div>
                <button
                  onClick={() => onRemove(product)}
                  aria-label={"Remove " + product.name + " from wishlist"}
                  className="text-gray-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-950/30 transition-colors cursor-pointer self-start"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
