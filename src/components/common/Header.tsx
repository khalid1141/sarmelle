import React from 'react';
import { Sparkles, Search, Menu, User, LogOut, Heart, ShoppingBag } from 'lucide-react';

interface HeaderProps {
  currentView: 'home' | 'collection' | 'product' | 'admin' | 'account';
  selectedCategory: string;
  selectedOfferType: string;
  isLoggedIn: boolean;
  userName: string;
  wishlistCount: number;
  cartCount: number;
  onOpenMobileMenu: () => void;
  onShopNow: () => void;
  onOpenSearchCollection: () => void;
  onNavHome: () => void;
  onNavCategory: (category: string) => void;
  onNavNewArrivals: () => void;
  onNavFestive: () => void;
  onNavOffers: () => void;
  onContactFooter: () => void;
  onAccount: () => void;
  onLogout: () => void;
  onLogin: () => void;
  onOpenWishlist: () => void;
  onOpenCart: () => void;
}

export default function Header({
  currentView,
  selectedCategory,
  selectedOfferType,
  isLoggedIn,
  userName,
  wishlistCount,
  cartCount,
  onOpenMobileMenu,
  onShopNow,
  onOpenSearchCollection,
  onNavHome,
  onNavCategory,
  onNavNewArrivals,
  onNavFestive,
  onNavOffers,
  onContactFooter,
  onAccount,
  onLogout,
  onLogin,
  onOpenWishlist,
  onOpenCart
}: HeaderProps) {
  return (
    <>
      {/* Festive Announcement Bar */}
      <div className="bg-gradient-to-r from-[#5C2D91] via-[#7A1C28] to-[#D4AF37] text-white text-xs sm:text-sm font-medium py-2 px-4 text-center tracking-wide flex items-center justify-center gap-2 shadow-inner">
        <Sparkles className="w-4 h-4 text-amber-200 animate-pulse flex-shrink-0" />
        <span className="truncate">Diwali Special Sale | Upto 40% OFF on New Festive Collection</span>
        <button
          onClick={onShopNow}
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
              onClick={onOpenMobileMenu}
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
              onClick={onOpenSearchCollection}
            />
            <Search className="w-4 h-4 text-[#D4AF37] absolute left-3.5 top-2.5 pointer-events-none" />
          </div>

          {/* Center: Brand Typography Logo with Lady Silhouette & "Wear Your Grace" tagline (Matching image_86320f0b.png) */}
          <div
            className="cursor-pointer flex flex-col items-center justify-center select-none flex-shrink-0"
            onClick={onNavHome}
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
              onClick={onOpenSearchCollection}
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
                  onClick={onAccount}
                  className={`flex items-center gap-1.5 text-xs font-medium py-1 px-2.5 rounded-lg border transition-all cursor-pointer ${
                    currentView === 'account'
                      ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]'
                      : 'border-transparent text-[#E5D5C5] hover:text-[#D4AF37] hover:border-[#D4AF37]/40'
                  }`}
                  title="My Account Dashboard"
                >
                  <User className="w-4 h-4 text-[#D4AF37]" />
                  <span className="max-w-[130px] truncate">{userName}</span>
                </button>
                <button
                  onClick={onLogout}
                  className="text-gray-400 hover:text-red-400 p-1 transition-colors cursor-pointer"
                  title="Logout"
                  aria-label="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="text-[#E5D5C5] hover:text-[#D4AF37] transition-colors hidden sm:flex items-center gap-2 text-xs font-medium py-1 cursor-pointer"
                title="Login / Register"
              >
                <User className="w-4 h-4 text-[#D4AF37]" />
                <span>Login / Register</span>
              </button>
            )}

            {/* Wishlist */}
            <button
              onClick={onOpenWishlist}
              className="relative text-[#E5D5C5] hover:text-[#D4AF37] transition-colors flex items-center gap-2 py-1 cursor-pointer"
              title="Wishlist"
              aria-label="Wishlist"
            >
              <Heart className="w-4 h-4 text-[#D4AF37]" />
              <span className="hidden sm:inline text-xs font-medium">Wishlist</span>
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#D4AF37] text-black font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Cart with Counter Badge */}
            <button
              onClick={onOpenCart}
              className="relative text-[#E5D5C5] hover:text-[#D4AF37] transition-colors p-1 cursor-pointer"
              title="Cart"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5 text-[#D4AF37]" />
              <span className="absolute -top-1.5 -right-1.5 bg-[#D4AF37] text-black font-bold text-[10px] w-4.5 h-4.5 rounded-full flex items-center justify-center shadow">
                {cartCount}
              </span>
            </button>
          </div>
        </div>

        {/* Desktop Secondary Sub-Navbar with Persistent Active Category State */}
        <div className="hidden lg:block border-t border-[#D4AF37]/20 bg-[#0B0B0B]/95 py-2.5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center gap-7 text-xs font-medium tracking-wide">
            <button
              onClick={onNavHome}
              className={`transition-all pb-1 border-b-2 cursor-pointer ${
                currentView === 'home'
                  ? 'text-[#D4AF37] font-semibold border-[#D4AF37]'
                  : 'text-[#E5D5C5] hover:text-[#D4AF37] border-transparent'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => onNavCategory('Sarees')}
              className={`transition-all pb-1 border-b-2 cursor-pointer ${
                currentView === 'collection' && selectedCategory === 'Sarees'
                  ? 'text-[#D4AF37] font-semibold border-[#D4AF37]'
                  : 'text-[#E5D5C5] hover:text-[#D4AF37] border-transparent'
              }`}
            >
              Sarees
            </button>
            <button
              onClick={() => onNavCategory('Kurtis')}
              className={`transition-all pb-1 border-b-2 cursor-pointer ${
                currentView === 'collection' && selectedCategory === 'Kurtis' && selectedOfferType === 'All'
                  ? 'text-[#D4AF37] font-semibold border-[#D4AF37]'
                  : 'text-[#E5D5C5] hover:text-[#D4AF37] border-transparent'
              }`}
            >
              Kurtis
            </button>
            <button
              onClick={() => onNavCategory('Lehengas')}
              className={`transition-all pb-1 border-b-2 cursor-pointer ${
                currentView === 'collection' && selectedCategory === 'Lehengas'
                  ? 'text-[#D4AF37] font-semibold border-[#D4AF37]'
                  : 'text-[#E5D5C5] hover:text-[#D4AF37] border-transparent'
              }`}
            >
              Lehengas
            </button>
            <button
              onClick={() => onNavCategory('Dupattas')}
              className={`transition-all pb-1 border-b-2 cursor-pointer ${
                currentView === 'collection' && selectedCategory === 'Dupattas'
                  ? 'text-[#D4AF37] font-semibold border-[#D4AF37]'
                  : 'text-[#E5D5C5] hover:text-[#D4AF37] border-transparent'
              }`}
            >
              Dupattas
            </button>
            <button
              onClick={() => onNavCategory('Sets')}
              className={`transition-all pb-1 border-b-2 cursor-pointer ${
                currentView === 'collection' && selectedCategory === 'Sets'
                  ? 'text-[#D4AF37] font-semibold border-[#D4AF37]'
                  : 'text-[#E5D5C5] hover:text-[#D4AF37] border-transparent'
              }`}
            >
              Sets
            </button>
            <button
              onClick={onNavNewArrivals}
              className={`transition-all pb-1 border-b-2 cursor-pointer ${
                currentView === 'collection' && selectedOfferType === 'New Festive Collection'
                  ? 'text-[#D4AF37] font-semibold border-[#D4AF37]'
                  : 'text-[#E5D5C5] hover:text-[#D4AF37] border-transparent'
              }`}
            >
              New Arrivals
            </button>
            <button
              onClick={onNavFestive}
              className={`transition-all pb-1 border-b-2 flex items-center gap-1 cursor-pointer ${
                currentView === 'collection' && selectedOfferType === 'Diwali Sale'
                  ? 'text-[#D4AF37] font-semibold border-[#D4AF37]'
                  : 'text-[#D4AF37]/90 hover:text-[#D4AF37] border-transparent font-medium'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Festive Collection
            </button>
            <button
              onClick={onNavOffers}
              className={`transition-all pb-1 border-b-2 cursor-pointer ${
                currentView === 'collection' && selectedOfferType === 'Offers'
                  ? 'text-[#D4AF37] font-semibold border-[#D4AF37]'
                  : 'text-[#E5D5C5] hover:text-[#D4AF37] border-transparent'
              }`}
            >
              Offers
            </button>
            <button
              onClick={onContactFooter}
              className="transition-colors hover:text-[#D4AF37] text-[#E5D5C5] pb-1 border-b-2 border-transparent cursor-pointer"
            >
              Contact
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
