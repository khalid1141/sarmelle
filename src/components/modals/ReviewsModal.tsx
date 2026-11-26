import React from 'react';
import { Star, X, ShieldCheck } from 'lucide-react';
import type { Product, ProductReview } from '../../types/product';

interface ReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  reviews?: ProductReview[];
}

export default function ReviewsModal({
  isOpen,
  onClose,
  product,
  reviews = []
}: ReviewsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-[#121212] border border-[#D4AF37]/40 max-w-2xl w-full max-h-[88vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header with Title and X Icon */}
        <div className="p-5 sm:p-6 border-b border-[#D4AF37]/25 flex justify-between items-center bg-[#171717]">
          <div>
            <span className="text-[11px] text-[#D4AF37] font-semibold uppercase tracking-wider block">Customer Stories & Ratings</span>
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-white mt-0.5">Customer Reviews</h3>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
              <span>{product.name}</span>
              <span>•</span>
              <span className="flex items-center text-amber-400 font-bold">
                <Star className="w-3.5 h-3.5 fill-current inline mr-1" /> {product.rating} ({product.reviewsCount} reviews)
              </span>
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            title="Close reviews"
            aria-label="Close reviews"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Reviews List (Sorted descending by date with newest at top) */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-grow divide-y divide-gray-800/80">
          {reviews.map((review, idx) => (
            <div key={review.id} className={`${idx !== 0 ? 'pt-4' : ''} space-y-2.5`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-1.5 text-amber-400">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <h4 className="text-sm font-semibold text-white mt-1.5 leading-snug">{review.title}</h4>
                </div>
                <span className="text-xs text-gray-400 font-medium whitespace-nowrap bg-black/50 px-2.5 py-1 rounded border border-gray-800">
                  {review.date}
                </span>
              </div>

              <p className="text-xs text-gray-300 leading-relaxed">
                {review.comment}
              </p>

              <div className="flex items-center gap-3 text-[11px] text-gray-400 pt-1">
                <span className="font-medium text-white">{review.author}</span>
                <span>•</span>
                <span>{review.location}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Purchase
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Bottom Close Button */}
        <div className="p-4 border-t border-[#D4AF37]/20 bg-[#171717] flex justify-end">
          <button 
            onClick={onClose}
            className="bg-[#D4AF37] hover:bg-[#E5C158] text-black font-semibold text-xs px-6 py-2.5 rounded-lg transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
