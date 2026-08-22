import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, X, Settings, User, Zap, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { Logo } from '../common/Logo';
import { GLOBAL_CATALOG } from '../../lib/algorithm';

interface HeaderProps {
  onSearchSubmit?: (query: string) => void;
  activeTab?: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onSearchSubmit, setActiveTab }) => {
  const [searchInput, setSearchInput] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [showFlowToast, setShowFlowToast] = useState(false);

  const notificationsRef = useRef<HTMLDivElement | null>(null);

  const { user } = useAuthStore();
  const { setSettingsOpen, setAuthModalOpen } = useSettingsStore();
  const { playTrack, currentTrack } = usePlayerStore();

  // Close notifications on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDesktopSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim() && onSearchSubmit) {
      onSearchSubmit(searchInput.trim());
    }
  };

  const handleInstantFlow = () => {
    if (navigator.vibrate) navigator.vibrate([15, 30, 15]);
    const seed = currentTrack || GLOBAL_CATALOG[0];
    playTrack(seed, GLOBAL_CATALOG);
    setShowFlowToast(true);
    setTimeout(() => setShowFlowToast(false), 2200);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0a0c14]/80 backdrop-blur-2xl border-b border-white/[0.08] select-none px-4 md:px-6 py-2.5">
      {/* ========================================================================= */}
      {/* 1. MOBILE BESPOKE HEADER */}
      {/* ========================================================================= */}
      <div className="flex md:hidden items-center justify-between gap-3">
        {/* Left: Luminous Typographic Logo */}
        <Logo size="sm" onClick={() => setActiveTab('home')} />

        {/* Right Action Dock */}
        <div className="flex items-center gap-1.5">
          {/* ⚡ Instant AI Flow Button */}
          <button
            onClick={handleInstantFlow}
            className="p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white active:scale-90 transition relative group cursor-pointer shadow-sm"
            title="Instant Vibe Flow"
          >
            <Zap className="w-4 h-4 text-cyan-300 group-hover:scale-110 transition-transform" />
          </button>

          {/* Notifications Bell */}
          <button
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(10);
              setIsNotificationsOpen(!isNotificationsOpen);
            }}
            className="p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white active:scale-90 transition relative cursor-pointer shadow-sm"
            title="What's New"
          >
            <Bell className="w-4 h-4 text-neutral-200" />
            <span className="w-2 h-2 rounded-full bg-pink-500 absolute top-1.5 right-1.5 ring-2 ring-[#0a0c14]" />
          </button>

          {/* Settings & Equalizer */}
          <button
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(10);
              setSettingsOpen(true);
            }}
            className="p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white active:scale-90 transition cursor-pointer shadow-sm"
            title="Sound Studio & Equalizer"
          >
            <Settings className="w-4 h-4 text-neutral-200" />
          </button>

          {/* User Profile Avatar */}
          <button
            onClick={() => setAuthModalOpen(true)}
            className="relative p-0.5 ml-0.5 rounded-full border border-white/20 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 active:scale-90 transition cursor-pointer shadow-md"
          >
            <div className="w-7 h-7 rounded-full bg-[#11131e] flex items-center justify-center overflow-hidden">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="User" className="w-full h-full object-cover" />
              ) : (
                <User className="w-3.5 h-3.5 text-neutral-200" />
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Toast Overlay for Instant Flow */}
      {showFlowToast && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/90 backdrop-blur-xl text-black font-extrabold text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200 z-50 border border-white/40">
          <Sparkles className="w-3.5 h-3.5 fill-current text-indigo-600" />
          <span>Starting Algorithmic Vibe Flow...</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. DESKTOP HEADER */}
      {/* ========================================================================= */}
      <div className="hidden md:flex items-center justify-between gap-6 max-w-7xl mx-auto">
        <Logo size="md" onClick={() => setActiveTab('home')} />

        <form onSubmit={handleDesktopSearch} className="flex-1 max-w-lg relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search songs, artists, or albums..."
            className="w-full pl-10 pr-4 py-2 rounded-full bg-white/[0.06] border border-white/12 text-white placeholder-neutral-400 text-xs font-semibold focus:outline-none focus:border-white/30 focus:bg-white/[0.09] transition shadow-inner"
          />
        </form>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-neutral-300 hover:text-white transition cursor-pointer"
            title="Settings & Equalizer"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={() => setAuthModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/12 text-xs font-bold text-white transition cursor-pointer"
          >
            <User className="w-3.5 h-3.5 text-cyan-300" />
            <span>{user?.displayName || 'My Profile'}</span>
          </button>
        </div>
      </div>

      {/* 3. NOTIFICATIONS MODAL */}
      {isNotificationsOpen && (
        <div
          ref={notificationsRef}
          className="absolute right-4 top-14 w-80 rounded-2xl glass-panel p-4 z-50 animate-in fade-in zoom-in-95 duration-200"
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">What's New</h4>
            <button onClick={() => setIsNotificationsOpen(false)} className="text-neutral-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3 pt-3">
            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08]">
              <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 text-xs font-black">320k</span>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-white">Lossless CD Audio Engine</p>
                <p className="text-[11px] text-neutral-300">Direct unthrottled 320kbps CD audio streaming in 0ms delay.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08]">
              <span className="p-1.5 rounded-lg bg-pink-500/20 text-pink-300 text-xs font-black">AI</span>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-white">Contextual Soundscapes</p>
                <p className="text-[11px] text-neutral-300">Dynamic mood playlists update contextually every hour of the day.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
