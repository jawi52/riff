import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Settings,
  User,
  LogOut,
  Sliders,
  BarChart3,
  Download,
  X
} from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { PwaInstallModal } from '../common/PwaInstallModal';

interface HeaderProps {
  onSearchSubmit?: (query: string) => void;
  activeTab?: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onSearchSubmit, activeTab, setActiveTab }) => {
  const [searchInput, setSearchInput] = useState('');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  const { user, logout } = useAuthStore();
  const { setSettingsOpen } = useSettingsStore();
  const { activeMainView, previousMainView, setActiveMainView } = usePlayerStore();

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim() && onSearchSubmit) {
      onSearchSubmit(searchInput.trim());
    }
  };

  const handleBack = () => {
    if (previousMainView && previousMainView !== activeMainView) {
      setActiveTab(previousMainView);
      setActiveMainView(previousMainView);
    } else {
      setActiveTab('home');
      setActiveMainView('home');
    }
  };

  const handleForward = () => {
    // If on home, jump to search or library
    if (activeMainView === 'home') {
      setActiveTab('search');
      setActiveMainView('search');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#000000] border-b border-white/[0.04] px-4 md:px-6 py-2.5 flex items-center justify-between select-none">
      {/* 1. Left Controls: Spotify Round Navigation Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleBack}
          className="w-8 h-8 rounded-full bg-black/70 hover:bg-neutral-800 text-white flex items-center justify-center transition cursor-pointer disabled:opacity-40"
          title="Go back"
        >
          <ChevronLeft className="w-5 h-5 -ml-0.5" />
        </button>

        <button
          onClick={handleForward}
          className="w-8 h-8 rounded-full bg-black/70 hover:bg-neutral-800 text-white flex items-center justify-center transition cursor-pointer hidden sm:flex"
          title="Go forward"
        >
          <ChevronRight className="w-5 h-5 -mr-0.5" />
        </button>
      </div>

      {/* 2. Center: Spotify Search Bar (Prominent on Search or Desktop) */}
      <div className="flex-1 max-w-md mx-4">
        {activeTab === 'search' ? (
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                if (onSearchSubmit) onSearchSubmit(e.target.value);
              }}
              placeholder="What do you want to play?"
              autoFocus
              className="w-full pl-10 pr-9 py-2 rounded-full bg-[#242424] hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] text-white placeholder-neutral-400 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-white transition"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  if (onSearchSubmit) onSearchSubmit('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>
        ) : (
          <div className="hidden md:block text-center">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest font-mono">
              ⚡ Riff-Engine 320k Lossless
            </span>
          </div>
        )}
      </div>

      {/* 3. Right Controls: User Profile Menu & Tools */}
      <div className="flex items-center gap-2 relative" ref={profileMenuRef}>
        {/* Equalizer / Settings quick button */}
        <button
          onClick={() => setSettingsOpen(true)}
          className="w-8 h-8 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white flex items-center justify-center transition cursor-pointer"
          title="Equalizer & Sound Studio"
        >
          <Sliders className="w-4 h-4" />
        </button>

        {/* User Pill Button (Spotify Desktop signature) */}
        <button
          onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
          className="flex items-center gap-2 p-1 pr-3 rounded-full bg-black/60 hover:bg-neutral-800 border border-white/10 transition cursor-pointer"
        >
          <div className="w-7 h-7 rounded-full bg-neutral-800 overflow-hidden flex items-center justify-center">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-4 h-4 text-white" />
            )}
          </div>
          <span className="text-xs font-bold text-white max-w-[100px] truncate hidden sm:inline">
            {user?.displayName || 'My Profile'}
          </span>
        </button>

        {/* Profile Dropdown Menu */}
        {isProfileMenuOpen && (
          <div className="absolute right-0 top-11 w-52 rounded-xl bg-[#282828] border border-white/10 p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-2 border-b border-white/10 mb-1">
              <p className="text-xs font-bold text-white truncate">{user?.displayName || 'User'}</p>
              <p className="text-[11px] text-neutral-400 truncate">{user?.email || 'Authenticated User'}</p>
              <span className="inline-block mt-1 text-[9px] font-black uppercase text-[#1db954] bg-[#1db954]/10 px-1.5 py-0.5 rounded border border-[#1db954]/20">
                30-Day Session Active
              </span>
            </div>

            <button
              onClick={() => {
                setIsProfileMenuOpen(false);
                setActiveTab('stats');
                setActiveMainView('stats');
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-neutral-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <BarChart3 className="w-4 h-4 text-[#1db954]" />
              <span>Listening Insights</span>
            </button>

            <button
              onClick={() => {
                setIsProfileMenuOpen(false);
                setSettingsOpen(true);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-neutral-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <Settings className="w-4 h-4 text-neutral-300" />
              <span>Audio Studio & DSP</span>
            </button>

            <button
              onClick={() => {
                setIsProfileMenuOpen(false);
                setIsInstallModalOpen(true);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-neutral-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Install Offline App</span>
            </button>

            <div className="my-1 border-t border-white/10" />

            <button
              onClick={() => {
                setIsProfileMenuOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </button>
          </div>
        )}
      </div>

      <PwaInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        deferredPrompt={null}
      />
    </header>
  );
};

export default Header;
