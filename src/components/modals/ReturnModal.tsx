import React, { useEffect, useState } from 'react';
import { RotateCcw, X, MapPin } from 'lucide-react';
import type { UserOrder, UserOrderItem } from '../../types/order';

interface ReturnModalProps {
  returnItem: { order: UserOrder; item: UserOrderItem } | null;
  onClose: () => void;
  onSubmit: (type: 'Exchange' | 'Return', reason: string) => void;
}

export default function ReturnModal({
  returnItem,
  onClose,
  onSubmit
}: ReturnModalProps) {
  const [returnTypeSelection, setReturnTypeSelection] = useState<'Exchange' | 'Return'>('Exchange');
  const [returnReasonSelection, setReturnReasonSelection] = useState('');

  useEffect(() => {
    if (returnItem) setReturnReasonSelection('');
  }, [returnItem]);

  if (!returnItem) return null;

  return (
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
            onClick={onClose}
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
            onSubmit(returnTypeSelection, returnReasonSelection);
          }}
          className="p-5 sm:p-6 space-y-5 text-xs overflow-y-auto max-h-[75vh]"
        >
          {/* Item Info Box */}
          <div className="bg-[#181818] border border-gray-800 p-3.5 rounded-xl flex items-center gap-3.5">
            <img
              src={returnItem.item.image}
              alt={returnItem.item.name}
              className="w-14 h-18 object-cover object-top rounded-lg border border-gray-700 bg-black shrink-0"
            />
            <div>
              <h4 className="font-serif font-bold text-white text-sm">{returnItem.item.name}</h4>
              <p className="text-gray-400 mt-0.5">Size: {returnItem.item.size} • Color: {returnItem.item.color}</p>
              <p className="text-[#D4AF37] font-bold font-mono mt-1">₹{returnItem.item.price.toLocaleString('en-IN')}</p>
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
              onClick={onClose}
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
  );
}
