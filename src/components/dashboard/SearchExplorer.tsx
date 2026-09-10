import React, { useState, useEffect, useRef, useMemo } from 'react';
import { searchCatalog, ApiArtist, ApiAlbum } from '../../lib/api';
import { Track } from '../../types';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useLibraryStore } from '../../stores/useLibraryStore';
import { 
  getRecentSearches, 
  removeRecentItem, 
  clearAllRecentItems, 
  addRecentTrack,
  RecentItem 
} from '../../lib/recentSearches';
import { getSearchSuggestions } from '../../lib/searchSuggestions';
import { TrackContextMenuModal } from '../common/TrackContextMenuModal';
import { 
  Search, 
  X, 
  Play, 
  Pause, 
  Radio, 
  Loader2, 
  Heart, 
  Compass, 
  Trash2, 
  History, 
  Sparkles,
  MoreVertical
} from 'lucide-react';

interface SearchExplorerProps {
  initialQuery?: string;
}

type SearchTab = 'all' | 'songs' | 'artists' | 'albums';

// Client-side query cache to protect backend credits & give 0ms instant response
const queryCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

const BROWSE_GENRES = [
  { title: '🇵🇰 Coke Studio & Pak Pop', desc: 'Atif, Young Stunners & Ali Sethi', query: 'Coke Studio Pakistan', color: 'from-emerald-700 to-teal-950' },
  { title: '🇮🇳 Bollywood Romance', desc: 'Arijit Singh, Pritam & Shreya', query: 'Bollywood Top Hits', color: 'from-rose-700 to-pink-950' },
  { title: '🌾 Punjabi Wave', desc: 'Guru Randhawa, AP Dhillon & Diljit', query: 'Punjabi Hits', color: 'from-amber-600 to-orange-950' },
  { title: '🌍 Global Top 50', desc: 'The Weeknd, Billie Eilish & Drake', query: 'Global Top Hits', color: 'from-blue-700 to-indigo-950' },
  { title: '💔 Sad & Acoustic Vibes', desc: 'Late Night Urdu & Hindi Melodies', query: 'Sad Hindi Songs', color: 'from-purple-800 to-indigo-950' },
  { title: '⚡ Workout & Gym Beats', desc: 'High BPM Energy & Bass Drops', query: 'Gym Workout Music', color: 'from-red-700 to-amber-950' },
  { title: '🌙 Sufi & Qawwali Mystics', desc: 'Nusrat & Rahat Fateh Ali Khan', query: 'Nusrat Fateh Ali Khan Qawwali', color: 'from-yellow-700 to-stone-900' },
  { title: '🎧 Chill & Lo-Fi Beats', desc: 'Focus & Study Rhythms', query: 'Lo-Fi Chill Beats', color: 'from-blue-600 to-cyan-950' },
  { title: '🎸 Rock & Indie Classics', desc: 'Guitar Solos & Anthems', query: 'Rock Classics', color: 'from-teal-600 to-slate-950' },
  { title: '🔥 Desi Hip Hop', desc: 'Talha Anjum, KR$NA & Seedhe Maut', query: 'Desi Hip Hop', color: 'from-red-800 to-black' },
];

