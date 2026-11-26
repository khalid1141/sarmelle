import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Filter, ArrowUpDown, ChevronDown, Check, X, ShoppingBag, Star, Heart } from 'lucide-react';
import type { Product } from '../../types/product';

interface CollectionViewProps {
  /* Filter state — survived in App (baseline) and stays there (shared with Header/HomeView) */
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedOfferType: string;
  setSelectedOfferType: (offer: string) => void;
  selectedFabric: string;
  setSelectedFabric: (fabric: string) => void;
  selectedColorFilter: string;
  setSelectedColorFilter: (color: string) => void;
  maxPrice: number;
  setMaxPrice: (price: number) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  /* Derived in App (from the surviving filter state) */
  productsList: Product[];
  filteredProducts: Product[];
  resetAllFilters: () => void;
  /* Load-more state — survived in App (baseline); sentinel ref + observer moved here */
  visibleProductsCount: number;
  setVisibleProductsCount: React.Dispatch<React.SetStateAction<number>>;
  isLoadingMore: boolean;
  setIsLoadingMore: React.Dispatch<React.SetStateAction<boolean>>;
  scrollSentinelRef: React.RefObject<HTMLDivElement | null>;
  /* Shared actions */
  wishlist: Product[];
  addToCart: (product: Product, size?: string, color?: string) => void;
  toggleWishlist: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  onNavHome: () => void;
}

