import React from 'react';
import { Heart } from 'lucide-react';

interface FooterProps {
  onHome: () => void;
  onShopCategory: (category: string) => void;
  onNewArrivals: () => void;
  onTrackOrder: () => void;
  onReturns: () => void;
  onSizeGuide: () => void;
}

export default function Footer({
  onHome,
  onShopCategory,
  onNewArrivals,
  onTrackOrder,
  onReturns,
  onSizeGuide
}: FooterProps) {
  return (
    <footer className="bg-[#080808] border-t border-[#D4AF37]/30 text-gray-400 text-sm py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

        <div className="space-y-4">
          <div className="cursor-pointer" onClick={onHome}>
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
            <li><button onClick={() => onShopCategory('Sarees')} className="hover:text-[#D4AF37] transition-colors">Sarees</button></li>
            <li><button onClick={() => onShopCategory('Kurtis')} className="hover:text-[#D4AF37] transition-colors">Kurtis</button></li>
            <li><button onClick={() => onShopCategory('Lehengas')} className="hover:text-[#D4AF37] transition-colors">Lehengas</button></li>
            <li><button onClick={() => onShopCategory('Dupattas')} className="hover:text-[#D4AF37] transition-colors">Dupattas</button></li>
            <li><button onClick={onNewArrivals} className="hover:text-[#D4AF37] transition-colors">New Arrivals</button></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-serif font-semibold text-sm mb-4 tracking-wider uppercase">Customer Care</h4>
          <ul className="space-y-2.5 text-xs">
            <li>
              <button
                onClick={onTrackOrder}
                className="hover:text-[#D4AF37] transition-colors cursor-pointer text-left"
              >
                Track Order
              </button>
            </li>
            <li>
              <button
                onClick={onReturns}
                className="hover:text-[#D4AF37] transition-colors cursor-pointer text-left"
              >
                Returns & Refunds
              </button>
            </li>
            <li>
              <button
                onClick={onSizeGuide}
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
  );
}
