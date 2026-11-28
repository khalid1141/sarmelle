import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export function OtpView() {
  const { verifyOtp, resendOtp, pendingEmail, setAuthScreen } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (code.length !== 6) {
      setError('Please enter a valid 6-digit verification code');
      return;
    }

    setLoading(true);
    const result = await verifyOtp(code);
    setLoading(false);

    if (!result.ok) {
      setError(result.error || 'Invalid verification code');
    }
  };

  const handleResend = async () => {
    setError(null);
    setMessage(null);
    setResending(true);
    const result = await resendOtp();
    setResending(false);

    if (result.ok) {
      setMessage(result.message || 'New code sent. (Mock code: 123456)');
    } else {
      setError(result.error || 'Failed to resend code');
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8 border border-amber-200/40">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-lg bg-amber-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-stone-900">Two-Factor Authentication</h1>
          <p className="text-xs text-stone-500 mt-2 leading-relaxed">
            We sent a 6-digit code to <span className="font-semibold text-stone-700">{pendingEmail || 'your email'}</span>. It is valid for 10 minutes.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-md" role="alert">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-md" role="alert">
            {message}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-2 text-center">
              Enter 6-Digit Code
            </label>
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              required
              placeholder="123456"
              className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest bg-stone-50 border border-stone-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-stone-900 focus:bg-white transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full py-3 px-4 bg-stone-900 hover:bg-stone-800 text-white font-medium rounded-lg shadow-sm transition-colors focus:outline-hidden focus:ring-2 focus:ring-stone-900 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between text-xs text-stone-500">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="text-amber-800 hover:text-amber-950 font-medium hover:underline disabled:opacity-50"
          >
            {resending ? 'Resending...' : 'Resend code'}
          </button>
          <button
            type="button"
            onClick={() => setAuthScreen('login')}
            className="text-stone-600 hover:text-stone-900 hover:underline"
          >
            Back to sign in
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-stone-100 text-center">
          <p className="text-xs text-stone-400">Mock OTP Code: <span className="font-mono text-stone-600 font-bold">123456</span></p>
        </div>
      </div>
    </div>
  );
}
