import React, { useState } from 'react';
import { RiffLogo } from '../common/RiffLogo';
import { useAuthStore } from '../../stores/useAuthStore';
import { HomeFeed } from './HomeFeed';
import { SearchExplorer } from './SearchExplorer';
import { LibraryView } from './LibraryView';
import { MiniPlayer } from './MiniPlayer';
import { NowPlayingModal } from '../player/NowPlayingModal';
import { MobileBottomNav, DashboardTab } from './MobileBottomNav';
import { 
  LogOut, 
  Sparkles, 
  Home, 
  Search, 
  Library
} from 'lucide-react';

interface DashboardPageProps {
  onLogout: () => void;
  isStandaloneApp?: boolean;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onLogout,
  isStandaloneApp = false,
}) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('home');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { user, logout } = useAuthStore();

  const handleSelectQuery = (q: string) => {
    setSearchQuery(q);
    setActiveTab('search');
  };

  const handleLogoutClick = async () => {
    await logout();
    onLogout();
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col selection:bg-[#1ed760] selection:text-black">
      {/* 1. Sticky Frosted Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-[#121212]/90 backdrop-blur-md border-b border-white/5 transition duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-4">
          {/* Logo & Desktop Nav Tabs */}
          <div className="flex items-center gap-6">
            <RiffLogo size="md" />

            {/* Desktop Navigation Links (Hidden on Mobile) */}
            <nav className="hidden md:flex items-center gap-2">
              <button
                onClick={() => setActiveTab('home')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                  activeTab === 'home'
                    ? 'bg-white text-black'
                    : 'text-[#b3b3b3] hover:text-white hover:bg-white/5'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </button>

              <button
                onClick={() => setActiveTab('search')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                  activeTab === 'search'
                    ? 'bg-white text-black'
                    : 'text-[#b3b3b3] hover:text-white hover:bg-white/5'
                }`}
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>

              <button
                onClick={() => setActiveTab('library')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                  activeTab === 'library'
                    ? 'bg-white text-black'
                    : 'text-[#b3b3b3] hover:text-white hover:bg-white/5'
                }`}
              >
                <Library className="w-4 h-4" />
                <span>Your Library</span>
              </button>
            </nav>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Studio Badge */}
            <div className="hidden xs:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#181818] border border-white/10 text-[10px] sm:text-xs text-[#1ed760] font-bold">
              <Sparkles className="w-3 h-3" />
              <span>320k Studio Master</span>
            </div>

            {/* User Profile Avatar */}
            <div 
              onClick={() => setActiveTab('library')}
              className="flex items-center gap-2 pl-2 border-l border-white/10 cursor-pointer group select-none"
            >
              <img
                src={user?.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.email || 'riff'}`}
                alt="Avatar"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#282828] object-cover border border-white/20 group-hover:border-[#1ed760] transition"
              />
              <span className="hidden sm:inline text-xs font-bold text-white group-hover:text-[#1ed760] transition truncate max-w-[120px]">
                {user?.displayName || 'Listener'}
              </span>
            </div>

            {/* Logout Button (Desktop) */}
            <button
              onClick={handleLogoutClick}
              title="Log Out"
              className="hidden sm:flex p-2 rounded-full bg-white/5 hover:bg-red-500/20 text-[#b3b3b3] hover:text-red-400 border border-white/5 hover:border-red-500/30 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Tab Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-6">
        {activeTab === 'home' && (
          <HomeFeed 
            userName={user?.displayName} 
            onSelectQuery={handleSelectQuery} 
          />
        )}
        {activeTab === 'search' && (
          <SearchExplorer 
            initialQuery={searchQuery} 
          />
        )}
        {(activeTab === 'library' || activeTab === 'profile') && (
          <LibraryView onLogout={onLogout} isStandaloneApp={isStandaloneApp} />
        )}
      </main>

      {/* 3. Persistent Fixed Mini-Player */}
      <MiniPlayer />

      {/* 4. Fullscreen Now Playing & Synced Lyrics Modal */}
      <NowPlayingModal />

      {/* 5. Mobile Fixed Bottom Navigation Bar (< md) */}
      <MobileBottomNav 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
    </div>
  );
};
