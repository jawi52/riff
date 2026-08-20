import React, { useState, useEffect, useRef } from 'react';
import { Search, Home, ArrowDownCircle, Bell, FolderTree, X, Play, Sparkles, Wifi, Radio, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { Track } from '../../types';
import { Logo } from '../common/Logo';
import { PwaInstallModal } from '../common/PwaInstallModal';
import {
  RecentItem,
  getRecentSearches,
  addRecentTrack,
  addRecentQuery,
  removeRecentItem,
  clearAllRecentItems,
} from '../../lib/recentSearches';

interface HeaderProps {
  onSearchSubmit?: (query: string) => void;
  activeTab?: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onSearchSubmit, activeTab, setActiveTab }) => {
  const [searchInput, setSearchInput] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isPwaModalOpen, setIsPwaModalOpen] = useState(false);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<RecentItem[]>([]);
  const [liveResults, setLiveResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { user } = useAuthStore();
  const { setSettingsOpen, setAuthModalOpen } = useSettingsStore();
  const { setActiveMainView, playTrack } = usePlayerStore();

  // Load and listen for recent searches changes
  useEffect(() => {
    setRecentSearches(getRecentSearches());

    const handleRecentUpdate = (e: any) => {
      if (e.detail) {
        setRecentSearches(e.detail);
      } else {
        setRecentSearches(getRecentSearches());
      }
    };

    window.addEventListener('riff_recent_searches_updated', handleRecentUpdate);
    return () => {
      window.removeEventListener('riff_recent_searches_updated', handleRecentUpdate);
    };
  }, []);

  // When search dropdown opens, refresh recent searches
  useEffect(() => {
    if (isSearchDropdownOpen) {
      setRecentSearches(getRecentSearches());
    }
  }, [isSearchDropdownOpen]);

  // Close dropdowns on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSearchDropdownOpen(false);
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Listen for native PWA installation event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Live search debouncing when typing
  useEffect(() => {
    const trimmed = searchInput.trim();
    if (!trimmed || !isSearchDropdownOpen) {
      setLiveResults([]);
      setIsSearching(false);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/v1/search?q=${encodeURIComponent(trimmed)}&type=tracks`);
        if (res.ok) {
          const data = await res.json();
          setLiveResults(data.tracks?.slice(0, 6) || []);
        }
      } catch (err) {
        console.error('Live search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 180);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchInput, isSearchDropdownOpen]);

  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchInput.trim()) {
      const q = searchInput.trim();
      addRecentQuery(q, liveResults[0]);
      setIsSearchDropdownOpen(false);
      setActiveTab('search');
      setActiveMainView('search');
      if (onSearchSubmit) {
        onSearchSubmit(q);
      }
    }
  };

  const handleHomeClick = () => {
    setIsSearchDropdownOpen(false);
    setActiveTab('home');
    setActiveMainView('home');
  };

  const handleBrowseClick = () => {
    setIsSearchDropdownOpen(false);
    setActiveTab('search');
    setActiveMainView('search');
  };

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          setDeferredPrompt(null);
        }
      });
    } else {
      setIsPwaModalOpen(true);
    }
  };

  const handleSelectTrack = (track: Track) => {
    addRecentTrack(track);
    playTrack(track);
    setIsSearchDropdownOpen(false);
  };

  const handleSelectRecentItem = (item: RecentItem) => {
    if (item.trackData) {
      addRecentTrack(item.trackData);
      playTrack(item.trackData);
      setIsSearchDropdownOpen(false);
    } else if (item.type === 'query') {
      setSearchInput(item.title);
      setActiveTab('search');
      setActiveMainView('search');
      if (onSearchSubmit) onSearchSubmit(item.title);
      setIsSearchDropdownOpen(false);
    }
  };

  const handleRemoveRecent = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeRecentItem(id);
  };

  const handleClearAllRecent = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearAllRecentItems();
  };

  const notificationsList = [
    {
      id: 1,
      title: 'Studio Web Audio DSP Active',
      desc: '5-Band Equalizer, Compressor & 60 FPS spectrum visualizer running.',
      time: 'Just now',
      icon: Sparkles,
      color: 'text-[#1ed760] bg-[#1ed760]/15 border-[#1ed760]/30',
    },
    {
      id: 2,
      title: '30,000+ Live Radio Stations',
      desc: 'Global Radio Browser integration live. Search any genre or frequency.',
      time: '10m ago',
      icon: Radio,
      color: 'text-[#06b6d4] bg-[#06b6d4]/15 border-[#06b6d4]/30',
    },
    {
      id: 3,
      title: 'Offline File Sandbox (OPFS)',
      desc: 'Drag and drop local MP3/FLAC/WAV files for zero-latency offline playback.',
      time: '1h ago',
      icon: Wifi,
      color: 'text-amber-400 bg-amber-400/15 border-amber-400/30',
    },
  ];

  return (
    <>
      <header className="w-full sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6 py-2.5 bg-[#000000] border-b border-white/[0.08] select-none">
        {/* 1. Left Section: Clean Riff Logo */}
        <div className="flex items-center min-w-[140px] shrink-0 cursor-pointer">
          <Logo
            size="sm"
            onClick={handleHomeClick}
          />
        </div>

        {/* 2. Center Section: Circular Home Icon + Unified Search Pill Bar + Instant Dropdown */}
        <div className="flex-1 flex items-center justify-center max-w-2xl px-2 sm:px-4">
          <div ref={searchContainerRef} className="relative flex items-center gap-2 w-full max-w-lg">
            {/* Circular Home Button */}
            <button
              onClick={handleHomeClick}
              className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 cursor-pointer ${
                activeTab === 'home'
                  ? 'bg-[#282828] text-white ring-1 ring-white/20'
                  : 'bg-[#1f1f1f] text-neutral-300 hover:text-white hover:bg-[#282828]'
              } active:scale-95 shadow-md`}
              title="Home Feed"
            >
              <Home className="w-5 h-5" />
            </button>

            {/* Unified Search Pill Container */}
            <div
              onClick={() => {
                setIsSearchDropdownOpen(true);
                searchInputRef.current?.focus();
              }}
              className="flex-1 flex items-center bg-[#1f1f1f] hover:bg-[#282828] focus-within:bg-[#1f1f1f] focus-within:ring-2 focus-within:ring-white/30 rounded-full px-3.5 py-2.5 transition-all duration-200 border border-white/[0.05] shadow-inner cursor-pointer"
            >
              <Search className="w-5 h-5 text-neutral-400 shrink-0 mr-2.5 cursor-pointer" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search songs, artists, playlists, or radio..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKey}
                onFocus={() => setIsSearchDropdownOpen(true)}
                className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-neutral-400 focus:outline-none font-sans cursor-text"
              />

              {searchInput && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchInput('');
                    setLiveResults([]);
                    searchInputRef.current?.focus();
                  }}
                  className="p-0.5 text-neutral-400 hover:text-white mr-1.5 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Vertical Separator Divider */}
              <div className="h-4 w-[1px] bg-neutral-600/80 mx-2 shrink-0" />

              {/* Browse / Drawer Action Icon -> Navigates to Search Page */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleBrowseClick();
                }}
                className="text-neutral-400 hover:text-white transition-colors p-0.5 shrink-0 cursor-pointer"
                title="Go to Search & Radio Explorer"
              >
                <FolderTree className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* INSTANT SEARCH POPUP DROPDOWN (Anchored under Search Bar) */}
            {isSearchDropdownOpen && (
              <div className="absolute left-12 right-0 top-full mt-2 bg-[#181920]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-3 sm:p-4 z-50 animate-in fade-in zoom-in-95 duration-150 text-white max-h-[440px] overflow-y-auto">
                {/* Mode A: Live Search Typing Results */}
                {searchInput.trim() ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-bold font-mono tracking-wider text-neutral-400 uppercase">
                        {isSearching ? 'SEARCHING...' : 'LIVE SEARCH RESULTS'}
                      </span>
                      {isSearching && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1ed760]" />}
                    </div>

                    {liveResults.length === 0 && !isSearching ? (
                      <div className="py-6 text-center text-xs font-mono text-neutral-500">
                        No instant matches for "{searchInput}". Press <span className="text-white font-bold">Enter</span> to search full catalog.
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {liveResults.map((track) => (
                          <div
                            key={track.id}
                            onClick={() => handleSelectTrack(track)}
                            className="flex items-center justify-between p-2 rounded-xl hover:bg-white/10 cursor-pointer transition-colors group"
                          >
                            <div className="flex items-center gap-3 min-w-0 pr-2">
                              <img
                                src={track.coverUrl || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=120&q=80'}
                                alt=""
                                className="w-10 h-10 rounded-md object-cover shrink-0 shadow-sm"
                              />
                              <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-[#1ed760] transition-colors">
                                  {track.title}
                                </p>
                                <p className="text-[11px] text-neutral-400 truncate flex items-center gap-1.5 mt-0.5">
                                  <span className="px-1 py-0.2 rounded bg-white/15 text-[9px] font-bold text-neutral-300">E</span>
                                  <span>Song • {track.artist}</span>
                                </p>
                              </div>
                            </div>
                            <div className="w-7 h-7 rounded-full bg-[#1ed760] text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md shrink-0">
                              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                            </div>
                          </div>
                        ))}

                        <button
                          onClick={() => {
                            const q = searchInput.trim();
                            addRecentQuery(q, liveResults[0]);
                            setIsSearchDropdownOpen(false);
                            setActiveTab('search');
                            setActiveMainView('search');
                            if (onSearchSubmit) onSearchSubmit(q);
                          }}
                          className="w-full text-center py-2.5 text-xs font-mono font-bold text-[#1ed760] hover:underline block pt-2 border-t border-white/[0.08] cursor-pointer"
                        >
                          View all results for "{searchInput}" &rarr;
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Mode B: Recent Searches (Starts blank if empty, populates as searched) */
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-sm font-bold font-sans text-white">Recent searches</span>
                      {recentSearches.length > 0 && (
                        <button
                          onClick={handleClearAllRecent}
                          className="text-xs text-neutral-400 hover:text-white font-medium hover:underline cursor-pointer"
                        >
                          Clear all
                        </button>
                      )}
                    </div>

                    {recentSearches.length === 0 ? (
                      <div className="py-8 text-center text-xs font-sans text-neutral-500">
                        No recent searches
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {recentSearches.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => handleSelectRecentItem(item)}
                            className="flex items-center justify-between p-2 rounded-xl hover:bg-white/10 cursor-pointer transition-colors group"
                          >
                            <div className="flex items-center gap-3 min-w-0 pr-2">
                              <img
                                src={item.coverUrl || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=120&q=80'}
                                alt=""
                                className="w-10 h-10 rounded-md object-cover shrink-0 shadow-sm"
                              />
                              <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-[#1ed760] transition-colors">
                                  {item.title}
                                </p>
                                <p className="text-[11px] text-neutral-400 truncate flex items-center gap-1.5 mt-0.5">
                                  <span className="px-1 py-0.2 rounded bg-white/15 text-[9px] font-bold text-neutral-300">E</span>
                                  <span>{item.subtitle}</span>
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-[#1ed760] text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md shrink-0">
                                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                              </div>
                              <button
                                onClick={(e) => handleRemoveRecent(e, item.id)}
                                className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                                title="Remove from recent searches"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 3. Right Section: Install App Pill, Notification Bell & Profile Avatar */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0 min-w-[140px] justify-end">
          {/* Install App Button */}
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-transparent hover:bg-white/10 hover:scale-105 active:scale-95 text-white font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer"
            title="Install Riff as Mobile or Desktop PWA"
          >
            <ArrowDownCircle className="w-4.5 h-4.5 text-white" />
            <span className="hidden sm:inline font-sans">Install App</span>
          </button>

          {/* Notification Bell with Floating Popover */}
          <div ref={notificationsRef} className="relative">
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="p-2 rounded-full text-neutral-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all relative cursor-pointer"
              title="What's New & Alerts"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#1ed760]" />
            </button>

            {/* Anchored Floating Notifications Popover */}
            {isNotificationsOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-[#181920]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150 text-white space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#1ed760]" />
                    <span className="text-sm font-bold font-mono tracking-tight uppercase">NOTIFICATIONS</span>
                  </div>
                  <button
                    onClick={() => setIsNotificationsOpen(false)}
                    className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {notificationsList.map((n) => {
                    const Icon = n.icon;
                    return (
                      <div
                        key={n.id}
                        className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:border-white/20 transition-all flex items-start gap-3 cursor-pointer"
                      >
                        <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${n.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-white truncate">{n.title}</h4>
                            <span className="text-[10px] text-neutral-500 font-mono">{n.time}</span>
                          </div>
                          <p className="text-[11px] text-neutral-400 leading-snug">{n.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Profile Avatar with Emerald Active Status Ring */}
          <div
            onClick={() => (user.isGuest ? setAuthModalOpen(true) : setSettingsOpen(true))}
            className="p-0.5 rounded-full ring-2 ring-[#1ed760] hover:ring-white hover:scale-105 active:scale-95 cursor-pointer transition-all duration-200 shadow-md"
            title={user.displayName || 'Profile & Settings'}
          >
            <img
              src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&q=80'}
              alt={user.displayName}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover"
            />
          </div>
        </div>
      </header>

      {/* PWA Mobile & Desktop Installation Modal */}
      <PwaInstallModal
        isOpen={isPwaModalOpen}
        onClose={() => setIsPwaModalOpen(false)}
        deferredPrompt={deferredPrompt}
      />
    </>
  );
};

export default Header;