export default function CollectionView({
  selectedCategory,
  setSelectedCategory,
  selectedOfferType,
  setSelectedOfferType,
  selectedFabric,
  setSelectedFabric,
  selectedColorFilter,
  setSelectedColorFilter,
  maxPrice,
  setMaxPrice,
  sortBy,
  setSortBy,
  productsList,
  filteredProducts,
  resetAllFilters,
  visibleProductsCount,
  setVisibleProductsCount,
  isLoadingMore,
  setIsLoadingMore,
  scrollSentinelRef,
  wishlist,
  addToCart,
  toggleWishlist,
  onSelectProduct,
  onNavHome
}: CollectionViewProps) {
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isMobSortDropdownOpen, setIsMobSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const mobSortDropdownRef = useRef<HTMLDivElement>(null);

  // Outside click listener for custom sort dropdowns
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) {
        setIsSortDropdownOpen(false);
      }
      if (mobSortDropdownRef.current && !mobSortDropdownRef.current.contains(e.target as Node)) {
        setIsMobSortDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Infinite scroll trigger via IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && visibleProductsCount < filteredProducts.length && !isLoadingMore) {
        setIsLoadingMore(true);
        setTimeout(() => {
          setVisibleProductsCount(prev => Math.min(prev + 6, filteredProducts.length));
          setIsLoadingMore(false);
        }, 300);
      }
    }, { rootMargin: '250px' });

    if (scrollSentinelRef.current) {
      observer.observe(scrollSentinelRef.current);
    }
    return () => observer.disconnect();
  }, [visibleProductsCount, filteredProducts.length, isLoadingMore]);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 select-none">
      {/* Breadcrumb & Festive Header Banner */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
          <button onClick={onNavHome} className="hover:text-[#D4AF37] transition-colors cursor-pointer">Home</button>
          <span>&gt;</span>
          <span className="text-[#D4AF37] font-medium">
            {selectedCategory === 'All' ? 'Festive Collection' : selectedCategory}
          </span>
        </div>
        
        <div className="bg-gradient-to-r from-[#240A10] via-[#16060A] to-[#0A0A0A] border border-[#D4AF37]/35 p-6 sm:p-8 rounded-2xl relative overflow-hidden shadow-2xl">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-[#D4AF37]/15 to-transparent pointer-events-none" />
          <div className="relative z-10 max-w-xl space-y-2">
            <div className="inline-flex items-center gap-1.5 bg-[#D4AF37]/15 border border-[#D4AF37]/30 px-3 py-1 rounded-full text-[10px] uppercase tracking-widest text-[#D4AF37] font-semibold">
              <Sparkles className="w-3 h-3 text-[#D4AF37]" /> Diwali Festive Edit
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-white tracking-wide">
              {selectedCategory === 'All' ? 'Brighter Outfits. Bigger Celebrations.' : `Curated ${selectedCategory}`}
            </h2>
            <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
              Discover heirloom handlooms, pure zari weaves, and modern silhouette sets crafted for festival joy.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Desktop Left Sidebar Filters (Sticky on scroll with subtle thin scrollbar) */}
        <aside className="hidden lg:block bg-[#121212] border border-[#D4AF37]/25 p-6 rounded-2xl space-y-6 self-start shadow-xl sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto thin-gold-scrollbar">
          <div className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-4">
            <h3 className="text-white font-serif font-bold text-base flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#D4AF37]" /> Filter By
            </h3>
            <button 
              onClick={resetAllFilters}
              className="text-xs text-[#D4AF37] hover:text-[#F3E5AB] transition-colors cursor-pointer"
            >
              Reset
            </button>
          </div>

          {/* Sort Ensembles in Sidebar */}
          <div className="space-y-2.5 pb-4 border-b border-[#D4AF37]/20">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#D4AF37]" /> Sort Ensembles
            </h4>
            {['Featured', 'Price: Low to High', 'Price: High to Low', 'Rating', 'Discount: High to Low', 'Newest'].map(opt => (
              <label key={opt} className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer hover:text-white py-0.5">
                <input 
                  type="radio" 
                  name="sidebarSort" 
                  checked={sortBy === opt} 
                  onChange={() => setSortBy(opt)}
                  className="accent-[#D4AF37] cursor-pointer"
                />
                <span className={sortBy === opt ? 'text-[#D4AF37] font-semibold' : ''}>{opt}</span>
              </label>
            ))}
          </div>

          {/* Category Filter */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">Category</h4>
            {['All', 'Sarees', 'Kurtis', 'Lehengas', 'Dupattas'].map(cat => (
              <label key={cat} className="flex items-center justify-between text-xs text-gray-300 cursor-pointer hover:text-white py-0.5 group">
                <span className="flex items-center gap-2">
                  <input 
                    type="radio" 
                    name="category" 
                    checked={selectedCategory === cat} 
                    onChange={() => setSelectedCategory(cat)}
                    className="accent-[#D4AF37] cursor-pointer"
                  />
                  <span className={selectedCategory === cat ? 'text-[#D4AF37] font-semibold' : ''}>{cat}</span>
                </span>
                <span className="text-[10px] text-gray-500 group-hover:text-gray-400">
                  {cat === 'All' ? productsList.length : productsList.filter(p => p.category === cat).length}
                </span>
              </label>
            ))}
          </div>

          {/* Fabric Filter */}
          <div className="space-y-2.5 pt-4 border-t border-[#D4AF37]/20">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">Fabric</h4>
            {['All', 'Silk', 'Organza', 'Georgette', 'Cotton', 'Velvet'].map(fab => (
              <label key={fab} className="flex items-center justify-between text-xs text-gray-300 cursor-pointer hover:text-white py-0.5 group">
                <span className="flex items-center gap-2">
                  <input 
                    type="radio" 
                    name="fabric" 
                    checked={selectedFabric === fab} 
                    onChange={() => setSelectedFabric(fab)}
                    className="accent-[#D4AF37] cursor-pointer"
                  />
                  <span className={selectedFabric === fab ? 'text-[#D4AF37] font-semibold' : ''}>{fab}</span>
                </span>
                <span className="text-[10px] text-gray-500 group-hover:text-gray-400">
                  {fab === 'All' ? productsList.length : productsList.filter(p => p.fabric === fab).length}
                </span>
              </label>
            ))}
          </div>

          {/* Color Swatch Filter */}
          <div className="space-y-3 pt-4 border-t border-[#D4AF37]/20">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">Color Palette</h4>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'All', hex: '#333333' },
                { label: 'Maroon', hex: '#7A1C28' },
                { label: 'Gold', hex: '#D4AF37' },
                { label: 'Green', hex: '#1B4D3E' },
                { label: 'Pink', hex: '#E8A3B2' },
                { label: 'Purple', hex: '#5C2D91' },
                { label: 'Red', hex: '#C2185B' },
                { label: 'Mustard', hex: '#FBC02D' },
                { label: 'White', hex: '#FAFAFA' }
              ].map(color => {
                const isSelected = selectedColorFilter === color.label;
                return (
                  <button
                    key={color.label}
                    onClick={() => setSelectedColorFilter(isSelected ? 'All' : color.label)}
                    className={`text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1.5 border transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-[#D4AF37] bg-[#D4AF37]/20 text-[#D4AF37] font-semibold ring-1 ring-[#D4AF37]' 
                        : 'border-gray-800 bg-[#171717] text-gray-400 hover:text-white hover:border-gray-600'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full border border-black/40" style={{ backgroundColor: color.hex }} />
                    {color.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Offer Collection Filter */}
          <div className="space-y-2.5 pt-4 border-t border-[#D4AF37]/20">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">Offer & Campaign</h4>
            {['All', 'Diwali Sale', 'New Festive Collection', 'Best Sellers'].map(offer => (
              <label key={offer} className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer hover:text-white py-0.5">
                <input 
                  type="radio" 
                  name="offerType" 
                  checked={selectedOfferType === offer} 
                  onChange={() => setSelectedOfferType(offer)}
                  className="accent-[#D4AF37] cursor-pointer"
                />
                <span className={selectedOfferType === offer ? 'text-[#D4AF37] font-semibold' : ''}>{offer}</span>
              </label>
            ))}
          </div>

          {/* Max Price Range Slider */}
          <div className="space-y-3 pt-4 border-t border-[#D4AF37]/20">
            <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">
              <span>Max Budget</span>
              <span className="text-white font-mono">₹{maxPrice.toLocaleString('en-IN')}</span>
            </div>
            <input 
              type="range" 
              min="1000" 
              max="10000" 
              step="500" 
              value={maxPrice} 
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-[#D4AF37] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-500">
              <span>₹1,000</span>
              <span>₹5,000</span>
              <span>₹10,000</span>
            </div>
          </div>
        </aside>

        {/* Products Main View Area */}
        <main className="lg:col-span-3 space-y-6">
          {/* Collection Toolbar (Sticky on Scroll) */}
          <div className="sticky top-20 z-20 bg-[#0D0D0D]/95 backdrop-blur-md border border-[#D4AF37]/25 px-4 sm:px-5 py-3 rounded-xl shadow-md">
            {/* Desktop View: Clean "Showing X Products" on left, Sort on right */}
            <div className="hidden md:flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-gray-300">
                Showing <span className="text-[#D4AF37] font-bold font-serif">{filteredProducts.length}</span> Products
              </span>

              <div className="flex items-center gap-2" ref={sortDropdownRef}>
                <span className="text-xs text-gray-400">Sort by:</span>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsSortDropdownOpen(prev => !prev)}
                    className="bg-[#141414] border border-[#D4AF37]/40 hover:border-[#D4AF37] text-xs text-[#E5D5C5] rounded-lg px-3 py-1.5 flex items-center gap-2 transition-all cursor-pointer shadow-sm select-none"
                    aria-expanded={isSortDropdownOpen}
                  >
                    <span className="font-medium">{sortBy}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-[#D4AF37] transition-transform duration-200 ${isSortDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isSortDropdownOpen && (
                    <div className="absolute right-0 top-full mt-1.5 w-48 bg-[#121212] border border-[#D4AF37]/50 rounded-xl shadow-2xl py-1.5 z-40 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
                      {[
                        'Featured',
                        'Price: Low to High',
                        'Price: High to Low',
                        'Rating',
                        'Discount: High to Low',
                        'Newest'
                      ].map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            setSortBy(opt);
                            setIsSortDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                            sortBy === opt
                              ? 'bg-[#D4AF37]/15 text-[#D4AF37] font-semibold'
                              : 'text-gray-300 hover:bg-[#1c1c1c] hover:text-white'
                          }`}
                        >
                          <span>{opt}</span>
                          {sortBy === opt && <Check className="w-3.5 h-3.5 text-[#D4AF37]" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile View: Merged funnel + sort icon alone (matching image_f1a4a245.png, no text, no beeping dot) */}
            <div className="flex md:hidden items-center justify-between gap-2">
              <button
                onClick={() => setIsMobileFilterOpen(true)}
                className="p-2 sm:p-2.5 rounded-lg border border-[#D4AF37]/40 bg-[#141414] text-[#D4AF37] hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all cursor-pointer flex items-center justify-center shadow-sm"
                aria-label="Filter and sort ensembles"
                title="Filter & Sort"
              >
                {/* Exact Filter + Sort Merged Vector matching image_f1a4a245.png */}
                <svg 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="w-5 h-5 text-[#D4AF37]"
                >
                  <path d="M3 4h18l-7 8.5v6.5l-4 2v-8.5L3 4z" />
                  <line x1="14" y1="14" x2="21" y2="14" strokeWidth="2.5" />
                  <line x1="15" y1="17.5" x2="21" y2="17.5" strokeWidth="2.5" />
                  <line x1="16" y1="21" x2="21" y2="21" strokeWidth="2.5" />
                </svg>
              </button>

              <div className="relative flex items-center" ref={mobSortDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsMobSortDropdownOpen(prev => !prev)}
                  className="bg-[#141414] border border-[#D4AF37]/40 text-xs text-[#E5D5C5] rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 focus:outline-none transition-colors cursor-pointer select-none"
                >
                  <span className="font-medium max-w-[125px] truncate">{sortBy}</span>
                  <ChevronDown className={`w-3 h-3 text-[#D4AF37] transition-transform duration-200 ${isMobSortDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isMobSortDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-44 bg-[#121212] border border-[#D4AF37]/50 rounded-xl shadow-2xl py-1.5 z-40 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
                    {[
                      { label: 'Featured', value: 'Featured' },
                      { label: 'Price: Low to High', value: 'Price: Low to High' },
                      { label: 'Price: High to Low', value: 'Price: High to Low' },
                      { label: 'Rating', value: 'Rating' },
                      { label: 'Discount', value: 'Discount: High to Low' },
                      { label: 'Newest', value: 'Newest' }
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setSortBy(opt.value);
                          setIsMobSortDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                          sortBy === opt.value
                            ? 'bg-[#D4AF37]/15 text-[#D4AF37] font-semibold'
                            : 'text-gray-300 hover:bg-[#1c1c1c] hover:text-white'
                        }`}
                      >
                        <span className="truncate">{opt.label}</span>
                        {sortBy === opt.value && <Check className="w-3 h-3 text-[#D4AF37] shrink-0 ml-1" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <div className="bg-[#121212] border border-[#D4AF37]/20 rounded-2xl p-12 text-center space-y-4">
              <ShoppingBag className="w-12 h-12 text-gray-600 mx-auto" />
              <h3 className="text-lg font-serif font-bold text-white">No products found</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                We could not find any ethnic items matching the selected combination of filters. Try clearing your filters or widening your price range.
              </p>
              <button 
                onClick={resetAllFilters}
                className="bg-[#D4AF37] hover:bg-[#E5C158] text-black font-semibold text-xs px-5 py-2.5 rounded-lg transition-all cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6">
                {filteredProducts.slice(0, visibleProductsCount).map(product => {
                  const isWishlisted = wishlist.some(w => w.id === product.id);
                  return (
                    <div 
                      key={product.id} 
                      className="bg-[#121212] border border-[#D4AF37]/20 rounded-xl overflow-hidden group hover:border-[#D4AF37]/60 transition-all duration-300 shadow-xl flex flex-col justify-between hover:-translate-y-1"
                    >
                      <div>
                        {/* Image Thumbnail with Badges */}
                        <div 
                          className="relative aspect-[3/4] overflow-hidden bg-black cursor-pointer" 
                          onClick={() => onSelectProduct(product)}
                        >
                          <img 
                            src={product.image} 
                            alt={product.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          />
                          
                          {/* Festive Discount Tag */}
                          <span className="absolute top-2.5 left-2.5 bg-[#7A1C28] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-md tracking-wider">
                            {product.discount}% OFF
                          </span>

                          {/* Fabric Badge */}
                          <span className="absolute bottom-2.5 left-2.5 bg-black/75 backdrop-blur-sm border border-[#D4AF37]/30 text-amber-200 text-[9px] font-medium px-2 py-0.5 rounded shadow">
                            {product.fabric}
                          </span>

                          {/* Wishlist Button */}
                          <button 
                            onClick={(e) => { e.stopPropagation(); toggleWishlist(product); }}
                            className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/70 backdrop-blur-sm border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-all cursor-pointer shadow-lg"
                            title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                          >
                            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-[#D4AF37] text-[#D4AF37]' : ''}`} />
                          </button>
                        </div>

                        {/* Content */}
                        <div className="px-3 sm:px-3.5 pt-2.5 pb-2 space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-[11px] text-amber-400">
                              <Star className="w-3.5 h-3.5 fill-current" />
                              <span className="font-semibold">{product.rating}</span>
                              <span className="text-gray-400">({product.reviewsCount})</span>
                            </div>
                            {/* Swatch dots */}
                            <div className="flex items-center gap-1">
                              {product.colors.slice(0, 3).map((col, idx) => (
                                <span 
                                  key={idx} 
                                  className="w-2.5 h-2.5 rounded-full border border-black/50" 
                                  style={{ backgroundColor: col.hex }} 
                                  title={col.name}
                                />
                              ))}
                            </div>
                          </div>

                          <h4 
                            className="text-white font-serif text-xs sm:text-sm font-medium line-clamp-1 cursor-pointer hover:text-[#D4AF37] transition-colors leading-tight"
                            onClick={() => onSelectProduct(product)}
                          >
                            {product.name}
                          </h4>
                        </div>
                      </div>

                      {/* Bottom Price & Add Action (Vertically Centered) */}
                      <div className="px-3 sm:px-3.5 py-2.5 flex items-center justify-between border-t border-gray-800/60">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-white text-xs sm:text-base font-bold leading-none">₹{product.price.toLocaleString('en-IN')}</span>
                          <span className="text-[10px] sm:text-xs text-gray-400 line-through leading-none">
                            ₹{product.originalPrice.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <button 
                          onClick={() => addToCart(product)}
                          className="bg-gradient-to-r from-[#D4AF37] to-[#AA771C] hover:from-[#E5C158] hover:to-[#D4AF37] text-black font-bold text-[11px] sm:text-xs px-3 py-1.5 rounded-lg transition-all shadow-md cursor-pointer flex items-center gap-1 shrink-0"
                        >
                          <ShoppingBag className="w-3 h-3" /> ADD
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Infinite Scroll Sentinel & Subtle Status */}
              <div ref={scrollSentinelRef} className="h-6 w-full" />
              {isLoadingMore && (
                <div className="py-6 flex items-center justify-center gap-2 text-xs text-[#D4AF37] font-medium">
                  <Sparkles className="w-4 h-4 animate-spin text-[#D4AF37]" />
                  <span>Loading more royal ensembles...</span>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile Filter Drawer (Includes Both Filter & Sort) */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end lg:hidden">
          <div className="w-full max-w-xs bg-[#121212] border-l border-[#D4AF37]/30 h-full flex flex-col p-6 shadow-2xl overflow-y-auto space-y-6 animate-in slide-in-from-right">
            <div className="flex justify-between items-center border-b border-[#D4AF37]/20 pb-4">
              <h3 className="text-white font-serif font-bold text-base flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#D4AF37]" /> Filter & Sort
              </h3>
              <button onClick={() => setIsMobileFilterOpen(false)} className="text-gray-400 hover:text-white cursor-pointer" aria-label="Close drawer">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Sort Option in Mobile Drawer */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase text-[#D4AF37] flex items-center gap-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-[#D4AF37]" /> Sort Ensembles
              </h4>
              {['Featured', 'Price: Low to High', 'Price: High to Low', 'Rating', 'Discount: High to Low', 'Newest'].map(opt => (
                <label key={opt} className="flex items-center gap-2 text-xs text-gray-300 py-0.5">
                  <input 
                    type="radio" 
                    name="mobSort" 
                    checked={sortBy === opt} 
                    onChange={() => setSortBy(opt)}
                    className="accent-[#D4AF37]" 
                  />
                  <span className={sortBy === opt ? 'text-[#D4AF37] font-semibold' : ''}>{opt}</span>
                </label>
              ))}
            </div>

            {/* Category in Mobile Drawer */}
            <div className="space-y-2 border-t border-gray-800 pt-4">
              <h4 className="text-xs font-semibold uppercase text-[#D4AF37]">Category</h4>
              {['All', 'Sarees', 'Kurtis', 'Lehengas', 'Dupattas'].map(cat => (
                <label key={cat} className="flex items-center gap-2 text-xs text-gray-300 py-0.5">
                  <input 
                    type="radio" 
                    name="mobCategory" 
                    checked={selectedCategory === cat} 
                    onChange={() => setSelectedCategory(cat)}
                    className="accent-[#D4AF37]" 
                  />
                  <span className={selectedCategory === cat ? 'text-[#D4AF37] font-semibold' : ''}>{cat}</span>
                </label>
              ))}
            </div>

            {/* Fabric in Mobile Drawer */}
            <div className="space-y-2 border-t border-gray-800 pt-4">
              <h4 className="text-xs font-semibold uppercase text-[#D4AF37]">Fabric</h4>
              {['All', 'Silk', 'Organza', 'Georgette', 'Cotton', 'Velvet'].map(fab => (
                <label key={fab} className="flex items-center gap-2 text-xs text-gray-300 py-0.5">
                  <input 
                    type="radio" 
                    name="mobFabric" 
                    checked={selectedFabric === fab} 
                    onChange={() => setSelectedFabric(fab)}
                    className="accent-[#D4AF37]" 
                  />
                  <span className={selectedFabric === fab ? 'text-[#D4AF37] font-semibold' : ''}>{fab}</span>
                </label>
              ))}
            </div>

            {/* Max Budget in Mobile Drawer */}
            <div className="space-y-2 border-t border-gray-800 pt-4">
              <h4 className="text-xs font-semibold uppercase text-[#D4AF37]">Max Budget: ₹{maxPrice.toLocaleString('en-IN')}</h4>
              <input 
                type="range" 
                min="1000" 
                max="10000" 
                step="500" 
                value={maxPrice} 
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-[#D4AF37]"
              />
            </div>

            <div className="pt-4 border-t border-gray-800 flex gap-3">
              <button 
                onClick={resetAllFilters}
                className="flex-1 py-2 text-xs border border-gray-700 text-gray-300 rounded-lg hover:border-gray-500 transition-colors"
              >
                Reset
              </button>
              <button 
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 py-2 text-xs bg-[#D4AF37] text-black font-bold rounded-lg hover:bg-[#E5C158] transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
