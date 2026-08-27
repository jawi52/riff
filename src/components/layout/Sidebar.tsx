import React, { useState } from 'react';
import {
  Library,
  Plus,
  Heart,
  Upload,
  Search,
  ListFilter,
  Pin,
  Home,
  BarChart3,
  Compass
} from 'lucide-react';
import { useLibraryStore } from '../../stores/useLibraryStore';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { RiffIcon } from '../common/Logo';

interface SidebarProps {
  activeTab?: string;
  setActiveTab: (tab: string) => void;
  onOpenUpload: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onOpenUpload }) => {
  const { playlists, likedTracks, localTracks, createPlaylist } = useLibraryStore();
  const { setActiveMainView } = usePlayerStore();

  const [activeFilter, setActiveFilter] = useState<'all' | 'playlists' | 'favorites' | 'local'>('all');
  const [filterQuery, setFilterQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const filteredPlaylists = playlists.filter((pl) =>
    pl.title.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const handleCreatePlaylist = () => {
    const title = prompt('Enter new playlist name:', 'My Curated Set');
    if (title && title.trim()) {
      createPlaylist(title.trim());
    }
  };

  const handleNav = (view: any) => {
    setActiveTab(view);
    setActiveMainView(view);
  };

  return (
    <aside className="w-72 lg:w-80 rounded-2xl bg-[#0e101b]/80 backdrop-blur-2xl border border-white/[0.08] flex flex-col justify-between hidden md:flex select-none h-full overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)] shrink-0">
      {/* 1. Main Navigation Links */}
      <div className="p-3 pb-2 space-y-1 shrink-0 border-b border-white/[0.06]">
        {[
          { id: 'home', label: 'Home Feed', icon: Home },
          { id: 'search', label: 'Search & Explore', icon: Compass },
          { id: 'library', label: 'Your Library', icon: Library },
          { id: 'stats', label: 'Stats & Insights', icon: BarChart3, badge: 'Insights' }
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white font-black shadow-lg shadow-violet-500/25'
                  : 'text-neutral-300 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-neutral-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-white/20 text-white backdrop-blur-md'
                      : 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 2. Library Sub-Header Section */}
      <div className="p-3 pt-2 space-y-2.5 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400">
            Vault Collection
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={handleCreatePlaylist}
              className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Create new playlist"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {[
            { id: 'all', label: 'All' },
            { id: 'playlists', label: 'Playlists' },
            { id: 'favorites', label: 'Favorites' },
            { id: 'local', label: 'Local' }
          ].map((chip) => {
            const isActive = activeFilter === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => setActiveFilter(chip.id as any)}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-white text-black font-bold shadow-sm'
                    : 'bg-white/[0.06] text-neutral-300 hover:bg-white/[0.12] hover:text-white'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* In-Library Search & Sort Bar */}
        <div className="flex items-center justify-between pt-1 text-neutral-400 text-xs">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-1 rounded-full hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
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
                className="w-full bg-white/[0.08] text-xs text-white placeholder-neutral-500 rounded-md px-2 py-0.5 focus:outline-none font-sans"
              />
            )}
          </div>

          <button
            onClick={() => setActiveFilter('all')}
            className="flex items-center gap-1 text-[11px] font-medium text-neutral-400 hover:text-white cursor-pointer"
            title="Sort Library"
          >
            <span>Recents</span>
            <ListFilter className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Middle Scrollable Items Area */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1 pr-1.5 custom-scrollbar">
        {/* Pinned 1: Liked Songs Card */}
        {(activeFilter === 'all' || activeFilter === 'favorites') && (
          <div
            onClick={() => {
              usePlayerStore.getState().navigateToPlaylist({
                id: 'liked_songs',
                title: 'Liked Songs',
                description: 'Your favorite tracks',
                coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80',
                creator: 'You',
                trackCount: likedTracks.length,
                tracks: likedTracks,
                updatedAt: Date.now()
              });
            }}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.08] transition-all cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-600 flex items-center justify-center shrink-0 shadow-md">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate group-hover:text-cyan-400 transition-colors">
                Liked Songs
              </p>
              <p className="text-[11px] text-neutral-400 truncate flex items-center gap-1.5 mt-0.5">
                <Pin className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                <span>Playlist • {likedTracks.length} songs</span>
              </p>
            </div>
          </div>
        )}

        {/* Pinned 2: Local OPFS Audio Vault */}
        {(activeFilter === 'all' || activeFilter === 'local') && (
          <div
            onClick={onOpenUpload}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.08] transition-all cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0 shadow-md">
              <Upload className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate group-hover:text-cyan-400 transition-colors">
                Local Audio Vault
              </p>
              <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                Sandboxed OPFS • {localTracks.length} files
              </p>
            </div>
          </div>
        )}

        {/* User Curated Playlists */}
        {(activeFilter === 'all' || activeFilter === 'playlists') && (
          <>
            {filteredPlaylists.map((pl) => (
              <div
                key={pl.id}
                onClick={() => usePlayerStore.getState().navigateToPlaylist(pl)}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.08] transition-all cursor-pointer group"
              >
                <img
                  src={pl.coverUrl || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=120&q=80'}
                  alt=""
                  className="w-11 h-11 rounded-xl object-cover shrink-0 shadow-sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate group-hover:text-cyan-400 transition-colors">
                    {pl.title}
                  </p>
                  <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                    Playlist • {pl.creator || 'You'}
                  </p>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Bottom Footer Info */}
      <div className="p-3.5 border-t border-white/[0.07] text-[11px] font-mono text-neutral-400 flex items-center justify-between shrink-0 bg-[#0e0f15]/50">
        <div className="flex items-center gap-2">
          <RiffIcon size={14} glow={false} />
          <span className="font-bold tracking-wider text-neutral-300">RIFF VAULT MESH</span>
        </div>
        <span className="text-[#1ed760] font-bold text-[10px] uppercase">ONLINE</span>
      </div>
    </aside>
  );
};

export default Sidebar;
