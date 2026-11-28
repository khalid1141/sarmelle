import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Admin } from '../types';
import { apiClient } from '../api/apiClient';
import { formatLockoutMessage } from '../utils/formatters';

interface AuthContextType {
  admin: Admin | null;
  isLoading: boolean;
  authScreen: 'login' | 'otp' | 'forgot' | 'reset';
  setAuthScreen: (screen: 'login' | 'otp' | 'forgot' | 'reset') => void;
  notice: string | null;
  setNotice: (notice: string | null) => void;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  verifyOtp: (code: string) => Promise<{ ok: boolean; error?: string }>;
  resendOtp: () => Promise<{ ok: boolean; message?: string; error?: string }>;
  forgotPassword: (email: string) => Promise<{ ok: boolean; message?: string }>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  pendingEmail: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authScreen, setAuthScreen] = useState<'login' | 'otp' | 'forgot' | 'reset'>('login');
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string>('');

  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<{ admin: Admin }>('/api/admin/auth/me');
      if (res.ok) {
        setAdmin(res.data.admin);
      } else {
        if (res.error.code === 'session_expired' || res.error.code === 'unauthenticated') {
          setAdmin(null);
          setNotice('Your session expired, please sign in again');
        }
      }
    } catch {
      setAdmin(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string) => {
    setNotice(null);
    const res = await apiClient.post('/api/admin/auth/login', { email, password });
    if (res.ok) {
      setAdmin(res.data.admin);
      return { ok: true };
    } else {
      if (res.error.code === 'otp_required') {
        setPendingEmail(email);
        setAuthScreen('otp');
        return { ok: true };
      }
      const formattedErr = formatLockoutMessage(res.error);
      return { ok: false, error: formattedErr };
    }
  };

  const verifyOtp = async (code: string) => {
    setNotice(null);
    const res = await apiClient.post('/api/admin/auth/otp/verify', { code });
    if (res.ok) {
      setAdmin(res.data.admin);
      setAuthScreen('login');
      return { ok: true };
    } else {
      const formattedErr = formatLockoutMessage(res.error);
      if (res.error.code === 'otp_locked') {
        setAuthScreen('login');
      }
      return { ok: false, error: formattedErr };
    }
  };

  const resendOtp = async () => {
    const res = await apiClient.post('/api/admin/auth/otp/resend', {});
    if (res.ok) {
      return { ok: true, message: 'New code sent to your email.' };
    }
    const formattedErr = formatLockoutMessage(res.error);
    return { ok: false, error: formattedErr };
  };

  const forgotPassword = async (email: string) => {
    const res = await apiClient.post('/api/admin/auth/forgot-password', { email });
    setAuthScreen('reset');
    setPendingEmail(email);
    return { ok: true, message: res.ok ? res.data.message : 'If this account exists, a code has been sent.' };
  };

  const resetPassword = async (email: string, code: string, newPassword: string) => {
    const res = await apiClient.post('/api/admin/auth/reset-password', { email, code, new_password: newPassword });
    if (res.ok) {
      setAuthScreen('login');
      setNotice('Password reset successfully. Please sign in with your new password.');
      return { ok: true };
    }
    const formattedErr = formatLockoutMessage(res.error);
    return { ok: false, error: formattedErr };
  };

  const logout = async () => {
    await apiClient.post('/api/admin/auth/logout', {});
    setAdmin(null);
    setAuthScreen('login');
    setNotice('You have been signed out.');
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        isLoading,
        authScreen,
        setAuthScreen,
        notice,
        setNotice,
        login,
        verifyOtp,
        resendOtp,
        forgotPassword,
        resetPassword,
        logout,
        pendingEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
