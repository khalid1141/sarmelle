/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, User, Heart, ShoppingBag, Menu, X, Filter, ChevronDown, 
  Star, Check, ArrowRight, ShieldCheck, Truck, RotateCcw, SlidersHorizontal, 
  Sparkles, Flame, Tag, HelpCircle, Eye, Trash2, Plus, Minus, Lock, CheckCircle2,
  Package, ShoppingCart, Users, BarChart3, Settings, LogOut, RefreshCw,
  ChevronLeft, ChevronRight, Clock, Gem, Mail, Edit3, CreditCard, QrCode, Building,
  ArrowLeft, Download, BadgeCheck, ArrowUpDown, LogIn, MapPin, Calendar, FileText, AlertCircle, KeyRound
} from 'lucide-react';

import type { Product, ProductReview } from './types/product';
import type { HeroSlide, PromoBanner, FeaturedBlock, LookbookConfig } from './types/campaign';
import type { UserOrderItem, UserOrder, UserReturn } from './types/order';
import type { CartItem, AppliedCoupon } from './types/cart';

export type { Product, ProductReview, HeroSlide, PromoBanner, FeaturedBlock, LookbookConfig, UserOrderItem, UserOrder, UserReturn };

import SizeChartModal from './components/modals/SizeChartModal';
import WishlistDrawer from './components/modals/WishlistDrawer';
import CartDrawer from './components/modals/CartDrawer';
import AuthModal from './components/modals/AuthModal';
import OrderTrackingModal from './components/modals/OrderTrackingModal';
import ReturnModal from './components/modals/ReturnModal';
import CheckoutModal from './components/modals/CheckoutModal';
import Footer from './components/common/Footer';
import Header from './components/common/Header';
import MobileNav from './components/common/MobileNav';
import HomeView from './components/views/HomeView';
import CollectionView from './components/views/CollectionView';
import ProductDetailView from './components/views/ProductDetailView';
import AccountView from './components/views/AccountView';
import ReviewsModal from './components/modals/ReviewsModal';
import ChangePasswordModal from './components/modals/ChangePasswordModal';
import { SAMPLE_PRODUCTS } from './data/products';
import { SAMPLE_REVIEWS } from './data/reviews';
import { SAMPLE_HERO_SLIDES, SAMPLE_PROMO_BANNERS, SAMPLE_FEATURED_BLOCKS, DEFAULT_LOOKBOOK } from './data/campaign';
import { SAMPLE_USER_ORDERS, SAMPLE_USER_RETURNS } from './data/orders';

export { SAMPLE_PRODUCTS, SAMPLE_REVIEWS, SAMPLE_HERO_SLIDES, SAMPLE_PROMO_BANNERS, SAMPLE_FEATURED_BLOCKS, DEFAULT_LOOKBOOK, SAMPLE_USER_ORDERS, SAMPLE_USER_RETURNS };


