import React, { useState } from 'react';
import { RiffLogo } from '../common/RiffLogo';
import { useAuthStore } from '../../stores/useAuthStore';
import { 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
  ShieldCheck 
} from 'lucide-react';

interface AuthPageProps {
  initialMode?: 'login' | 'register';
  onBackToLanding?: () => void;
  onAuthSuccess?: () => void;
  isStandaloneApp?: boolean;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'login',
  onBackToLanding,
  onAuthSuccess,
  isStandaloneApp = false,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember30Days, setRemember30Days] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);

  const { 
    login, 
    register, 
    loginWithGoogle, 
    isLoading, 
    authError, 
    authSuccessMessage, 
    clearError, 
    isConfigured 
  } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!email.trim() || !password) {
      setLocalError('Please enter your email and password.');
      return;
    }

    if (mode === 'register') {
      if (password.length < 6) {
        setLocalError('Password must be at least 6 characters.');
        return;
      }

      const success = await register(email, password, name);
      if (success && onAuthSuccess) {
        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
          onAuthSuccess();
        }
      }
    } else {
      const success = await login(email, password);
      if (success && onAuthSuccess) {
        onAuthSuccess();
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setLocalError(null);
    clearError();
    await loginWithGoogle();
  };

  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    setLocalError(null);
    clearError();
  };

  const activeError = localError || authError;

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col justify-between selection:bg-[#1ed760] selection:text-black">
      {/* 1. Header with Riff Logo & Back Link */}
      <header className="px-6 py-6 sm:px-12 flex items-center justify-between border-b border-white/5 bg-[#121212]">
        <div className="flex items-center gap-2">
          <RiffLogo size="md" />
        </div>

        {!isStandaloneApp && onBackToLanding && (
          <button
            onClick={onBackToLanding}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#727272] hover:border-white text-xs font-bold text-white transition hover:scale-105 active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </button>
        )}
      </header>

      {/* 2. Authentic Spotify Centered Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-[450px] bg-[#121212] sm:bg-[#181818] sm:border sm:border-white/10 sm:rounded-2xl p-6 sm:p-10 shadow-2xl">
          {/* Headline */}
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-8 text-center">
            {mode === 'login' ? 'To continue, log in to Riff.' : 'Sign up to start listening.'}
          </h1>

          {/* Setup Warning if Supabase is Not Set */}
          {!isConfigured && (
            <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-200">
              <p className="font-bold flex items-center gap-1.5 mb-1 text-amber-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Supabase Configuration Required</span>
              </p>
              <p className="text-[#b3b3b3] text-[11px] leading-relaxed">
                Add <code className="text-white bg-black/40 px-1 py-0.5 rounded">VITE_SUPABASE_URL</code> and <code className="text-white bg-black/40 px-1 py-0.5 rounded">VITE_SUPABASE_ANON_KEY</code> to your Cloudflare/Vercel or .env settings to enable real authentication.
              </p>
            </div>
          )}

          {/* Social Provider Buttons */}
          <div className="space-y-3 mb-6">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full h-12 rounded-full border border-[#727272] hover:border-white bg-transparent hover:bg-white/5 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-3 transition hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-50"
            >
              {/* Google G Multi-color SVG */}
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          {/* Divider Line */}
          <div className="border-t border-[#292929] my-6" />

          {/* Success Notification */}
          {authSuccessMessage && (
            <div className="mb-6 p-4 rounded-lg bg-[#1ed760]/10 border border-[#1ed760]/30 flex items-start gap-2.5 text-xs text-[#1ed760] animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-[#1ed760] shrink-0 mt-0.5" />
              <span>{authSuccessMessage}</span>
            </div>
          )}

          {/* Error Notification */}
          {activeError && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{activeError}</span>
            </div>
          )}

          {/* Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field (Sign Up Only) */}
            {mode === 'register' && (
              <div>
                <label className="spotify-label">What should we call you?</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter a profile name"
                  className="spotify-input"
                />
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="spotify-label">
                {mode === 'login' ? 'Email or username' : "What's your email?"}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                required
                className="spotify-input"
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="spotify-label">
                {mode === 'login' ? 'Password' : 'Create a password'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="spotify-input pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#727272] hover:text-white transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 30-Day Auto-Renewal Session Checkbox */}
            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer text-xs text-[#b3b3b3] hover:text-white select-none">
                <input
                  type="checkbox"
                  checked={remember30Days}
                  onChange={(e) => setRemember30Days(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#1ed760] cursor-pointer"
                />
                <span className="flex items-center gap-1.5 font-medium text-white">
                  <span>Remember me for 30 days</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-[#1ed760]" />
                </span>
              </label>
              <p className="text-[10px] text-[#727272] pl-7 mt-0.5">
                Session auto-renews for 30 days each time you visit.
              </p>
            </div>

            {/* Primary Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-full bg-[#1ed760] hover:bg-[#1fdf64] active:scale-[0.98] text-black font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition hover:scale-[1.02] cursor-pointer disabled:opacity-50 shadow-md shadow-[#1ed760]/20"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>{mode === 'login' ? 'Log In' : 'Sign Up'}</span>
                )}
              </button>
            </div>
          </form>

          {/* Mode Switcher Section */}
          <div className="mt-8 pt-8 border-t border-[#292929] text-center">
            {mode === 'login' ? (
              <div>
                <p className="text-sm font-bold text-white mb-4">Don't have an account?</p>
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className="w-full h-12 rounded-full border border-[#727272] hover:border-white bg-transparent hover:bg-white/5 text-white font-bold text-sm sm:text-base flex items-center justify-center transition hover:scale-[1.02] cursor-pointer"
                >
                  Sign up for Riff
                </button>
              </div>
            ) : (
              <div>
                <p className="text-sm text-[#b3b3b3]">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="text-white hover:text-[#1ed760] font-bold underline ml-1 cursor-pointer transition"
                  >
                    Log in here
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 3. Spotify Legal Footer */}
      <footer className="py-6 px-4 text-center text-[11px] text-[#727272] bg-[#121212]">
        <p>This site is protected by reCAPTCHA and the Google Privacy Policy and Terms of Service apply.</p>
      </footer>
    </div>
  );
};
