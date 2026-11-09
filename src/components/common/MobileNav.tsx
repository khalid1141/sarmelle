import React from 'react';
import { X, Sparkles, User, Package, LogOut, LogIn } from 'lucide-react';

interface MobileNavProps {
  isOpen: boolean;
  isLoggedIn: boolean;
  onClose: () => void;
  onNavHome: () => void;
  onNavCategory: (category: string) => void;
  onNavFestive: () => void;
  onNavDiwaliSale: () => void;
  onAccountTab: (tab: 'profile' | 'orders') => void;
  onLogout: () => void;
  onLogin: () => void;
}

export default function MobileNav({
  isOpen,
  isLoggedIn,
  onClose,
  onNavHome,
  onNavCategory,
  onNavFestive,
  onNavDiwaliSale,
  onAccountTab,
  onLogout,
  onLogin
}: MobileNavProps) {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-start lg:hidden cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-4/5 max-w-xs bg-[#121212] border-r border-[#D4AF37]/30 h-full flex flex-col p-6 shadow-2xl overflow-y-auto animate-in slide-in-from-left cursor-default"
      >
        <div className="flex justify-between items-center border-b border-[#D4AF37]/20 pb-4 mb-4">
          <div className="cursor-pointer" onClick={() => { onNavHome(); onClose(); }}>
            <span className="font-serif font-bold text-[#F3E5AB] text-xl tracking-wider">Sarmelle</span>
            <p className="text-[8px] tracking-[0.2em] text-[#C5A059] uppercase font-light">Wear Your Grace</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 cursor-pointer">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Categories */}
        <div className="flex flex-col space-y-1 text-sm font-medium">
          <button
            onClick={() => { onNavHome(); onClose(); }}
            className="text-left text-white hover:text-[#D4AF37] py-2 border-b border-gray-800/80 transition-colors cursor-pointer"
          >
            Home
          </button>
          <button
            onClick={() => { onNavCategory('Sarees'); onClose(); }}
            className="text-left text-white hover:text-[#D4AF37] py-2 border-b border-gray-800/80 transition-colors cursor-pointer"
          >
            Sarees
          </button>
          <button
            onClick={() => { onNavCategory('Kurtis'); onClose(); }}
            className="text-left text-white hover:text-[#D4AF37] py-2 border-b border-gray-800/80 transition-colors cursor-pointer"
          >
            Kurtis
          </button>
          <button
            onClick={() => { onNavCategory('Lehengas'); onClose(); }}
            className="text-left text-white hover:text-[#D4AF37] py-2 border-b border-gray-800/80 transition-colors cursor-pointer"
          >
            Lehengas
          </button>
          <button
            onClick={() => { onNavCategory('Dupattas'); onClose(); }}
            className="text-left text-white hover:text-[#D4AF37] py-2 border-b border-gray-800/80 transition-colors cursor-pointer"
          >
            Dupattas
          </button>
          <button
            onClick={() => { onNavFestive(); onClose(); }}
            className="text-left text-[#D4AF37] font-semibold py-2 border-b border-gray-800/80 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4" /> Festive Collection
          </button>
          <button
            onClick={() => { onNavDiwaliSale(); onClose(); }}
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
            onClick={() => { onAccountTab('profile'); onClose(); }}
            className="flex items-center gap-2.5 text-left text-gray-200 hover:text-[#D4AF37] py-2 px-1 text-xs transition-colors cursor-pointer"
          >
            <User className="w-4 h-4 text-[#D4AF37] shrink-0" />
            <span>Profile</span>
          </button>

          <button
            onClick={() => { onAccountTab('orders'); onClose(); }}
            className="flex items-center gap-2.5 text-left text-gray-200 hover:text-[#D4AF37] py-2 px-1 text-xs transition-colors cursor-pointer"
          >
            <Package className="w-4 h-4 text-[#D4AF37] shrink-0" />
            <span>Orders</span>
          </button>

          {/* Dynamic Auth Button based on login state */}
          <div className="pt-3">
            {isLoggedIn ? (
              <button
                onClick={() => { onLogout(); onClose(); }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border border-red-500/40 bg-red-950/30 text-red-400 hover:bg-red-900/40 text-xs font-semibold transition-all cursor-pointer shadow"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            ) : (
              <button
                onClick={() => { onLogin(); onClose(); }}
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
  );
}
