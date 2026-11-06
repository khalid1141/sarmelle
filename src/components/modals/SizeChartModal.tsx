import React from 'react';
import { X, Sparkles } from 'lucide-react';

interface SizeChartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SizeChartModal({ isOpen, onClose }: SizeChartModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-[#121212] border border-[#D4AF37]/40 max-w-xl w-full max-h-[88vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header with Title and X Icon */}
        <div className="p-5 sm:p-6 border-b border-[#D4AF37]/25 flex justify-between items-center bg-[#171717]">
          <div>
            <span className="text-[11px] text-[#D4AF37] font-semibold uppercase tracking-wider block">Fit & Measurements</span>
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-white mt-0.5">Size & Measurement Chart</h3>
            <p className="text-xs text-gray-400 mt-1">Standard Indian ethnic garment measurements in inches</p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            title="Close size chart"
            aria-label="Close size chart"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Measurement Tables and Information */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-grow">
          {/* Saree Note */}
          <div className="bg-[#1A1A1A] border border-[#D4AF37]/30 p-4 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
              <Sparkles className="w-4 h-4" /> Saree Dimension Guarantee
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              All Sarmelle sarees are <strong>Free Size</strong>. Length: <strong>5.5 Meters</strong> (approx 6 yards). Includes an attached <strong>0.8 Meter unstitched matching blouse piece</strong> that can be tailored to any bust measurement from 32 to 46 inches.
            </p>
          </div>

          {/* Kurti & Ethnic Garment Table */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-2.5">Kurtis, Anarkalis & Festive Sets (Inches)</h4>
            <div className="overflow-x-auto rounded-lg border border-gray-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#1A1A1A] text-[#D4AF37] uppercase font-semibold text-[11px] border-b border-gray-800">
                  <tr>
                    <th className="py-2.5 px-3">Size</th>
                    <th className="py-2.5 px-3">Bust (in)</th>
                    <th className="py-2.5 px-3">Waist (in)</th>
                    <th className="py-2.5 px-3">Hip (in)</th>
                    <th className="py-2.5 px-3">Length (in)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 text-gray-300">
                  <tr className="hover:bg-white/[0.02]">
                    <td className="py-2 px-3 font-semibold text-white">XS (34)</td>
                    <td className="py-2 px-3">34"</td>
                    <td className="py-2 px-3">28"</td>
                    <td className="py-2 px-3">38"</td>
                    <td className="py-2 px-3">44"</td>
                  </tr>
                  <tr className="hover:bg-white/[0.02]">
                    <td className="py-2 px-3 font-semibold text-white">S (36)</td>
                    <td className="py-2 px-3">36"</td>
                    <td className="py-2 px-3">30"</td>
                    <td className="py-2 px-3">40"</td>
                    <td className="py-2 px-3">45"</td>
                  </tr>
                  <tr className="hover:bg-white/[0.02]">
                    <td className="py-2 px-3 font-semibold text-white">M (38)</td>
                    <td className="py-2 px-3">38"</td>
                    <td className="py-2 px-3">32"</td>
                    <td className="py-2 px-3">42"</td>
                    <td className="py-2 px-3">45"</td>
                  </tr>
                  <tr className="hover:bg-white/[0.02]">
                    <td className="py-2 px-3 font-semibold text-white">L (40)</td>
                    <td className="py-2 px-3">40"</td>
                    <td className="py-2 px-3">34"</td>
                    <td className="py-2 px-3">44"</td>
                    <td className="py-2 px-3">46"</td>
                  </tr>
                  <tr className="hover:bg-white/[0.02]">
                    <td className="py-2 px-3 font-semibold text-white">XL (42)</td>
                    <td className="py-2 px-3">42"</td>
                    <td className="py-2 px-3">36"</td>
                    <td className="py-2 px-3">46"</td>
                    <td className="py-2 px-3">46"</td>
                  </tr>
                  <tr className="hover:bg-white/[0.02]">
                    <td className="py-2 px-3 font-semibold text-white">XXL (44)</td>
                    <td className="py-2 px-3">44"</td>
                    <td className="py-2 px-3">38"</td>
                    <td className="py-2 px-3">48"</td>
                    <td className="py-2 px-3">47"</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* How to Measure */}
          <div className="space-y-2 border-t border-gray-800/80 pt-4">
            <h5 className="text-xs font-semibold text-[#D4AF37] uppercase tracking-wider">How to Measure:</h5>
            <ul className="text-xs text-gray-400 space-y-1.5 list-disc list-inside">
              <li><strong>Bust:</strong> Measure around the fullest part of your chest keeping the tape parallel to the floor.</li>
              <li><strong>Waist:</strong> Measure around your natural waistline, keeping tape comfortably loose.</li>
              <li><strong>Hips:</strong> Stand with feet together and measure around fullest point of your hips.</li>
            </ul>
          </div>
        </div>

        {/* Modal Bottom Close Button */}
        <div className="p-4 border-t border-[#D4AF37]/20 bg-[#171717] flex justify-end">
          <button 
            onClick={onClose}
            className="bg-[#D4AF37] hover:bg-[#E5C158] text-black font-semibold text-xs px-6 py-2.5 rounded-lg transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
