import React, { useState } from 'react';
import { Library, Plus, ArrowRight, Heart, Upload, Search, ListFilter, Pin } from 'lucide-react';
import { useLibraryStore } from '../../stores/useLibraryStore';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { RiffIcon } from '../common/Logo';

interface SidebarProps {
  activeTab?: string;
  setActiveTab: (tab: string) => void;
  onOpenUpload: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ setActiveTab, onOpenUpload }) => {
  const { playlists, likedTracks, localTracks, createPlaylist } = useLibraryStore();
  const { setActiveMainView } = usePlayerStore();

  const [activeFilter, setActiveFilter] = useState<'all' | 'playlists' | 'favorites' | 'local' | 'radio'>('all');
  const [filterQuery, setFilterQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleCreatePlaylist = () => {
    const title = prompt('Enter new playlist name:', 'My Curated Set');
    if (title && title.trim()) {
      createPlaylist(title.trim());
    }
  };

  const handleOpenLibrary = () => {
    setActiveTab('library');
    setActiveMainView('library');
  };

  const filteredPlaylists = playlists.filter((pl) =>
    pl.title.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <aside className="w-72 lg:w-80 rounded-2xl bg-[#12131a]/90 backdrop-blur-2xl border border-white/[0.07] flex flex-col justify-between hidden md:flex select-none h-full overflow-hidden shadow-2xl shrink-0">
      {/* Top Header Section */}
      <div className="p-4 space-y-3 shrink-0">
        {/* Your Library Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleOpenLibrary}
            className="flex items-center gap-2.5 text-neutral-400 hover:text-white transition-colors group cursor-pointer"
            title="Your Library Vault"
          >
            <Library className="w-5 h-5 text-neutral-400 group-hover:text-white transition-colors" />
            <span className="font-bold text-sm tracking-tight text-neutral-200 group-hover:text-white font-sans">
              Your Library
            </span>
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={handleCreatePlaylist}
              className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              title="Create new playlist"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={handleOpenLibrary}
              className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              title="Expand Library View"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {[
            { id: 'all', label: 'All' },
            { id: 'playlists', label: 'Playlists' },
            { id: 'favorites', label: 'Favorites' },
            { id: 'local', label: 'Local Files' },
          ].map((chip) => {
            const isActive = activeFilter === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => setActiveFilter(chip.id as any)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
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
            onClick={handleOpenLibrary}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.08] transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#450af5] to-[#8e8ee5] flex items-center justify-center shrink-0 shadow-md">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white truncate group-hover:text-[#1ed760] transition-colors">
                Liked Songs
              </p>
              <p className="text-xs text-neutral-400 truncate flex items-center gap-1.5 mt-0.5">
                <span className="text-[#1ed760] flex items-center gap-0.5">
                  <Pin className="w-3 h-3 fill-current" />
                </span>
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
            <div className="w-12 h-12 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center shrink-0 shadow-md">
              <Upload className="w-5 h-5 text-neutral-200" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white truncate group-hover:text-[#1ed760] transition-colors">
                Local Audio Vault
              </p>
              <p className="text-xs text-neutral-400 truncate mt-0.5">
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
                onClick={handleOpenLibrary}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.08] transition-all cursor-pointer group"
              >
                <img
                  src={pl.coverUrl || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=120&q=80'}
                  alt=""
                  className="w-12 h-12 rounded-lg object-cover shrink-0 shadow-sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white truncate group-hover:text-[#1ed760] transition-colors">
                    {pl.title}
                  </p>
                  <p className="text-xs text-neutral-400 truncate mt-0.5">
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
