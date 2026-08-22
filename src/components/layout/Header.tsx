import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, X, Play, Clock, Settings, User } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { Track } from '../../types';
import { Logo } from '../common/Logo';

interface HeaderProps {
  onSearchSubmit?: (query: string) => void;
  activeTab?: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onSearchSubmit, setActiveTab }) => {
  const [searchInput, setSearchInput] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [recentPlayed, setRecentPlayed] = useState<Track[]>([]);

  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const historyRef = useRef<HTMLDivElement | null>(null);

  const { user } = useAuthStore();
  const { setSettingsOpen, setAuthModalOpen } = useSettingsStore();
  const { playTrack, playbackState } = usePlayerStore();

  useEffect(() => {
    try {
      const raw = localStorage.getItem('riff_recent_searches');
      if (raw) setRecentPlayed(JSON.parse(raw));
    } catch {}
  }, [isHistoryOpen]);

  // Close modals on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (historyRef.current && !historyRef.current.contains(e.target as Node)) {
        setIsHistoryOpen(false);
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

  return (
    <header className="sticky top-0 z-40 bg-[#06070a]/95 backdrop-blur-2xl border-b border-white/[0.08] select-none px-4 md:px-6 py-2.5">
      {/* ========================================================================= */}
      {/* 1. MOBILE BESPOKE HEADER (iPhone / Android Viewports) */}
      {/* ========================================================================= */}
      <div className="flex md:hidden items-center justify-between gap-3">
        {/* Left: User Avatar with Glowing Status */}
        <button
          onClick={() => setAuthModalOpen(true)}
          className="relative flex items-center gap-2 p-1 rounded-full hover:bg-white/5 active:scale-95 transition cursor-pointer"
        >
          <div className="relative w-8 h-8 rounded-full overflow-hidden border border-emerald-500/40 p-0.5 bg-gradient-to-tr from-emerald-500 to-cyan-500">
            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="User" className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-emerald-400" />
              )}
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400 absolute bottom-1 right-1 ring-2 ring-[#06070a] animate-pulse" />
        </button>

        {/* Center: Brand Monogram with Dancing EQ Bars */}
        <div 
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center font-black text-black text-sm shadow-md">
            R
          </div>
          <div className="flex items-center gap-1">
            <span className="text-base font-black tracking-tight text-white group-hover:text-emerald-400 transition">
              RIFF
            </span>
            {playbackState === 'playing' && (
              <div className="flex items-end gap-0.5 h-3.5 ml-1">
                <span className="w-0.5 bg-emerald-400 animate-[bounce_0.8s_infinite] h-2 rounded-full" />
                <span className="w-0.5 bg-emerald-400 animate-[bounce_1.1s_infinite] h-3.5 rounded-full" />
                <span className="w-0.5 bg-emerald-400 animate-[bounce_0.9s_infinite] h-1.5 rounded-full" />
              </div>
            )}
          </div>
        </div>

        {/* Right Action Dock: History, Notifications, Settings */}
        <div className="flex items-center gap-1">
          {/* History Clock Button */}
          <button
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(10);
              setIsHistoryOpen(!isHistoryOpen);
              setIsNotificationsOpen(false);
            }}
            className="p-2 rounded-full text-neutral-300 hover:text-white active:scale-90 transition relative"
            title="Listening History"
          >
            <Clock className="w-5 h-5" />
          </button>

          {/* Notifications Bell */}
          <button
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(10);
              setIsNotificationsOpen(!isNotificationsOpen);
              setIsHistoryOpen(false);
            }}
            className="p-2 rounded-full text-neutral-300 hover:text-white active:scale-90 transition relative"
            title="What's New"
          >
            <Bell className="w-5 h-5" />
            <span className="w-2 h-2 rounded-full bg-emerald-400 absolute top-2 right-2 ring-2 ring-[#06070a]" />
          </button>

          {/* Settings Gear */}
          <button
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(10);
              setSettingsOpen(true);
            }}
            className="p-2 rounded-full text-neutral-300 hover:text-white active:scale-90 transition"
            title="Sound Studio & Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DESKTOP HEADER (Preserved for Large Displays) */}
      {/* ========================================================================= */}
      <div className="hidden md:flex items-center justify-between gap-6 max-w-7xl mx-auto">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-4">
          <div onClick={() => setActiveTab('home')} className="cursor-pointer">
            <Logo />
          </div>
        </div>

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
            className="p-2 rounded-full text-neutral-400 hover:text-white hover:bg-white/5 transition"
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

      {/* ========================================================================= */}
      {/* 4. LISTENING HISTORY MODAL / DRAWER */}
      {/* ========================================================================= */}
      {isHistoryOpen && (
        <div
          ref={historyRef}
          className="absolute right-4 top-14 w-80 rounded-2xl bg-[#11131a]/95 border border-white/10 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-200"
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Recently Played</h4>
            <button onClick={() => setIsHistoryOpen(false)} className="text-neutral-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 pt-3 max-h-72 overflow-y-auto custom-scrollbar">
            {recentPlayed.length > 0 ? (
              recentPlayed.slice(0, 6).map((track, i) => (
                <div
                  key={i}
                  onClick={() => {
                    playTrack(track);
                    setIsHistoryOpen(false);
                  }}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition cursor-pointer group"
                >
                  <img src={track.coverUrl} alt={track.title} className="w-9 h-9 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate group-hover:text-emerald-400 transition">{track.title}</p>
                    <p className="text-[10px] text-neutral-400 truncate">{track.artist}</p>
                  </div>
                  <Play className="w-3.5 h-3.5 text-neutral-400 group-hover:text-emerald-400 fill-current" />
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-neutral-500 text-xs font-semibold">
                No recent listening history yet
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
