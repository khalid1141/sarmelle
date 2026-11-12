import React, { useState } from 'react';
import { X, Sparkles, Tag, Gem } from 'lucide-react';
import type { Product } from '../../types/product';
import type { HeroSlide, PromoBanner, FeaturedBlock, LookbookConfig } from '../../types/campaign';

interface AdminViewProps {
  productsList: Product[];
  setProductsList: React.Dispatch<React.SetStateAction<Product[]>>;
  heroSlides: HeroSlide[];
  setHeroSlides: React.Dispatch<React.SetStateAction<HeroSlide[]>>;
  promoBanners: PromoBanner[];
  setPromoBanners: React.Dispatch<React.SetStateAction<PromoBanner[]>>;
  featuredBlocks: FeaturedBlock[];
  setFeaturedBlocks: React.Dispatch<React.SetStateAction<FeaturedBlock[]>>;
  lookbookBanner: LookbookConfig;
  setLookbookBanner: React.Dispatch<React.SetStateAction<LookbookConfig>>;
  onNavHome: () => void;
}

export default function AdminView({
  productsList,
  setProductsList,
  heroSlides,
  setHeroSlides,
  promoBanners,
  setPromoBanners,
  featuredBlocks,
  setFeaturedBlocks,
  lookbookBanner,
  setLookbookBanner,
  onNavHome,
}: AdminViewProps) {
  const [adminTab, setAdminTab] = useState<'campaign' | 'products' | 'orders'>('campaign');
  const [adminNotification, setAdminNotification] = useState<string | null>(null);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#141414] border border-[#D4AF37]/30 p-6 rounded-xl gap-4">
        <div>
          <span className="text-xs text-[#D4AF37] font-semibold uppercase tracking-widest">Sarmelle Owner Portal (admin.sarmelle.com)</span>
          <h2 className="text-2xl font-serif font-bold text-white mt-1">Admin Campaign & Store Manager</h2>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setAdminNotification('All campaign changes are live on the storefront!');
              setTimeout(() => setAdminNotification(null), 3500);
            }} 
            className="bg-[#5C1824] hover:bg-[#7A1C28] text-[#F3E5AB] font-bold text-xs px-4 py-2.5 rounded-lg border border-[#D4AF37]/50 shadow transition-all cursor-pointer"
          >
            Save & Apply Live
          </button>
          <button 
            onClick={onNavHome} 
            className="bg-[#D4AF37] hover:bg-[#E5C158] text-black font-semibold text-xs px-4 py-2.5 rounded-lg shadow transition-all cursor-pointer"
          >
            Back to Storefront &rarr;
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {adminNotification && (
        <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-lg text-xs flex items-center justify-between">
          <span>{adminNotification}</span>
          <button onClick={() => setAdminNotification(null)} className="text-emerald-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#141414] border border-[#D4AF37]/20 p-6 rounded-xl space-y-2">
          <p className="text-xs text-gray-400 uppercase">Total Revenue (Festive)</p>
          <h3 className="text-2xl font-bold text-white">₹4,82,500</h3>
          <p className="text-xs text-emerald-400">+18% from last week</p>
        </div>
        <div className="bg-[#141414] border border-[#D4AF37]/20 p-6 rounded-xl space-y-2">
          <p className="text-xs text-gray-400 uppercase">Awaiting Stock Review</p>
          <h3 className="text-2xl font-bold text-amber-400">12 Orders</h3>
          <p className="text-xs text-gray-300">Requires physical check</p>
        </div>
        <div className="bg-[#141414] border border-[#D4AF37]/20 p-6 rounded-xl space-y-2">
          <p className="text-xs text-gray-400 uppercase">Active Products</p>
          <h3 className="text-2xl font-bold text-white">{productsList.length} Products</h3>
          <p className="text-xs text-gray-300">Default Draft mode enforced</p>
        </div>
        <div className="bg-[#141414] border border-[#D4AF37]/20 p-6 rounded-xl space-y-2">
          <p className="text-xs text-gray-400 uppercase">Gateway Status</p>
          <h3 className="text-2xl font-bold text-emerald-400">Razorpay Live</h3>
          <p className="text-xs text-gray-300">Webhooks verified</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#D4AF37]/30 gap-4">
        <button 
          onClick={() => setAdminTab('campaign')}
          className={`pb-3 text-xs sm:text-sm font-semibold tracking-wider uppercase transition-colors cursor-pointer ${
            adminTab === 'campaign' 
              ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Festival Campaign & Visuals Control
        </button>
        <button 
          onClick={() => setAdminTab('products')}
          className={`pb-3 text-xs sm:text-sm font-semibold tracking-wider uppercase transition-colors cursor-pointer ${
            adminTab === 'products' 
              ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Product Images & Pricing
        </button>
        <button 
          onClick={() => setAdminTab('orders')}
          className={`pb-3 text-xs sm:text-sm font-semibold tracking-wider uppercase transition-colors cursor-pointer ${
            adminTab === 'orders' 
              ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Orders & Review Queue
        </button>
      </div>

      {/* TAB 1: FESTIVAL CAMPAIGN VISUALS & TEXT CONTROLS */}
      {adminTab === 'campaign' && (
        <div className="space-y-8">
          {/* 1. Hero Banner Controls */}
          <div className="bg-[#141414] border border-[#D4AF37]/30 p-6 rounded-xl space-y-5">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-serif font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#D4AF37]" /> 1. Hero Festival Banner Controls
                </h3>
                <p className="text-xs text-gray-400">Configure main headline, subtitle, button text, and campaign images.</p>
              </div>
              <span className="text-[10px] bg-[#D4AF37]/15 text-[#D4AF37] px-2.5 py-1 rounded border border-[#D4AF37]/30">Live on Storefront</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-300 font-medium block mb-1">Headline Part 1</label>
                  <input 
                    type="text" 
                    value={heroSlides[0]?.titlePart1 || ''} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setHeroSlides(prev => prev.map((s, i) => i === 0 ? { ...s, titlePart1: val } : s));
                    }}
                    className="w-full bg-black border border-[#D4AF37]/40 rounded p-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-300 font-medium block mb-1">Headline Part 2 (Gold Gradient)</label>
                  <input 
                    type="text" 
                    value={heroSlides[0]?.titlePart2 || ''} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setHeroSlides(prev => prev.map((s, i) => i === 0 ? { ...s, titlePart2: val } : s));
                    }}
                    className="w-full bg-black border border-[#D4AF37]/40 rounded p-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-300 font-medium block mb-1">Subtitle</label>
                  <input 
                    type="text" 
                    value={heroSlides[0]?.subtitle || ''} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setHeroSlides(prev => prev.map((s, i) => i === 0 ? { ...s, subtitle: val } : s));
                    }}
                    className="w-full bg-black border border-[#D4AF37]/40 rounded p-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-300 font-medium block mb-1">Desktop CTA Button Text</label>
                  <input 
                    type="text" 
                    value={heroSlides[0]?.ctaTextDesktop || ''} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setHeroSlides(prev => prev.map((s, i) => i === 0 ? { ...s, ctaTextDesktop: val } : s));
                    }}
                    className="w-full bg-black border border-[#D4AF37]/40 rounded p-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-300 font-medium block mb-1">Desktop Hero Image URL</label>
                  <input 
                    type="text" 
                    value={heroSlides[0]?.desktopImage || ''} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setHeroSlides(prev => prev.map((s, i) => i === 0 ? { ...s, desktopImage: val } : s));
                    }}
                    className="w-full bg-black border border-[#D4AF37]/40 rounded p-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                  <div className="mt-2 h-20 w-44 rounded overflow-hidden border border-gray-700 bg-black">
                    <img src={heroSlides[0]?.desktopImage} alt="desktop preview" className="w-full h-full object-cover" />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-300 font-medium block mb-1">Mobile Hero Image URL</label>
                  <input 
                    type="text" 
                    value={heroSlides[0]?.mobileImage || ''} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setHeroSlides(prev => prev.map((s, i) => i === 0 ? { ...s, mobileImage: val } : s));
                    }}
                    className="w-full bg-black border border-[#D4AF37]/40 rounded p-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Promo Banners Strip (3 Banners) */}
          <div className="bg-[#141414] border border-[#D4AF37]/30 p-6 rounded-xl space-y-5">
            <div className="border-b border-gray-800 pb-3">
              <h3 className="text-base sm:text-lg font-serif font-bold text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#D4AF37]" /> 2. Promo Banner Strip (3 Cards)
              </h3>
              <p className="text-xs text-gray-400">Configure titles, descriptions, buttons, and images for the 3 promotional cards.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {promoBanners.map((banner, idx) => (
                <div key={idx} className="bg-black/60 border border-gray-800 p-4 rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-[#D4AF37]">Banner Card {idx + 1}</span>
                    <div className="w-12 h-8 rounded overflow-hidden border border-gray-700 bg-black">
                      <img src={banner.image} alt="thumb" className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-400 block mb-0.5">Title (Newline supported)</label>
                    <input 
                      type="text" 
                      value={banner.title}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPromoBanners(prev => prev.map((b, i) => i === idx ? { ...b, title: val } : b));
                      }}
                      className="w-full bg-black border border-[#D4AF37]/30 rounded p-1.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-400 block mb-0.5">Subtitle</label>
                    <input 
                      type="text" 
                      value={banner.subtitle}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPromoBanners(prev => prev.map((b, i) => i === idx ? { ...b, subtitle: val } : b));
                      }}
                      className="w-full bg-black border border-[#D4AF37]/30 rounded p-1.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-400 block mb-0.5">Button Text</label>
                    <input 
                      type="text" 
                      value={banner.ctaText}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPromoBanners(prev => prev.map((b, i) => i === idx ? { ...b, ctaText: val } : b));
                      }}
                      className="w-full bg-black border border-[#D4AF37]/30 rounded p-1.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-400 block mb-0.5">Image URL</label>
                    <input 
                      type="text" 
                      value={banner.image}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPromoBanners(prev => prev.map((b, i) => i === idx ? { ...b, image: val } : b));
                      }}
                      className="w-full bg-black border border-[#D4AF37]/30 rounded p-1.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Featured Collection Blocks (4 Blocks) */}
          <div className="bg-[#141414] border border-[#D4AF37]/30 p-6 rounded-xl space-y-5">
            <div className="border-b border-gray-800 pb-3">
              <h3 className="text-base sm:text-lg font-serif font-bold text-white flex items-center gap-2">
                <Gem className="w-4 h-4 text-[#D4AF37]" /> 3. Featured Collection Blocks (4 Large Visual Cards)
              </h3>
              <p className="text-xs text-gray-400">Configure titles, target links, and imagery for the 4 featured ethnic categories.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {featuredBlocks.map((block, idx) => (
                <div key={idx} className="bg-black/60 border border-gray-800 p-4 rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-[#D4AF37]">Block {idx + 1}</span>
                    <div className="w-10 h-12 rounded overflow-hidden border border-gray-700 bg-black">
                      <img src={block.image} alt="thumb" className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-400 block mb-0.5">Title</label>
                    <input 
                      type="text" 
                      value={block.title}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFeaturedBlocks(prev => prev.map((b, i) => i === idx ? { ...b, title: val } : b));
                      }}
                      className="w-full bg-black border border-[#D4AF37]/30 rounded p-1.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-400 block mb-0.5">Image URL</label>
                    <input 
                      type="text" 
                      value={block.image}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFeaturedBlocks(prev => prev.map((b, i) => i === idx ? { ...b, image: val } : b));
                      }}
                      className="w-full bg-black border border-[#D4AF37]/30 rounded p-1.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Diwali Lookbook Banner */}
          <div className="bg-[#141414] border border-[#D4AF37]/30 p-6 rounded-xl space-y-5">
            <div className="border-b border-gray-800 pb-3">
              <h3 className="text-base sm:text-lg font-serif font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#D4AF37]" /> 4. Brands / Collection Highlight (Diwali Lookbook)
              </h3>
              <p className="text-xs text-gray-400">Control lookbook headline, tagline, and campaign backdrop image.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-300 font-medium block mb-1">Title</label>
                  <input 
                    type="text" 
                    value={lookbookBanner.title}
                    onChange={(e) => setLookbookBanner(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-black border border-[#D4AF37]/40 rounded p-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-300 font-medium block mb-1">Subtitle</label>
                  <input 
                    type="text" 
                    value={lookbookBanner.subtitle}
                    onChange={(e) => setLookbookBanner(prev => ({ ...prev, subtitle: e.target.value }))}
                    className="w-full bg-black border border-[#D4AF37]/40 rounded p-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-300 font-medium block mb-1">Button Text</label>
                  <input 
                    type="text" 
                    value={lookbookBanner.ctaText}
                    onChange={(e) => setLookbookBanner(prev => ({ ...prev, ctaText: e.target.value }))}
                    className="w-full bg-black border border-[#D4AF37]/40 rounded p-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-300 font-medium block mb-1">Image URL</label>
                  <input 
                    type="text" 
                    value={lookbookBanner.image}
                    onChange={(e) => setLookbookBanner(prev => ({ ...prev, image: e.target.value }))}
                    className="w-full bg-black border border-[#D4AF37]/40 rounded p-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div className="h-28 rounded-lg overflow-hidden border border-gray-700 bg-black">
                  <img src={lookbookBanner.image} alt="lookbook preview" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCT IMAGES & PRICING CONTROLS */}
      {adminTab === 'products' && (
        <div className="bg-[#141414] border border-[#D4AF37]/30 rounded-xl p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-800 pb-3">
            <div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-white">Product Catalog & Images Manager</h3>
              <p className="text-xs text-gray-400">Edit product photo URLs, titles, pricing, and discount percentages live.</p>
            </div>
          </div>

          <div className="space-y-4">
            {productsList.map((product) => (
              <div key={product.id} className="bg-black/60 border border-gray-800 p-4 rounded-xl flex flex-col md:flex-row items-center gap-4">
                <div className="w-20 h-24 rounded-lg overflow-hidden border border-[#D4AF37]/40 flex-shrink-0 bg-black">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                </div>

                <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 w-full">
                  <div>
                    <label className="text-[10px] text-gray-400 block">Product Name</label>
                    <input 
                      type="text" 
                      value={product.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setProductsList(prev => prev.map(p => p.id === product.id ? { ...p, name: val } : p));
                      }}
                      className="w-full bg-black border border-gray-700 rounded p-1.5 text-xs text-white focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 block">Price (₹)</label>
                    <input 
                      type="number" 
                      value={product.price}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setProductsList(prev => prev.map(p => p.id === product.id ? { ...p, price: val } : p));
                      }}
                      className="w-full bg-black border border-gray-700 rounded p-1.5 text-xs text-white focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 block">Original Price (₹)</label>
                    <input 
                      type="number" 
                      value={product.originalPrice}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setProductsList(prev => prev.map(p => p.id === product.id ? { ...p, originalPrice: val } : p));
                      }}
                      className="w-full bg-black border border-gray-700 rounded p-1.5 text-xs text-white focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 block">Image URL</label>
                    <input 
                      type="text" 
                      value={product.image}
                      onChange={(e) => {
                        const val = e.target.value;
                        setProductsList(prev => prev.map(p => p.id === product.id ? { ...p, image: val } : p));
                      }}
                      className="w-full bg-black border border-gray-700 rounded p-1.5 text-xs text-white focus:border-[#D4AF37]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ORDERS & STOCK REVIEW QUEUE */}
      {adminTab === 'orders' && (
        <div className="bg-[#141414] border border-[#D4AF37]/20 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-serif font-bold text-white">Recent Orders & Stock Review Queue</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="border-b border-[#D4AF37]/20 text-[#D4AF37] uppercase text-xs">
                <tr>
                  <th className="pb-3">Order ID</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Items</th>
                  <th className="pb-3">Total</th>
                  <th className="pb-3">Payment</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                <tr>
                  <td className="py-3 font-mono text-[#D4AF37]">#SRM-1042</td>
                  <td className="py-3">Priya Sharma</td>
                  <td className="py-3">Maroon Banarasi Silk Saree (1)</td>
                  <td className="py-3 font-semibold text-white">₹4,899</td>
                  <td className="py-3"><span className="text-emerald-400 text-xs bg-emerald-950 px-2 py-0.5 rounded">Paid (UPI)</span></td>
                  <td className="py-3"><span className="text-amber-400 text-xs bg-amber-950 px-2 py-0.5 rounded">Awaiting Owner Review</span></td>
                  <td className="py-3">
                    <button onClick={() => alert('Order accepted and stock reserved!')} className="bg-[#D4AF37] text-black font-bold text-xs px-3 py-1 rounded cursor-pointer">
                      Accept Order
                    </button>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 font-mono text-[#D4AF37]">#SRM-1041</td>
                  <td className="py-3">Ananya Verma</td>
                  <td className="py-3">Floral Anarkali Kurti (2)</td>
                  <td className="py-3 font-semibold text-white">₹3,598</td>
                  <td className="py-3"><span className="text-emerald-400 text-xs bg-emerald-950 px-2 py-0.5 rounded">Paid (Card)</span></td>
                  <td className="py-3"><span className="text-emerald-400 text-xs bg-emerald-950 px-2 py-0.5 rounded">Dispatched</span></td>
                  <td className="py-3">
                    <span className="text-xs text-gray-400">View Details</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
