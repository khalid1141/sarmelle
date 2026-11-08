import React from 'react';
import { Heart, X } from 'lucide-react';
import type { Product } from '../../types/product';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  wishlist: Product[];
  onAddToBag: (product: Product) => void;
}

export default function WishlistDrawer({
  isOpen,
  onClose,
  wishlist,
  onAddToBag
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
              <div key={product.id} className="flex gap-4 bg-[#1A1A1A] border border-[#D4AF37]/20 p-3 rounded-lg items-center">
                <img src={product.image} alt={product.name} className="w-16 h-20 object-cover rounded" />
                <div className="flex-grow">
                  <h4 className="text-white font-medium text-sm">{product.name}</h4>
                  <p className="text-xs text-amber-400 font-semibold mt-1">₹{product.price.toLocaleString('en-IN')}</p>
                </div>
                <button onClick={() => onAddToBag(product)} className="bg-[#D4AF37] text-black text-xs font-bold px-3 py-1.5 rounded">
                  Add
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
