import React, { useState } from 'react';
import {
  Music2,
  Lock,
  Mail,
  User,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';

interface AuthPageProps {
  initialMode?: 'login' | 'register';
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode = 'login' }) => {
  const { authView, setAuthView, login, register, authError, clearError, isLoading } = useAuthStore();
  
  const isRegister = authView === 'register' || initialMode === 'register';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [remember30Days, setRemember30Days] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError(null);

    if (!email.trim() || !email.includes('@')) {
      setValidationError('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      setValidationError('Password must be at least 6 characters long.');
      return;
    }

    if (isRegister) {
      if (!name.trim()) {
        setValidationError('Please enter your name or username.');
        return;
      }
      if (password !== confirmPassword) {
        setValidationError('Passwords do not match. Please check again.');
        return;
      }
      await register(email.trim(), password, name.trim());
    } else {
      await login(email.trim(), password, remember30Days);
    }
  };

  const errorMessage = validationError || authError;

  return (
    <div className="min-h-screen w-full bg-[#000000] text-white flex flex-col items-center justify-between p-4 sm:p-8 font-sans select-none">
      {/* 1. Header with Spotify-style Logo */}
      <div className="w-full max-w-md pt-4 pb-6 flex items-center justify-between">
        <button
          onClick={() => setAuthView('landing')}
          className="flex items-center gap-2 text-xs font-bold text-neutral-400 hover:text-white transition cursor-pointer p-2 rounded-full hover:bg-white/5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to overview</span>
        </button>

        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setAuthView('landing')}>
          <div className="w-8 h-8 rounded-full bg-[#1db954] flex items-center justify-center text-black font-black shadow-md">
            <Music2 className="w-4 h-4 fill-current" />
          </div>
          <span className="text-lg font-black tracking-tight text-white">Riff</span>
        </div>
      </div>

      {/* 2. Main Authentication Card */}
      <div className="w-full max-w-md rounded-3xl bg-[#121212] border border-white/[0.08] p-8 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] my-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
            {isRegister ? 'Sign up to start listening' : 'Log in to Riff'}
          </h1>
          <p className="text-xs text-neutral-400 font-medium">
            {isRegister
              ? 'Create a free account to unlock 100M+ songs & playlists'
              : 'Welcome back. Your 30-day session will renew on sign in.'}
          </p>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="mb-6 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-xs text-rose-300 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Display Name (Register Only) */}
          {isRegister && (
            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                What should we call you?
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  placeholder="Enter a profile name"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.06] border border-white/10 text-white placeholder-neutral-500 text-sm font-medium focus:outline-none focus:border-[#1db954] focus:bg-white/[0.09] transition"
                  required
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-neutral-300 mb-1.5">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder="name@domain.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.06] border border-white/10 text-white placeholder-neutral-500 text-sm font-medium focus:outline-none focus:border-[#1db954] focus:bg-white/[0.09] transition"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-neutral-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder="At least 6 characters"
                className="w-full pl-10 pr-11 py-3 rounded-xl bg-white/[0.06] border border-white/10 text-white placeholder-neutral-500 text-sm font-medium focus:outline-none focus:border-[#1db954] focus:bg-white/[0.09] transition"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition cursor-pointer p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password (Register Only) */}
          {isRegister && (
            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  placeholder="Re-enter your password"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.06] border border-white/10 text-white placeholder-neutral-500 text-sm font-medium focus:outline-none focus:border-[#1db954] focus:bg-white/[0.09] transition"
                  required
                />
              </div>
            </div>
          )}

          {/* Remember Me for 30 Days Checkbox (Login Only) */}
          {!isRegister && (
            <div className="flex items-center justify-between pt-1 pb-2">
              <label className="flex items-center gap-2.5 text-xs text-neutral-300 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember30Days}
                  onChange={(e) => setRemember30Days(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-700 bg-white/10 text-[#1db954] focus:ring-[#1db954] accent-[#1db954] cursor-pointer"
                />
                <span>Remember me for 30 days</span>
              </label>
              <span className="text-[10px] text-neutral-500 font-mono">Auto-renewing</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-6 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black font-black text-sm transition hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <span>{isRegister ? 'Create Account' : 'Log In'}</span>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 border-t border-white/[0.08]" />

        {/* Switch Between Login / Register */}
        <div className="text-center text-xs text-neutral-400">
          {isRegister ? (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  clearError();
                  setValidationError(null);
                  setAuthView('login');
                }}
                className="font-bold text-white hover:text-[#1db954] underline transition cursor-pointer ml-1"
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
                  clearError();
                  setValidationError(null);
                  setAuthView('register');
                }}
                className="font-bold text-white hover:text-[#1db954] underline transition cursor-pointer ml-1"
              >
                Sign up for Riff
              </button>
            </p>
          )}
        </div>
      </div>

      {/* 3. Footer info */}
      <div className="w-full max-w-md text-center text-[11px] text-neutral-600 pb-2">
        Protected by Riff 30-Day Session Security. Zero commercial tracking.
      </div>
    </div>
  );
};
