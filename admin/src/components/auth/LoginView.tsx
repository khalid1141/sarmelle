import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export function LoginView() {
  const { login, setAuthScreen, notice } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 12) {
      setError('Password must be at least 12 characters');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (!result.ok) {
      setError(result.error || 'Email or password is incorrect');
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8 border border-amber-200/40">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-lg bg-stone-900 text-amber-400 font-bold text-xl flex items-center justify-center mx-auto mb-3 shadow-md">
            S
          </div>
          <h1 className="text-2xl font-bold text-stone-900">Store Admin Portal</h1>
          <p className="text-xs text-stone-500 mt-1 uppercase tracking-wider">Secure Pilot Environment</p>
        </div>

        {notice && (
          <div className="mb-6 p-3 bg-amber-50 border border-amber-200 text-amber-900 text-sm rounded-md" role="alert">
            {notice}
          </div>
        )}

        {error && (
          <div className="mb-6 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-md" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
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
              className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-stone-900 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-600">
                Password
              </label>
              <button
                type="button"
                onClick={() => setAuthScreen('forgot')}
                className="text-xs font-medium text-amber-800 hover:text-amber-950 hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={12}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-stone-900 focus:bg-white transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-xs font-medium text-stone-500 hover:text-stone-900"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-stone-900 hover:bg-stone-800 text-white font-medium rounded-lg shadow-sm transition-colors focus:outline-hidden focus:ring-2 focus:ring-stone-900 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-stone-100 text-center">
          <p className="text-xs text-stone-500">
            {import.meta.env.VITE_USE_MOCK === 'true' && (<>Mock credentials: <span className="font-mono text-stone-700">owner@example.com</span> / <span className="font-mono text-stone-700">MockPassword123!</span></>)}
          </p>
        </div>
      </div>
    </div>
  );
}
