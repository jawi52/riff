import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { HomeFeed } from '../home/HomeFeed';
import { SearchExplorer } from '../search/SearchExplorer';
import { LibraryView } from '../library/LibraryView';
import { ArtistView } from '../artist/ArtistView';
import { PlaylistDetailView } from '../playlist/PlaylistDetailView';
import { StatsView } from '../stats/StatsView';
import { QueueDrawer } from '../queue/QueueDrawer';
import { NowPlayingSidebar } from './NowPlayingSidebar';
import { MiniPlayer } from '../player/MiniPlayer';
import { FullscreenPlayerModal } from '../player/FullscreenPlayerModal';
import { SettingsDrawer } from '../settings/SettingsDrawer';
import { AuthModal } from '../settings/AuthModal';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useLibraryStore } from '../../stores/useLibraryStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { requestPersistentStorage } from '../../lib/db';

export const AppShell: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { activeMainView, setActiveMainView, initAudioListeners } = usePlayerStore();
  const { loadLibrary } = useLibraryStore();
  const { initGuestSession } = useAuthStore();

  useEffect(() => {
    initAudioListeners();
    loadLibrary();
    initGuestSession();
    requestPersistentStorage();
  }, []);

  const handleGlobalSearch = (q: string) => {
    setSearchQuery(q);
    setActiveMainView('search');
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#000000] text-white select-none">
      {/* 1. Full-Width Top Navbar */}
      <Header
        onSearchSubmit={handleGlobalSearch}
        activeTab={activeMainView}
        setActiveTab={(tab) => setActiveMainView(tab as any)}
      />

      {/* 2. Floating 3-Panel Workspace (Left Vault Card + Center Main Card + Right NowPlaying Card) */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative p-2 gap-2 bg-[#000000]">
        {/* Left Floating Panel: Library Vault */}
        <Sidebar
          activeTab={activeMainView}
          setActiveTab={(tab) => setActiveMainView(tab as any)}
          onOpenUpload={() => setActiveMainView('library')}
        />

        {/* Center Floating Panel: Main Content Viewport */}
        <main className="flex-1 rounded-2xl bg-[#12131a]/90 backdrop-blur-2xl border border-white/[0.07] flex flex-col overflow-y-auto shadow-2xl relative min-w-0 h-full p-3.5 md:p-6 pb-16 md:pb-20 custom-scrollbar">
          {activeMainView === 'home' && (
            <HomeFeed
              onSelectGenre={(genre) => {
                setSearchQuery(genre);
                setActiveMainView('search');
              }}
            />
          )}

          {activeMainView === 'search' && <SearchExplorer initialQuery={searchQuery} />}

          {activeMainView === 'library' && <LibraryView />}

          {activeMainView === 'artist' && <ArtistView />}

          {activeMainView === 'playlist' && <PlaylistDetailView />}

          {activeMainView === 'stats' && <StatsView />}
        </main>

        {/* Right Floating Panel: Now Playing & Audio Studio Hub */}
        <NowPlayingSidebar />
      </div>

      {/* 3. Persistent Bottom Mini Player */}
      <MiniPlayer />

      {/* 4. Mobile Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeMainView}
        setActiveTab={(tab) => setActiveMainView(tab as any)}
        onOpenUpload={() => setActiveMainView('library')}
      />

      {/* Fullscreen Player Modal */}
      <FullscreenPlayerModal />

      {/* Up Next Queue Drawer */}
      <QueueDrawer />

      {/* Settings Drawer */}
      <SettingsDrawer />

      {/* Auth Modal */}
      <AuthModal />
    </div>
  );
};

export default AppShell;
