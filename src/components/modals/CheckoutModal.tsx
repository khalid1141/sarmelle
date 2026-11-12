import React, { useLayoutEffect, useState } from 'react';
import {
  ShieldCheck, X, Truck, Clock, CreditCard, CheckCircle2, Check,
  ArrowRight, Lock, ArrowLeft, QrCode, Download
} from 'lucide-react';
import type { CartItem } from '../../types/cart';
import type { UserOrder } from '../../types/order';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  cartFinalTotal: number;
  isFreeShippingEligible: boolean;
  onOrderPlaced: (order: UserOrder) => void;
  onContinueShopping: () => void;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  cart,
  cartFinalTotal,
  isFreeShippingEligible,
  onOrderPlaced,
  onContinueShopping
}: CheckoutModalProps) {
  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3 | 4>(1);
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');

  const [deliveryAddress, setDeliveryAddress] = useState({
    fullName: 'Pooja Sharma',
    phone: '9876543210',
    pincode: '560001',
    address: 'Flat 402, Royal Palms Residency',
    locality: 'MG Road, Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka'
  });

  const [selectedUpiApp, setSelectedUpiApp] = useState<'gpay' | 'phonepe' | 'paytm' | 'custom'>('gpay');
  const [upiIdInput, setUpiIdInput] = useState('pooja@okhdfcbank');
  const [confirmedOrder, setConfirmedOrder] = useState<{
    orderId: string;
    itemsCount: number;
    totalAmount: number;
    deliveryDate: string;
    paymentMethod: string;
  } | null>(null);

  // Opening checkout always starts at step 1, matching the previous App-level reset.
  useLayoutEffect(() => {
    if (isOpen) setCheckoutStep(1);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
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
            onClick={onClose}
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
                {/* Payment Mode Selector Tabs (UPI only) */}
                <div className="md:col-span-5 space-y-2">
                  <div className="p-3.5 rounded-xl border border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37] font-semibold ring-1 ring-[#D4AF37] flex items-center justify-between">
                    <span className="flex items-center gap-2.5 text-xs">
                      <QrCode className="w-4 h-4 text-[#D4AF37]" />
                      Instant UPI / QR Code
                    </span>
                    <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
                      Popular
                    </span>
                  </div>
                </div>

                {/* Payment Detail Form */}
                <div className="md:col-span-7 bg-[#161616] border border-gray-800 rounded-xl p-4 sm:p-5 space-y-4">
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
                        const paymentDesc = `UPI (${selectedUpiApp.toUpperCase()})`;
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
                        onOrderPlaced(newOrderRecord);
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
                  onClick={onContinueShopping}
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
  );
}
