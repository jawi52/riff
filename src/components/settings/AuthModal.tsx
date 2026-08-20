import React, { useState } from 'react';
import { X, Lock, Mail, User, Loader2, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useSettingsStore } from '../../stores/useSettingsStore';

import { Logo } from '../common/Logo';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setAuthModalOpen } = useSettingsStore();
  const { login, register, isLoading } = useAuthStore();

  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    if (mode === 'login') {
      const ok = await login(email, password);
      if (ok) setAuthModalOpen(false);
    } else {
      const ok = await register(email, password, displayName || email.split('@')[0]);
      if (ok) setAuthModalOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-md glass-editorial border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
        <button
          onClick={() => setAuthModalOpen(false)}
          className="absolute right-5 top-5 p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Logo & Title */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <Logo size="md" />
          </div>
          
          <div className="space-y-1">
            <h2 className="text-2xl font-black font-mono tracking-tight text-white uppercase">
              {mode === 'login' ? 'WELCOME TO RIFF' : 'CREATE RIFF CLOUD'}
            </h2>
            <p className="text-xs font-mono text-neutral-400">
              {mode === 'login'
                ? 'Sign in to access your synchronized playlists across devices'
                : 'Your local guest playlists & favorites will automatically sync!'}
            </p>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-neutral-900/80 border border-white/[0.08] text-xs font-mono font-bold uppercase">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 py-2 rounded-lg transition-all ${
              mode === 'login' ? 'bg-white text-black shadow-md' : 'text-neutral-400 hover:text-white'
            }`}
          >
            SIGN IN
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 py-2 rounded-lg transition-all ${
              mode === 'register' ? 'bg-white text-black shadow-md' : 'text-neutral-400 hover:text-white'
            }`}
          >
            CREATE ACCOUNT
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                placeholder="Display Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-[#12131a] font-mono text-xs text-white placeholder-neutral-500 rounded-xl pl-10 pr-4 py-3 border border-white/10 focus:border-[#1db954] focus:outline-none transition-colors"
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
              className="w-full bg-[#12131a] font-mono text-xs text-white placeholder-neutral-500 rounded-xl pl-10 pr-4 py-3 border border-white/10 focus:border-[#1db954] focus:outline-none transition-colors"
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
              className="w-full bg-[#12131a] font-mono text-xs text-white placeholder-neutral-500 rounded-xl pl-10 pr-4 py-3 border border-white/10 focus:border-[#1db954] focus:outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl btn-spotify-emerald text-black font-black font-mono text-xs tracking-wider uppercase shadow-xl transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-black" />
            ) : mode === 'login' ? (
              'SIGN IN TO VAULT'
            ) : (
              'CREATE ACCOUNT & SYNC'
            )}
          </button>
        </form>

        {/* Security Badge */}
        <div className="pt-2 flex items-center justify-center gap-1.5 text-[10px] font-mono text-neutral-500">
          <ShieldCheck className="w-3.5 h-3.5 text-[#1db954]" />
          <span>ZERO-KNOWLEDGE ENCRYPTED AUDIO MESH</span>
        </div>
      </div>
    </div>
  );
};
