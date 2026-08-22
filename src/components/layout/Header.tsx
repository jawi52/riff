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
    <header className="sticky top-0 z-40 bg-[#06070a]/95 backdrop-blur-2xl border-b border-white/[0.08] select-none px-4 md:px-6 py-2.5">
      {/* ========================================================================= */}
      {/* 1. MOBILE BESPOKE HEADER (iPhone / Android Viewports) */}
      {/* ========================================================================= */}
      <div className="flex md:hidden items-center justify-between gap-3">
        {/* Left: Official Riff Brand Logo */}
        <Logo size="sm" onClick={() => setActiveTab('home')} />

        {/* Right Action Dock: Flow Mix, Notifications, Settings, Profile */}
        <div className="flex items-center gap-1">
          {/* ⚡ Instant AI Flow Button (Replaced Clock) */}
          <button
            onClick={handleInstantFlow}
            className="p-2 rounded-full text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 active:scale-90 transition relative group cursor-pointer"
            title="Instant Vibe Flow"
          >
            <Zap className="w-5 h-5 fill-emerald-500/30 text-emerald-400 group-hover:scale-110 transition-transform" />
          </button>

          {/* Notifications Bell */}
          <button
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(10);
              setIsNotificationsOpen(!isNotificationsOpen);
            }}
            className="p-2 rounded-full text-neutral-300 hover:text-white active:scale-90 transition relative cursor-pointer"
            title="What's New"
          >
            <Bell className="w-5 h-5" />
            <span className="w-2 h-2 rounded-full bg-emerald-400 absolute top-2 right-2 ring-2 ring-[#06070a]" />
          </button>

          {/* Settings & Equalizer */}
          <button
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(10);
              setSettingsOpen(true);
            }}
            className="p-2 rounded-full text-neutral-300 hover:text-white active:scale-90 transition cursor-pointer"
            title="Sound Studio & Equalizer"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* User Profile Avatar */}
          <button
            onClick={() => setAuthModalOpen(true)}
            className="relative p-0.5 ml-1 rounded-full border border-emerald-500/40 bg-gradient-to-tr from-emerald-500 to-cyan-500 active:scale-90 transition cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="User" className="w-full h-full object-cover" />
              ) : (
                <User className="w-3.5 h-3.5 text-emerald-400" />
              )}
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 absolute bottom-0 right-0 ring-2 ring-[#06070a] animate-pulse" />
          </button>
        </div>
      </div>

      {/* Toast Overlay for Instant Flow */}
      {showFlowToast && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-emerald-500 text-black font-extrabold text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
          <Sparkles className="w-3.5 h-3.5 fill-current" />
          <span>Starting Algorithmic Vibe Flow...</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. DESKTOP HEADER (Preserved for Large Displays) */}
      {/* ========================================================================= */}
      <div className="hidden md:flex items-center justify-between gap-6 max-w-7xl mx-auto">
        {/* Left: Brand Logo */}
        <Logo size="md" onClick={() => setActiveTab('home')} />

        {/* Center: Search Bar */}
        <form onSubmit={handleDesktopSearch} className="flex-1 max-w-lg relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search verified songs, artists, or albums..."
            className="w-full pl-10 pr-4 py-2 rounded-full bg-white/[0.06] border border-white/10 text-white placeholder-neutral-500 text-xs font-semibold focus:outline-none focus:border-emerald-500 transition shadow-inner"
          />
        </form>

        {/* Right Tools: User & Settings */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 rounded-full text-neutral-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
            title="Settings & Equalizer"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={() => setAuthModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-xs font-bold text-white transition cursor-pointer"
          >
            <User className="w-3.5 h-3.5 text-emerald-400" />
            <span>{user?.displayName || 'My Profile'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. NOTIFICATIONS MODAL / DRAWER */}
      {/* ========================================================================= */}
      {isNotificationsOpen && (
        <div
          ref={notificationsRef}
          className="absolute right-4 top-14 w-80 rounded-2xl bg-[#11131a]/95 border border-white/10 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-200"
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">What's New</h4>
            <button onClick={() => setIsNotificationsOpen(false)} className="text-neutral-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3 pt-3">
            <div className="flex items-start gap-3 p-2 rounded-xl bg-white/[0.03]">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold">320k</span>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-white">Lossless CD Audio Engine</p>
                <p className="text-[11px] text-neutral-400">All songs now stream directly from unthrottled 320kbps CD networks in 0ms delay.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2 rounded-xl bg-white/[0.03]">
              <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 text-xs font-bold">AI</span>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-white">Spotify-Style Daylist</p>
                <p className="text-[11px] text-neutral-400">Dynamic mood playlists update contextually every time of the day.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
