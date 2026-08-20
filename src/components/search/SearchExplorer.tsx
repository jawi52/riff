import React, { useState, useEffect, useRef } from 'react';
import { Search, Music, User, Disc, ListMusic, Radio, Play, Heart, Loader2, Sparkles, X } from 'lucide-react';
import { SearchResults, RadioStation, Track } from '../../types';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useLibraryStore } from '../../stores/useLibraryStore';

interface SearchExplorerProps {
  initialQuery?: string;
}

function formatDuration(sec: number): string {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const SearchExplorer: React.FC<SearchExplorerProps> = ({ initialQuery = '' }) => {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<'all' | 'tracks' | 'artists' | 'playlists' | 'albums' | 'radio'>('all');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { playTrack, currentTrack, playbackState } = usePlayerStore();
  const { toggleLikeTrack, likedTracks } = useLibraryStore();

  const handlePlayWithRecent = (track: Track, queueList?: Track[]) => {
    try {
      const raw = localStorage.getItem('riff_recent_searches');
      const existing: Track[] = raw ? JSON.parse(raw) : [];
      const updated = [track, ...existing.filter((t) => t.id !== track.id)].slice(0, 10);
      localStorage.setItem('riff_recent_searches', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    playTrack(track, queueList);
  };

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      performSearch(initialQuery, category);
    }
  }, [initialQuery]);

  const performSearch = async (searchQuery: string, searchCat: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setResults(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`/api/v1/search?q=${encodeURIComponent(trimmed)}&type=${searchCat}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (val.trim().length >= 2) {
      debounceTimerRef.current = setTimeout(() => {
        performSearch(val, category);
      }, 450);
    } else if (val.trim().length === 0) {
      setResults(null);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    performSearch(query, category);
  };

  const handleCategoryChange = (cat: typeof category) => {
    setCategory(cat);
    if (query.trim()) {
      performSearch(query, cat);
    }
  };

  const categories = [
    { id: 'all', label: 'ALL RESULTS', icon: Sparkles },
    { id: 'tracks', label: 'TRACKS', icon: Music },
    { id: 'artists', label: 'ARTISTS', icon: User },
    { id: 'albums', label: 'ALBUMS', icon: Disc },
    { id: 'playlists', label: 'PLAYLISTS', icon: ListMusic },
    { id: 'radio', label: 'LIVE RADIO', icon: Radio }
  ];

  return (
    <div className="space-y-8 pb-32 select-none">
      {/* Header Banner */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-neutral-400 text-xs font-mono tracking-wider uppercase">
          <Search className="w-3.5 h-3.5 text-[#1db954]" />
          <span>UNIVERSAL CATALOG // 150M+ TRACKS</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black font-mono tracking-tight text-white uppercase">
          EXPLORE & <span className="text-[#1db954]">DISCOVER</span>
        </h1>
      </div>

      {/* Frosted Glass Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
        <input
          type="text"
          placeholder="Search by track name, artist, album, genre (e.g. LISA MONEY, Daft Punk, Synthwave)..."
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          className="w-full glass-editorial text-sm font-mono text-white placeholder-neutral-500 rounded-2xl pl-12 pr-32 py-4 border border-white/[0.08] focus:border-[#1db954]/50 focus:outline-none focus:ring-2 focus:ring-[#1db954]/20 transition-all shadow-xl"
        />
        
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setResults(null);
              }}
              className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="btn-spotify-emerald px-4 py-2 rounded-xl text-black font-extrabold text-xs font-mono tracking-wider uppercase transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-md"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : 'SEARCH'}
          </button>
        </div>
      </form>

      {/* Filter Category Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 select-none">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = category === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id as typeof category)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-white text-black shadow-md'
                  : 'bg-white/[0.04] text-neutral-400 hover:text-white border border-white/[0.08] hover:border-white/20'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#1db954]' : ''}`} />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Search Results Display */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-neutral-500 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#1db954]" />
          <p className="text-xs font-mono tracking-wider uppercase">Querying JioSaavn, Audius, Jamendo & Web Stream Mesh...</p>
        </div>
      ) : results ? (
        <div className="space-y-10">
          {/* Tracks Section */}
          {(category === 'all' || category === 'tracks') && results.tracks?.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-baseline justify-between border-b border-white/[0.08] pb-2">
                <h3 className="text-xl font-black font-mono text-white uppercase tracking-tight flex items-center gap-2">
                  <Music className="w-4 h-4 text-[#1db954]" />
                  <span>MATCHING TRACKS ({results.tracks.length})</span>
                </h3>
                <span className="text-xs font-mono text-neutral-500">LOSSLESS READY</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {results.tracks.map((track, i) => {
                  const isLiked = likedTracks.some((t) => t.id === track.id);
                  const isCurrent = currentTrack?.id === track.id && playbackState === 'playing';
                  const rankFormatted = (i + 1).toString().padStart(2, '0');

                  return (
                    <div
                      key={track.id + '_' + i}
                      onClick={() => handlePlayWithRecent(track, results.tracks)}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer group select-none ${
                        isCurrent
                          ? 'bg-[#1db954]/15 border-[#1db954]/50 shadow-lg shadow-[#1db954]/10'
                          : 'glass-card-editorial hover:bg-white/[0.06] border-white/[0.06]'
                      }`}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <span className="font-mono text-sm font-black text-neutral-500 group-hover:text-white w-5 text-center transition-colors">
                          {rankFormatted}
                        </span>

                        <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                          <img src={track.coverUrl} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Play className="w-4 h-4 text-white fill-white" />
                          </div>
                        </div>

                        <div className="min-w-0">
                          <p className={`text-sm font-bold font-mono tracking-tight truncate ${isCurrent ? 'text-[#1db954]' : 'text-white group-hover:text-[#1db954]'}`}>
                            {track.title}
                          </p>
                          <p className="text-xs text-neutral-400 truncate mt-0.5">
                            {track.artist} • <span className="text-neutral-500 uppercase font-mono text-[10px]">{track.sourceType}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-neutral-500 hidden sm:inline-block">
                          {formatDuration(track.duration)}
                        </span>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLikeTrack(track);
                          }}
                          className={`p-2 rounded-full hover:bg-white/10 transition-colors ${
                            isLiked ? 'text-[#1db954] fill-[#1db954]' : 'text-neutral-500 hover:text-white'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${isLiked ? 'fill-[#1db954]' : ''}`} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Live Radio Stations */}
          {(category === 'all' || category === 'radio') && results.radioStations?.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-baseline justify-between border-b border-white/[0.08] pb-2">
                <h3 className="text-xl font-black font-mono text-white uppercase tracking-tight flex items-center gap-2">
                  <Radio className="w-4 h-4 text-[#1db954]" />
                  <span>LIVE RADIO BROADCASTS ({results.radioStations.length})</span>
                </h3>
                <span className="text-xs font-mono text-neutral-500">GLOBAL FM MESH</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {results.radioStations.map((station: RadioStation) => (
                  <div
                    key={station.id}
                    onClick={() =>
                      playTrack({
                        id: station.id,
                        title: station.name,
                        artist: `${station.country} • Live FM`,
                        album: 'Live Radio Broadcast',
                        duration: 0,
                        coverUrl: station.favicon || 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=300&q=80',
                        sourceType: 'radio',
                        streamUrl: station.url
                      })
                    }
                    className="p-4 rounded-2xl glass-card-editorial hover:border-[#1db954]/50 cursor-pointer transition-all flex items-center gap-3.5 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-md">
                      {station.favicon ? (
                        <img src={station.favicon} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Radio className="w-6 h-6 text-[#1db954]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold font-mono text-white truncate group-hover:text-[#1db954] transition-colors">
                        {station.name}
                      </p>
                      <p className="text-xs text-neutral-400 font-mono truncate mt-0.5">
                        {station.country} • <span className="text-[#1db954]">{station.bitrate} KBPS</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-20 text-neutral-500 space-y-3">
          <Search className="w-12 h-12 mx-auto text-neutral-600 mb-2" />
          <p className="text-base font-black font-mono uppercase text-white">Universal Audio Search</p>
          <p className="text-xs font-mono text-neutral-400 max-w-sm mx-auto">
            Search over 150M+ tracks across YouTube Music, iTunes, Deezer, SoundCloud, and 30,000+ live radio broadcasts.
          </p>
        </div>
      )}
    </div>
  );
};
