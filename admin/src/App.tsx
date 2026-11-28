/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginView } from './components/auth/LoginView';
import { OtpView } from './components/auth/OtpView';
import { ForgotPasswordView } from './components/auth/ForgotPasswordView';
import { LayoutShell } from './components/layout/LayoutShell';

function AppContent() {
  const { admin, isLoading, authScreen } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.hash || '#/inventory');

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(window.location.hash || '#/inventory');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center text-amber-200">
        Loading admin session...
      </div>
    );
  }

  if (!admin) {
    if (authScreen === 'otp') return <OtpView />;
    if (authScreen === 'forgot' || authScreen === 'reset') return <ForgotPasswordView />;
    return <LoginView />;
  }

  return <LayoutShell currentPath={currentPath} />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
