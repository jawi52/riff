import React, { useState } from 'react';
import { X, Lock, Mail, User, Loader2, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { Logo } from '../common/Logo';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setAuthModalOpen } = useSettingsStore();
  const { login, register, isLoading, authError, clearError } = useAuthStore();

  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    if (mode === 'login') {
      const ok = await login(email, password, true);
      if (ok) setAuthModalOpen(false);
    } else {
      const ok = await register(email, password, displayName || email.split('@')[0]);
      if (ok) setAuthModalOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-md bg-[#12131d] border border-cyan-500/30 rounded-3xl p-6 md:p-8 space-y-5 shadow-[0_0_50px_rgba(6,182,212,0.15)] relative animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-56 h-56 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        <button
          onClick={() => {
            clearError();
            setAuthModalOpen(false);
          }}
          className="absolute right-5 top-5 p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Logo & Title */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Logo size="md" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-black text-white tracking-tight flex items-center justify-center gap-1.5">
              <span>{mode === 'login' ? 'Welcome Back' : 'Join Riff Cloud'}</span>
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </h2>
            <p className="text-xs text-neutral-400 font-medium">
              {mode === 'login'
                ? 'Sign in to access your synchronized library & jam rooms'
                : 'Your guest playlists & liked songs will automatically sync!'}
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {authError && (
          <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="flex-1">{authError}</span>
          </div>
        )}

        {/* Mode Switcher */}
        <div className="flex items-center p-1 rounded-2xl bg-white/[0.04] border border-white/10 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              clearError();
              setMode('login');
            }}
            className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
              mode === 'login' ? 'bg-cyan-500 text-black shadow-md font-black' : 'text-neutral-400 hover:text-white'
            }`}
          >
            SIGN IN
          </button>
          <button
            type="button"
            onClick={() => {
              clearError();
              setMode('register');
            }}
            className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
              mode === 'register' ? 'bg-cyan-500 text-black shadow-md font-black' : 'text-neutral-400 hover:text-white'
            }`}
          >
            CREATE ACCOUNT
          </button>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'register' && (
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                placeholder="Full Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-[#0a0c14] text-xs text-white placeholder-neutral-500 rounded-xl pl-10 pr-4 py-3 border border-white/10 focus:border-cyan-400 focus:outline-none transition"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="email"
              required
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0a0c14] text-xs text-white placeholder-neutral-500 rounded-xl pl-10 pr-4 py-3 border border-white/10 focus:border-cyan-400 focus:outline-none transition"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0a0c14] text-xs text-white placeholder-neutral-500 rounded-xl pl-10 pr-4 py-3 border border-white/10 focus:border-cyan-400 focus:outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs tracking-wider uppercase shadow-xl transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-black" />
            ) : mode === 'login' ? (
              'Sign In to Riff'
            ) : (
              'Create Account & Sync'
            )}
          </button>
        </form>

        {/* Security Badge */}
        <div className="pt-1 flex items-center justify-center gap-1.5 text-[10px] text-neutral-500">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>Encrypted Cloud Sync // Supabase Authentication</span>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
