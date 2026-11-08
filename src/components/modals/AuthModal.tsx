import React, { useState } from 'react';
import { X, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: () => void;
}

export default function AuthModal({
  isOpen,
  onClose,
  onAuthenticated
}: AuthModalProps) {
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#141414] border border-[#D4AF37]/40 max-w-md w-full p-6 sm:p-8 rounded-2xl relative space-y-6 shadow-2xl animate-in fade-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Logo & Title */}
        <div className="text-center space-y-1.5 pt-2">
          <span className="text-2xl font-serif font-bold tracking-wider bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#AA771C] bg-clip-text text-transparent">
            Sarmelle
          </span>
          <h3 className="text-lg font-serif font-bold text-white">
            {authMode === 'login' && 'Welcome Back'}
            {authMode === 'register' && 'Create an Account'}
            {authMode === 'forgot' && 'Reset Password'}
          </h3>
          <p className="text-xs text-gray-400">
            {authMode === 'login' && 'Sign in to access your festive orders, saved wishlist, and member privileges.'}
            {authMode === 'register' && 'Join the royal circle for early festival drops and celebratory discounts.'}
            {authMode === 'forgot' && 'Enter your registered email address and we will dispatch a secure reset link.'}
          </p>
        </div>

        {/* Auth Mode Tabs (Shown on login and register) */}
        {authMode !== 'forgot' && (
          <div className="flex border-b border-gray-800">
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-2 text-xs font-semibold tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'border-[#D4AF37] text-[#D4AF37]'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('register')}
              className={`flex-1 py-2 text-xs font-semibold tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
                authMode === 'register'
                  ? 'border-[#D4AF37] text-[#D4AF37]'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              Register
            </button>
          </div>
        )}

        {/* Form Fields: Login */}
        {authMode === 'login' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onAuthenticated();
            }}
            className="space-y-4"
          >
            <div>
              <label className="text-[11px] uppercase tracking-wider text-gray-400 block mb-1">Email Address</label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                className="w-full bg-black border border-[#D4AF37]/35 rounded-lg p-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] transition-colors"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] uppercase tracking-wider text-gray-400">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotPasswordSent(false);
                    setAuthMode('forgot');
                  }}
                  className="text-[10px] text-[#D4AF37] hover:underline cursor-pointer"
                >
                  Forgot?
                </button>
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                className="w-full bg-black border border-[#D4AF37]/35 rounded-lg p-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] transition-colors"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#D4AF37] to-[#AA771C] text-black font-bold py-3 rounded-lg text-xs uppercase tracking-widest hover:brightness-110 transition-all cursor-pointer shadow-lg mt-2"
            >
              Sign In
            </button>
            <div className="text-center pt-1">
              <span className="text-xs text-gray-400">New to Sarmelle? </span>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className="text-xs text-[#D4AF37] font-semibold hover:underline cursor-pointer"
              >
                Create an account
              </button>
            </div>
          </form>
        )}

        {/* Form Fields: Register */}
        {authMode === 'register' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onAuthenticated();
            }}
            className="space-y-3.5"
          >
            <div>
              <label className="text-[11px] uppercase tracking-wider text-gray-400 block mb-1">Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Priya Sharma"
                className="w-full bg-black border border-[#D4AF37]/35 rounded-lg p-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] transition-colors"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-gray-400 block mb-1">Email Address</label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                className="w-full bg-black border border-[#D4AF37]/35 rounded-lg p-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] transition-colors"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-gray-400 block mb-1">Mobile Number</label>
              <input
                type="tel"
                required
                placeholder="+91 98765 43210"
                className="w-full bg-black border border-[#D4AF37]/35 rounded-lg p-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] transition-colors"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-gray-400 block mb-1">Create Password</label>
              <input
                type="password"
                required
                placeholder="At least 6 characters"
                className="w-full bg-black border border-[#D4AF37]/35 rounded-lg p-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] transition-colors"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#D4AF37] to-[#AA771C] text-black font-bold py-3 rounded-lg text-xs uppercase tracking-widest hover:brightness-110 transition-all cursor-pointer shadow-lg mt-2"
            >
              Create Account
            </button>
            <div className="text-center pt-1">
              <span className="text-xs text-gray-400">Already registered? </span>
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className="text-xs text-[#D4AF37] font-semibold hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {/* Form Fields: Forgot Password */}
        {authMode === 'forgot' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-1">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setForgotPasswordSent(false);
                }}
                className="text-gray-400 hover:text-[#D4AF37] transition-colors p-1 cursor-pointer flex items-center gap-1.5 text-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </button>
            </div>

            {forgotPasswordSent ? (
              <div className="bg-emerald-950/60 border border-emerald-500/40 p-5 rounded-xl text-center space-y-3 animate-in fade-in">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-semibold text-white">Reset Link Dispatched</h4>
                <p className="text-xs text-gray-300 leading-relaxed">
                  We have sent password reset instructions to <strong className="text-white">{forgotPasswordEmail || 'your email'}</strong>. Please check your inbox and follow the secure link.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setForgotPasswordSent(false);
                  }}
                  className="mt-2 w-full bg-[#D4AF37] hover:bg-[#E5C158] text-black font-bold text-xs py-2.5 rounded-lg transition-all cursor-pointer shadow"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setForgotPasswordSent(true);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-gray-400 block mb-1">Registered Email Address</label>
                  <input
                    type="email"
                    required
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-black border border-[#D4AF37]/35 rounded-lg p-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#D4AF37] to-[#AA771C] text-black font-bold py-3 rounded-lg text-xs uppercase tracking-widest hover:brightness-110 transition-all cursor-pointer shadow-lg mt-2"
                >
                  Send Reset Instructions
                </button>
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setForgotPasswordSent(false);
                    }}
                    className="text-xs text-[#D4AF37] font-semibold hover:underline cursor-pointer"
                  >
                    Cancel and Return to Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
