import React, { useState, useRef } from 'react';
import { 
  Star, Sparkles, Check, ShieldCheck, RotateCcw, 
  ChevronDown, Tag, Gem, ArrowRight 
} from 'lucide-react';
import type { Product } from '../../types/product';
import { SAMPLE_REVIEWS } from '../../data/reviews';

interface ProductDetailViewProps {
  selectedProduct: Product;
  selectedProductColor: string;
  setSelectedProductColor: (color: string) => void;
  selectedProductSize: string;
  setSelectedProductSize: (size: string) => void;
  activeProductImageIdx: number;
  setActiveProductImageIdx: React.Dispatch<React.SetStateAction<number>>;
  addToCart: (product: Product, size?: string, color?: string) => void;
  onOpenCart: () => void;
  onOpenReviews: () => void;
  onOpenSizeChart: () => void;
}

export default function ProductDetailView({
  selectedProduct,
  selectedProductColor,
  setSelectedProductColor,
  selectedProductSize,
  setSelectedProductSize,
  activeProductImageIdx,
  setActiveProductImageIdx,
  addToCart,
  onOpenCart,
  onOpenReviews,
  onOpenSizeChart,
}: ProductDetailViewProps) {
  const [expandedAccordion, setExpandedAccordion] = useState<string | null>('description');
  const mobTouchStartX = useRef<number | null>(null);
  const mobTouchEndX = useRef<number | null>(null);

  const handleProductTouchStart = (e: React.TouchEvent) => {
    mobTouchStartX.current = e.touches[0].clientX;
  };

  const handleProductTouchMove = (e: React.TouchEvent) => {
    mobTouchEndX.current = e.touches[0].clientX;
  };

  const handleProductTouchEnd = () => {
    if (mobTouchStartX.current === null || mobTouchEndX.current === null) return;
    const diff = mobTouchStartX.current - mobTouchEndX.current;
    const imagesList = selectedProduct.images && selectedProduct.images.length > 0 ? selectedProduct.images : [selectedProduct.image];
    if (diff > 40) {
      setActiveProductImageIdx(prev => (prev + 1) % imagesList.length);
    } else if (diff < -40) {
      setActiveProductImageIdx(prev => (prev - 1 + imagesList.length) % imagesList.length);
    }
    mobTouchStartX.current = null;
    mobTouchEndX.current = null;
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <p className="text-xs text-gray-400 mb-6">Home &gt; {selectedProduct.category} &gt; <span className="text-[#D4AF37]">{selectedProduct.name}</span></p>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Fixed Gallery with Thumbnails & Mobile Touch Swipe */}
        <div className="lg:col-span-7 flex flex-col sm:flex-row gap-4 self-start h-fit lg:sticky lg:top-24">
          {/* Desktop Thumbnails Column */}
          <div className="hidden sm:flex flex-col gap-3 flex-shrink-0">
            {(selectedProduct.images && selectedProduct.images.length > 0 ? selectedProduct.images : [selectedProduct.image]).map((img, idx) => (
              <button 
                key={idx} 
                onClick={() => setActiveProductImageIdx(idx)}
                className={`w-16 h-20 sm:w-20 sm:h-24 rounded-lg overflow-hidden border cursor-pointer transition-all flex-shrink-0 ${
                  activeProductImageIdx === idx 
                    ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/80 scale-102 shadow-lg shadow-amber-950/40' 
                    : 'border-[#D4AF37]/30 hover:border-[#D4AF37]/70 opacity-70 hover:opacity-100'
                }`}
                title={`View angle ${idx + 1}`}
              >
                <img src={img} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>

          {/* Main Active Image Container (Locked Dimensions on PC, Swipeable on Mobile) */}
          <div 
            onTouchStart={handleProductTouchStart}
            onTouchMove={handleProductTouchMove}
            onTouchEnd={handleProductTouchEnd}
            className="w-full sm:flex-1 h-[420px] sm:h-[500px] lg:h-[560px] rounded-xl overflow-hidden border border-[#D4AF37]/30 bg-black relative shadow-2xl flex-shrink-0 select-none group"
          >
            {/* Festive Discount Tag */}
            <span className="absolute top-4 left-4 bg-[#7A1C28] text-white text-xs font-bold px-3 py-1 rounded shadow z-10">
              {selectedProduct.discount}% OFF
            </span>

            {/* Mobile Slide Navigation Buttons */}
            {/* Main Image */}
            <img 
              key={activeProductImageIdx}
              src={(selectedProduct.images && selectedProduct.images[activeProductImageIdx]) || selectedProduct.image} 
              alt={selectedProduct.name} 
              className="w-full h-full object-cover transition-opacity duration-200" 
            />

            {/* Mobile Slide Indicators (Dots) */}
            {(selectedProduct.images?.length || 1) > 1 && (
              <div className="sm:hidden absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-20 pointer-events-none">
                {(selectedProduct.images || [selectedProduct.image]).map((_, i) => (
                  <span 
                    key={i} 
                    className={`h-1.5 rounded-full transition-all duration-300 ${activeProductImageIdx === i ? 'w-5 bg-[#D4AF37]' : 'w-1.5 bg-white/40'}`} 
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          {/* Product Title & Clickable Rating Row */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-wide">{selectedProduct.name}</h2>
            <div 
              onClick={onOpenReviews}
              className="flex items-center gap-2 mt-2.5 cursor-pointer group w-fit select-none"
              title="Click to view all customer reviews"
              role="button"
            >
              <div className="flex items-center text-amber-400 group-hover:text-amber-300 transition-colors">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-sm font-bold ml-1">{selectedProduct.rating}</span>
              </div>
              <span className="text-xs text-gray-400 group-hover:text-[#D4AF37] underline underline-offset-4 transition-colors">
                ({selectedProduct.reviewsCount} customer reviews)
              </span>
            </div>
          </div>

          {/* Diwali Special Tag */}
          <div className="bg-gradient-to-r from-[#2A141A] to-[#141414] border border-[#D4AF37]/40 p-3.5 rounded-lg flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-[#D4AF37]" />
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-wider">Diwali Special</p>
                <p className="text-[11px] text-gray-300">Celebrate in Tradition • Upto 30% OFF</p>
              </div>
            </div>
            <span className="text-xs text-[#D4AF37] font-semibold">Limited Time</span>
          </div>

          {/* Price & Taxes */}
          <div className="flex items-baseline gap-3 border-b border-[#D4AF37]/20 pb-4">
            <span className="text-3xl font-bold text-white tracking-tight">₹{selectedProduct.price.toLocaleString('en-IN')}</span>
            <span className="text-lg text-gray-400 line-through">₹{selectedProduct.originalPrice.toLocaleString('en-IN')}</span>
            <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-950/50 border border-emerald-500/30 px-2.5 py-0.5 rounded">
              Inclusive of all taxes
            </span>
          </div>

          {/* Color Selection with Spacing & Highlighted Ring Border */}
          <div className="space-y-3 pt-1">
            <label className="text-xs uppercase tracking-wider text-gray-400 font-medium block">
              Color: <span className="text-white font-semibold">{selectedProductColor}</span>
            </label>
            <div className="flex items-center gap-3.5 pt-1">
              {selectedProduct.colors.map((c, i) => {
                const isSelected = selectedProductColor.toLowerCase() === c.name.toLowerCase();
                return (
                  <button 
                    key={i} 
                    onClick={() => setSelectedProductColor(c.name)}
                    className={`w-8 h-8 rounded-full transition-all cursor-pointer relative ${
                      isSelected 
                        ? 'ring-2 ring-[#D4AF37] ring-offset-3 ring-offset-[#0D0D0D] scale-110 shadow-lg shadow-amber-950/50' 
                        : 'border-2 border-gray-600 hover:border-gray-400 hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                    aria-label={`Select color ${c.name}`}
                  >
                    {isSelected && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <Check className={`w-3.5 h-3.5 ${c.hex === '#FAFAFA' || c.hex === '#FDF5E6' ? 'text-black' : 'text-white'}`} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Size Selection & Size Chart Modal Link */}
          <div className="space-y-2.5 pt-1">
            <div className="flex justify-between items-center">
              <label className="text-xs uppercase tracking-wider text-gray-400 font-medium">
                Size: <span className="text-white font-semibold">{selectedProductSize}</span>
              </label>
              <button 
                onClick={onOpenSizeChart} 
                className="text-xs text-[#D4AF37] hover:text-[#E5C158] underline underline-offset-4 flex items-center gap-1 cursor-pointer font-medium"
              >
                Size Chart
              </button>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {selectedProduct.sizes.map((sz, i) => {
                const isSelected = selectedProductSize === sz;
                return (
                  <button 
                    key={i} 
                    onClick={() => setSelectedProductSize(sz)}
                    className={`px-4 py-2 rounded-md border text-xs font-semibold tracking-wider transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37] ring-1 ring-[#D4AF37]/50 shadow' 
                        : 'border-gray-700 text-gray-300 hover:border-[#D4AF37]/50 hover:text-white bg-[#141414]'
                    }`}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>
          </div>

          {/* In Stock Indicator */}
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-emerald-400 font-medium">In Stock • Ready to Dispatch</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-2">
            <button 
              onClick={() => addToCart(selectedProduct, selectedProductSize, selectedProductColor)}
              className="flex-grow bg-[#D4AF37] hover:bg-[#E5C158] text-black font-bold py-3.5 rounded-lg transition-all text-xs tracking-widest uppercase shadow-lg shadow-amber-950/40 cursor-pointer"
            >
              ADD TO CART
            </button>
            <button 
              onClick={() => { addToCart(selectedProduct, selectedProductSize, selectedProductColor); onOpenCart(); }}
              className="flex-grow bg-[#7A1C28] hover:bg-[#8F2332] text-white font-bold py-3.5 rounded-lg transition-all text-xs tracking-widest uppercase shadow-lg shadow-red-950/50 cursor-pointer"
            >
              BUY NOW
            </button>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#D4AF37]/20 text-center">
            <div className="bg-[#141414] p-3 rounded-lg border border-[#D4AF37]/20">
              <ShieldCheck className="w-5 h-5 text-[#D4AF37] mx-auto mb-1" />
              <p className="text-[10px] text-gray-300 font-medium">Secure Payments</p>
            </div>
            <div className="bg-[#141414] p-3 rounded-lg border border-[#D4AF37]/20">
              <RotateCcw className="w-5 h-5 text-[#D4AF37] mx-auto mb-1" />
              <p className="text-[10px] text-gray-300 font-medium">Easy Returns</p>
            </div>
            <div className="bg-[#141414] p-3 rounded-lg border border-[#D4AF37]/20">
              <Sparkles className="w-5 h-5 text-[#D4AF37] mx-auto mb-1" />
              <p className="text-[10px] text-gray-300 font-medium">Premium Quality</p>
            </div>
          </div>

          {/* Interactive Accordions with Rich Sample Content */}
          <div className="space-y-3 pt-4 border-t border-[#D4AF37]/20">
            {/* Accordion 1: Product Description */}
            <div className="bg-[#141414] border border-[#D4AF37]/20 rounded-lg overflow-hidden transition-colors">
              <button 
                onClick={() => setExpandedAccordion(expandedAccordion === 'description' ? null : 'description')}
                className="w-full p-4 flex justify-between items-center text-left cursor-pointer hover:bg-white/[0.02]"
              >
                <span className="text-white font-serif font-medium text-sm">Product Description</span>
                <ChevronDown className={`w-4 h-4 text-[#D4AF37] transition-transform duration-300 ${expandedAccordion === 'description' ? 'rotate-180' : ''}`} />
              </button>
              {expandedAccordion === 'description' && (
                <div className="px-4 pb-4 pt-1 text-xs text-gray-300 leading-relaxed border-t border-gray-800/60 animate-in fade-in duration-200">
                  <p className="mb-2.5">
                    Elevate your festive wardrobe with this exquisite artisanal {selectedProduct.category.toLowerCase().replace(/s$/, '')} from Sarmelle. Handcrafted with traditional craftsmanship and authentic gold-finish thread accents, tailored to drape fluidly for weddings, Diwali pujas, and celebratory evenings.
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 text-gray-400">
                    <li>Intricate woven zari motifs along borders and pallu</li>
                    <li>Crafted from high-grade breathable {selectedProduct.fabric || 'silk blend'}</li>
                    <li>Includes matching unstitched blouse / dupatta fabric</li>
                    <li>Ethically produced by master handloom weavers</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Accordion 2: Fabric & Care */}
            <div className="bg-[#141414] border border-[#D4AF37]/20 rounded-lg overflow-hidden transition-colors">
              <button 
                onClick={() => setExpandedAccordion(expandedAccordion === 'fabric' ? null : 'fabric')}
                className="w-full p-4 flex justify-between items-center text-left cursor-pointer hover:bg-white/[0.02]"
              >
                <span className="text-white font-serif font-medium text-sm">Fabric & Care</span>
                <ChevronDown className={`w-4 h-4 text-[#D4AF37] transition-transform duration-300 ${expandedAccordion === 'fabric' ? 'rotate-180' : ''}`} />
              </button>
              {expandedAccordion === 'fabric' && (
                <div className="px-4 pb-4 pt-1 text-xs text-gray-300 leading-relaxed border-t border-gray-800/60 animate-in fade-in duration-200 space-y-2">
                  <p><strong className="text-[#D4AF37]">Material:</strong> 100% Premium {selectedProduct.fabric || 'Pure Artisan'} Festive Fabric</p>
                  <p><strong className="text-[#D4AF37]">Weave Technique:</strong> Authentic Jacquard Weave with Metallic Lurex Zari</p>
                  <p><strong className="text-[#D4AF37]">Wash Care:</strong> Strictly Dry Clean Only to maintain shine and metallic thread lustre.</p>
                  <p><strong className="text-[#D4AF37]">Ironing:</strong> Steam press on reverse side under low to moderate heat.</p>
                  <p><strong className="text-[#D4AF37]">Storage:</strong> Wrap in clean, breathable cotton or muslin cloth away from direct sunlight.</p>
                </div>
              )}
            </div>

            {/* Accordion 3: Delivery & Returns */}
            <div className="bg-[#141414] border border-[#D4AF37]/20 rounded-lg overflow-hidden transition-colors">
              <button 
                onClick={() => setExpandedAccordion(expandedAccordion === 'shipping' ? null : 'shipping')}
                className="w-full p-4 flex justify-between items-center text-left cursor-pointer hover:bg-white/[0.02]"
              >
                <span className="text-white font-serif font-medium text-sm">Delivery & Returns</span>
                <ChevronDown className={`w-4 h-4 text-[#D4AF37] transition-transform duration-300 ${expandedAccordion === 'shipping' ? 'rotate-180' : ''}`} />
              </button>
              {expandedAccordion === 'shipping' && (
                <div className="px-4 pb-4 pt-1 text-xs text-gray-300 leading-relaxed border-t border-gray-800/60 animate-in fade-in duration-200 space-y-2">
                  <p><strong className="text-[#D4AF37]">Express Dispatch:</strong> Orders are verified and dispatched within 24 to 48 hours.</p>
                  <p><strong className="text-[#D4AF37]">Estimated Delivery:</strong> 3-5 business days across all metro and Tier-1 cities in India.</p>
                  <p><strong className="text-[#D4AF37]">7-Day Easy Returns:</strong> If you are not completely satisfied, return or exchange within 7 days in original condition with tags intact.</p>
                  <p><strong className="text-[#D4AF37]">Inspected Quality:</strong> Each piece undergoes two rounds of manual QC inspection before packing.</p>
                </div>
              )}
            </div>

            {/* Accordion 4: Offers & Discounts */}
            <div className="bg-[#141414] border border-[#D4AF37]/20 rounded-lg overflow-hidden transition-colors">
              <button 
                onClick={() => setExpandedAccordion(expandedAccordion === 'offers' ? null : 'offers')}
                className="w-full p-4 flex justify-between items-center text-left cursor-pointer hover:bg-white/[0.02]"
              >
                <span className="text-white font-serif font-medium text-sm">Offers & Discounts</span>
                <ChevronDown className={`w-4 h-4 text-[#D4AF37] transition-transform duration-300 ${expandedAccordion === 'offers' ? 'rotate-180' : ''}`} />
              </button>
              {expandedAccordion === 'offers' && (
                <div className="px-4 pb-4 pt-1 text-xs text-gray-300 leading-relaxed border-t border-gray-800/60 animate-in fade-in duration-200 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-medium">
                    <Tag className="w-3.5 h-3.5 flex-shrink-0" /> DIWALI30: Flat 30% discount applied automatically on checkout.
                  </div>
                  <div className="flex items-center gap-2 text-[#D4AF37]">
                    <Sparkles className="w-3.5 h-3.5 flex-shrink-0" /> Prepaid Discount: Extra 5% instant off on UPI & Net Banking.
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Gem className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" /> Complimentary Festive Potli Pouch with every saree order.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ================= INLINE REVIEWS PREVIEW SECTION ================= */}
      <div className="mt-14 pt-10 border-t border-[#D4AF37]/25">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
          <div>
            <span className="text-xs text-[#D4AF37] font-semibold uppercase tracking-widest">Verified Customer Feedback</span>
            <h3 className="text-2xl font-serif font-bold text-white mt-1">Customer Ratings & Reviews</h3>
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center bg-[#D4AF37] text-black font-bold text-sm px-3 py-1 rounded">
                <span>{selectedProduct.rating}</span>
                <Star className="w-3.5 h-3.5 fill-black ml-1" />
              </div>
              <span className="text-sm text-gray-300 font-medium">Based on {selectedProduct.reviewsCount} verified reviews</span>
            </div>
          </div>

          <button 
            onClick={onOpenReviews}
            className="bg-[#141414] hover:bg-[#1C1C1C] text-[#D4AF37] border border-[#D4AF37]/50 hover:border-[#D4AF37] font-semibold text-xs px-5 py-2.5 rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow"
          >
            View All {selectedProduct.reviewsCount} Reviews <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Top 3 Reviews Cards Inline Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {SAMPLE_REVIEWS.slice(0, 3).map((rev) => (
            <div key={rev.id} className="bg-[#121212] border border-[#D4AF37]/20 p-5 rounded-xl space-y-3 shadow-lg flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1 text-amber-400">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <span className="text-[11px] text-gray-500">{rev.date}</span>
                </div>
                <h5 className="text-sm font-semibold text-white leading-snug">{rev.title}</h5>
                <p className="text-xs text-gray-300 leading-relaxed line-clamp-3">{rev.comment}</p>
              </div>

              <div className="pt-2 border-t border-gray-800/60 flex items-center justify-between text-[11px] text-gray-400">
                <span className="font-medium text-white">{rev.author}</span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Buyer
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-6">
          <button 
            onClick={onOpenReviews}
            className="text-xs text-[#D4AF37] hover:underline cursor-pointer font-medium"
          >
            Click to explore all customer stories & ratings &rarr;
          </button>
        </div>
      </div>
    </main>
  );
}
