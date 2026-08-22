import React, { useState, useEffect, useRef } from 'react';
import { Search, Music, Play, Pause, Heart, Loader2, X, Clock } from 'lucide-react';
import { Track } from '../../types';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useLibraryStore } from '../../stores/useLibraryStore';

interface SearchExplorerProps {
  initialQuery?: string;
}

interface SearchApiResponse {
  query: string;
  topResult: Track | null;
  sameArtistTracks: Track[];
  similarVibeTracks: Track[];
  tracks: Track[];
  artists: any[];
  albums: any[];
}

function formatDuration(sec: number): string {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const GENRE_TILES = [
  { name: 'Pop', color: 'from-pink-600 to-rose-900', query: 'Top Pop' },
  { name: 'Hip-Hop / Rap', color: 'from-orange-600 to-amber-950', query: 'Hip Hop Rap' },
  { name: 'Punjabi & Desi', color: 'from-emerald-600 to-teal-950', query: 'Punjabi Hits' },
  { name: 'K-Pop', color: 'from-fuchsia-600 to-purple-950', query: 'K-Pop BLACKPINK LISA' },
  { name: 'Synthwave / Retro', color: 'from-cyan-600 to-blue-950', query: 'Synthwave' },
  { name: 'Lo-Fi Chill', color: 'from-violet-600 to-indigo-950', query: 'Lo-Fi Beats' },
  { name: 'Workout & Hype', color: 'from-red-600 to-rose-950', query: 'Workout Hype' },
  { name: 'Deep Focus', color: 'from-sky-600 to-slate-900', query: 'Deep Focus Study' },
  { name: 'Rock & Metal', color: 'from-stone-600 to-neutral-900', query: 'Rock Anthems' },
  { name: 'R&B / Soul', color: 'from-amber-700 to-yellow-950', query: 'R&B Soul' },
  { name: 'Electronic / EDM', color: 'from-lime-600 to-emerald-950', query: 'EDM Electronic' },
  { name: 'Sleep & Ambient', color: 'from-indigo-800 to-slate-950', query: 'Sleep Ambient' }
];

export const SearchExplorer: React.FC<SearchExplorerProps> = ({ initialQuery = '' }) => {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { playTrack, currentTrack, playbackState } = usePlayerStore();
  const { toggleLikeTrack, likedTracks } = useLibraryStore();

  useEffect(() => {
    try {
      const raw = localStorage.getItem('riff_recent_queries');
      if (raw) setRecentSearches(JSON.parse(raw));
    } catch {}
  }, []);

  const saveRecentQuery = (q: string) => {
    if (!q.trim()) return;
    try {
      const updated = [q.trim(), ...recentSearches.filter((item) => item.toLowerCase() !== q.trim().toLowerCase())].slice(0, 8);
      setRecentSearches(updated);
      localStorage.setItem('riff_recent_queries', JSON.stringify(updated));
    } catch {}
  };

  const removeRecentQuery = (q: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter((item) => item !== q);
    setRecentSearches(updated);
    localStorage.setItem('riff_recent_queries', JSON.stringify(updated));
  };

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  const performSearch = async (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setResults(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    saveRecentQuery(trimmed);

    try {
      const res = await fetch(`/api/v1/search?q=${encodeURIComponent(trimmed)}`);
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
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (val.trim().length >= 2) {
      debounceTimerRef.current = setTimeout(() => {
        performSearch(val);
      }, 400);
    } else if (val.trim().length === 0) {
      setResults(null);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    performSearch(query);
  };

  return (
    <div className="space-y-6 pb-36 select-none animate-in fade-in duration-300">
      {/* 1. Search Bar Input */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="What do you want to play? (e.g. 'money by lisa', 'the weeknd', 'punjabi')"
          className="w-full pl-12 pr-11 py-3.5 rounded-2xl bg-white/[0.07] border border-white/10 text-white placeholder-neutral-500 text-sm font-semibold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition shadow-lg"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setResults(null);
            }}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      {/* Loading Spinner */}
      {isLoading && (
        <div className="text-center py-12 space-y-3">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
          <p className="text-xs text-neutral-400 font-medium">Searching verified catalog and decrypting 320k streams...</p>
        </div>
      )}

      {/* 2. When No Search Query: Show Recent Searches & Genre Tiles */}
      {!query.trim() && !results && (
        <div className="space-y-6">
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Recent Searches</h3>
                <button
                  onClick={() => {
                    setRecentSearches([]);
                    localStorage.removeItem('riff_recent_queries');
                  }}
                  className="text-[11px] text-neutral-500 hover:text-neutral-300 font-semibold"
                >
                  Clear All
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {recentSearches.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setQuery(item);
                      performSearch(item);
                    }}
                    className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.05] text-xs font-bold text-neutral-200 cursor-pointer transition group"
                  >
                    <Clock className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{item}</span>
                    <button
                      onClick={(e) => removeRecentQuery(item, e)}
                      className="p-0.5 text-neutral-400 hover:text-white transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Browse All Genres & Moods */}
          <div className="space-y-3">
            <h3 className="text-sm md:text-base font-extrabold text-white tracking-tight">Browse All Categories</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {GENRE_TILES.map((tile, i) => (
                <div
                  key={i}
                  onClick={() => {
                    setQuery(tile.query);
                    performSearch(tile.query);
                  }}
                  className={`relative h-24 md:h-28 rounded-2xl bg-gradient-to-br ${tile.color} p-3.5 flex flex-col justify-between overflow-hidden cursor-pointer shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all border border-white/10`}
                >
                  <span className="text-sm font-black text-white tracking-tight">{tile.name}</span>
                  <div className="self-end opacity-20">
                    <Music className="w-10 h-10" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Search Results View */}
      {results && !isLoading && (
        <div className="space-y-6">
          {/* Top Result Hero Card */}
          {results.topResult && (
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Top Result</h3>
              <div
                onClick={() => playTrack(results.topResult!, results.tracks)}
                className="group relative p-4 md:p-5 rounded-3xl bg-gradient-to-br from-emerald-950/40 via-white/[0.04] to-black border border-emerald-500/20 hover:border-emerald-500/50 cursor-pointer transition-all duration-300 shadow-xl flex flex-col sm:flex-row items-center gap-4"
              >
                <img
                  src={results.topResult.coverUrl}
                  alt={results.topResult.title}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover shadow-2xl flex-shrink-0"
                />
                <div className="flex-1 text-center sm:text-left min-w-0 space-y-1">
                  <h2 className="text-lg md:text-xl font-black text-white truncate group-hover:text-emerald-400 transition">
                    {results.topResult.title}
                  </h2>
                  <p className="text-xs md:text-sm font-semibold text-neutral-300 truncate">
                    {results.topResult.artist}
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Song • 320k Lossless
                    </span>
                    <span className="text-xs font-mono text-neutral-400">
                      {formatDuration(results.topResult.duration)}
                    </span>
                  </div>
                </div>

                <div className="w-12 h-12 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-2xl group-hover:scale-105 active:scale-95 transition flex-shrink-0">
                  <Play className="w-6 h-6 fill-current ml-0.5" />
                </div>
              </div>
            </div>
          )}

          {/* All Verified Songs List */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 px-1">
              Songs ({results.tracks.length} verified results)
            </h3>

            <div className="space-y-1">
              {results.tracks.map((track, i) => {
                const isPlaying = currentTrack?.id === track.id && playbackState === 'playing';
                const isLiked = likedTracks.some((t) => t.id === track.id);
                return (
                  <div
                    key={`${track.id}_${i}`}
                    onClick={() => playTrack(track, results.tracks)}
                    className="group flex items-center gap-3.5 p-2.5 rounded-2xl hover:bg-white/[0.06] active:bg-white/[0.1] transition cursor-pointer"
                  >
                    <span className="w-4 text-center text-xs font-mono text-neutral-500 group-hover:hidden">
                      {i + 1}
                    </span>
                    <div className="w-4 hidden group-hover:flex items-center justify-center text-emerald-400">
                      {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    </div>

                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      className="w-11 h-11 rounded-xl object-cover shadow-sm flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <p className={`text-xs md:text-sm font-bold truncate ${isPlaying ? 'text-emerald-400' : 'text-white'}`}>
                        {track.title}
                      </p>
                      <p className="text-[11px] md:text-xs text-neutral-400 truncate">{track.artist}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (navigator.vibrate) navigator.vibrate(15);
                          toggleLikeTrack(track);
                        }}
                        className="p-1.5 rounded-full text-neutral-500 hover:text-white transition"
                      >
                        <Heart className={`w-4 h-4 ${isLiked ? 'fill-emerald-500 text-emerald-500' : ''}`} />
                      </button>
                      <span className="text-[11px] font-mono text-neutral-500">
                        {formatDuration(track.duration)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
