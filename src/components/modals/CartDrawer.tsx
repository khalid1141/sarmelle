import React from 'react';
import { ShoppingBag, X, Truck, Minus, Plus, Trash2, Tag, Check, Lock } from 'lucide-react';
import type { Product } from '../../types/product';

interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
}

interface AppliedCoupon {
  code: string;
  discountPercent: number;
  discountAmount?: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  updateQuantity: (index: number, delta: number) => void;
  removeItem: (index: number) => void;
  couponInput: string;
  onCouponInputChange: (value: string) => void;
  appliedCoupon: AppliedCoupon | null;
  couponError: string;
  onApplyCoupon: (overrideCode?: string) => void;
  onRemoveCoupon: () => void;
  subtotal: number;
  isFreeShippingEligible: boolean;
  finalTotal: number;
  onStartCheckout: () => void;
  onExploreCollection: () => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  updateQuantity,
  removeItem,
  couponInput,
  onCouponInputChange,
  appliedCoupon,
  couponError,
  onApplyCoupon,
  onRemoveCoupon,
  subtotal,
  isFreeShippingEligible,
  finalTotal,
  onStartCheckout,
  onExploreCollection
}: CartDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex justify-end select-none">
      <div className="w-full max-w-md bg-[#121212] border-l border-[#D4AF37]/30 h-full flex flex-col p-5 sm:p-6 shadow-2xl animate-in slide-in-from-right">
        {/* Drawer Header */}
        <div className="flex justify-between items-center border-b border-[#D4AF37]/20 pb-4">
          <h3 className="text-white font-serif font-bold text-lg flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#D4AF37]" /> Your Shopping Bag ({cart.reduce((a, c) => a + c.quantity, 0)})
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Close cart"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Free Shipping Progress Indicator */}
        {cart.length > 0 && (
          <div className="bg-[#181818] border border-[#D4AF37]/25 rounded-xl p-3 my-3">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="flex items-center gap-1.5 text-gray-300 font-medium">
                <Truck className="w-4 h-4 text-[#D4AF37]" />
                {isFreeShippingEligible ? (
                  <span className="text-[#D4AF37] font-semibold">Festive Free Express Shipping unlocked!</span>
                ) : (
                  <span>Add <strong className="text-white">₹{(1999 - subtotal).toLocaleString('en-IN')}</strong> for FREE Express Shipping</span>
                )}
              </span>
              <span className="text-[10px] text-gray-400 font-mono">
                {Math.min(100, Math.round((subtotal / 1999) * 100))}%
              </span>
            </div>
            <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#AA771C] via-[#D4AF37] to-[#F3E5AB] h-full transition-all duration-500 rounded-full"
                style={{ width: `${Math.min(100, Math.round((subtotal / 1999) * 100))}%` }}
              />
            </div>
          </div>
        )}

        {/* Items List */}
        <div className="flex-grow overflow-y-auto py-2 space-y-3.5 pr-1">
          {cart.length === 0 ? (
            <div className="text-center py-20 space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#1A1A1A] border border-[#D4AF37]/30 flex items-center justify-center mx-auto text-[#D4AF37]">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-white font-serif font-bold text-base">Your Bag is Empty</h4>
                <p className="text-gray-400 text-xs mt-1">Explore our Diwali collection and add your favorite ensembles.</p>
              </div>
              <button
                onClick={onExploreCollection}
                className="bg-gradient-to-r from-[#D4AF37] to-[#AA771C] text-black font-semibold text-xs px-6 py-2.5 rounded-lg transition-all shadow-md cursor-pointer hover:brightness-110"
              >
                Explore Festive Collection
              </button>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div key={idx} className="bg-[#171717] border border-[#D4AF37]/25 p-3.5 rounded-xl flex gap-3.5 items-center shadow-md">
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-16 h-20 sm:w-18 sm:h-22 object-cover rounded-lg border border-gray-800 flex-shrink-0"
                />
                <div className="flex-grow min-w-0 space-y-1">
                  <h4 className="text-white font-medium text-xs sm:text-sm truncate">{item.product.name}</h4>
                  <div className="flex items-center gap-2 text-[11px] text-gray-400">
                    <span className="bg-black/60 px-2 py-0.5 rounded border border-gray-800">Size: {item.selectedSize}</span>
                    <span className="bg-black/60 px-2 py-0.5 rounded border border-gray-800">{item.selectedColor}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs sm:text-sm font-bold text-amber-300">
                      ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                    </span>

                    {/* Quantity Counter Buttons */}
                    <div className="flex items-center border border-gray-700 bg-black rounded-lg overflow-hidden">
                      <button
                        onClick={() => updateQuantity(idx, -1)}
                        className="p-1 sm:p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
                        title="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2.5 text-xs text-white font-semibold font-mono">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(idx, 1)}
                        className="p-1 sm:p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
                        title="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeItem(idx)}
                  className="text-gray-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-950/30 transition-colors cursor-pointer self-start"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Bottom Actions & Price Breakdown */}
        {cart.length > 0 && (
          <div className="border-t border-[#D4AF37]/25 pt-4 space-y-3.5">
            {/* Coupon Code Section */}
            <div className="space-y-1.5">
              <div className="flex gap-2">
                <div className="relative flex-grow">
                  <Tag className="w-3.5 h-3.5 text-[#D4AF37] absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponInput}
                    onChange={(e) => onCouponInputChange(e.target.value.toUpperCase())}
                    onKeyDown={(e) => { if (e.key === 'Enter') onApplyCoupon(); }}
                    className="w-full bg-black border border-gray-800 focus:border-[#D4AF37] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 uppercase tracking-wider outline-none"
                  />
                </div>
                <button
                  onClick={() => onApplyCoupon()}
                  className="bg-[#241216] border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black font-semibold text-xs px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  Apply
                </button>
              </div>

              {couponError && (
                <p className="text-[11px] text-rose-400">{couponError}</p>
              )}

              {appliedCoupon && (
                <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-xs text-emerald-400">
                  <span className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    Code <strong>{appliedCoupon.code}</strong> applied ({appliedCoupon.discountPercent ? `${appliedCoupon.discountPercent}% OFF` : `₹${appliedCoupon.discountAmount} OFF`})
                  </span>
                  <button onClick={onRemoveCoupon} className="text-gray-400 hover:text-rose-400 underline text-[11px] cursor-pointer">
                    Remove
                  </button>
                </div>
              )}

              {/* Quick-apply pills */}
              {!appliedCoupon && (
                <div className="flex items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] text-gray-500">Suggested:</span>
                  <button
                    onClick={() => onApplyCoupon('DIWALI30')}
                    className="text-[10px] bg-[#1A1A1A] hover:bg-[#252525] border border-[#D4AF37]/30 text-[#D4AF37] px-2 py-0.5 rounded cursor-pointer transition-colors"
                  >
                    DIWALI30 (30% OFF)
                  </button>
                  <button
                    onClick={() => onApplyCoupon('WELCOME10')}
                    className="text-[10px] bg-[#1A1A1A] hover:bg-[#252525] border border-gray-700 text-gray-300 px-2 py-0.5 rounded cursor-pointer transition-colors"
                  >
                    WELCOME10
                  </button>
                </div>
              )}
            </div>

            {/* Compact Total (Detailed breakdown is shown in the checkout modal) */}
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#161616] border border-[#D4AF37]/20 rounded-xl">
              <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">Total:</span>
              <span className="text-[#D4AF37] font-serif font-bold text-sm sm:text-base">₹{finalTotal.toLocaleString('en-IN')}</span>
            </div>

            {/* Checkout Trigger */}
            <button
              onClick={onStartCheckout}
              className="w-full bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#AA771C] text-black font-bold py-3.5 rounded-xl hover:brightness-110 transition-all text-xs tracking-widest uppercase shadow-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4 text-black" /> Proceed to Secure Checkout &rarr;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
