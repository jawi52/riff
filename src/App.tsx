import { useEffect, useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { LandingPage } from './components/landing/LandingPage';
import { AuthPage } from './components/auth/AuthPage';
import { useAuthStore } from './stores/useAuthStore';

export function App() {
  const { isAuthenticated, authView, checkSession } = useAuthStore();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // 1. Initial 30-Day Session Validation
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // 2. Track PWA Install Prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  // 3. Routing Gate:
  // If user is authenticated & session is active (<30 days), render full player AppShell
  if (isAuthenticated && authView === 'app') {
    return <AppShell />;
  }

  // If user requested Login or Register page
  if (authView === 'login' || authView === 'register') {
    return <AuthPage initialMode={authView} />;
  }

  // Default for unauthenticated users: High-Conversion Landing Page
  return <LandingPage deferredPrompt={deferredPrompt} />;
}

export default App;
