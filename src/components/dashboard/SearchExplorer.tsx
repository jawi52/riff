import React, { useState, useEffect, useRef } from 'react';
import { searchCatalog, SearchResponse } from '../../lib/api';
import { Track } from '../../types';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useLibraryStore } from '../../stores/useLibraryStore';
import { 
  Search, 
  X, 
  Play, 
  Pause, 
  Radio, 
  Loader2, 
  Sparkles,
  Music2,
  Heart
} from 'lucide-react';

interface SearchExplorerProps {
  initialQuery?: string;
}

export const SearchExplorer: React.FC<SearchExplorerProps> = ({ initialQuery }) => {
  const [query, setQuery] = useState(initialQuery || '');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const { currentTrack, playbackState, playTrack, togglePlayPause } = usePlayerStore();
  const { likedTracks, toggleLikeTrack } = useLibraryStore();
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const performSearch = async (term: string) => {
    if (!term.trim()) {
      setResults(null);
      setIsSearching(false);
      return;
    }

    try {
      setIsSearching(true);
      setSearchError(null);
      const data = await searchCatalog(term, 25);
      setResults(data);
    } catch (err: any) {
      console.error('Search query error:', err);
      setSearchError(err?.message || 'Failed to search catalog');
    } finally {
      setIsSearching(false);
    }
  };

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      performSearch(val);
    }, 350);
  };

  const clearSearch = () => {
    setQuery('');
    setResults(null);
    setSearchError(null);
  };

  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      setQuery(initialQuery);
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, []);

  const handleTrackClick = (track: Track) => {
    if (currentTrack?.id === track.id) {
      togglePlayPause();
    } else {
      playTrack(track, results?.tracks || [track]);
    }
  };

  const categories = [
    { title: 'Global Hits', color: 'from-purple-600 to-indigo-900', query: 'Top Global Hits' },
    { title: 'Hip-Hop & Rap', color: 'from-orange-600 to-red-900', query: 'Hip Hop' },
    { title: 'Punjabi Hits', color: 'from-amber-500 to-yellow-800', query: 'Shubh Punjabi' },
    { title: 'Chill & Lo-Fi', color: 'from-blue-600 to-cyan-900', query: 'Lo-Fi Chill Beats' },
    { title: 'Pop Masters', color: 'from-pink-600 to-rose-900', query: 'Pop Hits' },
    { title: 'Rock & Indie', color: 'from-emerald-600 to-teal-900', query: 'Rock Classics' },
  ];

  return (
    <div className="space-y-6 pb-32">
      {/* Search Input Bar */}
      <div className="relative max-w-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#727272]" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="What do you want to listen to?"
          autoFocus
          className="w-full h-12 pl-12 pr-12 rounded-full bg-[#242424] hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] border border-transparent focus:border-white text-sm text-white placeholder-[#727272] outline-none transition shadow-lg"
        />
        {isSearching ? (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1ed760] animate-spin" />
        ) : query ? (
          <button
            onClick={clearSearch}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#727272] hover:text-white transition cursor-pointer p-1"
          >
            <X className="w-4 h-4" />
          </button>
        ) : null}
      </div>

      {/* Error state */}
      {searchError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-xs text-red-300">
          <p className="font-bold mb-1">Search Error</p>
          <p>{searchError}</p>
        </div>
      )}

      {/* When Search Has Results */}
      {results && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Top Result Card & Matching Tracks Split */}
          {results.tracks.length === 0 ? (
            <div className="py-16 text-center text-[#b3b3b3] space-y-2">
              <p className="text-lg font-bold text-white">No results found for "{query}"</p>
              <p className="text-xs max-w-sm mx-auto">
                Please make sure your words are spelled correctly, or try searching for different keywords or artists.
              </p>
            </div>
          ) : (
            <>
              {/* Top Result Card & Matching Tracks Split */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Top Result Card */}
                <div className="lg:col-span-5">
                  <h2 className="text-lg font-bold text-white mb-3">Top Result</h2>
                  <div 
                    onClick={() => handleTrackClick(results.tracks[0])}
                    className="bg-[#181818] hover:bg-[#282828] p-5 rounded-xl group transition-all duration-200 cursor-pointer shadow-lg relative"
                  >
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden bg-[#242424] mb-4 shadow-md">
                      <img
                        src={results.tracks[0].coverUrl}
                        alt={results.tracks[0].title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    </div>

                    <h3 className="text-xl font-black text-white truncate">
                      {results.tracks[0].title}
                    </h3>
                    <p className="text-xs text-[#b3b3b3] mt-1 truncate">
                      <span className="font-semibold text-white">{results.tracks[0].artist}</span> • Song
                    </p>

                    <div className="mt-4 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-[#1ed760]/10 border border-[#1ed760]/20 text-[10px] font-bold text-[#1ed760] uppercase">
                        320kbps CD Master
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLikeTrack(results.tracks[0]);
                        }}
                        className="p-1.5 rounded-full hover:bg-white/10 text-[#b3b3b3] hover:text-white transition cursor-pointer"
                        title={likedTracks.some(t => t.id === results.tracks[0].id) ? 'Unlike' : 'Like'}
                      >
                        <Heart
                          className={`w-4 h-4 transition ${
                            likedTracks.some(t => t.id === results.tracks[0].id)
                              ? 'fill-[#1ed760] text-[#1ed760]'
                              : ''
                          }`}
                        />
                      </button>
                    </div>

                    {/* Play Button */}
                    <div className="absolute right-5 bottom-5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTrackClick(results.tracks[0]);
                        }}
                        className="w-12 h-12 rounded-full bg-[#1ed760] text-black flex items-center justify-center shadow-xl group-hover:scale-105 active:scale-95 transition cursor-pointer"
                        aria-label="Play top result"
                      >
                        {currentTrack?.id === results.tracks[0].id && playbackState === 'playing' ? (
                          <Pause className="w-5 h-5 fill-black" />
                        ) : (
                          <Play className="w-5 h-5 fill-black ml-0.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Songs List (Top 5) */}
                <div className="lg:col-span-7">
                  <h2 className="text-lg font-bold text-white mb-3">Songs</h2>
                  <div className="space-y-1">
                    {results.tracks.slice(1, 6).map((track) => {
                      const isThisPlaying = currentTrack?.id === track.id && playbackState === 'playing';
                      const isLiked = likedTracks.some((t) => t.id === track.id);

                      return (
                        <div
                          key={track.id}
                          onClick={() => handleTrackClick(track)}
                          className="group flex items-center justify-between p-2 rounded-md hover:bg-white/10 transition cursor-pointer"
                        >
                          <div className="flex items-center gap-3 min-w-0 pr-3">
                            <div className="w-10 h-10 rounded bg-[#242424] shrink-0 relative overflow-hidden">
                              <img
                                src={track.coverUrl}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                              {isThisPlaying && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                  <Radio className="w-4 h-4 text-[#1ed760] animate-pulse" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className={`text-sm font-bold truncate leading-tight ${isThisPlaying ? 'text-[#1ed760]' : 'text-white'}`}>
                                {track.title}
                              </p>
                              <p className="text-xs text-[#b3b3b3] truncate mt-0.5">
                                {track.artist}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 text-xs text-[#b3b3b3]">
                            {/* Like / Heart Toggle */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleLikeTrack(track);
                              }}
                              className="p-1 rounded-full text-[#727272] hover:text-white transition cursor-pointer"
                              title={isLiked ? 'Unlike' : 'Like'}
                            >
                              <Heart
                                className={`w-4 h-4 transition ${
                                  isLiked ? 'fill-[#1ed760] text-[#1ed760]' : 'opacity-0 group-hover:opacity-100'
                                }`}
                              />
                            </button>

                            <span className="hidden sm:inline text-[#1ed760] font-semibold text-[11px]">
                              320k
                            </span>
                            <span className="tabular-nums">
                              {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Additional Results (Tracks 6+) */}
              {results.tracks.length > 6 && (
                <div className="space-y-3 pt-4">
                  <h3 className="text-base font-bold text-white">More Tracks</h3>
                  <div className="space-y-1">
                    {results.tracks.slice(6).map((track, idx) => {
                      const isThisPlaying = currentTrack?.id === track.id && playbackState === 'playing';
                      const isLiked = likedTracks.some((t) => t.id === track.id);

                      return (
                        <div
                          key={track.id}
                          onClick={() => handleTrackClick(track)}
                          className="group flex items-center justify-between p-2 rounded-md hover:bg-white/10 transition cursor-pointer"
                        >
                          <div className="flex items-center gap-3 min-w-0 pr-3">
                            <span className="w-5 text-right text-xs text-[#727272] group-hover:text-white tabular-nums shrink-0">
                              {idx + 7}
                            </span>
                            <div className="w-10 h-10 rounded bg-[#242424] shrink-0 relative overflow-hidden">
                              <img
                                src={track.coverUrl}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                              {isThisPlaying && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                  <Radio className="w-4 h-4 text-[#1ed760] animate-pulse" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className={`text-sm font-bold truncate leading-tight ${isThisPlaying ? 'text-[#1ed760]' : 'text-white'}`}>
                                {track.title}
                              </p>
                              <p className="text-xs text-[#b3b3b3] truncate mt-0.5">
                                {track.artist}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 text-xs text-[#b3b3b3]">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleLikeTrack(track);
                              }}
                              className="p-1 rounded-full text-[#727272] hover:text-white transition cursor-pointer"
                              title={isLiked ? 'Unlike' : 'Like'}
                            >
                              <Heart
                                className={`w-4 h-4 transition ${
                                  isLiked ? 'fill-[#1ed760] text-[#1ed760]' : 'opacity-0 group-hover:opacity-100'
                                }`}
                              />
                            </button>

                            <span className="hidden sm:inline text-[#1ed760] font-semibold text-[11px]">
                              320k
                            </span>
                            <span className="tabular-nums">
                              {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* When Search Is Idle: Show Quick Browse Genres */}
      {!results && !query && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#1ed760]" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Browse All
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4">
            {categories.map((cat) => (
              <div
                key={cat.title}
                onClick={() => {
                  setQuery(cat.query);
                  performSearch(cat.query);
                }}
                className={`relative h-28 sm:h-32 rounded-xl p-4 bg-gradient-to-br ${cat.color} overflow-hidden shadow-md hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer select-none`}
              >
                <h3 className="font-black text-white text-base sm:text-lg leading-tight max-w-[70%]">
                  {cat.title}
                </h3>
                <Music2 className="absolute -right-2 -bottom-2 w-16 h-16 text-white/20 rotate-12" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
