import React, { useState } from 'react';
import { RiffLogo } from '../common/RiffLogo';
import { useAuthStore } from '../../stores/useAuthStore';
import { 
  ArrowLeft, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Loader2, 
  ShieldCheck 
} from 'lucide-react';

interface AuthPageProps {
  initialMode?: 'login' | 'register';
  onBackToLanding?: () => void;
  onAuthSuccess?: () => void;
  isStandaloneApp?: boolean;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'register',
  onBackToLanding,
  onAuthSuccess,
  isStandaloneApp = false,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember30Days, setRemember30Days] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);

  const { login, register, loginWithGoogle, isLoading, authError, authSuccessMessage, clearError, isConfigured } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!email.trim() || !password) {
      setLocalError('Please fill in all required fields.');
      return;
    }

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setLocalError('Passwords do not match. Please verify.');
        return;
      }
      if (password.length < 6) {
        setLocalError('Password must be at least 6 characters.');
        return;
      }

      const success = await register(email, password, name);
      if (success && onAuthSuccess) {
        // If session was returned immediately (no email confirm needed)
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

  const activeError = localError || authError;

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col justify-between p-4 sm:p-6 selection:bg-[#1ed760] selection:text-black">
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#1ed760]/5 rounded-full blur-3xl" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 max-w-7xl mx-auto w-full flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <RiffLogo size="md" />
        </div>

        {!isStandaloneApp && onBackToLanding && (
          <button
            onClick={onBackToLanding}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-[#b3b3b3] hover:text-white transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Landing</span>
          </button>
        )}
      </header>

      {/* Center Auth Card */}
      <main className="relative z-10 w-full max-w-[460px] mx-auto my-auto py-8">
        <div className="bg-[#181818] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Card Title */}
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
              {mode === 'register' ? 'Sign up to start listening' : 'Log in to Riff'}
            </h1>
            <p className="text-xs sm:text-sm text-[#b3b3b3]">
              {mode === 'register'
                ? 'Join Riff for unthrottled 320kbps CD master audio.'
                : 'Welcome back! Your studio audio session awaits.'}
            </p>
          </div>

          {/* Setup notice if Supabase not yet configured */}
          {!isConfigured && (
            <div className="mb-5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-200">
              <p className="font-bold flex items-center gap-1.5 mb-1 text-amber-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Supabase Setup Required</span>
              </p>
              <p className="text-[#b3b3b3] text-[11px] leading-relaxed">
                Connect your free Supabase project by adding <code className="text-white bg-black/40 px-1 py-0.5 rounded">VITE_SUPABASE_URL</code> and <code className="text-white bg-black/40 px-1 py-0.5 rounded">VITE_SUPABASE_ANON_KEY</code> to your environment.
              </p>
            </div>
          )}

          {/* 1. Continue with Google Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full h-12 rounded-full bg-[#181818] hover:bg-white/10 border border-white/20 hover:border-white/50 text-white font-bold text-sm flex items-center justify-center gap-3 transition-all duration-200 cursor-pointer disabled:opacity-50 shadow-sm"
          >
            {/* Google G Logo Multi-color SVG */}
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

          {/* Divider */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="border-t border-white/10 w-full" />
            <span className="bg-[#181818] px-3 text-[11px] font-bold uppercase tracking-wider text-[#7c7c7c] absolute">
              or
            </span>
          </div>

          {/* Success Notification */}
          {authSuccessMessage && (
            <div className="mb-5 p-3 rounded-xl bg-[#1ed760]/10 border border-[#1ed760]/30 flex items-start gap-2.5 text-xs text-[#1ed760] animate-in fade-in">
              <ShieldCheck className="w-4 h-4 text-[#1ed760] shrink-0 mt-0.5" />
              <span>{authSuccessMessage}</span>
            </div>
          )}

          {/* Error Notification */}
          {activeError && (
            <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{activeError}</span>
            </div>
          )}

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field (Sign Up Only) */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-[#b3b3b3] mb-1.5 uppercase tracking-wider">
                  What should we call you?
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7c7c7c]" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Profile name"
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#242424] hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] border border-transparent focus:border-[#1ed760] text-sm text-white placeholder-[#7c7c7c] outline-none transition"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-[#b3b3b3] mb-1.5 uppercase tracking-wider">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7c7c7c]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  required
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#242424] hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] border border-transparent focus:border-[#1ed760] text-sm text-white placeholder-[#7c7c7c] outline-none transition"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-[#b3b3b3] mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7c7c7c]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  className="w-full h-11 pl-10 pr-11 rounded-xl bg-[#242424] hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] border border-transparent focus:border-[#1ed760] text-sm text-white placeholder-[#7c7c7c] outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7c7c7c] hover:text-white transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password (Sign Up Only) */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-[#b3b3b3] mb-1.5 uppercase tracking-wider">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7c7c7c]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    required
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#242424] hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] border border-transparent focus:border-[#1ed760] text-sm text-white placeholder-[#7c7c7c] outline-none transition"
                  />
                </div>
              </div>
            )}

            {/* 30-Day Session Checkbox */}
            <div className="pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs text-[#b3b3b3] hover:text-white select-none">
                <input
                  type="checkbox"
                  checked={remember30Days}
                  onChange={(e) => setRemember30Days(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#1ed760] cursor-pointer"
                />
                <span className="flex items-center gap-1.5 font-medium">
                  <span>Keep me logged in for 30 days</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-[#1ed760]" />
                </span>
              </label>
              <p className="text-[10px] text-[#7c7c7c] mt-1 pl-6.5">
                Session automatically auto-renews for 30 days whenever you visit.
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-full bg-[#1ed760] hover:bg-[#1fdf64] active:scale-98 text-black font-bold text-sm tracking-tight flex items-center justify-center gap-2 transition shadow-lg shadow-[#1ed760]/20 hover:shadow-[#1ed760]/35 cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>{mode === 'register' ? 'Create Account' : 'Log In'}</span>
                )}
              </button>
            </div>
          </form>

          {/* Switch Mode Footer */}
          <div className="mt-6 pt-5 border-t border-white/10 text-center text-xs text-[#b3b3b3]">
            {mode === 'register' ? (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setLocalError(null);
                    clearError();
                  }}
                  className="text-white hover:text-[#1ed760] font-bold underline ml-1 cursor-pointer transition"
                >
                  Log in here
                </button>
              </p>
            ) : (
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setLocalError(null);
                    clearError();
                  }}
                  className="text-white hover:text-[#1ed760] font-bold underline ml-1 cursor-pointer transition"
                >
                  Sign up for Riff
                </button>
              </p>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center text-[11px] text-[#7c7c7c] py-4">
        <span>© {new Date().getFullYear()} Riff Music. Protected with 320kbps CD Master Edge Architecture.</span>
      </footer>
    </div>
  );
};