export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'collection' | 'product' | 'admin' | 'account'>(() => {
    try {
      const saved = sessionStorage.getItem('sarmelle_current_view');
      return (saved as any) || 'home';
    } catch {
      return 'home';
    }
  });

  const [accountTab, setAccountTab] = useState<'profile' | 'orders' | 'returns'>(() => {
    try {
      const saved = sessionStorage.getItem('sarmelle_account_tab');
      return (saved as any) || 'profile';
    } catch {
      return 'profile';
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem('sarmelle_current_view', currentView);
    } catch {
      // ignore
    }
  }, [currentView]);

  useEffect(() => {
    try {
      sessionStorage.setItem('sarmelle_account_tab', accountTab);
    } catch {
      // ignore
    }
  }, [accountTab]);

  const [userOrders, setUserOrders] = useState<UserOrder[]>(SAMPLE_USER_ORDERS);
  const [userReturns, setUserReturns] = useState<UserReturn[]>(SAMPLE_USER_RETURNS);
  const [activeTrackingOrder, setActiveTrackingOrder] = useState<UserOrder | null>(null);
  const [returnModalItem, setReturnModalItem] = useState<{ order: UserOrder; item: UserOrderItem } | null>(null);
  const [accountNotice, setAccountNotice] = useState<string | null>(null);
  const [wishlistNotice, setWishlistNotice] = useState<string | null>(null);
  const [ordersSubFilter, setOrdersSubFilter] = useState<'all' | 'returns'>('all');

  // Simple Change Password Dialog States (Old pass, new pass, confirm new pass)
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const [userProfile, setUserProfile] = useState({
    fullName: 'Priya Sharma',
    email: 'khalidmohd.k10@gmail.com',
    phone: '+91 98765 43210',
    gender: 'Female',
    birthday: '14 November 1994',
    memberSince: 'October 2024'
  });
  const [selectedProduct, setSelectedProduct] = useState<Product>(SAMPLE_PRODUCTS[0]);
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(SAMPLE_HERO_SLIDES);
  const [promoBanners, setPromoBanners] = useState<PromoBanner[]>(SAMPLE_PROMO_BANNERS);
  const [featuredBlocks, setFeaturedBlocks] = useState<FeaturedBlock[]>(SAMPLE_FEATURED_BLOCKS);
  const [lookbookBanner, setLookbookBanner] = useState<LookbookConfig>(DEFAULT_LOOKBOOK);
  const [productsList, setProductsList] = useState<Product[]>(SAMPLE_PRODUCTS);
  const [adminTab, setAdminTab] = useState<'campaign' | 'products' | 'orders'>('campaign');
  const [adminNotification, setAdminNotification] = useState<string | null>(null);

  const [isReviewsModalOpen, setIsReviewsModalOpen] = useState(false);
  const [isSizeChartModalOpen, setIsSizeChartModalOpen] = useState(false);
  const [selectedProductColor, setSelectedProductColor] = useState<string>('Maroon');
  const [selectedProductSize, setSelectedProductSize] = useState<string>('Free Size');

  
  // Product Detail Active Image & Mobile Touch Swipe
  const [activeProductImageIdx, setActiveProductImageIdx] = useState<number>(0);



  useEffect(() => {
    setActiveProductImageIdx(0);
  }, [selectedProduct?.id]);

  // Cart & Wishlist state
  const [cart, setCart] = useState<CartItem[]>([
    { product: SAMPLE_PRODUCTS[0], quantity: 1, selectedSize: 'Free Size', selectedColor: 'Maroon' },
    { product: SAMPLE_PRODUCTS[2], quantity: 1, selectedSize: 'M', selectedColor: 'Rose Pink' }
  ]);
  const [wishlist, setWishlist] = useState<Product[]>([SAMPLE_PRODUCTS[1], SAMPLE_PRODUCTS[4]]);
  
  // Cart Actions
  const updateCartQuantity = (index: number, delta: number) => {
    setCart(prev => {
      const updated = [...prev];
      const newQty = updated[index].quantity + delta;
      if (newQty <= 0) {
        return updated.filter((_, i) => i !== index);
      }
      updated[index] = { ...updated[index], quantity: newQty };
      return updated;
    });
  };

  const removeCartItem = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>({
    code: 'DIWALI30',
    discountPercent: 30
  });
  const [couponError, setCouponError] = useState('');

  const handleApplyCoupon = (overrideCode?: string) => {
    const code = (overrideCode || couponInput).trim().toUpperCase();
    if (!code) return;
    if (code === 'DIWALI30') {
      setAppliedCoupon({ code: 'DIWALI30', discountPercent: 30 });
      setCouponError('');
      setCouponInput('');
    } else if (code === 'WELCOME10') {
      setAppliedCoupon({ code: 'WELCOME10', discountPercent: 10 });
      setCouponError('');
      setCouponInput('');
    } else if (code === 'FESTIVE500') {
      setAppliedCoupon({ code: 'FESTIVE500', discountPercent: 0, discountAmount: 500 });
      setCouponError('');
      setCouponInput('');
    } else {
      setCouponError('Invalid code. Use DIWALI30, WELCOME10, or FESTIVE500');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
  };

  // Cart Price Math
  const cartSubtotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const couponDiscount = appliedCoupon
    ? (appliedCoupon.discountAmount || Math.round((cartSubtotal * appliedCoupon.discountPercent) / 100))
    : 0;
  const isFreeShippingEligible = cartSubtotal >= 1999;
  
  // Checkout Modal Open State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const shippingCharge = 50; // Flat ₹50 per order policy
  const cartFinalTotal = Math.max(0, cartSubtotal - couponDiscount + shippingCharge);

  // Filters state for collection page
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedOfferType, setSelectedOfferType] = useState<string>('All');
  const [selectedFabric, setSelectedFabric] = useState<string>('All');
  const [selectedColorFilter, setSelectedColorFilter] = useState<string>('All');
  const [maxPrice, setMaxPrice] = useState<number>(10000);
  const [sortBy, setSortBy] = useState<string>('Featured');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      const saved = sessionStorage.getItem('sarmelle_logged_in');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem('sarmelle_logged_in', String(isLoggedIn));
    } catch {
      // ignore
    }
  }, [isLoggedIn]);


  const resetAllFilters = () => {
    setSelectedCategory('All');
    setSelectedOfferType('All');
    setSelectedFabric('All');
    setSelectedColorFilter('All');
    setMaxPrice(10000);
    setSortBy('Featured');
  };

  const addToCart = (product: Product, size = 'Free Size', color = product.colors[0]?.name || 'Default') => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id && item.selectedSize === size && item.selectedColor === color);
      if (existing) {
        return prev.map(item => item === existing ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1, selectedSize: size, selectedColor: color }];
    });
    setCartOpen(true);
  };

  const toggleWishlist = (product: Product) => {
    setWishlist(prev => 
      prev.some(item => item.id === product.id) 
        ? prev.filter(item => item.id !== product.id) 
        : [...prev, product]
    );
  };

  const moveWishlistItemToBag = (product: Product) => {
    addToCart(product);
    setWishlist(prev => prev.filter(item => item.id !== product.id));
    setWishlistOpen(false);
    setWishlistNotice('Moved to bag');
    setTimeout(() => setWishlistNotice(null), 2500);
  };

  const filteredProducts = SAMPLE_PRODUCTS.filter(p => {
    if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
    if (selectedOfferType !== 'All' && p.offerType !== selectedOfferType) return false;
    if (selectedFabric !== 'All' && p.fabric !== selectedFabric) return false;
    if (selectedColorFilter !== 'All' && !p.colors.some(c => c.name.toLowerCase().includes(selectedColorFilter.toLowerCase()))) return false;
    if (p.price > maxPrice) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'Price: Low to High') return a.price - b.price;
    if (sortBy === 'Price: High to Low') return b.price - a.price;
    if (sortBy === 'Rating') return b.rating - a.rating;
    if (sortBy === 'Discount: High to Low') return b.discount - a.discount;
    if (sortBy === 'Newest') return b.id - a.id;
    return 0; // Featured
  });

  const activeFilterCount = (selectedCategory !== 'All' ? 1 : 0) +
    (selectedOfferType !== 'All' ? 1 : 0) +
    (selectedFabric !== 'All' ? 1 : 0) +
    (selectedColorFilter !== 'All' ? 1 : 0) +
    (maxPrice < 10000 ? 1 : 0);
  const hasActiveFilters = activeFilterCount > 0;

  // Infinite Scroll State for Collection View (Initial 9 products, loads remaining on scroll)
  const [visibleProductsCount, setVisibleProductsCount] = useState<number>(9);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const scrollSentinelRef = useRef<HTMLDivElement | null>(null);

  // Reset visible items count back to 9 on filter or sort criteria change
  useEffect(() => {
    setVisibleProductsCount(9);
  }, [selectedCategory, selectedOfferType, selectedFabric, selectedColorFilter, maxPrice, sortBy]);


  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#E5D5C5] font-sans selection:bg-[#D4AF37] selection:text-black">
      
      {/* Festive Announcement Bar + Main Header (Desktop and Secondary Sub-Navbar) */}
      <Header
        currentView={currentView}
        selectedCategory={selectedCategory}
        selectedOfferType={selectedOfferType}
        isLoggedIn={isLoggedIn}
        userName={userProfile.fullName.split(' ')[0]}
        wishlistCount={wishlist.length}
        cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)}
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
        onShopNow={() => { setSelectedOfferType('Diwali Sale'); setCurrentView('collection'); }}
        onOpenSearchCollection={() => setCurrentView('collection')}
        onNavHome={() => { setSelectedCategory('All'); setSelectedOfferType('All'); setCurrentView('home'); }}
        onNavCategory={(category) => { setSelectedCategory(category); setSelectedOfferType('All'); setCurrentView('collection'); }}
        onNavNewArrivals={() => { setSelectedCategory('All'); setSelectedOfferType('New Festive Collection'); setCurrentView('collection'); }}
        onNavFestive={() => { setSelectedCategory('All'); setSelectedOfferType('Diwali Sale'); setCurrentView('collection'); }}
        onNavOffers={() => { setSelectedCategory('All'); setSelectedOfferType('Offers'); setCurrentView('collection'); }}
        onContactFooter={() => { const el = document.querySelector('footer'); el?.scrollIntoView({ behavior: 'smooth' }); }}
        onAccount={() => { setCurrentView('account'); setAccountTab('profile'); }}
        onLogout={() => {
          setIsLoggedIn(false);
          if (currentView === 'account') setCurrentView('home');
        }}
        onLogin={() => setAuthModalOpen(true)}
        onOpenWishlist={() => setWishlistOpen(true)}
        onOpenCart={() => setCartOpen(true)}
      />

      {/* ================= MOBILE NAVIGATION DRAWER ================= */}
      <MobileNav
        isOpen={mobileMenuOpen}
        isLoggedIn={isLoggedIn}
        onClose={() => setMobileMenuOpen(false)}
        onNavHome={() => setCurrentView('home')}
        onNavCategory={(category) => { setSelectedCategory(category); setCurrentView('collection'); }}
        onNavFestive={() => { setSelectedOfferType('New Festive Collection'); setCurrentView('collection'); }}
        onNavDiwaliSale={() => { setSelectedOfferType('Diwali Sale'); setCurrentView('collection'); }}
        onAccountTab={(tab) => { setIsLoggedIn(true); setAccountTab(tab); setCurrentView('account'); }}
        onLogout={() => {
          setIsLoggedIn(false);
          if (currentView === 'account') setCurrentView('home');
        }}
        onLogin={() => setAuthModalOpen(true)}
      />

      {/* ================= VIEW 1: HOMEPAGE ================= */}
      <HomeView
        heroSlides={heroSlides}
        promoBanners={promoBanners}
        featuredBlocks={featuredBlocks}
        lookbookBanner={lookbookBanner}
        productsList={productsList}
        wishlist={wishlist}
        addToCart={addToCart}
        toggleWishlist={toggleWishlist}
        onSelectProduct={(product) => { setSelectedProduct(product); setCurrentView('product'); }}
        onNavCategoryOffer={(category, offer) => { if (category) setSelectedCategory(category); if (offer) setSelectedOfferType(offer); setCurrentView('collection'); }}
        onNavCategory={(category) => { setSelectedCategory(category); setCurrentView('collection'); }}
        onShopOffer={(offer) => { if (offer) setSelectedOfferType(offer); setCurrentView('collection'); }}
      />

      {/* ================= VIEW 2: COLLECTION PAGE ================= */}
      <CollectionView
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedOfferType={selectedOfferType}
        setSelectedOfferType={setSelectedOfferType}
        selectedFabric={selectedFabric}
        setSelectedFabric={setSelectedFabric}
        selectedColorFilter={selectedColorFilter}
        setSelectedColorFilter={setSelectedColorFilter}
        maxPrice={maxPrice}
        setMaxPrice={setMaxPrice}
        sortBy={sortBy}
        setSortBy={setSortBy}
        filteredProducts={filteredProducts}
        resetAllFilters={resetAllFilters}
        visibleProductsCount={visibleProductsCount}
        setVisibleProductsCount={setVisibleProductsCount}
        isLoadingMore={isLoadingMore}
        setIsLoadingMore={setIsLoadingMore}
        scrollSentinelRef={scrollSentinelRef}
        wishlist={wishlist}
        addToCart={addToCart}
        toggleWishlist={toggleWishlist}
        onSelectProduct={(product) => { setSelectedProduct(product); setCurrentView('product'); }}
        onNavHome={() => setCurrentView('home')}
      />

      {/* ================= VIEW 3: PRODUCT DETAIL PAGE ================= */}
      {currentView === 'product' && (
        <ProductDetailView
          selectedProduct={selectedProduct}
          selectedProductColor={selectedProductColor}
          setSelectedProductColor={setSelectedProductColor}
          selectedProductSize={selectedProductSize}
          setSelectedProductSize={setSelectedProductSize}
          activeProductImageIdx={activeProductImageIdx}
          setActiveProductImageIdx={setActiveProductImageIdx}
          addToCart={addToCart}
          onOpenCart={() => setCartOpen(true)}
          onOpenReviews={() => setIsReviewsModalOpen(true)}
          onOpenSizeChart={() => setIsSizeChartModalOpen(true)}
        />
      )}

      {/* ================= VIEW 5: USER PROFILE, ORDERS & RETURNS DASHBOARD ================= */}
      {currentView === 'account' && (
        <AccountView
          userProfile={userProfile}
          setUserProfile={setUserProfile}
          accountNotice={accountNotice}
          setAccountNotice={setAccountNotice}
          accountTab={accountTab}
          setAccountTab={setAccountTab}
          userOrders={userOrders}
          userReturns={userReturns}
          addToCart={addToCart}
          onNavHome={() => setCurrentView('home')}
          onNavCollection={() => setCurrentView('collection')}
          onOpenChangePassword={() => setIsChangePasswordOpen(true)}
          onInitiateReturn={(order, item) => setReturnModalItem({ order, item })}
        />
      )}

      {/* ================= VIEW 4: ADMIN DASHBOARD PROTOTYPE ================= */}
      {currentView === 'admin' && (
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
                className="bg-[#5C1824] hover:bg-[#7A1C28] text-[#F3E5AB] font-bold text-xs px-4 py-2.5 rounded-lg border border-[#D4AF37]/50 shadow transition-all"
              >
                Save & Apply Live
              </button>
              <button 
                onClick={() => setCurrentView('home')} 
                className="bg-[#D4AF37] hover:bg-[#E5C158] text-black font-semibold text-xs px-4 py-2.5 rounded-lg shadow transition-all"
              >
                Back to Storefront &rarr;
              </button>
            </div>
          </div>

          {/* Toast Notification */}
          {adminNotification && (
            <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-lg text-xs flex items-center justify-between">
              <span>{adminNotification}</span>
              <button onClick={() => setAdminNotification(null)} className="text-emerald-400 hover:text-white">
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
              className={`pb-3 text-xs sm:text-sm font-semibold tracking-wider uppercase transition-colors ${
                adminTab === 'campaign' 
                  ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Festival Campaign & Visuals Control
            </button>
            <button 
              onClick={() => setAdminTab('products')}
              className={`pb-3 text-xs sm:text-sm font-semibold tracking-wider uppercase transition-colors ${
                adminTab === 'products' 
                  ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Product Images & Pricing
            </button>
            <button 
              onClick={() => setAdminTab('orders')}
              className={`pb-3 text-xs sm:text-sm font-semibold tracking-wider uppercase transition-colors ${
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
                        <button onClick={() => alert('Order accepted and stock reserved!')} className="bg-[#D4AF37] text-black font-bold text-xs px-3 py-1 rounded">
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
      )}

      {/* ================= CART DRAWER ================= */}
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        updateQuantity={updateCartQuantity}
        removeItem={removeCartItem}
        couponInput={couponInput}
        onCouponInputChange={(value) => setCouponInput(value)}
        appliedCoupon={appliedCoupon}
        couponError={couponError}
        onApplyCoupon={handleApplyCoupon}
        onRemoveCoupon={handleRemoveCoupon}
        subtotal={cartSubtotal}
        isFreeShippingEligible={isFreeShippingEligible}
        finalTotal={cartFinalTotal}
        onStartCheckout={() => {
          setCartOpen(false);
          setIsCheckoutOpen(true);
        }}
        onExploreCollection={() => {
          setCartOpen(false);
          setCurrentView('collection');
        }}
      />

      {/* ================= 4-STEP CHECKOUT STEPPER MODAL ================= */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        cartFinalTotal={cartFinalTotal}
        isFreeShippingEligible={isFreeShippingEligible}
        onOrderPlaced={(order) => {
          setUserOrders(prev => [order, ...prev]);
          setIsLoggedIn(true);
        }}
        onContinueShopping={() => {
          setCart([]);
          setIsCheckoutOpen(false);
          setCurrentView('home');
        }}
      />

      {/* ================= WISHLIST DRAWER ================= */}
      <WishlistDrawer
        isOpen={wishlistOpen}
        onClose={() => setWishlistOpen(false)}
        wishlist={wishlist}
        onAddToBag={moveWishlistItemToBag}
        onRemove={toggleWishlist}
      />

      {/* ================= WISHLIST TO BAG NOTICE ================= */}
      {wishlistNotice && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-[#141414] border border-[#D4AF37]/50 text-[#F3E5AB] px-5 py-3 rounded-xl shadow-2xl text-xs flex items-center gap-2 animate-in fade-in duration-200">
          <ShoppingBag className="w-4 h-4 text-[#D4AF37]" />
          <span>{wishlistNotice}</span>
        </div>
      )}

      {/* ================= AUTH MODAL (LOGIN & REGISTER) ================= */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthenticated={() => {
          setIsLoggedIn(true);
          setAuthModalOpen(false);
        }}
      />

      {/* ================= CUSTOMER REVIEWS MODAL POPUP ================= */}
      <ReviewsModal 
        isOpen={isReviewsModalOpen} 
        onClose={() => setIsReviewsModalOpen(false)} 
        product={selectedProduct} 
      />

      {/* ================= SIZE CHART MODAL POPUP ================= */}
      <SizeChartModal 
        isOpen={isSizeChartModalOpen} 
        onClose={() => setIsSizeChartModalOpen(false)} 
      />

      {/* ================= LIVE ORDER TRACKING MODAL ================= */}
      <OrderTrackingModal
        order={activeTrackingOrder}
        onClose={() => setActiveTrackingOrder(null)}
      />

      {/* ================= SIMPLE CHANGE PASSWORD MODAL ================= */}
      <ChangePasswordModal 
        isOpen={isChangePasswordOpen} 
        onClose={() => setIsChangePasswordOpen(false)} 
        onSuccess={(msg) => {
          setAccountNotice(msg);
          setTimeout(() => setAccountNotice(null), 5000);
        }} 
      />

      {/* ================= INITIATE RETURN / EXCHANGE MODAL ================= */}
      <ReturnModal
        returnItem={returnModalItem}
        onClose={() => setReturnModalItem(null)}
        onSubmit={(type, reason) => {
          if (!returnModalItem) return;
          const newRetNum = `RET-2026-${Math.floor(1000 + Math.random() * 9000)}`;
          const newReturnRecord: UserReturn = {
            id: `ret-${Date.now()}`,
            returnNumber: newRetNum,
            orderNumber: returnModalItem.order.orderNumber,
            date: 'Today, Just now',
            status: 'Initiated Return',
            type,
            reason,
            refundAmount: returnModalItem.item.price,
            refundNote: type === 'Exchange'
              ? `Exchange initiated. Please parcel and courier the ensemble in its original condition with tags intact to our Bengaluru Return Hub. The replacement ensemble will be dispatched upon receipt.`
              : `Return initiated. Please parcel and courier the ensemble in its original condition with tags intact to our Bengaluru Return Hub. Full refund of ₹${returnModalItem.item.price.toLocaleString('en-IN')} will be credited to your original payment source upon inspection.`,
            item: {
              name: returnModalItem.item.name,
              image: returnModalItem.item.image,
              size: returnModalItem.item.size,
              color: returnModalItem.item.color,
              price: returnModalItem.item.price
            }
          };
          setUserReturns(prev => [newReturnRecord, ...prev]);
          setReturnModalItem(null);
          setAccountTab('orders');
          setOrdersSubFilter('returns');
          setCurrentView('account');
          setAccountNotice(`Return request #${newRetNum} initiated successfully! Please self-ship the parcel to our returns hub.`);
          setTimeout(() => setAccountNotice(null), 5000);
        }}
      />

      {/* Footer */}
      <Footer
        onHome={() => setCurrentView('home')}
        onShopCategory={(category) => {
          setSelectedCategory(category);
          setCurrentView('collection');
        }}
        onNewArrivals={() => {
          setSelectedOfferType('New Festive Collection');
          setCurrentView('collection');
        }}
        onTrackOrder={() => {
          setIsLoggedIn(true);
          setAccountTab('orders');
          setCurrentView('account');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onReturns={() => {
          setIsLoggedIn(true);
          setAccountTab('returns');
          setCurrentView('account');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSizeGuide={() => setIsSizeChartModalOpen(true)}
      />

    </div>
  );
}
