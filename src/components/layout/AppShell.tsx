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
import { AiPromptModal } from '../ai/AiPromptModal';
import { SongCreditsModal } from '../common/SongCreditsModal';
import { WaveTagModal } from '../common/WaveTagModal';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useLibraryStore } from '../../stores/useLibraryStore';
import { requestPersistentStorage } from '../../lib/db';

export const AppShell: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { activeMainView, setActiveMainView, initAudioListeners } = usePlayerStore();
  const { loadLibrary } = useLibraryStore();

  useEffect(() => {
    initAudioListeners();
    loadLibrary();
    requestPersistentStorage();
  }, []);

  const handleGlobalSearch = (q: string) => {
    setSearchQuery(q);
    setActiveMainView('search');
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#000000] text-white select-none font-sans">
      {/* 1. Spotify Top Navbar */}
      <Header
        onSearchSubmit={handleGlobalSearch}
        activeTab={activeMainView}
        setActiveTab={(tab) => setActiveMainView(tab as any)}
      />

      {/* 2. Spotify 3-Column / Fluid Workspace */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative p-2 gap-2 bg-[#000000]">
        {/* Left Panel: Spotify Dual-Block Sidebar */}
        <Sidebar
          activeTab={activeMainView}
          setActiveTab={(tab) => setActiveMainView(tab as any)}
          onOpenUpload={() => setActiveMainView('library')}
        />

        {/* Center Panel: Main Viewport */}
        <main className="flex-1 rounded-lg bg-[#121212] border border-white/[0.04] shadow-2xl flex flex-col overflow-y-auto relative min-w-0 h-full p-4 md:p-6 pb-24 md:pb-28 custom-scrollbar">
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

        {/* Right Panel: Spotify Now Playing, Lyrics & Queue Hub */}
        <NowPlayingSidebar />
      </div>

      {/* 3. Persistent Spotify Bottom Mini Player */}
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

      {/* Riff AI Prompt DJ Modal */}
      <AiPromptModal />

      {/* Deep Song Credits Modal */}
      <SongCreditsModal />

      {/* Riff WaveTag Soundwave Barcode Modal */}
      <WaveTagModal />
    </div>
  );
};

export default AppShell;
