import { useState, useEffect } from 'react';
import { LandingPage } from './components/landing/LandingPage';
import { AuthPage } from './components/auth/AuthPage';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { useAuthStore } from './stores/useAuthStore';

export function App() {
  const [view, setView] = useState<'landing' | 'auth' | 'dashboard'>('landing');
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const { checkSession, initSupabaseAuthListener } = useAuthStore();

  useEffect(() => {
    // 1. Detect if running as standalone installed PWA (Desktop/Mobile)
    const isRunningStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://') ||
      new URLSearchParams(window.location.search).get('source') === 'pwa';

    setIsStandalone(isRunningStandalone);

    // 2. Initialize Supabase Auth listener if configured
    initSupabaseAuthListener();

    // 3. Evaluate 30-day inactivity session
    const initApp = async () => {
      const isAuth = await checkSession();

      if (isRunningStandalone) {
        // Installed app flow:
        // If active session within 30 days -> main dashboard
        // If no session or expired (>30 days) -> sign up / login page
        if (isAuth) {
          setView('dashboard');
        } else {
          setView('auth');
        }
      } else {
        // Web browser flow:
        // If active session within 30 days -> main dashboard
        // If no session or expired (>30 days) -> landing page
        if (isAuth) {
          setView('dashboard');
        } else {
          setView('landing');
        }
      }
    };

    initApp();

    // 4. Capture PWA installation prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, [checkSession, initSupabaseAuthListener]);

  const handleContinueOnline = async () => {
    // If user is already authenticated within 30 days, proceed directly to dashboard
    // Otherwise, transition to Sign Up / Log In
    const isAuth = await checkSession();
    if (isAuth) {
      setView('dashboard');
    } else {
      setView('auth');
    }
  };

  return (
    <ErrorBoundary>
      {view === 'landing' && (
        <LandingPage
          onContinueOnline={handleContinueOnline}
          deferredPrompt={deferredPrompt}
        />
      )}

      {view === 'auth' && (
        <AuthPage
          initialMode="register"
          isStandaloneApp={isStandalone}
          onBackToLanding={() => setView('landing')}
          onAuthSuccess={() => setView('dashboard')}
        />
      )}

      {view === 'dashboard' && (
        <DashboardPage
          isStandaloneApp={isStandalone}
          onLogout={() => {
            if (isStandalone) {
              setView('auth');
            } else {
              setView('landing');
            }
          }}
        />
      )}
    </ErrorBoundary>
  );
}

export default App;
