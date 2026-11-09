import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Tag, Gem, Flame, ShieldCheck, ChevronLeft, ChevronRight, Heart, Star, ShoppingBag, Mail } from 'lucide-react';
import type { Product } from '../../types/product';
import type { HeroSlide, PromoBanner, FeaturedBlock, LookbookConfig } from '../../types/campaign';

interface HomeViewProps {
  /** Shared (admin-editable) campaign data — stay in App.tsx */
  heroSlides: HeroSlide[];
  promoBanners: PromoBanner[];
  featuredBlocks: FeaturedBlock[];
  lookbookBanner: LookbookConfig;
  productsList: Product[];
  wishlist: Product[];
  addToCart: (product: Product, size?: string, color?: string) => void;
  toggleWishlist: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  onNavCategoryOffer: (category?: string, offer?: string) => void;
  onNavCategory: (category: string) => void;
  onShopOffer: (offer?: string) => void;
}

export default function HomeView({
  heroSlides,
  promoBanners,
  featuredBlocks,
  lookbookBanner,
  productsList,
  wishlist,
  addToCart,
  toggleWishlist,
  onSelectProduct,
  onNavCategoryOffer,
  onNavCategory,
  onShopOffer
}: HomeViewProps) {
  // Hero Auto-slide & Touch-Swipe States
  const [currentHeroSlide, setCurrentHeroSlide] = useState<number>(0);
  const [isHeroHovered, setIsHeroHovered] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const [activeProductTab, setActiveProductTab] = useState<'New Arrivals' | 'Best Sellers' | 'Festive Collection' | 'Trending Now'>('New Arrivals');

  // Auto-slide effect every 5 seconds (pauses on user interaction/hover)
  useEffect(() => {
    if (isHeroHovered || heroSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentHeroSlide(prev => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isHeroHovered, heroSlides.length]);

  const handleHeroTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    touchStartX.current = clientX;
  };

  const handleHeroTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    touchEndX.current = clientX;
  };

  const handleHeroTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 40;
    if (distance > minSwipeDistance) {
      // Swiped left -> next slide
      setCurrentHeroSlide(prev => (prev + 1) % heroSlides.length);
    } else if (distance < -minSwipeDistance) {
      // Swiped right -> prev slide
      setCurrentHeroSlide(prev => (prev - 1 + heroSlides.length) % heroSlides.length);
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Section 8 Product Horizontal Scroller Ref & Control
  const productScrollRef = useRef<HTMLDivElement>(null);
  const scrollProducts = (direction: 'left' | 'right') => {
    if (productScrollRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      productScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <main>
      {(() => {
        const activeSlide = heroSlides[currentHeroSlide] || heroSlides[0];
        const handleHeroCta = (slide: HeroSlide) => {
          onNavCategoryOffer(slide.categoryTarget, slide.offerTarget);
        };

        return (
          <section 
            className="relative w-full bg-[#0A0A0A] overflow-hidden cursor-grab active:cursor-grabbing select-none"
            onMouseEnter={() => setIsHeroHovered(true)}
            onMouseLeave={() => setIsHeroHovered(false)}
            onTouchStart={handleHeroTouchStart}
            onTouchMove={handleHeroTouchMove}
            onTouchEnd={handleHeroTouchEnd}
            onMouseDown={handleHeroTouchStart}
            onMouseMove={handleHeroTouchMove}
            onMouseUp={handleHeroTouchEnd}
          >
            {/* 1. DESKTOP VIEW: Full Width Edge-to-Edge Cinematic Banner (Seamless Full-Bleed Image, No Solid Split Box) */}
            <div className="hidden lg:block w-full">
              <div className="relative w-full overflow-hidden bg-[#0A0A0A] min-h-[520px] xl:min-h-[580px] flex flex-col justify-between group">
                {/* Full-Bleed Background Image (Spans 100% of banner width without hard rectangular split) */}
                <img 
                  key={activeSlide.id}
                  src={activeSlide.desktopImage} 
                  alt={activeSlide.titlePart2} 
                  className="absolute inset-0 w-full h-full object-cover object-right filter brightness-90 contrast-105 transition-all duration-700 transform group-hover:scale-102"
                />
                {/* Natural seamless continuous gradient - deep vignette behind left text, blending gracefully across to model on right */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/90 via-35% to-[#0A0A0A]/20 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/35 to-transparent pointer-events-none" />
                {/* Subtle warm festive ambient glow */}
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_25%_45%,rgba(212,175,55,0.12),transparent_65%)]" />

                {/* Banner Main Content (Constrained to container for alignment with nav, while banner is full width) */}
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full my-auto py-12">
                  <div className="max-w-xl space-y-5">
                    <h2 className="text-4xl xl:text-6xl font-serif font-bold text-white tracking-wide leading-[1.12]">
                      <span className="block">{activeSlide.titlePart1}</span>
                      <span className="inline-block bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#AA771C] bg-clip-text text-transparent pb-0.5">
                        {activeSlide.titlePart2}
                      </span>
                    </h2>

                    <p className="text-[#E5D5C5] text-base xl:text-lg font-light tracking-wide max-w-md leading-relaxed">
                      {activeSlide.subtitle}
                    </p>

                    <div className="pt-2">
                      <button 
                        onClick={() => handleHeroCta(activeSlide)}
                        className="inline-flex items-center gap-2.5 bg-[#D4AF37] hover:bg-[#E5C158] text-black font-semibold text-sm px-8 py-3.5 rounded-lg shadow-lg shadow-amber-950/40 hover:shadow-amber-500/25 transition-all transform hover:-translate-y-0.5 tracking-wider uppercase cursor-pointer"
                      >
                        {activeSlide.ctaTextDesktop} <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Integrated Full-Width Bottom Feature Badges Bar */}
                <div className="relative z-10 w-full bg-black/80 backdrop-blur-md px-6 xl:px-12 py-3.5 flex items-center justify-between text-xs text-[#E5D5C5]">
                  <div className="flex items-center gap-6 xl:gap-8 max-w-7xl">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-[#D4AF37]" />
                      <span className="font-medium tracking-wide">Upto 40% OFF</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Gem className="w-4 h-4 text-[#D4AF37]" />
                      <span className="font-medium tracking-wide">Exclusive Designs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-[#D4AF37]" />
                      <span className="font-medium tracking-wide">Limited Stock</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                      <span className="font-medium tracking-wide">Premium Quality</span>
                    </div>
                  </div>

                  {/* Pagination Indicator Dots */}
                  <div className="flex items-center gap-1.5">
                    {heroSlides.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentHeroSlide(idx)}
                        className={`transition-all duration-300 ${
                          currentHeroSlide === idx ? 'w-6 h-1.5 bg-[#D4AF37]' : 'w-2 h-1.5 bg-gray-600 hover:bg-gray-400'
                        } rounded-full cursor-pointer`}
                        title={`Slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. MOBILE VIEW: Dedicated Full-Width Edge-to-Edge Mobile Layout (Seamless Gradient, Matching hero_af3316e3.png) */}
            <div className="block lg:hidden w-full">
              <div className="relative w-full h-[520px] sm:h-[580px] overflow-hidden bg-[#0A0A0A]">
                {/* Mobile Background Image */}
                <img 
                  key={activeSlide.id}
                  src={activeSlide.mobileImage} 
                  alt={activeSlide.titlePart2} 
                  className="absolute inset-0 w-full h-full object-cover object-top transition-all duration-700 filter brightness-95"
                />

                {/* Seamless Gradient Overlays (No cut-off cards, no harsh backdrop boxes) */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/80 via-45% to-black/20 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent pointer-events-none" />

                {/* Mobile Content Positioned Seamlessly Over Image */}
                <div className="relative z-10 h-full flex flex-col justify-end p-5 sm:p-7 pb-6 space-y-3.5 text-left">
                  <div className="space-y-1.5">
                    <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-wide leading-tight drop-shadow-md">
                      <span className="block">{activeSlide.titlePart1}</span>
                      <span className="inline-block bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#AA771C] bg-clip-text text-transparent pb-0.5">
                        {activeSlide.titlePart2}
                      </span>
                    </h2>

                    <p className="text-xs sm:text-sm text-[#E5D5C5] font-light leading-snug drop-shadow max-w-xs">
                      {activeSlide.subtitle}
                    </p>
                  </div>

                  <div className="pt-1">
                    <button 
                      onClick={() => handleHeroCta(activeSlide)}
                      className="inline-flex items-center gap-2 bg-[#D4AF37] hover:bg-[#E5C158] text-black font-bold text-xs uppercase tracking-wider py-3 px-6 rounded-md shadow-lg transition-transform active:scale-95 cursor-pointer"
                    >
                      {activeSlide.ctaTextMobile} <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Mobile Badges Strip (Pure SVG Icons, Matching hero_af3316e3.png) */}
                  <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-[#E5D5C5]">
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Upto 40% OFF</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Gem className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Exclusive Designs</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Premium Quality</span>
                    </div>
                  </div>

                  {/* Smooth Mobile Pagination Indicators */}
                  <div className="flex items-center gap-1.5 pt-1">
                    {heroSlides.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentHeroSlide(idx)}
                        className={`transition-all duration-300 ${
                          currentHeroSlide === idx ? 'w-6 h-1.5 bg-[#D4AF37]' : 'w-2 h-1.5 bg-white/40 hover:bg-white/70'
                        } rounded-full cursor-pointer`}
                        title={`Slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      })()}

      {/* Category Circles Navigation (Borderless) */}
      <section className="py-8 sm:py-10 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 sm:gap-4">
            {[
              { name: 'Sarees', img: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=80', cat: 'Sarees' },
              { name: 'Kurtis', img: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=400&q=80', cat: 'Kurtis' },
              { name: 'Lehengas', img: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=400&q=80', cat: 'Lehengas' },
              { name: 'Dupattas', img: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=400&q=80', cat: 'Dupattas' },
              { name: 'Sets', img: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=400&q=80', cat: 'Kurtis' },
              { name: 'New Arrivals', img: 'https://images.unsplash.com/photo-1609357602309-408fb180a6b7?auto=format&fit=crop&w=400&q=80', offer: 'New Festive Collection' },
              { name: 'Festive Collection', img: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=80', offer: 'Diwali Sale' },
              { name: 'Offers', img: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=400&q=80', offer: 'Diwali Sale' },
            ].map((item, idx) => (
              <div 
                key={idx}
                onClick={() => onNavCategoryOffer(item.cat, item.offer)}
                className="flex flex-col items-center group cursor-pointer"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-0.5 bg-gradient-to-tr from-[#D4AF37] to-[#AA771C] shadow-md group-hover:scale-105 transition-transform">
                  <div className="w-full h-full rounded-full overflow-hidden bg-black">
                    <img src={item.img} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                </div>
                <span className="mt-2 text-[11px] sm:text-xs font-medium text-[#E5D5C5] group-hover:text-[#D4AF37] transition-colors text-center line-clamp-1">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Promo Banner Strip */}
      <section className="py-6 sm:py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          {promoBanners.map((banner, idx) => (
            <div 
              key={banner.id || idx}
              className="relative rounded-xl overflow-hidden bg-[#15060A] shadow-xl group min-h-[170px] sm:min-h-[190px] flex items-center"
            >
              {/* Background Image with Gradient Fade */}
              <div className="absolute right-0 top-0 bottom-0 w-1/2 h-full pointer-events-none overflow-hidden">
                <img 
                  src={banner.image} 
                  alt={banner.subtitle}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#15060A] via-[#15060A]/80 to-transparent" />
              </div>

              {/* Banner Content */}
              <div className="relative z-10 p-5 sm:p-6 max-w-[65%] space-y-2">
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#F3E5AB] leading-tight whitespace-pre-line">
                  {banner.title}
                </h3>
                <p className="text-xs text-[#E5D5C5] font-light">
                  {banner.subtitle}
                </p>
                <div className="pt-1">
                  <button 
                    onClick={() => onNavCategoryOffer(banner.targetCategory, banner.targetOffer)}
                    className="inline-flex items-center gap-1.5 bg-[#D4AF37] hover:bg-[#E5C158] text-black font-semibold text-xs px-4 py-2 rounded shadow-md transition-all tracking-wide"
                  >
                    {banner.ctaText} <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Collection */}
      <section className="py-8 sm:py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-[#D4AF37] font-semibold">Curated Ensembles</span>
            <h3 className="text-xl sm:text-3xl font-serif font-bold text-white mt-0.5">Featured Collection</h3>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6">
          {featuredBlocks.map((block, idx) => (
            <div 
              key={block.id || idx}
              onClick={() => onNavCategory(block.category)}
              className="group relative rounded-xl overflow-hidden bg-black aspect-[4/5] cursor-pointer shadow-lg hover:shadow-2xl transition-all"
            >
              <img 
                src={block.image} 
                alt={block.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />
              
              {/* Block Label and Button */}
              <div className="absolute bottom-4 left-4 right-4 space-y-1">
                <h4 className="text-white font-serif font-bold text-base sm:text-xl group-hover:text-[#D4AF37] transition-colors">
                  {block.title}
                </h4>
                <span className="inline-flex items-center gap-1 text-xs text-[#D4AF37] font-medium group-hover:underline">
                  {block.ctaText} <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Curated Product Section */}
      <section className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Tab Bar & View All */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {(['New Arrivals', 'Best Sellers', 'Festive Collection', 'Trending Now'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveProductTab(tab)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeProductTab === tab
                    ? 'bg-[#5C1824] text-white shadow-md'
                    : 'bg-[#1C1819] text-[#C4B2A2] hover:text-white hover:bg-[#2A2325]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <button 
              onClick={() => {
                if (activeProductTab === 'Festive Collection') onShopOffer('Diwali Sale');
                else if (activeProductTab === 'Best Sellers') onShopOffer('Best Sellers');
                else if (activeProductTab === 'New Arrivals') onShopOffer('New Festive Collection');
                else onShopOffer();
              }}
              className="text-xs sm:text-sm font-medium text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
            >
              View All &rarr;
            </button>
          </div>
        </div>

        {/* Horizontal Product Scroller Container with Peek and Scroll Controls */}
        <div className="relative group">
          {/* Floating Left Arrow Button */}
          <button 
            onClick={() => scrollProducts('left')} 
            className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/85 hover:bg-[#D4AF37] text-[#D4AF37] hover:text-black border border-[#D4AF37]/50 shadow-xl items-center justify-center transition-all cursor-pointer"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Floating Right Arrow Button (Immediately visible so user knows to scroll) */}
          <button 
            onClick={() => scrollProducts('right')} 
            className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/85 hover:bg-[#D4AF37] text-[#D4AF37] hover:text-black border border-[#D4AF37]/50 shadow-xl items-center justify-center transition-all cursor-pointer"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Scroll Track (Compact card height, 5th card peeks out on desktop, next card peeks on mobile) */}
          <div 
            ref={productScrollRef}
            className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto scroll-smooth pb-3 pt-1 scrollbar-none snap-x snap-mandatory"
          >
            {(() => {
              let tabProducts = productsList;
              if (activeProductTab === 'New Arrivals') {
                tabProducts = productsList.filter(p => p.isNewArrival || p.id % 2 === 0);
              } else if (activeProductTab === 'Best Sellers') {
                tabProducts = productsList.filter(p => p.isBestSeller);
              } else if (activeProductTab === 'Festive Collection') {
                tabProducts = productsList.filter(p => p.offerType === 'Diwali Sale' || p.offerType === 'New Festive Collection');
              } else if (activeProductTab === 'Trending Now') {
                tabProducts = productsList.filter(p => p.rating >= 4.8);
              }
              // Curated teaser slice (5 products) so catalog is not fully revealed here
              const displayProducts = tabProducts.slice(0, 5);

              return (
                <>
                  {displayProducts.map(product => (
                    <div 
                      key={product.id} 
                      className="flex-[0_0_160px] sm:flex-[0_0_185px] md:flex-[0_0_205px] lg:flex-[0_0_220px] snap-start bg-[#141414] rounded-xl overflow-hidden shadow-lg flex flex-col justify-between hover:shadow-2xl transition-all border border-white/5 group/card"
                    >
                      <div>
                        {/* Compact Image Container */}
                        <div 
                          className="relative h-36 sm:h-40 md:h-44 w-full overflow-hidden bg-[#0A0A0A] cursor-pointer" 
                          onClick={() => onSelectProduct(product)}
                        >
                          <img 
                            src={product.image} 
                            alt={product.name} 
                            className="w-full h-full object-cover object-top group-hover/card:scale-105 transition-transform duration-500" 
                          />
                          
                          {/* Discount Badge */}
                          <span className="absolute top-2 left-2 bg-[#D4AF37] text-black text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                            {product.discount}% OFF
                          </span>

                          {/* Wishlist Button */}
                          <button 
                            onClick={(e) => { e.stopPropagation(); toggleWishlist(product); }}
                            className="absolute top-2 right-2 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-colors"
                            title="Wishlist"
                          >
                            <Heart className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${wishlist.some(w => w.id === product.id) ? 'fill-current text-[#D4AF37]' : ''}`} />
                          </button>
                        </div>

                        {/* Compact Details */}
                        <div className="p-2 sm:p-2.5 space-y-0.5">
                          <h4 
                            className="text-white font-serif text-[11px] sm:text-xs font-medium line-clamp-1 cursor-pointer hover:text-[#D4AF37] transition-colors"
                            onClick={() => onSelectProduct(product)}
                          >
                            {product.name}
                          </h4>

                          <div className="flex items-baseline gap-1.5">
                            <span className="text-white text-xs sm:text-[13px] font-bold">₹{product.price.toLocaleString('en-IN')}</span>
                            <span className="text-[10px] text-gray-400 line-through">₹{product.originalPrice.toLocaleString('en-IN')}</span>
                          </div>

                          <div className="flex items-center gap-1 text-[10px] text-amber-400">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className="w-2.5 h-2.5 fill-current text-amber-400" />
                              ))}
                            </div>
                            <span className="text-gray-400 text-[9px]">({product.reviewsCount})</span>
                          </div>
                        </div>
                      </div>

                      {/* Compact Add to Cart */}
                      <div className="p-2 sm:p-2.5 pt-0">
                        <button 
                          onClick={() => addToCart(product)}
                          className="w-full bg-[#D4AF37] hover:bg-[#E5C158] text-black font-bold text-[9px] sm:text-[10px] py-1.5 rounded-md transition-colors shadow tracking-wider uppercase flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <ShoppingBag className="w-3 h-3" /> ADD TO CART
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* View All Teaser End Card */}
                  <div 
                    onClick={() => {
                      if (activeProductTab === 'Festive Collection') onShopOffer('Diwali Sale');
                      else if (activeProductTab === 'Best Sellers') onShopOffer('Best Sellers');
                      else if (activeProductTab === 'New Arrivals') onShopOffer('New Festive Collection');
                      else onShopOffer();
                    }}
                    className="flex-[0_0_145px] sm:flex-[0_0_165px] md:flex-[0_0_185px] snap-start rounded-xl bg-gradient-to-b from-[#1C080E] via-[#14060A] to-[#0A0A0A] border border-[#D4AF37]/30 hover:border-[#D4AF37] p-3 sm:p-4 flex flex-col items-center justify-center text-center cursor-pointer group/end transition-all hover:scale-102 hover:shadow-xl shadow-md min-h-[240px]"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] group-hover/end:bg-[#D4AF37] group-hover/end:text-black transition-colors mb-2">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-[#D4AF37] font-semibold">Explore All</span>
                    <h5 className="font-serif text-white font-bold text-xs sm:text-sm mt-1 mb-1">{activeProductTab}</h5>
                    <p className="text-[10px] text-[#C4B2A2] font-light line-clamp-2 mb-2">View complete festive catalog</p>
                    <span className="text-[10px] sm:text-xs font-semibold text-[#D4AF37] flex items-center gap-1 group-hover/end:underline">
                      View All &rarr;
                    </span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </section>

      {/* Diwali Lookbook */}
      <section className="py-8 sm:py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-2xl overflow-hidden bg-[#0D0D0D] border border-[#D4AF37]/25 shadow-2xl min-h-[220px] sm:min-h-[260px] flex items-center">
          {/* Background Portrait Image with Seamless Natural Gradient Fade */}
          <div className="absolute right-0 top-0 bottom-0 w-3/5 sm:w-1/2 h-full pointer-events-none overflow-hidden">
            <img 
              src={lookbookBanner.image} 
              alt="Diwali Lookbook"
              className="w-full h-full object-cover object-top filter brightness-95 contrast-105" 
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0D0D0D] via-[#0D0D0D]/85 via-35% to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D]/90 via-transparent to-transparent pointer-events-none sm:hidden" />
          </div>

          {/* Lookbook Content */}
          <div className="relative z-10 p-6 sm:p-12 max-w-lg space-y-3">
            <h3 className="text-2xl sm:text-4xl font-serif font-bold text-[#F3E5AB] leading-tight whitespace-pre-line drop-shadow">
              {lookbookBanner.title}
            </h3>
            <p className="text-xs sm:text-sm text-[#E5D5C5] font-light leading-relaxed drop-shadow">
              {lookbookBanner.subtitle}
            </p>
            <div className="pt-1.5">
              <button 
                onClick={() => onShopOffer(lookbookBanner.offerTarget)}
                className="inline-flex items-center gap-2 bg-[#D4AF37] hover:bg-[#E5C158] text-black font-bold text-xs sm:text-sm px-6 py-2.5 rounded-lg shadow-md transition-all tracking-wider uppercase cursor-pointer"
              >
                {lookbookBanner.ctaText} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-[#FAF4EA] via-[#F6ECE0] to-[#EFE2D3] text-gray-900 p-8 sm:p-12 text-center shadow-xl">
          {/* Subtle decorative glow */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.18),transparent_70%)]" />

          <div className="relative z-10 max-w-xl mx-auto space-y-3">
            <span className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-[#7A1C28] font-bold">
              STAY UPDATED
            </span>

            <h3 className="text-2xl sm:text-4xl font-serif font-bold text-[#2A0E14] leading-tight">
              Join Our Festive Circle
            </h3>

            <p className="text-xs sm:text-sm text-gray-700 font-light leading-relaxed">
              Be the first to know about new arrivals, exclusive offers and festive updates.
            </p>

            <form 
              onSubmit={(e) => { 
                e.preventDefault(); 
                alert('Thank you for joining the Sarmelle Festive Circle! A welcome discount has been sent to your inbox.'); 
              }} 
              className="flex flex-col sm:flex-row items-center gap-3 pt-3 max-w-md mx-auto"
            >
              <div className="relative w-full">
                <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
                <input 
                  type="email" 
                  placeholder="Enter your email address" 
                  required 
                  className="w-full bg-white/90 border border-[#D4AF37]/50 rounded-lg pl-10 pr-4 py-2.5 text-xs sm:text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-[#7A1C28] shadow-sm"
                />
              </div>
              <button 
                type="submit" 
                className="w-full sm:w-auto flex-shrink-0 inline-flex items-center justify-center gap-1.5 bg-[#5C1824] hover:bg-[#451019] text-[#F3E5AB] font-bold px-6 py-2.5 rounded-lg text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
              >
                Subscribe <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
