import React, { useState } from 'react';
import { downloadInvoicePdf } from '../../utils/invoice';
import { 
  User, Package, CheckCircle2, X, Edit3, KeyRound, MapPin, 
  ShieldCheck, Truck, RotateCcw, AlertCircle, ArrowRight, 
  Clock, Check, Download, ShoppingBag 
} from 'lucide-react';
import type { Product } from '../../types/product';
import type { UserOrder, UserOrderItem, UserReturn } from '../../types/order';
export interface UserProfile {
  fullName: string;
  email: string;
  phone: string;
  gender: string;
  birthday: string;
  memberSince: string;
}

interface AccountViewProps {
  productsList?: Product[];
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  accountNotice: string | null;
  setAccountNotice: (notice: string | null) => void;
  accountTab: 'profile' | 'orders' | 'returns';
  setAccountTab: (tab: 'profile' | 'orders' | 'returns') => void;
  userOrders: UserOrder[];
  userReturns: UserReturn[];
  addToCart: (product: Product, size?: string, color?: string) => void;
  onNavHome: () => void;
  onNavCollection: () => void;
  onOpenChangePassword: () => void;
  onInitiateReturn: (order: UserOrder, item: UserOrderItem) => void;
}

export default function AccountView({
  userProfile,
  setUserProfile,
  accountNotice,
  setAccountNotice,
  accountTab,
  setAccountTab,
  productsList = [],
  userOrders,
  userReturns,
  addToCart,
  onNavHome,
  onNavCollection,
  onOpenChangePassword,
  onInitiateReturn,
}: AccountViewProps) {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState<UserProfile>(userProfile);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <button 
            onClick={onNavHome} 
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
                      onClick={onOpenChangePassword}
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
                onClick={onNavCollection}
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
                                      onInitiateReturn(order, item);
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
                          onClick={() => downloadInvoicePdf(order, { fullName: userProfile.fullName, email: userProfile.email })}
                          className="text-gray-300 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" /> Download Invoice
                        </button>

                        <button
                          onClick={() => {
                            const prod = productsList.find(p => p.name === order.items[0]?.name) || productsList[0];
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
  );
}
