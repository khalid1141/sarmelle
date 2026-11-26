import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export function ForgotPasswordView() {
  const { forgotPassword, resetPassword, setAuthScreen, pendingEmail } = useAuth();
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState(pendingEmail || '');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await forgotPassword(email);
    setLoading(false);
    setMessage(res.message || 'If this account exists, a code has been sent.');
    setStep('reset');
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 12) {
      setError('New password must be at least 12 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setLoading(true);
    const res = await resetPassword(email, code, newPassword);
    setLoading(false);

    if (!res.ok) {
      setError(res.error || 'Failed to reset password');
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8 border border-amber-200/40">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-lg bg-stone-900 text-amber-400 flex items-center justify-center mx-auto mb-3 shadow-md">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.778-7.778zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-stone-900">Reset Password</h1>
          <p className="text-xs text-stone-500 mt-1">
            {step === 'email' ? 'Enter your admin email to receive a recovery code.' : 'Enter the code sent to your email and your new password.'}
          </p>
        </div>

        {message && (
          <div className="mb-6 p-3 bg-amber-50 border border-amber-200 text-amber-900 text-sm rounded-md" role="alert">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-md" role="alert">
            {error}
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleEmailSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
                Admin Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="owner@example.com"
                className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-stone-900"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-stone-900 hover:bg-stone-800 text-white font-medium rounded-lg shadow-sm transition-colors focus:outline-hidden focus:ring-2 focus:ring-stone-900 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Recovery Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                6-Digit Recovery Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                required
                placeholder="123456"
                className="w-full px-3 py-2 text-center text-xl font-mono tracking-widest bg-stone-50 border border-stone-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-stone-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                New Password (min 12 characters)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={12}
                  className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-stone-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-xs font-medium text-stone-500 hover:text-stone-900"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-stone-900"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-stone-900 hover:bg-stone-800 text-white font-medium rounded-lg shadow-sm transition-colors focus:outline-hidden focus:ring-2 focus:ring-stone-900 disabled:opacity-50 mt-2"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setAuthScreen('login')}
            className="text-xs text-stone-600 hover:text-stone-900 font-medium hover:underline"
          >
            Back to sign in
          </button>
        </div>
      </div>
    </div>
  );
}
