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
import AdminView from './components/views/AdminView';
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
      {currentView === 'home' && (
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
      )}

      {/* ================= VIEW 2: COLLECTION PAGE ================= */}
      {currentView === 'collection' && (
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
      )}

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
        <AdminView
          productsList={productsList}
          setProductsList={setProductsList}
          heroSlides={heroSlides}
          setHeroSlides={setHeroSlides}
          promoBanners={promoBanners}
          setPromoBanners={setPromoBanners}
          featuredBlocks={featuredBlocks}
          setFeaturedBlocks={setFeaturedBlocks}
          lookbookBanner={lookbookBanner}
          setLookbookBanner={setLookbookBanner}
          onNavHome={() => setCurrentView('home')}
        />
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