export const SearchExplorer: React.FC<SearchExplorerProps> = ({ initialQuery }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<{
    tracks: Track[];
    artists: ApiArtist[];
    albums: ApiAlbum[];
    total: number;
  } | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [contextMenuTrack, setContextMenuTrack] = useState<Track | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const querySeqRef = useRef<number>(0);

  const { currentTrack, playbackState, playTrack, togglePlayPause } = usePlayerStore();
  const { likedTracks, toggleLikeTrack } = useLibraryStore();

  // Sync recent searches from storage
  const syncRecents = () => {
    setRecentItems(getRecentSearches());
  };

  useEffect(() => {
    syncRecents();
    const handleRecentsUpdate = () => syncRecents();
    window.addEventListener('riff_recent_searches_updated', handleRecentsUpdate);
    return () => window.removeEventListener('riff_recent_searches_updated', handleRecentsUpdate);
  }, []);

  // Execute search against catalog
  const performSearch = async (term: string) => {
    const clean = term.trim();
    if (!clean) {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      setResults(null);
      setIsSearching(false);
      return;
    }

    // Check memory cache for instant 0ms return
    const cacheKey = clean.toLowerCase();
    const cached = queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      setResults(cached.data);
      setIsSearching(false);
      return;
    }

    // Cancel in-flight request
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const seq = ++querySeqRef.current;

    try {
      setIsSearching(true);
      setSearchError(null);
      const data = await searchCatalog(clean, 30, controller.signal);

      // Discard stale responses
      if (seq !== querySeqRef.current) return;

      queryCache.set(cacheKey, { data, timestamp: Date.now() });
      setResults(data);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      if (seq !== querySeqRef.current) return;
      console.warn('Search query warning:', err);
      setSearchError(err?.message || 'Failed to search catalog');
    } finally {
      if (seq === querySeqRef.current) {
        setIsSearching(false);
      }
    }
  };

  const handleQueryChange = (val: string) => {
    setQuery(val);

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      performSearch(val);
    }, 200);
  };

  const clearSearch = () => {
    setQuery('');
    setResults(null);
    setSearchError(null);
    setActiveTab('all');
    inputRef.current?.focus();
  };

  const handleSelectQuery = (suggestedTerm: string) => {
    setQuery(suggestedTerm);
    performSearch(suggestedTerm);
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

  // Compute clean, non-intrusive suggestion chips
  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    return getSearchSuggestions(query, {
      maxResults: 6,
      recentSearches: recentItems,
      liveArtists: results?.artists,
      liveTracks: results?.tracks,
    });
  }, [query, recentItems, results]);

  const handleTrackClick = (track: Track, trackList?: Track[]) => {
    addRecentTrack(track);
    if (currentTrack?.id === track.id) {
      togglePlayPause();
    } else {
      playTrack(track, trackList || results?.tracks || [track]);
    }
  };

  const handleArtistClick = (artist: ApiArtist) => {
    handleSelectQuery(artist.name);
  };

  const formatDuration = (sec?: number) => {
    if (!sec || isNaN(sec)) return '3:30';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Detect top result (Artist match or top track)
  const isArtistTopResult = Boolean(
    results?.artists &&
    results.artists.length > 0 &&
    (
      results.artists[0].name.toLowerCase().includes(query.toLowerCase().trim()) ||
      query.toLowerCase().trim().includes(results.artists[0].name.toLowerCase())
    )
  );

  const topArtist = results?.artists?.[0];
  const topTrack = results?.tracks?.[0];

  return (
    <div className="space-y-5 pb-36 selection:bg-[#1ed760] selection:text-black">
      {/* 1. Spotify-Style Search Input Bar */}
      <div className="relative space-y-2.5 max-w-xl">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#b3b3b3] pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                performSearch(query);
              }
            }}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="What do you want to listen to?"
            autoFocus
            className="w-full h-12 pl-12 pr-12 rounded-full bg-[#242424] hover:bg-[#2a2a2a] focus:bg-[#2e2e2e] border border-transparent focus:border-white text-sm text-white placeholder-[#727272] outline-none transition shadow-xl font-medium"
          />
          {isSearching ? (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1ed760] animate-spin" />
          ) : query ? (
            <button
              onClick={clearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#b3b3b3] hover:text-white transition cursor-pointer p-1"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>

        {/* 2. Non-Intrusive Autocomplete Chips (Never covers the results!) */}
        {query.trim() && suggestions.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 text-xs">
            <span className="text-[#727272] font-semibold flex items-center gap-1 mr-1 flex-shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-[#1ed760]" />
              Suggestions:
            </span>
            {suggestions.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSelectQuery(s.query)}
                className="px-3 py-1 rounded-full bg-[#242424] hover:bg-[#2e2e2e] text-white hover:text-[#1ed760] border border-white/5 transition flex-shrink-0 whitespace-nowrap font-medium cursor-pointer"
              >
                {s.title}
              </button>
            ))}
          </div>
        )}

        {/* 3. Category Filter Tabs */}
        {query.trim() && results && (
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pt-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap select-none ${
                activeTab === 'all'
                  ? 'bg-white text-black shadow-md'
                  : 'bg-[#242424] hover:bg-[#2e2e2e] text-white border border-white/5'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('songs')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap select-none ${
                activeTab === 'songs'
                  ? 'bg-white text-black shadow-md'
                  : 'bg-[#242424] hover:bg-[#2e2e2e] text-white border border-white/5'
              }`}
            >
              Songs ({results.tracks.length})
            </button>
            <button
              onClick={() => setActiveTab('artists')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap select-none ${
                activeTab === 'artists'
                  ? 'bg-white text-black shadow-md'
                  : 'bg-[#242424] hover:bg-[#2e2e2e] text-white border border-white/5'
              }`}
            >
              Artists ({results.artists.length})
            </button>
            <button
              onClick={() => setActiveTab('albums')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap select-none ${
                activeTab === 'albums'
                  ? 'bg-white text-black shadow-md'
                  : 'bg-[#242424] hover:bg-[#2e2e2e] text-white border border-white/5'
              }`}
            >
              Albums ({results.albums.length})
            </button>
          </div>
        )}
      </div>

      {/* Error Notification */}
      {searchError && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-xs text-red-300">
          <p className="font-bold mb-0.5">Search Connection Error</p>
          <p>{searchError}</p>
        </div>
      )}

      {/* 4. Empty Search State: Recents & Browse Categories */}
      {!query.trim() && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Recent Searches Shelf */}
          {recentItems.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-[#1ed760]" />
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    Recent Searches
                  </h2>
                </div>
                <button
                  onClick={() => {
                    clearAllRecentItems();
                    setRecentItems([]);
                  }}
                  className="text-xs font-semibold text-[#b3b3b3] hover:text-white flex items-center gap-1 transition cursor-pointer py-1 px-2 rounded-md hover:bg-white/5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear all
                </button>
              </div>

              <div className="flex gap-3 overflow-x-auto scrollbar-none pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory">
                {recentItems.map((item) => (
                  <div
                    key={`recent_${item.id}`}
                    onClick={() => {
                      if (item.type === 'track' && item.trackData) {
                        handleTrackClick(item.trackData);
                      } else {
                        handleSelectQuery(item.title);
                      }
                    }}
                    className="relative group flex-shrink-0 w-36 sm:w-40 p-3 rounded-xl bg-[#181818] hover:bg-[#282828] border border-white/5 transition-all duration-200 cursor-pointer snap-start flex flex-col items-center text-center"
                  >
                    {/* Delete item button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeRecentItem(item.id);
                        setRecentItems(getRecentSearches());
                      }}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 hover:bg-black text-[#b3b3b3] hover:text-white flex items-center justify-center transition z-10 cursor-pointer opacity-80 group-hover:opacity-100"
                      title="Remove from recents"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>

                    <div className="relative w-24 h-24 mb-3">
                      <img
                        src={item.coverUrl}
                        alt={item.title}
                        className={`w-full h-full object-cover shadow-lg ${
                          item.type === 'artist' ? 'rounded-full' : 'rounded-lg'
                        }`}
                      />
                      {item.type === 'track' && item.trackData && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTrackClick(item.trackData!);
                          }}
                          className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-[#1ed760] text-black flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition duration-200 shadow-xl hover:scale-105"
                        >
                          <Play className="w-4 h-4 fill-black ml-0.5" />
                        </button>
                      )}
                    </div>

                    <p className="text-xs font-bold text-white truncate w-full">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-[#b3b3b3] truncate w-full mt-0.5">
                      {item.subtitle || (item.type === 'track' ? 'Song' : 'Search')}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Browse Categories Grid */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-[#1ed760]" />
              <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                Browse All
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {BROWSE_GENRES.map((genre) => (
                <div
                  key={genre.title}
                  onClick={() => handleSelectQuery(genre.query)}
                  className={`relative h-28 sm:h-36 p-3 sm:p-4 rounded-xl bg-gradient-to-br ${genre.color} border border-white/10 hover:border-white/30 transition-all duration-300 hover:scale-[1.02] cursor-pointer overflow-hidden shadow-lg flex flex-col justify-between group`}
                >
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-white leading-tight">
                      {genre.title}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-white/70 line-clamp-2 mt-1">
                      {genre.desc}
                    </p>
                  </div>
                  <div className="self-end opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition duration-200">
                    <Search className="w-5 h-5 text-white" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* 5. Active Search Results Presentation */}
      {query.trim() && results && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* TAB 1: ALL (Top Result + Songs + Artists + Albums) */}
          {activeTab === 'all' && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Top Result Card */}
                {(isArtistTopResult && topArtist) || topTrack ? (
                  <div className="lg:col-span-5 space-y-3">
                    <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      Top Result
                    </h2>
                    {isArtistTopResult && topArtist ? (
                      /* Artist Hero Card */
                      <div
                        onClick={() => handleArtistClick(topArtist)}
                        className="group relative p-5 rounded-2xl bg-[#181818] hover:bg-[#282828] border border-white/5 hover:border-white/15 transition-all duration-300 cursor-pointer shadow-xl flex flex-col justify-between h-56"
                      >
                        <div className="flex items-center gap-4">
                          <img
                            src={topArtist.pictureBig || topArtist.pictureMedium || topArtist.picture || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80'}
                            alt={topArtist.name}
                            className="w-24 h-24 rounded-full object-cover shadow-2xl group-hover:scale-105 transition duration-300"
                          />
                          <div>
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-[#1ed760] text-black mb-1.5 shadow">
                              Artist
                            </span>
                            <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-[#1ed760] transition-colors leading-tight">
                              {topArtist.name}
                            </h3>
                            <p className="text-xs text-[#b3b3b3] mt-1 flex items-center gap-1">
                              <Radio className="w-3.5 h-3.5 text-[#1ed760]" />
                              Verified Artist • Tap to explore catalog
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <span className="text-xs font-semibold text-[#b3b3b3] group-hover:text-white transition">
                            Explore Artist Tracks
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleArtistClick(topArtist);
                            }}
                            className="w-12 h-12 rounded-full bg-[#1ed760] text-black flex items-center justify-center shadow-xl hover:scale-110 transition duration-200"
                            aria-label="Play artist"
                          >
                            <Play className="w-5 h-5 fill-black ml-0.5" />
                          </button>
                        </div>
                      </div>
                    ) : topTrack ? (
                      /* Song Hero Card */
                      <div
                        onClick={() => handleTrackClick(topTrack)}
                        className="group relative p-5 rounded-2xl bg-[#181818] hover:bg-[#282828] border border-white/5 hover:border-white/15 transition-all duration-300 cursor-pointer shadow-xl flex flex-col justify-between h-56"
                      >
                        <div className="flex items-center gap-4">
                          <img
                            src={topTrack.coverUrl}
                            alt={topTrack.title}
                            className="w-24 h-24 rounded-xl object-cover shadow-2xl group-hover:scale-105 transition duration-300"
                          />
                          <div className="min-w-0">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-white/10 text-white mb-1.5 border border-white/10">
                              Song
                            </span>
                            <h3 className="text-lg sm:text-xl font-black text-white truncate group-hover:text-[#1ed760] transition-colors">
                              {topTrack.title}
                            </h3>
                            <p className="text-xs text-[#b3b3b3] truncate mt-1">
                              {topTrack.artist}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-white/5 text-[#1ed760] border border-[#1ed760]/20">
                            320k Master
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setContextMenuTrack(topTrack);
                              }}
                              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
                              title="More options / Add to playlist"
                            >
                              <MoreVertical className="w-5 h-5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTrackClick(topTrack);
                              }}
                              className="w-12 h-12 rounded-full bg-[#1ed760] text-black flex items-center justify-center shadow-xl hover:scale-110 transition duration-200 cursor-pointer"
                              aria-label="Play track"
                            >
                              {currentTrack?.id === topTrack.id && playbackState === 'playing' ? (
                                <Pause className="w-5 h-5 fill-black" />
                              ) : (
                                <Play className="w-5 h-5 fill-black ml-0.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {/* Top Songs List (4-5 tracks) */}
                <div className={`${(isArtistTopResult && topArtist) || topTrack ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-3`}>
                  <div className="flex items-center justify-between">
                    <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      Songs
                    </h2>
                    {results.tracks.length > 4 && (
                      <button
                        onClick={() => setActiveTab('songs')}
                        className="text-xs font-bold text-[#b3b3b3] hover:text-white transition cursor-pointer"
                      >
                        See all ({results.tracks.length})
                      </button>
                    )}
                  </div>

                  <div className="space-y-1">
                    {results.tracks.slice(0, 4).map((track) => {
                      const isCurrent = currentTrack?.id === track.id;
                      const isPlaying = isCurrent && playbackState === 'playing';

                      return (
                        <div
                          key={track.id}
                          onClick={() => handleTrackClick(track)}
                          className={`group flex items-center justify-between p-2 sm:p-2.5 rounded-xl transition-all cursor-pointer ${
                            isCurrent
                              ? 'bg-white/10 text-[#1ed760]'
                              : 'hover:bg-[#1f1f1f] text-white'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 pr-3">
                            <div className="relative w-11 h-11 flex-shrink-0">
                              <img
                                src={track.coverUrl}
                                alt={track.title}
                                className="w-full h-full object-cover rounded-md shadow"
                              />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTrackClick(track);
                                }}
                                className={`absolute inset-0 m-auto w-8 h-8 rounded-full bg-black/80 flex items-center justify-center transition ${
                                  isCurrent
                                    ? 'opacity-100'
                                    : 'opacity-0 group-hover:opacity-100'
                                }`}
                              >
                                {isPlaying ? (
                                  <Pause className="w-4 h-4 text-[#1ed760] fill-current" />
                                ) : (
                                  <Play className="w-4 h-4 text-white fill-current ml-0.5" />
                                )}
                              </button>
                            </div>

                            <div className="min-w-0">
                              <p className={`text-xs sm:text-sm font-bold truncate ${isCurrent ? 'text-[#1ed760]' : 'text-white'}`}>
                                {track.title}
                              </p>
                              <p className="text-[11px] text-[#b3b3b3] truncate mt-0.5">
                                {track.artist}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleLikeTrack(track);
                              }}
                              className={`p-1.5 transition cursor-pointer ${
                                likedTracks.some((t: Track) => t.id === track.id)
                                  ? 'text-[#1ed760]'
                                  : 'text-[#b3b3b3] hover:text-white opacity-0 group-hover:opacity-100'
                              }`}
                              aria-label="Like track"
                            >
                              <Heart
                                className={`w-4 h-4 ${
                                  likedTracks.some((t: Track) => t.id === track.id)
                                    ? 'fill-[#1ed760]'
                                    : ''
                                }`}
                              />
                            </button>
                            <span className="text-xs text-[#b3b3b3] tabular-nums hidden sm:inline">
                              {formatDuration(track.duration)}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setContextMenuTrack(track);
                              }}
                              className="p-1.5 text-[#b3b3b3] hover:text-white transition cursor-pointer opacity-80 sm:opacity-0 group-hover:opacity-100"
                              title="More options / Add to playlist"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Artists Carousel */}
              {results.artists && results.artists.length > 0 && (
                <section className="space-y-3 pt-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      Artists
                    </h2>
                    {results.artists.length > 6 && (
                      <button
                        onClick={() => setActiveTab('artists')}
                        className="text-xs font-bold text-[#b3b3b3] hover:text-white transition cursor-pointer"
                      >
                        See all
                      </button>
                    )}
                  </div>

                  <div className="flex gap-4 overflow-x-auto scrollbar-none pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory">
                    {results.artists.map((artist) => (
                      <div
                        key={artist.id}
                        onClick={() => handleArtistClick(artist)}
                        className="group flex-shrink-0 w-32 sm:w-40 p-3 sm:p-4 rounded-xl bg-[#181818] hover:bg-[#282828] border border-white/5 transition duration-200 cursor-pointer snap-start flex flex-col items-center text-center"
                      >
                        <div className="relative w-24 h-24 sm:w-28 sm:h-28 mb-3">
                          <img
                            src={artist.pictureBig || artist.pictureMedium || artist.picture || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80'}
                            alt={artist.name}
                            className="w-full h-full object-cover rounded-full shadow-lg group-hover:scale-105 transition duration-200"
                          />
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-white truncate w-full">
                          {artist.name}
                        </p>
                        <span className="text-[11px] text-[#b3b3b3] mt-0.5">
                          Artist
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Albums Carousel */}
              {results.albums && results.albums.length > 0 && (
                <section className="space-y-3 pt-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      Albums & Singles
                    </h2>
                    {results.albums.length > 6 && (
                      <button
                        onClick={() => setActiveTab('albums')}
                        className="text-xs font-bold text-[#b3b3b3] hover:text-white transition cursor-pointer"
                      >
                        See all
                      </button>
                    )}
                  </div>

                  <div className="flex gap-4 overflow-x-auto scrollbar-none pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory">
                    {results.albums.map((album) => (
                      <div
                        key={album.id}
                        onClick={() => handleSelectQuery(album.title)}
                        className="group flex-shrink-0 w-32 sm:w-40 p-3 sm:p-4 rounded-xl bg-[#181818] hover:bg-[#282828] border border-white/5 transition duration-200 cursor-pointer snap-start flex flex-col items-center text-center"
                      >
                        <div className="relative w-24 h-24 sm:w-28 sm:h-28 mb-3">
                          <img
                            src={album.coverBig || album.coverMedium || album.cover || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&q=80'}
                            alt={album.title}
                            className="w-full h-full object-cover rounded-lg shadow-lg group-hover:scale-105 transition duration-200"
                          />
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-white truncate w-full">
                          {album.title}
                        </p>
                        <p className="text-[11px] text-[#b3b3b3] truncate w-full mt-0.5">
                          {album.artist?.name || 'Album'}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {/* TAB 2: SONGS ONLY */}
          {activeTab === 'songs' && (
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                All Songs ({results.tracks.length})
              </h2>

              <div className="space-y-1">
                {results.tracks.map((track, idx) => {
                  const isCurrent = currentTrack?.id === track.id;
                  const isPlaying = isCurrent && playbackState === 'playing';

                  return (
                    <div
                      key={track.id}
                      onClick={() => handleTrackClick(track)}
                      className={`group flex items-center justify-between p-2.5 sm:p-3 rounded-xl transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-white/10 text-[#1ed760]'
                          : 'hover:bg-[#1f1f1f] text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-3">
                        <span className="w-5 text-center text-xs text-[#b3b3b3] font-medium hidden sm:inline tabular-nums">
                          {idx + 1}
                        </span>

                        <div className="relative w-11 h-11 flex-shrink-0">
                          <img
                            src={track.coverUrl}
                            alt={track.title}
                            className="w-full h-full object-cover rounded-md shadow"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTrackClick(track);
                            }}
                            className={`absolute inset-0 m-auto w-8 h-8 rounded-full bg-black/80 flex items-center justify-center transition ${
                              isCurrent
                                ? 'opacity-100'
                                : 'opacity-0 group-hover:opacity-100'
                            }`}
                          >
                            {isPlaying ? (
                              <Pause className="w-4 h-4 text-[#1ed760] fill-current" />
                            ) : (
                              <Play className="w-4 h-4 text-white fill-current ml-0.5" />
                            )}
                          </button>
                        </div>

                        <div className="min-w-0">
                          <p className={`text-xs sm:text-sm font-bold truncate ${isCurrent ? 'text-[#1ed760]' : 'text-white'}`}>
                            {track.title}
                          </p>
                          <p className="text-[11px] text-[#b3b3b3] truncate mt-0.5">
                            {track.artist}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-[#1ed760] border border-[#1ed760]/20 hidden sm:inline">
                          320k
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLikeTrack(track);
                          }}
                          className={`p-1.5 transition cursor-pointer ${
                            likedTracks.some((t: Track) => t.id === track.id)
                              ? 'text-[#1ed760]'
                              : 'text-[#b3b3b3] hover:text-white opacity-0 group-hover:opacity-100'
                          }`}
                          aria-label="Like track"
                        >
                          <Heart
                            className={`w-4 h-4 ${
                              likedTracks.some((t: Track) => t.id === track.id)
                                ? 'fill-[#1ed760]'
                                : ''
                            }`}
                          />
                        </button>
                        <span className="text-xs text-[#b3b3b3] tabular-nums">
                          {formatDuration(track.duration)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setContextMenuTrack(track);
                          }}
                          className="p-1.5 text-[#b3b3b3] hover:text-white transition cursor-pointer opacity-80 sm:opacity-0 group-hover:opacity-100"
                          title="More options / Add to playlist"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* TAB 3: ARTISTS ONLY */}
          {activeTab === 'artists' && (
            <section className="space-y-4">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                All Artists ({results.artists.length})
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {results.artists.map((artist) => (
                  <div
                    key={artist.id}
                    onClick={() => handleArtistClick(artist)}
                    className="group p-4 rounded-xl bg-[#181818] hover:bg-[#282828] border border-white/5 transition duration-200 cursor-pointer flex flex-col items-center text-center"
                  >
                    <div className="relative w-28 h-28 sm:w-32 sm:h-32 mb-3">
                      <img
                        src={artist.pictureBig || artist.pictureMedium || artist.picture || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80'}
                        alt={artist.name}
                        className="w-full h-full object-cover rounded-full shadow-lg group-hover:scale-105 transition duration-200"
                      />
                    </div>
                    <p className="text-sm font-bold text-white truncate w-full">
                      {artist.name}
                    </p>
                    <span className="text-xs text-[#b3b3b3] mt-0.5">
                      Artist
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* TAB 4: ALBUMS ONLY */}
          {activeTab === 'albums' && (
            <section className="space-y-4">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                All Albums ({results.albums.length})
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {results.albums.map((album) => (
                  <div
                    key={album.id}
                    onClick={() => handleSelectQuery(album.title)}
                    className="group p-4 rounded-xl bg-[#181818] hover:bg-[#282828] border border-white/5 transition duration-200 cursor-pointer flex flex-col items-center text-center"
                  >
                    <div className="relative w-28 h-28 sm:w-32 sm:h-32 mb-3">
                      <img
                        src={album.coverBig || album.coverMedium || album.cover || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&q=80'}
                        alt={album.title}
                        className="w-full h-full object-cover rounded-lg shadow-lg group-hover:scale-105 transition duration-200"
                      />
                    </div>
                    <p className="text-sm font-bold text-white truncate w-full">
                      {album.title}
                    </p>
                    <p className="text-xs text-[#b3b3b3] truncate w-full mt-0.5">
                      {album.artist?.name || 'Album'}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* 6. Zero Results State */}
      {query.trim() && !isSearching && results && results.tracks.length === 0 && results.artists.length === 0 && (
        <div className="py-16 text-center space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-[#b3b3b3]">
            <Search className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              No results found for "{query}"
            </h3>
            <p className="text-xs text-[#b3b3b3] mt-1">
              Please check your spelling, or explore popular recommendations below.
            </p>
          </div>

          <div className="pt-2">
            <p className="text-xs font-semibold text-[#1ed760] mb-2 uppercase tracking-wider">
              Popular Searches
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {['Guru Randhawa', 'Atif Aslam', 'Arijit Singh', 'Coke Studio', 'Karan Aujla', 'The Weeknd'].map((rec) => (
                <button
                  key={rec}
                  onClick={() => handleSelectQuery(rec)}
                  className="px-3 py-1.5 rounded-full bg-[#242424] hover:bg-white text-xs font-semibold text-white hover:text-black transition cursor-pointer border border-white/5 shadow"
                >
                  {rec}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Universal Track Context Menu Modal */}
      <TrackContextMenuModal
        track={contextMenuTrack}
        isOpen={Boolean(contextMenuTrack)}
        onClose={() => setContextMenuTrack(null)}
      />
    </div>
  );
};
