import React, { useState } from 'react';
import {
  Library,
  Plus,
  Heart,
  Search,
  Pin,
  Home,
  Music2,
  ListFilter
} from 'lucide-react';
import { useLibraryStore } from '../../stores/useLibraryStore';
import { usePlayerStore } from '../../stores/usePlayerStore';

interface SidebarProps {
  activeTab?: string;
  setActiveTab: (tab: string) => void;
  onOpenUpload: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { playlists, likedTracks, createPlaylist } = useLibraryStore();
  const { setActiveMainView } = usePlayerStore();

  const [activeFilter, setActiveFilter] = useState<'all' | 'playlists' | 'artists'>('all');
  const [filterQuery, setFilterQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const filteredPlaylists = playlists.filter((pl) =>
    pl.title.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const handleCreatePlaylist = () => {
    const title = prompt('Enter new playlist name:', `My Playlist #${playlists.length + 1}`);
    if (title && title.trim()) {
      createPlaylist(title.trim());
    }
  };

  const handleNav = (view: any) => {
    setActiveTab(view);
    setActiveMainView(view);
  };

  return (
    <aside className="w-72 lg:w-84 flex flex-col hidden md:flex select-none h-full overflow-hidden shrink-0 gap-2">
      {/* 1. Top Spotify Block: Logo, Home, Search */}
      <div className="rounded-lg bg-[#121212] p-4 space-y-3 shrink-0">
        <div className="flex items-center gap-2.5 cursor-pointer mb-3 px-1" onClick={() => handleNav('home')}>
          <div className="w-8 h-8 rounded-full bg-[#1db954] flex items-center justify-center text-black shadow-md">
            <Music2 className="w-4 h-4 fill-current" />
          </div>
          <span className="text-lg font-black tracking-tight text-white">Riff</span>
        </div>

        <nav className="space-y-1">
          <button
            onClick={() => handleNav('home')}
            className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-md text-sm font-bold transition cursor-pointer ${
              activeTab === 'home'
                ? 'text-white'
                : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Home className={`w-5 h-5 ${activeTab === 'home' ? 'text-white stroke-[2.5]' : 'text-neutral-400'}`} />
            <span>Home</span>
          </button>

          <button
            onClick={() => handleNav('search')}
            className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-md text-sm font-bold transition cursor-pointer ${
              activeTab === 'search'
                ? 'text-white'
                : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Search className={`w-5 h-5 ${activeTab === 'search' ? 'text-white stroke-[2.5]' : 'text-neutral-400'}`} />
            <span>Search</span>
          </button>
        </nav>
      </div>

      {/* 2. Bottom Spotify Block: Your Library */}
      <div className="rounded-lg bg-[#121212] flex-1 flex flex-col p-3 overflow-hidden">
        {/* Library Header */}
        <div className="flex items-center justify-between px-2 py-1 mb-2 shrink-0">
          <button
            onClick={() => handleNav('library')}
            className={`flex items-center gap-3 transition font-bold text-sm cursor-pointer ${
              activeTab === 'library' ? 'text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Library className="w-5 h-5" />
            <span>Your Library</span>
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={handleCreatePlaylist}
              className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Create playlist"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 px-1 mb-3 shrink-0 overflow-x-auto no-scrollbar py-0.5">
          {[
            { id: 'all', label: 'Playlists' },
            { id: 'artists', label: 'Artists' },
          ].map((chip) => {
            const isActive = activeFilter === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => setActiveFilter(chip.id as any)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-white text-black font-bold'
                    : 'bg-white/[0.07] text-neutral-300 hover:bg-white/[0.12] hover:text-white'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* Search in library / Sort row */}
        <div className="flex items-center justify-between px-1 mb-2 text-xs text-neutral-400 shrink-0">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-1 rounded-full hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Search in Library"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
            {isSearchOpen && (
              <input
                type="text"
                placeholder="Search in Library..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                autoFocus
                className="w-full bg-white/[0.08] text-xs text-white placeholder-neutral-500 rounded px-2 py-0.5 focus:outline-none"
              />
            )}
          </div>

          <div className="flex items-center gap-1 text-[11px] font-medium text-neutral-400 hover:text-white cursor-pointer">
            <span>Recents</span>
            <ListFilter className="w-3 h-3" />
          </div>
        </div>

        {/* Scrollable Library Items List */}
        <div className="flex-1 overflow-y-auto px-1 space-y-0.5 custom-scrollbar">
          {/* Pinned: Liked Songs (Spotify Iconic Tile) */}
          <div
            onClick={() => {
              usePlayerStore.getState().navigateToPlaylist({
                id: 'liked_songs',
                title: 'Liked Songs',
                description: 'Your saved favorite tracks',
                coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80',
                creator: 'You',
                trackCount: likedTracks.length,
                tracks: likedTracks,
                updatedAt: Date.now(),
              });
            }}
            className="flex items-center gap-3 p-2 rounded-md hover:bg-white/[0.06] active:bg-white/[0.1] transition cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-md bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-500 flex items-center justify-center shrink-0 shadow-md">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white truncate group-hover:text-[#1db954] transition-colors">
                Liked Songs
              </p>
              <p className="text-xs text-neutral-400 truncate flex items-center gap-1.5 mt-0.5">
                <Pin className="w-3 h-3 text-[#1db954] fill-[#1db954] shrink-0" />
                <span>Playlist • {likedTracks.length} songs</span>
              </p>
            </div>
          </div>

          {/* User Playlists */}
          {filteredPlaylists.map((pl) => (
            <div
              key={pl.id}
              onClick={() => usePlayerStore.getState().navigateToPlaylist(pl)}
              className="flex items-center gap-3 p-2 rounded-md hover:bg-white/[0.06] active:bg-white/[0.1] transition cursor-pointer group"
            >
              <img
                src={pl.coverUrl || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=120&q=80'}
                alt=""
                className="w-12 h-12 rounded-md object-cover shrink-0 shadow-sm"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white truncate group-hover:text-[#1db954] transition-colors">
                  {pl.title}
                </p>
                <p className="text-xs text-neutral-400 truncate mt-0.5">
                  Playlist • {pl.creator || 'You'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
