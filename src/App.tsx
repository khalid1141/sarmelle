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
  const [returnTypeSelection, setReturnTypeSelection] = useState<'Exchange' | 'Return'>('Exchange');
  const [returnReasonSelection, setReturnReasonSelection] = useState('');
  const [accountNotice, setAccountNotice] = useState<string | null>(null);
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
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState(userProfile);
  const [selectedProduct, setSelectedProduct] = useState<Product>(SAMPLE_PRODUCTS[0]);
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentHeroSlide, setCurrentHeroSlide] = useState<number>(0);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(SAMPLE_HERO_SLIDES);
  const [promoBanners, setPromoBanners] = useState<PromoBanner[]>(SAMPLE_PROMO_BANNERS);
  const [featuredBlocks, setFeaturedBlocks] = useState<FeaturedBlock[]>(SAMPLE_FEATURED_BLOCKS);
  const [lookbookBanner, setLookbookBanner] = useState<LookbookConfig>(DEFAULT_LOOKBOOK);
  const [activeProductTab, setActiveProductTab] = useState<'New Arrivals' | 'Best Sellers' | 'Festive Collection' | 'Trending Now'>('New Arrivals');
  const [productsList, setProductsList] = useState<Product[]>(SAMPLE_PRODUCTS);
  const [adminTab, setAdminTab] = useState<'campaign' | 'products' | 'orders'>('campaign');
  const [adminNotification, setAdminNotification] = useState<string | null>(null);

  const [isReviewsModalOpen, setIsReviewsModalOpen] = useState(false);
  const [isSizeChartModalOpen, setIsSizeChartModalOpen] = useState(false);
  const [selectedProductColor, setSelectedProductColor] = useState<string>('Maroon');
  const [selectedProductSize, setSelectedProductSize] = useState<string>('Free Size');
  const [expandedAccordion, setExpandedAccordion] = useState<string | null>('description');
  
  // Product Detail Active Image & Mobile Touch Swipe
  const [activeProductImageIdx, setActiveProductImageIdx] = useState<number>(0);
  const mobTouchStartX = useRef<number | null>(null);
  const mobTouchEndX = useRef<number | null>(null);

  useEffect(() => {
    setActiveProductImageIdx(0);
  }, [selectedProduct?.id]);

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

  // Hero Auto-slide & Touch-Swipe States
  const [isHeroHovered, setIsHeroHovered] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Auto-slide effect every 5 seconds (pauses on user interaction/hover)
  useEffect(() => {
    if (currentView !== 'home' || isHeroHovered || heroSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentHeroSlide(prev => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [currentView, isHeroHovered, heroSlides.length]);

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
  
  // Checkout Stepper State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3 | 4>(1);
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');
  const shippingCharge = 50; // Flat ₹50 per order policy
  const cartFinalTotal = Math.max(0, cartSubtotal - couponDiscount + shippingCharge);

  const [deliveryAddress, setDeliveryAddress] = useState({
    fullName: 'Pooja Sharma',
    phone: '9876543210',
    pincode: '560001',
    address: 'Flat 402, Royal Palms Residency',
    locality: 'MG Road, Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    addressType: 'Home' as 'Home' | 'Office'
  });

  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking' | 'cod'>('upi');
  const [selectedUpiApp, setSelectedUpiApp] = useState<'gpay' | 'phonepe' | 'paytm' | 'custom'>('gpay');
  const [upiIdInput, setUpiIdInput] = useState('pooja@okhdfcbank');
  const [cardDetails, setCardDetails] = useState({
    number: '4532 •••• •••• 8821',
    name: 'POOJA SHARMA',
    expiry: '09/28',
    cvv: '•••'
  });
  const [netBank, setNetBank] = useState('HDFC Bank');
  const [confirmedOrder, setConfirmedOrder] = useState<{
    orderId: string;
    itemsCount: number;
    totalAmount: number;
    deliveryDate: string;
    paymentMethod: string;
  } | null>(null);

  // Filters state for collection page
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedOfferType, setSelectedOfferType] = useState<string>('All');
  const [selectedFabric, setSelectedFabric] = useState<string>('All');
  const [selectedColorFilter, setSelectedColorFilter] = useState<string>('All');
  const [maxPrice, setMaxPrice] = useState<number>(10000);
  const [sortBy, setSortBy] = useState<string>('Featured');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState<boolean>(false);
  const [isMobSortDropdownOpen, setIsMobSortDropdownOpen] = useState<boolean>(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const mobSortDropdownRef = useRef<HTMLDivElement>(null);
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

  // Infinite scroll trigger via IntersectionObserver
  useEffect(() => {
    if (currentView !== 'collection') return;
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
  }, [currentView, visibleProductsCount, filteredProducts.length, isLoadingMore]);

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#E5D5C5] font-sans selection:bg-[#D4AF37] selection:text-black">
      
      {/* Festive Announcement Bar */}
      <div className="bg-gradient-to-r from-[#5C2D91] via-[#7A1C28] to-[#D4AF37] text-white text-xs sm:text-sm font-medium py-2 px-4 text-center tracking-wide flex items-center justify-center gap-2 shadow-inner">
        <Sparkles className="w-4 h-4 text-amber-200 animate-pulse flex-shrink-0" />
        <span className="truncate">Diwali Special Sale | Upto 40% OFF on New Festive Collection</span>
        <button 
          onClick={() => { setSelectedOfferType('Diwali Sale'); setCurrentView('collection'); }} 
          className="underline font-semibold hover:text-amber-200 ml-1 transition-colors flex-shrink-0"
        >
          Shop Now &rarr;
        </button>
      </div>

      {/* Main Header matching image_86320f0b.png */}
      <header className="sticky top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-[#D4AF37]/25 shadow-lg select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          
          {/* Mobile Menu Toggle (Left on Mobile) */}
          <div className="flex items-center lg:hidden">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="text-[#D4AF37] hover:text-white p-2 focus:outline-none cursor-pointer"
              aria-label="Open mobile menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          {/* Desktop Left: Pill-Shaped Search Bar (Matching image_86320f0b.png) */}
          <div className="hidden lg:flex items-center relative w-72 xl:w-88 flex-shrink-0">
            <input 
              type="text" 
              placeholder="Search for sarees, kurtis and more..." 
              className="w-full bg-[#121212] border border-[#D4AF37]/35 hover:border-[#D4AF37]/60 rounded-full pl-10 pr-4 py-2 text-xs text-white placeholder-[#C4B2A2]/60 focus:outline-none focus:border-[#D4AF37] transition-all cursor-text shadow-inner"
              onClick={() => setCurrentView('collection')}
            />
            <Search className="w-4 h-4 text-[#D4AF37] absolute left-3.5 top-2.5 pointer-events-none" />
          </div>

          {/* Center: Brand Typography Logo with Lady Silhouette & "Wear Your Grace" tagline (Matching image_86320f0b.png) */}
          <div 
            className="cursor-pointer flex flex-col items-center justify-center select-none flex-shrink-0" 
            onClick={() => { setSelectedCategory('All'); setSelectedOfferType('All'); setCurrentView('home'); }}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-2xl sm:text-3xl font-serif font-bold tracking-wider bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#AA771C] bg-clip-text text-transparent">
                Sarmelle
              </span>
              {/* Elegant Silhouette Motif */}
              <svg className="w-6 h-8 text-[#D4AF37] fill-current" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2Z" fill="#D4AF37"/>
                <path d="M10.5 7.5C11.5 7 12.5 7 13.5 7.5C14.5 8 14.8 9.2 14.2 10.5L13 13.5C13.8 14.2 14.5 15.5 14 17.5L12 21C11.5 22 13 25 15 28C16.5 30 18.5 31 20 31.5H11C8.5 31.5 8 28 8.5 25C9 22 9.5 17 9.5 15L8.5 11C8.2 9.8 8.8 8.3 10.5 7.5Z" fill="#D4AF37" opacity="0.95"/>
                <path d="M14 28C17 28.5 21 29 22 30C23 31 22 31.5 19 31.5C16 31.5 14 30.5 14 28Z" fill="#AA771C"/>
              </svg>
            </div>
            <div className="flex items-center gap-1.5 -mt-1">
              <div className="h-[1px] w-3 sm:w-5 bg-gradient-to-r from-transparent to-[#D4AF37]/60" />
              <span className="text-[9px] sm:text-[10px] tracking-[0.25em] text-[#D4AF37] font-serif italic">
                Wear Your Grace
              </span>
              <div className="h-[1px] w-3 sm:w-5 bg-gradient-to-l from-transparent to-[#D4AF37]/60" />
            </div>
          </div>

          {/* Right: Actions (Login / Register, Wishlist, Cart with Counter Badge) */}
          <div className="flex items-center gap-3 sm:gap-6 flex-shrink-0">
            {/* Mobile Search Icon */}
            <button 
              onClick={() => setCurrentView('collection')}
              className="lg:hidden text-[#E5D5C5] hover:text-[#D4AF37] p-1.5 transition-colors cursor-pointer"
              title="Search"
              aria-label="Search"
            >
              <Search className="w-5 h-5 text-[#D4AF37]" />
            </button>

            {/* Login / Register / Account */}
            {isLoggedIn ? (
              <div className="hidden sm:flex items-center gap-2">
                <button 
                  onClick={() => {
                    setCurrentView('account');
                    setAccountTab('profile');
                  }} 
                  className={`flex items-center gap-1.5 text-xs font-medium py-1 px-2.5 rounded-lg border transition-all cursor-pointer ${
                    currentView === 'account' 
                      ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]' 
                      : 'border-transparent text-[#E5D5C5] hover:text-[#D4AF37] hover:border-[#D4AF37]/40'
                  }`}
                  title="My Account Dashboard"
                >
                  <User className="w-4 h-4 text-[#D4AF37]" />
                  <span>Priya (Account)</span>
                </button>
                <button
                  onClick={() => {
                    setIsLoggedIn(false);
                    if (currentView === 'account') setCurrentView('home');
                  }}
                  className="text-gray-400 hover:text-red-400 p-1 transition-colors cursor-pointer"
                  title="Logout"
                  aria-label="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setAuthModalOpen(true)} 
                className="text-[#E5D5C5] hover:text-[#D4AF37] transition-colors hidden sm:flex items-center gap-2 text-xs font-medium py-1 cursor-pointer" 
                title="Login / Register"
              >
                <User className="w-4 h-4 text-[#D4AF37]" />
                <span>Login / Register</span>
              </button>
            )}

            {/* Wishlist */}
            <button 
              onClick={() => setWishlistOpen(true)} 
              className="relative text-[#E5D5C5] hover:text-[#D4AF37] transition-colors flex items-center gap-2 py-1 cursor-pointer" 
              title="Wishlist"
              aria-label="Wishlist"
            >
              <Heart className="w-4 h-4 text-[#D4AF37]" />
              <span className="hidden sm:inline text-xs font-medium">Wishlist</span>
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#D4AF37] text-black font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Cart with Counter Badge */}
            <button 
              onClick={() => setCartOpen(true)} 
              className="relative text-[#E5D5C5] hover:text-[#D4AF37] transition-colors p-1 cursor-pointer" 
              title="Cart"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5 text-[#D4AF37]" />
              <span className="absolute -top-1.5 -right-1.5 bg-[#D4AF37] text-black font-bold text-[10px] w-4.5 h-4.5 rounded-full flex items-center justify-center shadow">
                {cart.reduce((acc, item) => acc + item.quantity, 0)}
              </span>
            </button>
          </div>
        </div>

        {/* Desktop Secondary Sub-Navbar with Persistent Active Category State */}
        <div className="hidden lg:block border-t border-[#D4AF37]/20 bg-[#0B0B0B]/95 py-2.5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center gap-7 text-xs font-medium tracking-wide">
            <button 
              onClick={() => { setSelectedCategory('All'); setSelectedOfferType('All'); setCurrentView('home'); }} 
              className={`transition-all pb-1 border-b-2 cursor-pointer ${
                currentView === 'home' 
                  ? 'text-[#D4AF37] font-semibold border-[#D4AF37]' 
                  : 'text-[#E5D5C5] hover:text-[#D4AF37] border-transparent'
              }`}
            >
              Home
            </button>
            <button 
              onClick={() => { setSelectedCategory('Sarees'); setSelectedOfferType('All'); setCurrentView('collection'); }} 
              className={`transition-all pb-1 border-b-2 cursor-pointer ${
                currentView === 'collection' && selectedCategory === 'Sarees' 
                  ? 'text-[#D4AF37] font-semibold border-[#D4AF37]' 
                  : 'text-[#E5D5C5] hover:text-[#D4AF37] border-transparent'
              }`}
            >
              Sarees
            </button>
            <button 
              onClick={() => { setSelectedCategory('Kurtis'); setSelectedOfferType('All'); setCurrentView('collection'); }} 
              className={`transition-all pb-1 border-b-2 cursor-pointer ${
                currentView === 'collection' && selectedCategory === 'Kurtis' && selectedOfferType === 'All' 
                  ? 'text-[#D4AF37] font-semibold border-[#D4AF37]' 
                  : 'text-[#E5D5C5] hover:text-[#D4AF37] border-transparent'
              }`}
            >
              Kurtis
            </button>
            <button 
              onClick={() => { setSelectedCategory('Lehengas'); setSelectedOfferType('All'); setCurrentView('collection'); }} 
              className={`transition-all pb-1 border-b-2 cursor-pointer ${
                currentView === 'collection' && selectedCategory === 'Lehengas' 
                  ? 'text-[#D4AF37] font-semibold border-[#D4AF37]' 
                  : 'text-[#E5D5C5] hover:text-[#D4AF37] border-transparent'
              }`}
            >
              Lehengas
            </button>
            <button 
              onClick={() => { setSelectedCategory('Dupattas'); setSelectedOfferType('All'); setCurrentView('collection'); }} 
              className={`transition-all pb-1 border-b-2 cursor-pointer ${
                currentView === 'collection' && selectedCategory === 'Dupattas' 
                  ? 'text-[#D4AF37] font-semibold border-[#D4AF37]' 
                  : 'text-[#E5D5C5] hover:text-[#D4AF37] border-transparent'
              }`}
            >
              Dupattas
            </button>
            <button 
              onClick={() => { setSelectedCategory('Sets'); setSelectedOfferType('All'); setCurrentView('collection'); }} 
              className={`transition-all pb-1 border-b-2 cursor-pointer ${
                currentView === 'collection' && selectedCategory === 'Sets' 
                  ? 'text-[#D4AF37] font-semibold border-[#D4AF37]' 
                  : 'text-[#E5D5C5] hover:text-[#D4AF37] border-transparent'
              }`}
            >
              Sets
            </button>
            <button 
              onClick={() => { setSelectedCategory('All'); setSelectedOfferType('New Festive Collection'); setCurrentView('collection'); }} 
              className={`transition-all pb-1 border-b-2 cursor-pointer ${
                currentView === 'collection' && selectedOfferType === 'New Festive Collection' 
                  ? 'text-[#D4AF37] font-semibold border-[#D4AF37]' 
                  : 'text-[#E5D5C5] hover:text-[#D4AF37] border-transparent'
              }`}
            >
              New Arrivals
            </button>
            <button 
              onClick={() => { setSelectedCategory('All'); setSelectedOfferType('Diwali Sale'); setCurrentView('collection'); }} 
              className={`transition-all pb-1 border-b-2 flex items-center gap-1 cursor-pointer ${
                currentView === 'collection' && selectedOfferType === 'Diwali Sale' 
                  ? 'text-[#D4AF37] font-semibold border-[#D4AF37]' 
                  : 'text-[#D4AF37]/90 hover:text-[#D4AF37] border-transparent font-medium'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Festive Collection
            </button>
            <button 
              onClick={() => { setSelectedCategory('All'); setSelectedOfferType('Offers'); setCurrentView('collection'); }} 
              className={`transition-all pb-1 border-b-2 cursor-pointer ${
                currentView === 'collection' && selectedOfferType === 'Offers' 
                  ? 'text-[#D4AF37] font-semibold border-[#D4AF37]' 
                  : 'text-[#E5D5C5] hover:text-[#D4AF37] border-transparent'
              }`}
            >
              Offers
            </button>
            <button 
              onClick={() => { const el = document.querySelector('footer'); el?.scrollIntoView({ behavior: 'smooth' }); }} 
              className="transition-colors hover:text-[#D4AF37] text-[#E5D5C5] pb-1 border-b-2 border-transparent cursor-pointer"
            >
              Contact
            </button>
          </div>
        </div>
      </header>

      {/* ================= MOBILE NAVIGATION DRAWER ================= */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-start lg:hidden cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-4/5 max-w-xs bg-[#121212] border-r border-[#D4AF37]/30 h-full flex flex-col p-6 shadow-2xl overflow-y-auto animate-in slide-in-from-left cursor-default"
          >
            <div className="flex justify-between items-center border-b border-[#D4AF37]/20 pb-4 mb-4">
              <div className="cursor-pointer" onClick={() => { setCurrentView('home'); setMobileMenuOpen(false); }}>
                <span className="font-serif font-bold text-[#F3E5AB] text-xl tracking-wider">Sarmelle</span>
                <p className="text-[8px] tracking-[0.2em] text-[#C5A059] uppercase font-light">Wear Your Grace</p>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="text-gray-400 hover:text-white p-1 cursor-pointer">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Navigation Categories */}
            <div className="flex flex-col space-y-1 text-sm font-medium">
              <button 
                onClick={() => { setCurrentView('home'); setMobileMenuOpen(false); }} 
                className="text-left text-white hover:text-[#D4AF37] py-2 border-b border-gray-800/80 transition-colors cursor-pointer"
              >
                Home
              </button>
              <button 
                onClick={() => { setSelectedCategory('Sarees'); setCurrentView('collection'); setMobileMenuOpen(false); }} 
                className="text-left text-white hover:text-[#D4AF37] py-2 border-b border-gray-800/80 transition-colors cursor-pointer"
              >
                Sarees
              </button>
              <button 
                onClick={() => { setSelectedCategory('Kurtis'); setCurrentView('collection'); setMobileMenuOpen(false); }} 
                className="text-left text-white hover:text-[#D4AF37] py-2 border-b border-gray-800/80 transition-colors cursor-pointer"
              >
                Kurtis
              </button>
              <button 
                onClick={() => { setSelectedCategory('Lehengas'); setCurrentView('collection'); setMobileMenuOpen(false); }} 
                className="text-left text-white hover:text-[#D4AF37] py-2 border-b border-gray-800/80 transition-colors cursor-pointer"
              >
                Lehengas
              </button>
              <button 
                onClick={() => { setSelectedCategory('Dupattas'); setCurrentView('collection'); setMobileMenuOpen(false); }} 
                className="text-left text-white hover:text-[#D4AF37] py-2 border-b border-gray-800/80 transition-colors cursor-pointer"
              >
                Dupattas
              </button>
              <button 
                onClick={() => { setSelectedOfferType('New Festive Collection'); setCurrentView('collection'); setMobileMenuOpen(false); }} 
                className="text-left text-[#D4AF37] font-semibold py-2 border-b border-gray-800/80 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4" /> Festive Collection
              </button>
              <button 
                onClick={() => { setSelectedOfferType('Diwali Sale'); setCurrentView('collection'); setMobileMenuOpen(false); }} 
                className="text-left text-white hover:text-[#D4AF37] py-2 border-b border-gray-800/80 transition-colors cursor-pointer"
              >
                Diwali Special Offers
              </button>
            </div>

            {/* Customer Account & Essential Services */}
            <div className="pt-4 mt-2 border-t border-[#D4AF37]/25 flex flex-col space-y-2">
              <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold px-1">
                Account & Orders
              </span>

              <button 
                onClick={() => {
                  setIsLoggedIn(true);
                  setAccountTab('profile');
                  setCurrentView('account');
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-2.5 text-left text-gray-200 hover:text-[#D4AF37] py-2 px-1 text-xs transition-colors cursor-pointer"
              >
                <User className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span>Profile</span>
              </button>

              <button 
                onClick={() => {
                  setIsLoggedIn(true);
                  setAccountTab('orders');
                  setCurrentView('account');
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-2.5 text-left text-gray-200 hover:text-[#D4AF37] py-2 px-1 text-xs transition-colors cursor-pointer"
              >
                <Package className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span>Orders</span>
              </button>

              {/* Dynamic Auth Button based on login state */}
              <div className="pt-3">
                {isLoggedIn ? (
                  <button
                    onClick={() => {
                      setIsLoggedIn(false);
                      if (currentView === 'account') setCurrentView('home');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border border-red-500/40 bg-red-950/30 text-red-400 hover:bg-red-900/40 text-xs font-semibold transition-all cursor-pointer shadow"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setAuthModalOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#AA771C] text-black text-xs font-bold transition-all hover:brightness-110 shadow-md cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Login / Register</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW 1: HOMEPAGE ================= */}
      {currentView === 'home' && (
        <main>
          {(() => {
            const activeSlide = heroSlides[currentHeroSlide] || heroSlides[0];
            const handleHeroCta = (slide: HeroSlide) => {
              if (slide.categoryTarget) {
                setSelectedCategory(slide.categoryTarget);
              }
              if (slide.offerTarget) {
                setSelectedOfferType(slide.offerTarget);
              }
              setCurrentView('collection');
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
                    onClick={() => { 
                      if (item.cat) setSelectedCategory(item.cat);
                      if (item.offer) setSelectedOfferType(item.offer);
                      setCurrentView('collection'); 
                    }}
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
                        onClick={() => {
                          if (banner.targetCategory) setSelectedCategory(banner.targetCategory);
                          if (banner.targetOffer) setSelectedOfferType(banner.targetOffer);
                          setCurrentView('collection');
                        }}
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
                  onClick={() => { setSelectedCategory(block.category); setCurrentView('collection'); }}
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
                    if (activeProductTab === 'Festive Collection') setSelectedOfferType('Diwali Sale');
                    else if (activeProductTab === 'Best Sellers') setSelectedOfferType('Best Sellers');
                    else if (activeProductTab === 'New Arrivals') setSelectedOfferType('New Festive Collection');
                    setCurrentView('collection');
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
                              onClick={() => { setSelectedProduct(product); setCurrentView('product'); }}
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
                                onClick={() => { setSelectedProduct(product); setCurrentView('product'); }}
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
                          if (activeProductTab === 'Festive Collection') setSelectedOfferType('Diwali Sale');
                          else if (activeProductTab === 'Best Sellers') setSelectedOfferType('Best Sellers');
                          else if (activeProductTab === 'New Arrivals') setSelectedOfferType('New Festive Collection');
                          setCurrentView('collection');
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
                    onClick={() => { setSelectedOfferType(lookbookBanner.offerTarget); setCurrentView('collection'); }}
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
      )}

      {/* ================= VIEW 2: COLLECTION PAGE ================= */}
      {currentView === 'collection' && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 select-none">
          {/* Breadcrumb & Festive Header Banner */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
              <button onClick={() => setCurrentView('home')} className="hover:text-[#D4AF37] transition-colors cursor-pointer">Home</button>
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
                      {cat === 'All' ? SAMPLE_PRODUCTS.length : SAMPLE_PRODUCTS.filter(p => p.category === cat).length}
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
                      {fab === 'All' ? SAMPLE_PRODUCTS.length : SAMPLE_PRODUCTS.filter(p => p.fabric === fab).length}
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
                              onClick={() => { setSelectedProduct(product); setCurrentView('product'); }}
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
                                onClick={() => { setSelectedProduct(product); setCurrentView('product'); }}
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
      )}

      {/* ================= VIEW 3: PRODUCT DETAIL PAGE ================= */}
      {currentView === 'product' && (
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
                  onClick={() => setIsReviewsModalOpen(true)}
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
                    onClick={() => setIsSizeChartModalOpen(true)} 
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
                  onClick={() => { addToCart(selectedProduct, selectedProductSize, selectedProductColor); setCartOpen(true); }}
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
                onClick={() => setIsReviewsModalOpen(true)}
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
                onClick={() => setIsReviewsModalOpen(true)}
                className="text-xs text-[#D4AF37] hover:underline cursor-pointer font-medium"
              >
                Click to explore all customer stories & ratings &rarr;
              </button>
            </div>
          </div>
        </main>
      )}

      {/* ================= VIEW 5: USER PROFILE, ORDERS & RETURNS DASHBOARD ================= */}
      {currentView === 'account' && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6 sm:space-y-8 animate-in fade-in duration-200">
          
          {/* Breadcrumb & Navigation */}
          <div className="flex items-center text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentView('home')} 
                className="hover:text-[#D4AF37] transition-colors cursor-pointer"
              >
                Home
              </button>
              <span>/</span>
              <span className="text-[#D4AF37] font-medium">My Account</span>
            </div>
          </div>

          {/* Account Welcome Banner - Clean & Sweet */}
          <div className="bg-gradient-to-r from-[#17080C] via-[#121212] to-[#141414] border border-[#D4AF37]/35 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-4 sm:gap-5 relative z-10">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-[#D4AF37] to-[#AA771C] p-0.5 shadow-md flex-shrink-0">
                <div className="w-full h-full rounded-full bg-[#121212] flex items-center justify-center text-[#D4AF37] font-serif font-bold text-lg sm:text-xl">
                  PS
                </div>
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-serif font-bold text-white tracking-wide truncate">
                  Namaste, {userProfile.fullName}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5 flex flex-wrap items-center gap-2">
                  <span>{userProfile.email}</span>
                  <span>•</span>
                  <span>{userProfile.phone}</span>
                  <span>•</span>
                  <span className="text-gray-500">Member since {userProfile.memberSince}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Account Alert / Toast */}
          {accountNotice && (
            <div className="bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-xl text-xs flex items-center justify-between animate-in fade-in">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {accountNotice}
              </span>
              <button onClick={() => setAccountNotice(null)} className="text-emerald-400 hover:text-white p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Account Sub-Tabs Header */}
          <div className="flex border-b border-[#D4AF37]/25 gap-2 sm:gap-6 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setAccountTab('profile')}
              className={`pb-3.5 px-1 sm:px-2 text-xs sm:text-sm font-semibold tracking-wider uppercase transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                accountTab === 'profile'
                  ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]'
                  : 'text-gray-400 hover:text-white border-b-2 border-transparent'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Profile Details</span>
            </button>

            <button
              onClick={() => {
                setAccountTab('orders');
              }}
              className={`pb-3.5 px-1 sm:px-2 text-xs sm:text-sm font-semibold tracking-wider uppercase transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                accountTab === 'orders'
                  ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]'
                  : 'text-gray-400 hover:text-white border-b-2 border-transparent'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Orders</span>
            </button>
          </div>

          {/* ================= TAB 1: PROFILE DETAILS ================= */}
          {accountTab === 'profile' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Personal Information */}
                <div className="bg-[#121212] border border-[#D4AF37]/25 rounded-2xl p-5 sm:p-6 space-y-5">
                  <div className="flex justify-between items-center border-b border-gray-800 pb-3">
                    <h3 className="text-base font-serif font-bold text-white flex items-center gap-2">
                      <User className="w-4 h-4 text-[#D4AF37]" /> Personal Information
                    </h3>
                    {!isEditingProfile ? (
                      <button
                        onClick={() => {
                          setEditProfileForm(userProfile);
                          setIsEditingProfile(true);
                        }}
                        className="text-xs text-[#D4AF37] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsEditingProfile(false)}
                        className="text-xs text-gray-400 hover:text-white cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  {!isEditingProfile ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-gray-500 uppercase tracking-wider block text-[10px]">Full Name</span>
                        <span className="text-white font-medium text-sm mt-0.5 block">{userProfile.fullName}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 uppercase tracking-wider block text-[10px]">Email Address</span>
                        <span className="text-white font-medium text-sm mt-0.5 block">{userProfile.email}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 uppercase tracking-wider block text-[10px]">Mobile Phone</span>
                        <span className="text-white font-medium text-sm mt-0.5 block">{userProfile.phone}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 uppercase tracking-wider block text-[10px]">Gender</span>
                        <span className="text-white font-medium text-sm mt-0.5 block">{userProfile.gender}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 uppercase tracking-wider block text-[10px]">Date of Birth</span>
                        <span className="text-white font-medium text-sm mt-0.5 block">{userProfile.birthday}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 uppercase tracking-wider block text-[10px] mb-1">Password Security</span>
                        <button
                          type="button"
                          onClick={() => setIsChangePasswordOpen(true)}
                          className="px-3 py-1 rounded-md border border-[#D4AF37]/50 bg-[#161616] text-[#D4AF37] hover:bg-[#D4AF37]/15 text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                        >
                          <KeyRound className="w-3 h-3" /> Change
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        setUserProfile(editProfileForm);
                        setIsEditingProfile(false);
                        setAccountNotice('Your profile information was updated successfully!');
                        setTimeout(() => setAccountNotice(null), 4000);
                      }} 
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <label className="text-gray-400 block mb-1">Full Name</label>
                          <input 
                            type="text" 
                            required 
                            value={editProfileForm.fullName}
                            onChange={(e) => setEditProfileForm({ ...editProfileForm, fullName: e.target.value })}
                            className="w-full bg-black border border-gray-700 focus:border-[#D4AF37] rounded-lg p-2.5 text-white outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-gray-400 block mb-1">Email Address</label>
                          <input 
                            type="email" 
                            required 
                            value={editProfileForm.email}
                            onChange={(e) => setEditProfileForm({ ...editProfileForm, email: e.target.value })}
                            className="w-full bg-black border border-gray-700 focus:border-[#D4AF37] rounded-lg p-2.5 text-white outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-gray-400 block mb-1">Mobile Phone</label>
                          <input 
                            type="tel" 
                            required 
                            value={editProfileForm.phone}
                            onChange={(e) => setEditProfileForm({ ...editProfileForm, phone: e.target.value })}
                            className="w-full bg-black border border-gray-700 focus:border-[#D4AF37] rounded-lg p-2.5 text-white outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-gray-400 block mb-1">Gender</label>
                          <select 
                            value={editProfileForm.gender}
                            onChange={(e) => setEditProfileForm({ ...editProfileForm, gender: e.target.value })}
                            className="w-full bg-black border border-gray-700 focus:border-[#D4AF37] rounded-lg p-2.5 text-white outline-none"
                          >
                            <option value="Female">Female</option>
                            <option value="Male">Male</option>
                            <option value="Non-Binary">Non-Binary</option>
                            <option value="Prefer not to say">Prefer not to say</option>
                          </select>
                        </div>
                      </div>

                      <div className="pt-2 flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setIsEditingProfile(false)}
                          className="px-4 py-2 border border-gray-700 text-gray-300 hover:text-white rounded-lg text-xs cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-gradient-to-r from-[#D4AF37] to-[#AA771C] text-black font-bold rounded-lg text-xs hover:brightness-110 cursor-pointer shadow-md"
                        >
                          Save Changes
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Saved Address */}
                <div className="bg-[#121212] border border-[#D4AF37]/25 rounded-2xl p-5 sm:p-6 space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-800 pb-3">
                    <h3 className="text-base font-serif font-bold text-white flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#D4AF37]" /> Saved Address
                    </h3>
                    <span className="text-xs text-[#D4AF37] font-semibold">2 Saved</span>
                  </div>

                  <div className="space-y-3">
                    {/* Primary Address */}
                    <div className="bg-[#161616] border border-[#D4AF37]/40 p-4 rounded-xl space-y-1 relative">
                      <span className="inline-block bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#D4AF37] text-[9px] font-bold px-2 py-0.5 rounded tracking-wider uppercase mb-1">
                        DEFAULT
                      </span>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white text-xs">Priya Sharma</span>
                        <span className="text-[11px] text-gray-400 font-mono">+91 98765 43210</span>
                      </div>
                      <p className="text-xs text-gray-300 pt-1 leading-relaxed">
                        Flat 402, Royal Palms Residency, MG Road, Indiranagar, Bengaluru, Karnataka - 560001
                      </p>
                    </div>

                    {/* Secondary Address */}
                    <div className="bg-[#161616] border border-gray-800 p-4 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white text-xs">Priya Sharma</span>
                        <span className="text-[11px] text-gray-400 font-mono">+91 98765 43210</span>
                      </div>
                      <p className="text-xs text-gray-400 pt-1 leading-relaxed">
                        Sarmelle Studios, 5th Floor, Fashion Tech Tower, Koramangala 4th Block, Bengaluru, Karnataka - 560034
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Shipping & Return Policy */}
              <div className="bg-[#141414] border border-[#D4AF37]/20 rounded-2xl p-5 sm:p-6">
                <h4 className="text-xs uppercase tracking-wider font-bold text-[#D4AF37] mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Shipping & Return Policy
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-3.5 rounded-xl bg-black/40 border border-gray-800 flex items-start gap-3">
                    <Truck className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-xs font-bold text-white">Flat ₹50 Shipping</h5>
                      <p className="text-[11px] text-gray-400 mt-0.5">Flat ₹50 delivery charge per order, regardless of item quantity.</p>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-black/40 border border-gray-800 flex items-start gap-3">
                    <RotateCcw className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-xs font-bold text-white">7-Day Return / Exchange</h5>
                      <p className="text-[11px] text-gray-400 mt-0.5">Submit exchange or return request within 7 days from parcel delivery.</p>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-black/40 border border-gray-800 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-xs font-bold text-white">No Damaged Items</h5>
                      <p className="text-[11px] text-gray-400 mt-0.5">Garments must have intact tags & folds. Damaged or worn items cannot be returned.</p>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-black/40 border border-gray-800 flex items-start gap-3">
                    <Package className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-xs font-bold text-white">Self-Ship Returns</h5>
                      <p className="text-[11px] text-gray-400 mt-0.5">Securely pack parcel and send via any trusted courier to our return warehouse.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: ORDERS ================= */}
          {accountTab === 'orders' && (
            <div className="space-y-6">
              {userOrders.length === 0 ? (
                <div className="bg-[#121212] border border-[#D4AF37]/20 rounded-2xl p-12 text-center space-y-4">
                  <Package className="w-12 h-12 text-gray-600 mx-auto" />
                  <h3 className="text-lg font-serif font-bold text-white">No orders placed yet</h3>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto">
                    You haven't ordered any royal ensembles yet. Discover our latest festive collections and enjoy priority delivery!
                  </p>
                  <button
                    onClick={() => setCurrentView('collection')}
                    className="bg-gradient-to-r from-[#D4AF37] to-[#AA771C] text-black font-bold text-xs px-6 py-2.5 rounded-lg transition-all hover:brightness-110 cursor-pointer shadow-md inline-flex items-center gap-2"
                  >
                    Explore Sarees & Ensembles <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  {userOrders.map((order) => {
                    const isInTransit = order.status === 'In Transit';
                    const matchingReturn = userReturns.find(r => r.orderNumber === order.orderNumber);

                    return (
                      <div 
                        key={order.id}
                        className="bg-[#121212] border border-[#D4AF37]/30 rounded-2xl overflow-hidden shadow-xl"
                      >
                        {/* Order Header: Placed Date, Total Paid, and Status GUARANTEED in a single non-wrapping line */}
                        <div className="bg-[#171717] border-b border-gray-800/80 px-3 sm:px-5 py-3 sm:py-3.5 flex flex-nowrap items-center justify-between gap-1.5 sm:gap-4 overflow-hidden w-full whitespace-nowrap">
                          {/* Field 1: Placed Date */}
                          <div className="flex items-center gap-1 shrink-0 whitespace-nowrap text-[10px] sm:text-xs text-gray-300">
                            <span className="text-gray-500 uppercase tracking-wider text-[9px] sm:text-[10px]">Placed:</span>
                            <span className="font-medium text-white">{order.date}</span>
                          </div>

                          {/* Field 2: Total Paid */}
                          <div className="flex items-center gap-1 shrink-0 whitespace-nowrap text-[10px] sm:text-xs">
                            <span className="text-gray-500 uppercase tracking-wider text-[9px] sm:text-[10px]">Paid:</span>
                            <span className="text-[#D4AF37] font-bold font-mono text-xs sm:text-sm">₹{order.totalAmount.toLocaleString('en-IN')}</span>
                          </div>

                          {/* Field 3: Status of Orders */}
                          <div className="shrink-0 whitespace-nowrap text-[10px] sm:text-xs font-semibold">
                            {matchingReturn ? (
                              <span className="text-amber-400">
                                {matchingReturn.type === 'Exchange' ? 'Exchange Initiated' : 'Return Initiated'}
                              </span>
                            ) : order.status === 'Delivered' ? (
                              <span className="text-emerald-400">
                                Delivered on {order.deliveredDate || 'Oct 2026'}
                              </span>
                            ) : order.status === 'In Transit' ? (
                              <span className="text-amber-400">
                                In Transit
                              </span>
                            ) : (
                              <span className="text-blue-400">
                                Order Confirmed & Paid
                              </span>
                            )}
                          </div>
                        </div>

                        {/* If return or exchange was initiated: Status & self-ship details strip */}
                        {matchingReturn && (
                          <div className="bg-amber-950/25 border-b border-amber-500/25 px-3 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-200">
                            <div className="flex items-center gap-2">
                              <RotateCcw className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                              <span className="font-semibold text-[#D4AF37]">{matchingReturn.type} ({matchingReturn.returnNumber}):</span>
                              <span className="text-gray-300 text-[11px]">{matchingReturn.reason}</span>
                            </div>
                            <span className="text-[10px] text-gray-400">Status: {matchingReturn.status} • Bengaluru Warehouse</span>
                          </div>
                        )}

                        {/* If in transit: Order Transit Info */}
                        {isInTransit && (
                          <div className="bg-[#0e0e0e] border-b border-gray-800/80 px-4 sm:px-6 py-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-gray-400">Carrier:</span>
                                <span className="text-white font-medium">{order.carrier}</span>
                                <span className="text-gray-600">•</span>
                                <span className="text-gray-400">Tracking:</span>
                                <span className="text-[#D4AF37] font-mono font-semibold">{order.trackingNumber}</span>
                              </div>
                              <span className="text-xs text-amber-300 font-medium flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" /> {order.estimatedDelivery}
                              </span>
                            </div>

                            {/* Tracking Milestones */}
                            <div className="grid grid-cols-4 gap-2 pt-2 text-center text-[10px]">
                              <div className="flex flex-col items-center">
                                <div className="w-6 h-6 rounded-full bg-emerald-500 text-black font-bold flex items-center justify-center mb-1">
                                  <Check className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-white font-medium">Confirmed</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <div className="w-6 h-6 rounded-full bg-emerald-500 text-black font-bold flex items-center justify-center mb-1">
                                  <Check className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-white font-medium">Quality Checked</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <div className="w-6 h-6 rounded-full bg-[#D4AF37] text-black font-bold flex items-center justify-center mb-1 animate-pulse">
                                  <Truck className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-[#D4AF37] font-bold">In Transit</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <div className="w-6 h-6 rounded-full bg-gray-800 text-gray-500 flex items-center justify-center mb-1">
                                  4
                                </div>
                                <span className="text-gray-500">Delivered</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Order Items */}
                        <div className="p-4 sm:p-6 divide-y divide-gray-800/70">
                          {order.items.map((item, itemIdx) => {
                            const isItemReturned = matchingReturn && matchingReturn.item.name === item.name;

                            return (
                              <div key={itemIdx} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${itemIdx > 0 ? 'pt-4' : ''}`}>
                                <div className="flex items-center gap-4">
                                  <img 
                                    src={item.image} 
                                    alt={item.name} 
                                    className="w-16 h-20 sm:w-20 sm:h-24 object-cover object-top rounded-xl border border-gray-800 bg-black shrink-0" 
                                  />
                                  <div>
                                    <h4 className="text-sm font-serif font-bold text-white hover:text-[#D4AF37] transition-colors">
                                      {item.name}
                                    </h4>
                                    <div className="text-xs text-gray-400 mt-1 space-x-2">
                                      <span>Size: <strong className="text-gray-200">{item.size}</strong></span>
                                      <span>•</span>
                                      <span>Color: <strong className="text-gray-200">{item.color}</strong></span>
                                      <span>•</span>
                                      <span>Qty: <strong className="text-gray-200">{item.quantity}</strong></span>
                                    </div>
                                    <div className="text-xs font-bold text-white mt-1.5 font-mono">
                                      ₹{item.price.toLocaleString('en-IN')}
                                    </div>
                                  </div>
                                </div>

                                {/* Item Return / Exchange Trigger - Centered Horizontally */}
                                <div className="flex items-center justify-center w-full sm:w-auto sm:mx-auto self-center">
                                  {isItemReturned ? (
                                    <span className="px-3.5 py-1.5 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs font-medium flex items-center justify-center gap-1.5">
                                      <RotateCcw className="w-3.5 h-3.5" />
                                      <span>{matchingReturn.type} Initiated</span>
                                    </span>
                                  ) : (
                                    order.status === 'Delivered' && order.canReturn && (
                                      <button
                                        onClick={() => {
                                          setReturnReasonSelection('');
                                          setReturnModalItem({ order, item });
                                        }}
                                        className="px-4 py-1.5 rounded-lg border border-[#D4AF37]/50 bg-[#161616] text-[#D4AF37] hover:bg-[#D4AF37]/15 text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                                      >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        <span>Initiate Return / Exchange</span>
                                      </button>
                                    )
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Order Bottom Action Bar */}
                        <div className="bg-[#141414] border-t border-gray-800 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-end gap-3 text-xs">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => {
                                const receipt = `SARMELLE OFFICIAL INVOICE\nOrder No: ${order.orderNumber}\nDate: ${order.date}\nCustomer: ${userProfile.fullName}\nTotal Amount: INR ${order.totalAmount}\nStatus: ${matchingReturn ? matchingReturn.type + ' Initiated' : order.status}\nCourier: ${order.carrier} (${order.trackingNumber})\nThank you for choosing Sarmelle.`;
                                const blob = new Blob([receipt], { type: 'text/plain' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `Invoice-${order.orderNumber}.txt`;
                                a.click();
                              }}
                              className="text-gray-300 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" /> Download Invoice
                            </button>

                            <button
                              onClick={() => {
                                const prod = SAMPLE_PRODUCTS.find(p => p.name === order.items[0]?.name) || SAMPLE_PRODUCTS[0];
                                addToCart(prod);
                                setAccountNotice(`Added ${order.items[0]?.name} back to your shopping bag!`);
                                setTimeout(() => setAccountNotice(null), 3000);
                              }}
                              className="bg-gradient-to-r from-[#D4AF37] to-[#AA771C] text-black font-bold px-3.5 py-1.5 rounded-lg text-xs hover:brightness-110 transition-all cursor-pointer shadow flex items-center gap-1"
                            >
                              <ShoppingBag className="w-3.5 h-3.5" /> Buy Again
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </main>
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
          setCheckoutStep(1);
        }}
        onExploreCollection={() => {
          setCartOpen(false);
          setCurrentView('collection');
        }}
      />

      {/* ================= 4-STEP CHECKOUT STEPPER MODAL ================= */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto select-none">
          <div className="bg-[#121212] border border-[#D4AF37]/40 max-w-3xl w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
            
            {/* Modal Top Bar */}
            <div className="p-4 sm:p-5 border-b border-[#D4AF37]/20 flex justify-between items-center bg-[#171717]">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
                <h3 className="text-white font-serif font-bold text-base sm:text-lg tracking-wide">
                  Sarmelle Secure Checkout
                </h3>
              </div>
              <button 
                onClick={() => setIsCheckoutOpen(false)} 
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                aria-label="Close checkout"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Progress Bar (Steps 1 to 4) */}
            <div className="bg-[#0D0D0D] px-4 sm:px-8 py-3.5 border-b border-gray-800">
              <div className="flex items-center justify-between max-w-lg mx-auto relative">
                {[
                  { step: 1, label: 'Delivery Address', icon: Truck },
                  { step: 2, label: 'Shipping Speed', icon: Clock },
                  { step: 3, label: 'Payment Method', icon: CreditCard },
                  { step: 4, label: 'Confirmation', icon: CheckCircle2 }
                ].map((s, idx) => {
                  const Icon = s.icon;
                  const isCompleted = checkoutStep > s.step;
                  const isActive = checkoutStep === s.step;
                  return (
                    <div key={s.step} className="flex flex-col items-center relative z-10">
                      <div 
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                          isCompleted 
                            ? 'bg-emerald-500 text-black font-bold' 
                            : isActive 
                              ? 'bg-[#D4AF37] text-black font-bold ring-4 ring-[#D4AF37]/20' 
                              : 'bg-gray-800 text-gray-500'
                        }`}
                      >
                        {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                      </div>
                      <span className={`text-[10px] mt-1 hidden sm:block ${isActive ? 'text-[#D4AF37] font-semibold' : 'text-gray-500'}`}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
                {/* Connecting track line */}
                <div className="absolute top-4 left-6 right-6 h-0.5 bg-gray-800 -z-0">
                  <div 
                    className="bg-[#D4AF37] h-full transition-all duration-300"
                    style={{ width: checkoutStep === 1 ? '0%' : checkoutStep === 2 ? '33%' : checkoutStep === 3 ? '66%' : '100%' }}
                  />
                </div>
              </div>
            </div>

            {/* Stepper Content Area */}
            <div className="p-5 sm:p-7 overflow-y-auto flex-grow space-y-6">
              
              {/* STEP 1: Delivery Address Form */}
              {checkoutStep === 1 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="border-b border-gray-800 pb-3">
                    <h4 className="text-white font-serif font-bold text-base">Step 1: Where should we deliver your festive outfits?</h4>
                    <p className="text-xs text-gray-400 mt-0.5">Please confirm your contact and shipping destination details.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Full Recipient Name *</label>
                      <input 
                        type="text" 
                        value={deliveryAddress.fullName}
                        onChange={(e) => setDeliveryAddress({ ...deliveryAddress, fullName: e.target.value })}
                        className="w-full bg-[#181818] border border-gray-700 focus:border-[#D4AF37] rounded-lg p-2.5 text-xs text-white outline-none"
                        placeholder="e.g. Pooja Sharma"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Mobile Phone (10-digits) *</label>
                      <input 
                        type="tel" 
                        value={deliveryAddress.phone}
                        onChange={(e) => setDeliveryAddress({ ...deliveryAddress, phone: e.target.value })}
                        className="w-full bg-[#181818] border border-gray-700 focus:border-[#D4AF37] rounded-lg p-2.5 text-xs text-white outline-none"
                        placeholder="9876543210"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs text-gray-400 block mb-1">Flat, House No., Building, Apartment *</label>
                      <input 
                        type="text" 
                        value={deliveryAddress.address}
                        onChange={(e) => setDeliveryAddress({ ...deliveryAddress, address: e.target.value })}
                        className="w-full bg-[#181818] border border-gray-700 focus:border-[#D4AF37] rounded-lg p-2.5 text-xs text-white outline-none"
                        placeholder="Flat 402, Royal Palms Residency"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Area, Street, Locality *</label>
                      <input 
                        type="text" 
                        value={deliveryAddress.locality}
                        onChange={(e) => setDeliveryAddress({ ...deliveryAddress, locality: e.target.value })}
                        className="w-full bg-[#181818] border border-gray-700 focus:border-[#D4AF37] rounded-lg p-2.5 text-xs text-white outline-none"
                        placeholder="MG Road, Indiranagar"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Pincode (PIN Code) *</label>
                      <input 
                        type="text" 
                        value={deliveryAddress.pincode}
                        onChange={(e) => setDeliveryAddress({ ...deliveryAddress, pincode: e.target.value })}
                        className="w-full bg-[#181818] border border-gray-700 focus:border-[#D4AF37] rounded-lg p-2.5 text-xs text-white outline-none"
                        placeholder="560001"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">City / Town</label>
                      <input 
                        type="text" 
                        value={deliveryAddress.city}
                        onChange={(e) => setDeliveryAddress({ ...deliveryAddress, city: e.target.value })}
                        className="w-full bg-[#181818] border border-gray-700 focus:border-[#D4AF37] rounded-lg p-2.5 text-xs text-white outline-none"
                        placeholder="Bengaluru"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">State</label>
                      <input 
                        type="text" 
                        value={deliveryAddress.state}
                        onChange={(e) => setDeliveryAddress({ ...deliveryAddress, state: e.target.value })}
                        className="w-full bg-[#181818] border border-gray-700 focus:border-[#D4AF37] rounded-lg p-2.5 text-xs text-white outline-none"
                        placeholder="Karnataka"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-2">
                    <span className="text-xs text-gray-400">Address Type:</span>
                    <label className="inline-flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer">
                      <input 
                        type="radio" 
                        name="addrType" 
                        checked={deliveryAddress.addressType === 'Home'} 
                        onChange={() => setDeliveryAddress({ ...deliveryAddress, addressType: 'Home' })} 
                        className="accent-[#D4AF37]"
                      />
                      Home (All Day Delivery)
                    </label>
                    <label className="inline-flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer">
                      <input 
                        type="radio" 
                        name="addrType" 
                        checked={deliveryAddress.addressType === 'Office'} 
                        onChange={() => setDeliveryAddress({ ...deliveryAddress, addressType: 'Office' })} 
                        className="accent-[#D4AF37]"
                      />
                      Office (10 AM - 6 PM)
                    </label>
                  </div>

                  <div className="pt-4 border-t border-gray-800 flex justify-end">
                    <button 
                      onClick={() => setCheckoutStep(2)}
                      className="bg-gradient-to-r from-[#D4AF37] to-[#AA771C] text-black font-bold text-xs px-6 py-3 rounded-lg hover:brightness-110 transition-all cursor-pointer flex items-center gap-2"
                    >
                      Continue to Shipping Method <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Shipping Method & Speed */}
              {checkoutStep === 2 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="border-b border-gray-800 pb-3">
                    <h4 className="text-white font-serif font-bold text-base">Step 2: Choose Delivery Option</h4>
                    <p className="text-xs text-gray-400 mt-0.5">Select your preferred courier transit speed and packaging.</p>
                  </div>

                  <div className="space-y-3">
                    {/* Standard Shipping */}
                    <div 
                      onClick={() => setShippingMethod('standard')}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between ${
                        shippingMethod === 'standard' 
                          ? 'border-[#D4AF37] bg-[#D4AF37]/10 ring-1 ring-[#D4AF37]' 
                          : 'border-gray-800 bg-[#161616] hover:border-gray-700'
                      }`}
                    >
                      <div className="flex gap-3.5">
                        <div className="w-5 h-5 rounded-full border border-[#D4AF37] flex items-center justify-center mt-0.5">
                          {shippingMethod === 'standard' && <div className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />}
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-white flex items-center gap-2">
                            Standard Express Delivery (3-5 Days)
                            {isFreeShippingEligible && (
                              <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">
                                FREE
                              </span>
                            )}
                          </h5>
                          <p className="text-xs text-gray-400 mt-1">
                            Dispatched via BlueDart / Delhivery with end-to-end SMS tracking.
                          </p>
                          <p className="text-[11px] text-amber-300 font-medium mt-1">
                            Estimated Delivery: Within 3 business days
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-white font-mono">
                        {isFreeShippingEligible ? '₹0' : '₹99'}
                      </span>
                    </div>

                    {/* Priority Festive Delivery */}
                    <div 
                      onClick={() => setShippingMethod('express')}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between ${
                        shippingMethod === 'express' 
                          ? 'border-[#D4AF37] bg-[#D4AF37]/10 ring-1 ring-[#D4AF37]' 
                          : 'border-gray-800 bg-[#161616] hover:border-gray-700'
                      }`}
                    >
                      <div className="flex gap-3.5">
                        <div className="w-5 h-5 rounded-full border border-[#D4AF37] flex items-center justify-center mt-0.5">
                          {shippingMethod === 'express' && <div className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />}
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-white flex items-center gap-2">
                            Priority Festive Delivery (24-48 Hours)
                            <span className="text-[10px] bg-[#7A1C28] text-white px-2 py-0.5 rounded font-semibold">
                              Diwali Fast Track
                            </span>
                          </h5>
                          <p className="text-xs text-gray-400 mt-1">
                            Includes premium festive gift box and insured priority transit.
                          </p>
                          <p className="text-[11px] text-amber-300 font-medium mt-1">
                            Guaranteed delivery before Diwali celebrations!
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-white font-mono">
                        {isFreeShippingEligible ? '₹99' : '₹149'}
                      </span>
                    </div>
                  </div>

                  {/* Address Summary Card */}
                  <div className="bg-[#171717] border border-gray-800 p-3.5 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="text-gray-400">Delivering to: </span>
                      <strong className="text-white">{deliveryAddress.fullName}</strong>, {deliveryAddress.address}, {deliveryAddress.city} - {deliveryAddress.pincode}
                    </div>
                    <button onClick={() => setCheckoutStep(1)} className="text-[#D4AF37] hover:underline cursor-pointer">
                      Edit
                    </button>
                  </div>

                  <div className="pt-4 border-t border-gray-800 flex justify-between">
                    <button 
                      onClick={() => setCheckoutStep(1)}
                      className="border border-gray-700 text-gray-300 hover:text-white text-xs px-5 py-2.5 rounded-lg cursor-pointer flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <button 
                      onClick={() => setCheckoutStep(3)}
                      className="bg-gradient-to-r from-[#D4AF37] to-[#AA771C] text-black font-bold text-xs px-6 py-2.5 rounded-lg hover:brightness-110 transition-all cursor-pointer flex items-center gap-2"
                    >
                      Continue to Payment <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Payment Method */}
              {checkoutStep === 3 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="border-b border-gray-800 pb-3 flex justify-between items-center">
                    <div>
                      <h4 className="text-white font-serif font-bold text-base">Step 3: Select Payment Option</h4>
                      <p className="text-xs text-gray-400 mt-0.5">All transactions are encrypted with 256-Bit SSL protection.</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-400 text-xs bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded">
                      <Lock className="w-3.5 h-3.5" /> 100% Secure
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Payment Mode Selector Tabs */}
                    <div className="md:col-span-5 space-y-2">
                      {[
                        { id: 'upi', label: 'Instant UPI / QR Code', icon: QrCode, badge: 'Popular' },
                        { id: 'card', label: 'Credit / Debit Cards', icon: CreditCard },
                        { id: 'netbanking', label: 'Net Banking', icon: Building },
                        { id: 'cod', label: 'Cash on Delivery', icon: Truck, badge: 'Available' }
                      ].map(mode => {
                        const Icon = mode.icon;
                        const isSelected = paymentMethod === mode.id;
                        return (
                          <div 
                            key={mode.id}
                            onClick={() => setPaymentMethod(mode.id as any)}
                            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                              isSelected 
                                ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37] font-semibold ring-1 ring-[#D4AF37]' 
                                : 'border-gray-800 bg-[#161616] text-gray-300 hover:border-gray-700'
                            }`}
                          >
                            <span className="flex items-center gap-2.5 text-xs">
                              <Icon className="w-4 h-4 text-[#D4AF37]" />
                              {mode.label}
                            </span>
                            {mode.badge && (
                              <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
                                {mode.badge}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Payment Detail Form */}
                    <div className="md:col-span-7 bg-[#161616] border border-gray-800 rounded-xl p-4 sm:p-5 space-y-4">
                      {paymentMethod === 'upi' && (
                        <div className="space-y-4 text-xs">
                          <h5 className="font-semibold text-white">Select UPI Provider:</h5>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { id: 'gpay', name: 'Google Pay' },
                              { id: 'phonepe', name: 'PhonePe' },
                              { id: 'paytm', name: 'Paytm UPI' }
                            ].map(app => (
                              <button 
                                key={app.id} 
                                onClick={() => setSelectedUpiApp(app.id as any)}
                                className={`py-2 px-3 rounded-lg border text-center font-medium transition-all cursor-pointer ${
                                  selectedUpiApp === app.id 
                                    ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-white font-bold' 
                                    : 'border-gray-800 bg-black text-gray-400 hover:text-white'
                                }`}
                              >
                                {app.name}
                              </button>
                            ))}
                          </div>

                          <div>
                            <label className="text-gray-400 block mb-1">Or enter Virtual Payment Address (VPA / UPI ID):</label>
                            <input 
                              type="text" 
                              value={upiIdInput}
                              onChange={(e) => setUpiIdInput(e.target.value)}
                              placeholder="mobile@okhdfcbank" 
                              className="w-full bg-black border border-gray-700 focus:border-[#D4AF37] rounded-lg p-2.5 text-xs text-white outline-none"
                            />
                            <p className="text-[10px] text-gray-500 mt-1">Approval request will be sent to your UPI mobile app instantly.</p>
                          </div>
                        </div>
                      )}

                      {paymentMethod === 'card' && (
                        <div className="space-y-3 text-xs">
                          <div>
                            <label className="text-gray-400 block mb-1">Card Number *</label>
                            <input 
                              type="text" 
                              value={cardDetails.number}
                              onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                              placeholder="4532 •••• •••• 8821" 
                              className="w-full bg-black border border-gray-700 focus:border-[#D4AF37] rounded-lg p-2.5 text-xs text-white font-mono outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-gray-400 block mb-1">Cardholder Name *</label>
                            <input 
                              type="text" 
                              value={cardDetails.name}
                              onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                              placeholder="POOJA SHARMA" 
                              className="w-full bg-black border border-gray-700 focus:border-[#D4AF37] rounded-lg p-2.5 text-xs text-white uppercase outline-none"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-gray-400 block mb-1">Expiry Date *</label>
                              <input 
                                type="text" 
                                value={cardDetails.expiry}
                                onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                                placeholder="MM/YY" 
                                className="w-full bg-black border border-gray-700 focus:border-[#D4AF37] rounded-lg p-2.5 text-xs text-white font-mono outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-gray-400 block mb-1">CVV / CVC *</label>
                              <input 
                                type="password" 
                                value={cardDetails.cvv}
                                onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                                placeholder="•••" 
                                maxLength={4}
                                className="w-full bg-black border border-gray-700 focus:border-[#D4AF37] rounded-lg p-2.5 text-xs text-white font-mono outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {paymentMethod === 'netbanking' && (
                        <div className="space-y-3 text-xs">
                          <label className="text-gray-400 block">Select Your Bank:</label>
                          <div className="grid grid-cols-2 gap-2">
                            {['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra', 'Punjab National Bank'].map(bank => (
                              <button 
                                key={bank}
                                onClick={() => setNetBank(bank)}
                                className={`p-2.5 rounded-lg border text-left text-xs transition-colors cursor-pointer ${
                                  netBank === bank 
                                    ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-white font-semibold' 
                                    : 'border-gray-800 bg-black text-gray-400 hover:text-white'
                                }`}
                              >
                                {bank}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {paymentMethod === 'cod' && (
                        <div className="space-y-3 text-xs">
                          <div className="bg-amber-950/20 border border-amber-600/30 p-3 rounded-lg text-amber-200">
                            Cash on Delivery is available for your pincode ({deliveryAddress.pincode}). Please keep exact cash or UPI QR scan ready at the time of delivery.
                          </div>
                          <p className="text-gray-400 text-[11px]">
                            An automated order verification SMS will be sent to <strong>+91 {deliveryAddress.phone}</strong> before shipping.
                          </p>
                        </div>
                      )}

                      {/* Total Amount Pay Button */}
                      <div className="pt-3 border-t border-gray-800">
                        <div className="flex justify-between items-center mb-3 text-xs">
                          <span className="text-gray-400">Total Payable Amount:</span>
                          <span className="text-[#D4AF37] font-serif font-bold text-lg">
                            ₹{cartFinalTotal.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <button 
                          onClick={() => {
                            const genOrderId = `#SRM-${Math.floor(100000 + Math.random() * 900000)}`;
                            const paymentDesc = paymentMethod === 'upi' ? `UPI (${selectedUpiApp.toUpperCase()})` : paymentMethod === 'card' ? 'Credit/Debit Card' : paymentMethod === 'netbanking' ? netBank : 'Cash on Delivery';
                            const newOrderRecord: UserOrder = {
                              id: `ord-${Date.now()}`,
                              orderNumber: genOrderId,
                              date: 'Today, Just now',
                              totalAmount: cartFinalTotal,
                              status: 'In Transit',
                              trackingNumber: `DELHIVERY-${Math.floor(10000000 + Math.random() * 90000000)}`,
                              carrier: shippingMethod === 'express' ? 'Delhivery Festive Priority' : 'Blue Dart Express',
                              estimatedDelivery: shippingMethod === 'express' ? 'Tomorrow by 5 PM' : 'In 3 business days',
                              canReturn: false,
                              items: cart.map(c => ({
                                name: c.product.name,
                                image: c.product.image,
                                size: c.selectedSize,
                                color: c.selectedColor,
                                price: c.product.price,
                                quantity: c.quantity
                              }))
                            };
                            setUserOrders(prev => [newOrderRecord, ...prev]);
                            setIsLoggedIn(true);
                            setConfirmedOrder({
                              orderId: genOrderId,
                              itemsCount: cart.reduce((a, c) => a + c.quantity, 0),
                              totalAmount: cartFinalTotal,
                              deliveryDate: shippingMethod === 'express' ? 'within 24-48 hours' : 'in 3 to 4 business days',
                              paymentMethod: paymentDesc
                            });
                            setCheckoutStep(4);
                          }}
                          className="w-full bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#AA771C] text-black font-bold py-3.5 rounded-xl hover:brightness-110 transition-all text-xs tracking-wider uppercase shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Lock className="w-4 h-4" /> Pay ₹{cartFinalTotal.toLocaleString('en-IN')} & Confirm Order
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-start">
                    <button 
                      onClick={() => setCheckoutStep(2)}
                      className="border border-gray-700 text-gray-300 hover:text-white text-xs px-5 py-2.5 rounded-lg cursor-pointer flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back to Shipping
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: Order Confirmation & Receipt */}
              {checkoutStep === 4 && confirmedOrder && (
                <div className="py-4 text-center space-y-6 animate-in zoom-in-95 duration-300">
                  <div className="w-20 h-20 rounded-full bg-[#182618] border-2 border-emerald-500/80 flex items-center justify-center mx-auto text-emerald-400 shadow-2xl">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-semibold">Festive Celebration Confirmed</span>
                    <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white">Thank You for Your Order!</h3>
                    <p className="text-xs text-gray-300 max-w-md mx-auto">
                      Your order has been placed successfully and is being handcrafted and packed with festive care.
                    </p>
                  </div>

                  {/* Order Receipt Card */}
                  <div className="bg-[#171717] border border-[#D4AF37]/30 max-w-md mx-auto rounded-2xl p-5 text-left space-y-3.5 shadow-xl">
                    <div className="flex justify-between items-center border-b border-gray-800 pb-3">
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Order Reference</span>
                        <strong className="text-sm font-mono text-[#D4AF37]">{confirmedOrder.orderId}</strong>
                      </div>
                      <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full font-semibold">
                        Confirmed
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between text-gray-300">
                        <span>Items Ordered:</span>
                        <span className="font-semibold text-white">{confirmedOrder.itemsCount} ensembles</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Paid Via:</span>
                        <span className="font-semibold text-white">{confirmedOrder.paymentMethod}</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Estimated Arrival:</span>
                        <span className="font-semibold text-amber-300">{confirmedOrder.deliveryDate}</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Shipping Address:</span>
                        <span className="font-semibold text-white text-right max-w-[200px] truncate">
                          {deliveryAddress.address}, {deliveryAddress.city}
                        </span>
                      </div>
                      <div className="border-t border-gray-800 pt-2 flex justify-between text-sm font-bold text-white">
                        <span>Amount Paid:</span>
                        <span className="text-[#D4AF37] font-mono">₹{confirmedOrder.totalAmount.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <button 
                      onClick={() => {
                        // Empty the cart and reset to home
                        setCart([]);
                        setIsCheckoutOpen(false);
                        setCurrentView('home');
                      }}
                      className="bg-gradient-to-r from-[#D4AF37] to-[#AA771C] text-black font-bold text-xs px-8 py-3 rounded-xl hover:brightness-110 transition-all shadow-lg cursor-pointer"
                    >
                      Continue Shopping
                    </button>
                    <button 
                      onClick={() => {
                        // Trigger simulated receipt download
                        const invoiceText = `SARMELLE INVOICE\nOrder ID: ${confirmedOrder.orderId}\nTotal: INR ${confirmedOrder.totalAmount}\nCustomer: ${deliveryAddress.fullName}\nStatus: Confirmed`;
                        const blob = new Blob([invoiceText], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `Sarmelle-Invoice-${confirmedOrder.orderId}.txt`;
                        a.click();
                      }}
                      className="border border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/10 font-semibold text-xs px-6 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" /> Download Invoice
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ================= WISHLIST DRAWER ================= */}
      <WishlistDrawer
        isOpen={wishlistOpen}
        onClose={() => setWishlistOpen(false)}
        wishlist={wishlist}
        onAddToBag={addToCart}
        onRemove={toggleWishlist}
      />

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
      {activeTrackingOrder && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-[#121212] border border-[#D4AF37]/40 max-w-xl w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-[#D4AF37]/25 flex justify-between items-center bg-[#171717]">
              <div>
                <span className="text-[10px] text-[#D4AF37] uppercase tracking-wider font-semibold block">Live Logistics Gateway</span>
                <h3 className="text-lg font-serif font-bold text-white mt-0.5 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-[#D4AF37]" /> Track Order {activeTrackingOrder.orderNumber}
                </h3>
              </div>
              <button 
                onClick={() => setActiveTrackingOrder(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Courier & AWB Strip */}
            <div className="bg-[#181818] px-5 py-3.5 border-b border-gray-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-gray-400 block text-[10px]">Express Carrier:</span>
                <span className="text-white font-medium">{activeTrackingOrder.carrier}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">AWB Tracking Number:</span>
                <span className="text-[#D4AF37] font-mono font-bold">{activeTrackingOrder.trackingNumber}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Estimated Delivery:</span>
                <span className="text-amber-300 font-semibold">{activeTrackingOrder.estimatedDelivery || 'Delivered'}</span>
              </div>
            </div>

            {/* Visual Milestones Timeline */}
            <div className="p-5 sm:p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="relative pl-6 border-l-2 border-[#D4AF37] space-y-5 text-xs">
                
                <div className="relative">
                  <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#121212] flex items-center justify-center text-black">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <div>
                    <span className="text-white font-bold block">Order Placed & Verified</span>
                    <p className="text-gray-400 text-[11px] mt-0.5">Payment processed via 256-bit SSL secured gateway. Sarmelle Bengaluru Hub.</p>
                    <span className="text-gray-500 text-[10px] font-mono">29 Oct, 09:30 PM</span>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#121212] flex items-center justify-center text-black">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <div>
                    <span className="text-white font-bold block">Quality & Handloom Steaming Inspected</span>
                    <p className="text-gray-400 text-[11px] mt-0.5">Checked for pure zari threads, fabric drape perfection & luxury packaging.</p>
                    <span className="text-gray-500 text-[10px] font-mono">30 Oct, 11:15 AM</span>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-[#D4AF37] border-2 border-[#121212] flex items-center justify-center text-black animate-pulse">
                    <Truck className="w-2.5 h-2.5" />
                  </div>
                  <div>
                    <span className="text-[#D4AF37] font-bold block">Dispatched & In Transit</span>
                    <p className="text-gray-300 text-[11px] mt-0.5">Departed Bengaluru Central Sorting Facility towards destination city hub.</p>
                    <span className="text-gray-500 text-[10px] font-mono">31 Oct, 06:40 PM</span>
                  </div>
                </div>

                <div className="relative opacity-60">
                  <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-gray-800 border-2 border-[#121212]" />
                  <div>
                    <span className="text-gray-400 font-medium block">Out for Delivery to Recipient</span>
                    <p className="text-gray-500 text-[11px] mt-0.5">Courier delivery agent will contact on +91 98765 43210 with OTP.</p>
                  </div>
                </div>

              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-800 bg-[#161616] flex justify-end">
              <button
                onClick={() => setActiveTrackingOrder(null)}
                className="bg-[#D4AF37] hover:bg-[#E5C158] text-black font-semibold text-xs px-6 py-2 rounded-lg cursor-pointer"
              >
                Close Tracking
              </button>
            </div>
          </div>
        </div>
      )}

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
      {returnModalItem && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200 select-none">
          <div className="bg-[#121212] border border-[#D4AF37]/40 max-w-lg w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-[#D4AF37]/25 flex justify-between items-center bg-[#171717]">
              <div>
                <span className="text-[10px] text-[#D4AF37] uppercase tracking-wider font-semibold block">Sarmelle 7-Day Guarantee</span>
                <h3 className="text-lg font-serif font-bold text-white mt-0.5 flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-[#D4AF37]" /> Initiate Return or Exchange
                </h3>
              </div>
              <button 
                onClick={() => setReturnModalItem(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!returnReasonSelection.trim()) return;
                const newRetNum = `RET-2026-${Math.floor(1000 + Math.random() * 9000)}`;
                const newReturnRecord: UserReturn = {
                  id: `ret-${Date.now()}`,
                  returnNumber: newRetNum,
                  orderNumber: returnModalItem.order.orderNumber,
                  date: 'Today, Just now',
                  status: 'Initiated Return',
                  type: returnTypeSelection,
                  reason: returnReasonSelection,
                  refundAmount: returnModalItem.item.price,
                  refundNote: returnTypeSelection === 'Exchange' 
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
              className="p-5 sm:p-6 space-y-5 text-xs overflow-y-auto max-h-[75vh]"
            >
              {/* Item Info Box */}
              <div className="bg-[#181818] border border-gray-800 p-3.5 rounded-xl flex items-center gap-3.5">
                <img 
                  src={returnModalItem.item.image} 
                  alt={returnModalItem.item.name} 
                  className="w-14 h-18 object-cover object-top rounded-lg border border-gray-700 bg-black shrink-0" 
                />
                <div>
                  <h4 className="font-serif font-bold text-white text-sm">{returnModalItem.item.name}</h4>
                  <p className="text-gray-400 mt-0.5">Size: {returnModalItem.item.size} • Color: {returnModalItem.item.color}</p>
                  <p className="text-[#D4AF37] font-bold font-mono mt-1">₹{returnModalItem.item.price.toLocaleString('en-IN')}</p>
                </div>
              </div>

              {/* Action Type: Exchange vs Refund */}
              <div className="space-y-2">
                <label className="text-gray-300 font-semibold block uppercase tracking-wider text-[11px]">Select What You Prefer:</label>
                <div className="grid grid-cols-2 gap-3">
                  <div 
                    onClick={() => setReturnTypeSelection('Exchange')}
                    className={`p-3 rounded-xl border transition-all cursor-pointer text-center ${
                      returnTypeSelection === 'Exchange' 
                        ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37] font-bold ring-1 ring-[#D4AF37]' 
                        : 'border-gray-800 bg-[#161616] text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <span>Size / Color Exchange</span>
                    <span className="block text-[10px] font-normal text-gray-400 mt-0.5">Replacement reserved at warehouse</span>
                  </div>

                  <div 
                    onClick={() => setReturnTypeSelection('Return')}
                    className={`p-3 rounded-xl border transition-all cursor-pointer text-center ${
                      returnTypeSelection === 'Return' 
                        ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37] font-bold ring-1 ring-[#D4AF37]' 
                        : 'border-gray-800 bg-[#161616] text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <span>Return for 100% Refund</span>
                    <span className="block text-[10px] font-normal text-gray-400 mt-0.5">Credited to source account</span>
                  </div>
                </div>
              </div>

              {/* Compulsory Reason Selector */}
              <div className="space-y-1.5">
                <label className="text-gray-300 font-semibold block uppercase tracking-wider text-[11px] flex items-center justify-between">
                  <span>Reason for Return / Exchange <span className="text-[#D4AF37]">*</span></span>
                  <span className="text-[10px] text-amber-400 font-normal">Compulsory</span>
                </label>
                <select
                  value={returnReasonSelection}
                  onChange={(e) => setReturnReasonSelection(e.target.value)}
                  required
                  className="w-full bg-black border border-gray-700 focus:border-[#D4AF37] rounded-lg p-2.5 text-white outline-none text-xs"
                >
                  <option value="">-- Please select a reason (Compulsory) --</option>
                  <option value="Need a different size (Blouse / Kurti fit)">Need a different size (Blouse / Kurti fit)</option>
                  <option value="Color tone mismatch with celebration lighting">Color tone mismatch with celebration lighting</option>
                  <option value="Fabric feel or draping preference">Fabric feel or draping preference</option>
                  <option value="Defect or handloom weave imperfection">Defect or handloom weave imperfection</option>
                  <option value="Changed mind / Ordered by mistake">Changed mind / Ordered by mistake</option>
                </select>
                {!returnReasonSelection.trim() && (
                  <p className="text-[10px] text-gray-500">Selecting a reason is required to submit your return request.</p>
                )}
              </div>

              {/* Return Warehouse Address (Self-Ship) */}
              <div className="bg-[#161616] border border-gray-800 p-3 rounded-xl text-xs space-y-1">
                <span className="text-[#D4AF37] font-semibold flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Return Warehouse Address (Self-Ship):
                </span>
                <p className="text-gray-300 leading-relaxed">
                  Sarmelle Returns Hub, Warehouse 4B, MG Road Industrial Estate, Bengaluru, Karnataka - 560001
                </p>
                <span className="text-gray-500 text-[10px]">Please pack securely with original tags intact and send via any trusted courier.</span>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex justify-end gap-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setReturnModalItem(null)}
                  className="px-4 py-2 border border-gray-700 text-gray-300 hover:text-white rounded-lg text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!returnReasonSelection.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-[#D4AF37] to-[#AA771C] text-black font-bold rounded-lg text-xs hover:brightness-110 transition-all cursor-pointer shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100"
                >
                  Submit Return Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-[#080808] border-t border-[#D4AF37]/30 text-gray-400 text-sm py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
          <div className="space-y-4">
            <div className="cursor-pointer" onClick={() => setCurrentView('home')}>
              <h4 className="text-xl sm:text-2xl font-serif font-bold tracking-wider bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#AA771C] bg-clip-text text-transparent">
                Sarmelle
              </h4>
              <p className="text-[8px] sm:text-[9px] tracking-[0.25em] text-[#C5A059] uppercase font-light">
                Wear Your Grace
              </p>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Timeless tradition meets modern elegance. Curated sarees, kurtis, and festive collections for every graceful woman.
            </p>
          </div>

          <div>
            <h4 className="text-white font-serif font-semibold text-sm mb-4 tracking-wider uppercase">Shop</h4>
            <ul className="space-y-2.5 text-xs">
              <li><button onClick={() => { setSelectedCategory('Sarees'); setCurrentView('collection'); }} className="hover:text-[#D4AF37] transition-colors">Sarees</button></li>
              <li><button onClick={() => { setSelectedCategory('Kurtis'); setCurrentView('collection'); }} className="hover:text-[#D4AF37] transition-colors">Kurtis</button></li>
              <li><button onClick={() => { setSelectedCategory('Lehengas'); setCurrentView('collection'); }} className="hover:text-[#D4AF37] transition-colors">Lehengas</button></li>
              <li><button onClick={() => { setSelectedCategory('Dupattas'); setCurrentView('collection'); }} className="hover:text-[#D4AF37] transition-colors">Dupattas</button></li>
              <li><button onClick={() => { setSelectedOfferType('New Festive Collection'); setCurrentView('collection'); }} className="hover:text-[#D4AF37] transition-colors">New Arrivals</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-serif font-semibold text-sm mb-4 tracking-wider uppercase">Customer Care</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button 
                  onClick={() => {
                    setIsLoggedIn(true);
                    setAccountTab('orders');
                    setCurrentView('account');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }} 
                  className="hover:text-[#D4AF37] transition-colors cursor-pointer text-left"
                >
                  Track Order
                </button>
              </li>
              <li>
                <button 
                  onClick={() => {
                    setIsLoggedIn(true);
                    setAccountTab('returns');
                    setCurrentView('account');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }} 
                  className="hover:text-[#D4AF37] transition-colors cursor-pointer text-left"
                >
                  Returns & Refunds
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setIsSizeChartModalOpen(true)} 
                  className="hover:text-[#D4AF37] transition-colors cursor-pointer text-left"
                >
                  Size Guide
                </button>
              </li>
              <li><a href="#" className="hover:text-[#D4AF37] transition-colors">Shipping Policy</a></li>
              <li><a href="#" className="hover:text-[#D4AF37] transition-colors">Contact Us</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-serif font-semibold text-sm mb-4 tracking-wider uppercase">Get in Touch</h4>
            <ul className="space-y-2.5 text-xs">
              <li>support@sarmelle.com</li>
              <li>+91 98765 43210</li>
              <li>123 Style Street, Fashion Nagar, Bengaluru, Karnataka 560001</li>
            </ul>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-gray-900 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500">
          <p>© 2026 Sarmelle. All rights reserved.</p>
          <p className="mt-2 sm:mt-0 flex items-center gap-1.5">
            Designed with <Heart className="w-3.5 h-3.5 text-red-500 fill-current inline" /> for every graceful woman.
          </p>
        </div>
      </footer>

    </div>
  );
}
