import React from 'react';
import { Truck, X, Check } from 'lucide-react';
import type { UserOrder } from '../../types/order';

interface OrderTrackingModalProps {
  order: UserOrder | null;
  onClose: () => void;
}

export default function OrderTrackingModal({
  order,
  onClose
}: OrderTrackingModalProps) {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-[#121212] border border-[#D4AF37]/40 max-w-xl w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#D4AF37]/25 flex justify-between items-center bg-[#171717]">
          <div>
            <span className="text-[10px] text-[#D4AF37] uppercase tracking-wider font-semibold block">Live Logistics Gateway</span>
            <h3 className="text-lg font-serif font-bold text-white mt-0.5 flex items-center gap-2">
              <Truck className="w-5 h-5 text-[#D4AF37]" /> Track Order {order.orderNumber}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Courier & AWB Strip */}
        <div className="bg-[#181818] px-5 py-3.5 border-b border-gray-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-gray-400 block text-[10px]">Express Carrier:</span>
            <span className="text-white font-medium">{order.carrier}</span>
          </div>
          <div>
            <span className="text-gray-400 block text-[10px]">AWB Tracking Number:</span>
            <span className="text-[#D4AF37] font-mono font-bold">{order.trackingNumber}</span>
          </div>
          <div>
            <span className="text-gray-400 block text-[10px]">Estimated Delivery:</span>
            <span className="text-amber-300 font-semibold">{order.estimatedDelivery || 'Delivered'}</span>
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
            onClick={onClose}
            className="bg-[#D4AF37] hover:bg-[#E5C158] text-black font-semibold text-xs px-6 py-2 rounded-lg cursor-pointer"
          >
            Close Tracking
          </button>
        </div>
      </div>
    </div>
  );
}
