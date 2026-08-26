import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Heart,
  Upload,
  Download,
  ListMusic,
  Play,
  Trash2,
  Plus,
  CheckCircle2,
  Search,
  ArrowUpDown,
  Grid2X2,
  List,
  Pin,
  X,
  FileMusic,
  Check,
  BarChart3
} from 'lucide-react';
import { useLibraryStore } from '../../stores/useLibraryStore';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { DBTrack } from '../../lib/db';
import { generateCanonicalTrackId } from '../../lib/dedup';
import { saveAudioToOPFS } from '../../lib/opfs';
import { Track } from '../../types';

function formatDuration(sec: number): string {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const DEFAULT_FOLLOWED_ARTISTS = [
  { name: 'Talha Anjum', avatarUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80', genre: 'Urdu Hip-Hop' },
  { name: 'The Weeknd', avatarUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&q=80', genre: 'Synthwave / R&B' },
  { name: 'Diljit Dosanjh', avatarUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80', genre: 'Punjabi Pop' },
  { name: 'Ali Sethi', avatarUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80', genre: 'Coke Studio' },
  { name: 'Atif Aslam', avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&q=80', genre: 'Sufi / Pop' },
  { name: 'Hasan Raheem', avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80', genre: 'Indie Pop' }
];

export const LibraryView: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'playlists' | 'artists' | 'albums' | 'downloaded' | 'local'>('all');
  const [sortBy, setSortBy] = useState<'recents' | 'recently_added' | 'alphabetical' | 'creator'>('recents');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [pinnedIds, setPinnedIds] = useState<string[]>(['liked_songs']);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    likedTracks,
    localTracks,
    offlineTracks,
    playlists,
    addLocalTrack,
    removeLocalTrack,
    createPlaylist,
    deletePlaylist
  } = useLibraryStore();

  const {
    playTrack,
    navigateToArtist,
    navigateToPlaylist
  } = usePlayerStore();

  useEffect(() => {
    try {
      const raw = localStorage.getItem('riff_pinned_library_items');
      if (raw) setPinnedIds(JSON.parse(raw));
    } catch {}
  }, []);

  const togglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const next = pinnedIds.includes(id) ? pinnedIds.filter((p) => p !== id) : [...pinnedIds, id];
      setPinnedIds(next);
      localStorage.setItem('riff_pinned_library_items', JSON.stringify(next));
    } catch {}
  };

  const libraryArtists = useMemo(() => {
    const map = new Map<string, { name: string; avatarUrl: string; genre: string }>();
    DEFAULT_FOLLOWED_ARTISTS.forEach((a) => map.set(a.name.toLowerCase(), a));
    likedTracks.forEach((t) => {
      const primary = t.artist.split(/,|ft\.|feat\.|&/i)[0].trim();
      if (!map.has(primary.toLowerCase())) {
        map.set(primary.toLowerCase(), { name: primary, avatarUrl: t.coverUrl, genre: 'Artist' });
      }
    });
    return Array.from(map.values());
  }, [likedTracks]);

  const libraryAlbums = useMemo(() => {
    const map = new Map<string, { id: string; title: string; artist: string; coverUrl: string; tracks: Track[] }>();
    const all = [...likedTracks, ...offlineTracks];
    for (const t of all) {
      if (t.album && !map.has(t.album.toLowerCase())) {
        map.set(t.album.toLowerCase(), {
          id: `alb_${t.album.toLowerCase().replace(/\s+/g, '_')}`,
          title: t.album,
          artist: t.artist,
          coverUrl: t.coverUrl,
          tracks: all.filter((x) => x.album === t.album)
        });
      }
    }
    return Array.from(map.values());
  }, [likedTracks, offlineTracks]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    let addedCount = 0;
    let duplicateCount = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadStatus(`Ingesting ${i + 1}/${files.length}: ${file.name}...`);
      try {
        const title = file.name.replace(/\.[^/.]+$/, '');
        const artist = 'Local Artist';
        const canonicalId = generateCanonicalTrackId(artist, title, 180);
        let opfsKey = '';
        try { opfsKey = await saveAudioToOPFS(canonicalId, file); } catch {}
        const dbTrack: DBTrack = {
          id: canonicalId,
          title,
          artist,
          album: 'Local Ingestion',
          duration: 180,
          coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80',
          sourceType: 'local',
          audioBlob: file,
          localBlobKey: opfsKey || canonicalId,
          isOfflineCached: true,
          addedAt: Date.now()
        };
        const added = await addLocalTrack(dbTrack);
        if (added) addedCount++; else duplicateCount++;
      } catch (err) { console.error('Error:', err); }
    }
    setUploadStatus(`Done! Added ${addedCount} song(s)${duplicateCount > 0 ? `, skipped ${duplicateCount} duplicates` : ''}.`);
    setTimeout(() => setUploadStatus(null), 4000);
  };

  const handleCreatePlaylistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistTitle.trim()) return;
    await createPlaylist(newPlaylistTitle.trim(), newPlaylistDesc.trim());
    setNewPlaylistTitle(''); setNewPlaylistDesc(''); setIsCreateModalOpen(false);
  };

  const filteredPlaylists = useMemo(() => {
    let list = [...playlists];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
    }
    list.sort((a, b) => (pinnedIds.includes(b.id) ? 1 : 0) - (pinnedIds.includes(a.id) ? 1 : 0));
    return list;
  }, [playlists, searchQuery, sortBy, pinnedIds]);

  const filteredArtists = useMemo(() => {
    let list = [...libraryArtists];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((a) => a.name.toLowerCase().includes(q) || a.genre.toLowerCase().includes(q));
    }
    return list;
  }, [libraryArtists, searchQuery, sortBy]);

  const filteredAlbums = useMemo(() => {
    let list = [...libraryAlbums];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((a) => a.title.toLowerCase().includes(q) || a.artist.toLowerCase().includes(q));
    }
    return list;
  }, [libraryAlbums, searchQuery, sortBy]);

  return (
    <div className="space-y-4 pb-6 select-none animate-in fade-in duration-300">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & PLUS MENU */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white text-xs font-bold border border-white/10">
            R
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Your Library
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className={`p-2 rounded-full transition cursor-pointer ${
              isSearchOpen ? 'bg-white text-black' : 'text-neutral-400 hover:text-white hover:bg-white/10'
            }`}
            title="Search in Library"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Plus Add Menu Trigger */}
          <div className="relative">
            <button
              onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
              className="p-2 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Add to Library"
            >
              <Plus className="w-6 h-6" />
            </button>

            {isAddMenuOpen && (
              <div className="absolute right-0 top-full mt-2 z-50 w-52 rounded-2xl bg-[#181924]/95 backdrop-blur-2xl border border-white/15 p-1.5 shadow-2xl space-y-1 animate-in fade-in zoom-in-95 duration-150">
                <button
                  onClick={() => {
                    setIsAddMenuOpen(false);
                    setIsCreateModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-white/10 text-xs font-bold text-white transition text-left cursor-pointer"
                >
                  <ListMusic className="w-4 h-4 text-cyan-400" />
                  <span>Create Playlist</span>
                </button>
                <button
                  onClick={() => {
                    setIsAddMenuOpen(false);
                    if (fileInputRef.current) fileInputRef.current.click();
                  }}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-white/10 text-xs font-bold text-white transition text-left cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>Import Local Audio</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden File Input for MP3 Ingestion */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="audio/*,.mp3,.flac,.wav,.aac,.ogg,.m4a"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Upload Toast Banner */}
      {uploadStatus && (
        <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{uploadStatus}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. REAL-TIME SEARCH IN LIBRARY BAR */}
      {/* ========================================================================= */}
      {isSearchOpen && (
        <div className="relative animate-in fade-in slide-in-from-top-2 duration-200">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Find in Your Library"
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-white placeholder-neutral-400 text-xs font-semibold focus:outline-none focus:border-white/30"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DYNAMIC FILTER CHIPS (Horizontal Scrollable Pills) */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
        {[
          { id: 'all', label: 'All' },
          { id: 'playlists', label: `Playlists (${playlists.length})` },
          { id: 'artists', label: `Artists (${libraryArtists.length})` },
          { id: 'albums', label: `Albums (${libraryAlbums.length})` },
          { id: 'downloaded', label: `Downloaded (${offlineTracks.length})` },
          { id: 'local', label: `Local Files (${localTracks.length})` }
        ].map((chip) => {
          const isActive = activeFilter === chip.id;
          return (
            <button
              key={chip.id}
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(10);
                setActiveFilter(isActive && chip.id !== 'all' ? 'all' : (chip.id as any));
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? 'bg-white text-black shadow-md scale-[1.02]'
                  : 'bg-white/[0.06] text-neutral-300 hover:bg-white/[0.12] hover:text-white border border-white/[0.06]'
              }`}
            >
              <span>{chip.label}</span>
              {isActive && chip.id !== 'all' && <X className="w-3 h-3 ml-0.5" />}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 4. SUB-BAR: SORT ENGINE & VIEW LAYOUT SWITCHER */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between pt-1">
        {/* Sort Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
            className="flex items-center gap-1.5 text-xs font-bold text-neutral-300 hover:text-white transition py-1 cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
            <span className="capitalize">
              {sortBy === 'recents'
                ? 'Recents'
                : sortBy === 'recently_added'
                ? 'Recently Added'
                : sortBy === 'alphabetical'
                ? 'Alphabetical'
                : 'Creator'}
            </span>
          </button>

          {isSortMenuOpen && (
            <div className="absolute left-0 top-full mt-2 z-50 w-44 rounded-2xl bg-[#181924]/95 backdrop-blur-2xl border border-white/15 p-1.5 shadow-2xl space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-2.5 py-1">
                Sort by
              </p>
              {[
                { id: 'recents', label: 'Recents' },
                { id: 'recently_added', label: 'Recently Added' },
                { id: 'alphabetical', label: 'Alphabetical (A-Z)' },
                { id: 'creator', label: 'Creator' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setSortBy(opt.id as any);
                    setIsSortMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                    sortBy === opt.id ? 'bg-white/15 text-white' : 'text-neutral-300 hover:bg-white/10'
                  }`}
                >
                  <span>{opt.label}</span>
                  {sortBy === opt.id && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* View Mode Toggle (List ↔ Grid) */}
        <button
          onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          title={`Switch to ${viewMode === 'list' ? 'Grid' : 'List'} View`}
        >
          {viewMode === 'list' ? <Grid2X2 className="w-4 h-4" /> : <List className="w-4 h-4" />}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 5. MAIN LIBRARY CONTENT (LIST OR GRID MODE) */}
      {/* ========================================================================= */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3' : 'space-y-1'}>
        {/* A. FLAGSHIP LIKED SONGS TILE (Always shown on 'all' or 'playlists') */}
        {(activeFilter === 'all' || activeFilter === 'playlists' || activeFilter === 'downloaded') && (
          <div
            onClick={() => {
              navigateToPlaylist({
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
            className={`group rounded-2xl cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] ${
              viewMode === 'grid'
                ? 'p-3 glass-card space-y-2.5 flex flex-col justify-between'
                : 'flex items-center justify-between p-2.5 hover:bg-white/[0.06] active:bg-white/[0.10]'
            }`}
          >
            <div className={`flex items-center gap-3.5 min-w-0 ${viewMode === 'grid' ? 'flex-col items-start' : ''}`}>
              {/* Purple Radiant Gradient Icon Box */}
              <div
                className={`relative rounded-xl bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-600 flex items-center justify-center shadow-lg flex-shrink-0 ${
                  viewMode === 'grid' ? 'w-full aspect-square' : 'w-13 h-13'
                }`}
              >
                <Heart className="w-6 h-6 text-white fill-white shadow-md" />
                <div className="absolute bottom-1 right-1">
                  <span className="w-4 h-4 rounded-full bg-emerald-500 text-black flex items-center justify-center text-[9px] font-black">
                    ↓
                  </span>
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs md:text-sm font-black text-white truncate group-hover:text-neutral-200">
                    Liked Songs
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 truncate mt-0.5">
                  <Pin className="w-3 h-3 text-emerald-400 fill-emerald-400 flex-shrink-0" />
                  <span>Playlist • {likedTracks.length} songs</span>
                </div>
              </div>
            </div>

            {viewMode === 'list' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => togglePin('liked_songs', e)}
                  className="p-1.5 text-neutral-500 hover:text-white rounded-full transition"
                >
                  <Pin className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* B. LISTENING INSIGHTS & WRAPPED TILE */}
        {(activeFilter === 'all') && (
          <div
            onClick={() => {
              usePlayerStore.getState().setActiveMainView('stats');
            }}
            className={`group rounded-2xl cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] ${
              viewMode === 'grid'
                ? 'p-3 glass-card space-y-2.5 flex flex-col justify-between border-violet-500/30'
                : 'flex items-center justify-between p-2.5 hover:bg-white/[0.06] active:bg-white/[0.10]'
            }`}
          >
            <div className={`flex items-center gap-3.5 min-w-0 ${viewMode === 'grid' ? 'flex-col items-start' : ''}`}>
              <div
                className={`rounded-xl bg-gradient-to-br from-violet-700 via-indigo-800 to-cyan-600 flex items-center justify-center shadow-lg flex-shrink-0 ${
                  viewMode === 'grid' ? 'w-full aspect-square' : 'w-13 h-13'
                }`}
              >
                <BarChart3 className="w-6 h-6 text-white shadow-md" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs md:text-sm font-black text-white truncate group-hover:text-cyan-400 transition">
                    Listening Stats & Wrapped
                  </p>
                </div>
                <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                  Your Music Insights • Top Artists & Time
                </p>
              </div>
            </div>
          </div>
        )}

        {/* B. LOCAL AUDIO OPFS SCANNER CARD (Shown on 'all' or 'local') */}
        {(activeFilter === 'all' || activeFilter === 'local') && localTracks.length > 0 && (
          <div
            onClick={() => {
              setActiveFilter('local');
            }}
            className={`group rounded-2xl cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] ${
              viewMode === 'grid'
                ? 'p-3 glass-card space-y-2.5 flex flex-col justify-between'
                : 'flex items-center justify-between p-2.5 hover:bg-white/[0.06] active:bg-white/[0.10]'
            }`}
          >
            <div className={`flex items-center gap-3.5 min-w-0 ${viewMode === 'grid' ? 'flex-col items-start' : ''}`}>
              <div
                className={`rounded-xl bg-gradient-to-br from-emerald-800 to-teal-950 flex items-center justify-center shadow-lg flex-shrink-0 border border-emerald-500/20 ${
                  viewMode === 'grid' ? 'w-full aspect-square' : 'w-13 h-13'
                }`}
              >
                <FileMusic className="w-6 h-6 text-emerald-400" />
              </div>

              <div className="min-w-0">
                <p className="text-xs md:text-sm font-black text-white truncate">Local Audio Files</p>
                <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                  OPFS Sandboxed • {localTracks.length} tracks
                </p>
              </div>
            </div>
          </div>
        )}

        {/* C. CUSTOM USER PLAYLISTS */}
        {(activeFilter === 'all' || activeFilter === 'playlists') &&
          filteredPlaylists.map((pl) => {
            const isPinned = pinnedIds.includes(pl.id);

            return (
              <div
                key={pl.id}
                onClick={() => {
                  navigateToPlaylist(pl);
                }}
                className={`group rounded-2xl cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] ${
                  viewMode === 'grid'
                    ? 'p-3 glass-card space-y-2.5 flex flex-col justify-between'
                    : 'flex items-center justify-between p-2.5 hover:bg-white/[0.06] active:bg-white/[0.10]'
                }`}
              >
                <div className={`flex items-center gap-3.5 min-w-0 ${viewMode === 'grid' ? 'flex-col items-start' : ''}`}>
                  <div
                    className={`relative rounded-xl overflow-hidden shadow-md bg-neutral-900 flex-shrink-0 ${
                      viewMode === 'grid' ? 'w-full aspect-square' : 'w-13 h-13'
                    }`}
                  >
                    <img src={pl.coverUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                      <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs md:text-sm font-bold text-white truncate group-hover:text-cyan-400 transition">
                      {pl.title}
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 truncate mt-0.5">
                      {isPinned && <Pin className="w-3 h-3 text-emerald-400 fill-emerald-400 flex-shrink-0" />}
                      <span>Playlist • {pl.creator || 'You'} • {pl.trackCount} tracks</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => togglePin(pl.id, e)}
                    className="p-1.5 text-neutral-500 hover:text-white rounded-full transition cursor-pointer"
                    title={isPinned ? 'Unpin' : 'Pin to top'}
                  >
                    <Pin className={`w-3.5 h-3.5 ${isPinned ? 'text-emerald-400 fill-emerald-400' : ''}`} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete playlist "${pl.title}"?`)) {
                        deletePlaylist(pl.id);
                      }
                    }}
                    className="p-1.5 text-neutral-500 hover:text-rose-400 rounded-full transition cursor-pointer"
                    title="Delete Playlist"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

        {/* D. ARTISTS (Circular Avatars) */}
        {(activeFilter === 'all' || activeFilter === 'artists') &&
          filteredArtists.map((artist, idx) => (
            <div
              key={idx}
              onClick={() => navigateToArtist(artist.name)}
              className={`group rounded-2xl cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] ${
                viewMode === 'grid'
                  ? 'p-3 glass-card space-y-2.5 flex flex-col items-center text-center'
                  : 'flex items-center justify-between p-2.5 hover:bg-white/[0.06] active:bg-white/[0.10]'
              }`}
            >
              <div className={`flex items-center gap-3.5 min-w-0 ${viewMode === 'grid' ? 'flex-col items-center' : ''}`}>
                <div
                  className={`rounded-full overflow-hidden shadow-md border border-white/10 p-0.5 bg-white/[0.04] flex-shrink-0 ${
                    viewMode === 'grid' ? 'w-24 h-24 sm:w-28 sm:h-28' : 'w-13 h-13'
                  }`}
                >
                  <img src={artist.avatarUrl} alt="" className="w-full h-full object-cover rounded-full group-hover:scale-105 transition duration-500" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-xs md:text-sm font-bold text-white truncate group-hover:text-cyan-400 transition">
                      {artist.name}
                    </p>
                    <CheckCircle2 className="w-3.5 h-3.5 text-white/80 fill-white/20 flex-shrink-0" />
                  </div>
                  <p className="text-[11px] text-neutral-400 truncate mt-0.5">Artist • {artist.genre}</p>
                </div>
              </div>
            </div>
          ))}

        {/* E. ALBUMS */}
        {(activeFilter === 'all' || activeFilter === 'albums') &&
          filteredAlbums.map((album) => (
            <div
              key={album.id}
              onClick={() => {
                navigateToPlaylist({
                  id: album.id,
                  title: album.title,
                  description: `Album • ${album.artist}`,
                  coverUrl: album.coverUrl,
                  creator: album.artist,
                  trackCount: album.tracks.length,
                  tracks: album.tracks,
                  updatedAt: Date.now()
                });
              }}
              className={`group rounded-2xl cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] ${
                viewMode === 'grid'
                  ? 'p-3 glass-card space-y-2.5 flex flex-col justify-between'
                  : 'flex items-center justify-between p-2.5 hover:bg-white/[0.06] active:bg-white/[0.10]'
              }`}
            >
              <div className={`flex items-center gap-3.5 min-w-0 ${viewMode === 'grid' ? 'flex-col items-start' : ''}`}>
                <div
                  className={`rounded-xl overflow-hidden shadow-md bg-neutral-900 flex-shrink-0 border border-white/10 ${
                    viewMode === 'grid' ? 'w-full aspect-square' : 'w-13 h-13'
                  }`}
                >
                  <img src={album.coverUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs md:text-sm font-bold text-white truncate group-hover:text-cyan-400 transition">
                    {album.title}
                  </p>
                  <p className="text-[11px] text-neutral-400 truncate mt-0.5">Album • {album.artist}</p>
                </div>
              </div>
            </div>
          ))}

        {/* F. DOWNLOADED / OFFLINE TRACKS */}
        {activeFilter === 'downloaded' && offlineTracks.length > 0 && (
          <div className="col-span-full space-y-2 pt-2">
            <div className="flex items-center gap-2 px-1 text-emerald-400 font-bold text-xs">
              <Download className="w-4 h-4" />
              <span>Offline Ready Tracks ({offlineTracks.length})</span>
            </div>
            {offlineTracks.map((track) => (
              <div
                key={track.id}
                onClick={() => playTrack(track, offlineTracks)}
                className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-white/[0.06] transition cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img src={track.coverUrl} alt="" className="w-10 h-10 rounded-xl object-cover" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{track.title}</p>
                    <p className="text-[11px] text-neutral-400 truncate">{track.artist}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-mono text-neutral-500">{formatDuration(track.duration)}</span>
                  <div className="w-4 h-4 rounded-full bg-emerald-500 text-black flex items-center justify-center text-[9px] font-black">
                    ↓
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* G. LOCAL OPFS AUDIO TRACKS */}
        {activeFilter === 'local' && localTracks.length > 0 && (
          <div className="col-span-full space-y-2 pt-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <FileMusic className="w-4 h-4" />
                <span>Local Ingested Tracks ({localTracks.length})</span>
              </div>
              <button
                onClick={() => {
                  if (fileInputRef.current) fileInputRef.current.click();
                }}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer"
              >
                + Add More
              </button>
            </div>
            {localTracks.map((track) => (
              <div
                key={track.id}
                onClick={() => playTrack(track, localTracks)}
                className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-white/[0.06] transition cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400 flex-shrink-0">
                    <FileMusic className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{track.title}</p>
                    <p className="text-[11px] text-neutral-400 truncate">Local OPFS Audio</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-neutral-500">{formatDuration(track.duration)}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeLocalTrack(track.id);
                    }}
                    className="p-1.5 text-neutral-500 hover:text-rose-400 rounded-full transition cursor-pointer"
                    title="Delete local file"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 6. ZERO-STATE WHEN LIBRARY IS EMPTY */}
      {/* ========================================================================= */}
      {likedTracks.length === 0 && playlists.length === 0 && localTracks.length === 0 && (
        <div className="text-center py-16 px-4 rounded-3xl glass-panel space-y-4 border border-white/10">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-purple-400 flex items-center justify-center mx-auto border border-purple-500/30">
            <ListMusic className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-white">Build Your Music Vault</h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              Follow artists, like songs, create custom playlists, or ingest local lossless MP3s.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-full bg-white text-black font-bold text-xs hover:bg-neutral-200 transition cursor-pointer"
            >
              Create Playlist
            </button>
            <button
              onClick={() => {
                if (fileInputRef.current) fileInputRef.current.click();
              }}
              className="px-4 py-2 rounded-full bg-white/10 text-white font-bold text-xs hover:bg-white/20 border border-white/10 transition cursor-pointer"
            >
              Import Local Songs
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. CREATE PLAYLIST MODAL */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-[#181924] border border-white/15 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white">Create Playlist</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlaylistSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300">Playlist Name</label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={newPlaylistTitle}
                  onChange={(e) => setNewPlaylistTitle(e.target.value)}
                  placeholder="My Curated Mix"
                  className="w-full px-4 py-3 rounded-2xl bg-white/[0.06] border border-white/10 text-white placeholder-neutral-500 text-sm font-semibold focus:outline-none focus:border-white/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300">Description (Optional)</label>
                <textarea
                  rows={3}
                  value={newPlaylistDesc}
                  onChange={(e) => setNewPlaylistDesc(e.target.value)}
                  placeholder="Give your playlist a cool description..."
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.06] border border-white/10 text-white placeholder-neutral-500 text-xs font-medium focus:outline-none focus:border-white/30 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-full text-xs font-bold text-neutral-400 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-white text-black text-xs font-black hover:bg-neutral-200 transition shadow-lg cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LibraryView;
