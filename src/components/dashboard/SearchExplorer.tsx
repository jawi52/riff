import React, { useState, useEffect, useRef, useCallback } from 'react';
import { searchCatalog, SearchResponse, ApiArtist } from '../../lib/api';
import { Track } from '../../types';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useLibraryStore } from '../../stores/useLibraryStore';
import { 
  getRecentSearches, 
  removeRecentItem, 
  clearAllRecentItems, 
  RecentItem 
} from '../../lib/recentSearches';
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
  History
} from 'lucide-react';

interface SearchExplorerProps {
  initialQuery?: string;
}

type SearchTab = 'all' | 'songs' | 'artists' | 'albums';

export const SearchExplorer: React.FC<SearchExplorerProps> = ({ initialQuery }) => {
  const [query, setQuery] = useState(initialQuery || '');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);

  const { currentTrack, playbackState, playTrack, togglePlayPause } = usePlayerStore();
  const { likedTracks, toggleLikeTrack } = useLibraryStore();
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Sync recent searches from storage
  const syncRecents = useCallback(() => {
    setRecentItems(getRecentSearches());
  }, []);

  useEffect(() => {
    syncRecents();
    const handleRecentsUpdate = () => syncRecents();
    window.addEventListener('riff_recent_searches_updated', handleRecentsUpdate);
    return () => window.removeEventListener('riff_recent_searches_updated', handleRecentsUpdate);
  }, [syncRecents]);

  const performSearch = async (term: string) => {
    const clean = term.trim();
    if (!clean) {
      setResults(null);
      setIsSearching(false);
      return;
    }

    try {
      setIsSearching(true);
      setSearchError(null);
      const data = await searchCatalog(clean, 25);
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
    }, 300);
  };

  const clearSearch = () => {
    setQuery('');
    setResults(null);
    setSearchError(null);
    setActiveTab('all');
  };

  const handleSelectSuggestion = (suggestedTerm: string) => {
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

  const handleTrackClick = (track: Track, trackList?: Track[]) => {
    if (currentTrack?.id === track.id) {
      togglePlayPause();
    } else {
      playTrack(track, trackList || results?.tracks || [track]);
    }
  };

  const handleArtistClick = (artist: ApiArtist) => {
    handleSelectSuggestion(artist.name);
  };

  // Spotify-style Smart Top Result Detection:
  // Check if the query is an Artist match
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

  const formatDuration = (sec?: number) => {
    if (!sec || isNaN(sec)) return '3:30';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const browseCategories = [
    { title: '🇵🇰 Coke Studio & Sufi', desc: 'Acoustic & Spiritual', query: 'Coke Studio Pakistan', color: 'from-emerald-700 to-green-950' },
    { title: '🇵🇰 Pakistani Hip-Hop', desc: 'Young Stunners & Talha Anjum', query: 'Young Stunners Talha Anjum', color: 'from-stone-700 to-neutral-950' },
    { title: '🇮🇳 Bollywood Romance', desc: 'Arijit Singh & Soulful Hits', query: 'Bollywood Romance Arijit Singh', color: 'from-rose-700 to-pink-950' },
    { title: '🌾 Punjabi Hits', desc: 'AP Dhillon, Shubh & Diljit', query: 'Punjabi Top Hits', color: 'from-amber-600 to-orange-950' },
    { title: '🌍 Global Top 50', desc: 'Billboard & Global Hits', query: 'Top 50 Global', color: 'from-purple-700 to-indigo-950' },
    { title: '🎧 Chill & Lo-Fi Beats', desc: 'Focus & Study Rhythms', query: 'Lo-Fi Chill Beats', color: 'from-blue-600 to-cyan-950' },
    { title: '🎸 Rock & Indie Classics', desc: 'Guitar Solos & Anthems', query: 'Rock Classics', color: 'from-teal-600 to-slate-950' },
    { title: '🔥 Desi Hip Hop', desc: 'Bohemia, KR$NA & Seedhe Maut', query: 'Desi Hip Hop', color: 'from-red-800 to-black' },
  ];

  return (
    <div className="space-y-6 pb-36 selection:bg-[#1ed760] selection:text-black">
      {/* 1. Spotify-Grade Search Input Bar */}
      <div className="space-y-3">
        <div className="relative max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#b3b3b3]" />
          <input
            type="text"
            value={query}
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

        {/* 2. Category Filter Pills (When search query is active) */}
        {query.trim() && results && (
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
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

      {/* Error State */}
      {searchError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-xs text-red-300 select-none">
          <p className="font-bold mb-1">Search Connection Error</p>
          <p>{searchError}</p>
        </div>
      )}

      {/* 3. Empty Search State: Recent Searches & Browse All */}
      {!query.trim() && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* A. Recent Searches Shelf with individual 1-Tap 'X' Delete */}
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
                  onClick={() => clearAllRecentItems()}
                  className="text-xs text-[#b3b3b3] hover:text-red-400 transition cursor-pointer font-semibold flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear all</span>
                </button>
              </div>

              {/* Horizontal Scroll Carousel of Recent Items */}
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
                {recentItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (item.trackData) {
                        handleTrackClick(item.trackData);
                      } else {
                        handleSelectSuggestion(item.title);
                      }
                    }}
                    className="w-[140px] sm:w-44 shrink-0 bg-[#181818] hover:bg-[#242424] p-3 rounded-xl group transition-all duration-200 cursor-pointer snap-start flex flex-col justify-between border border-white/5 relative"
                  >
                    {/* 1-Tap Delete 'X' Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeRecentItem(item.id);
                      }}
                      className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/60 hover:bg-red-500/80 text-white/80 hover:text-white transition shadow cursor-pointer opacity-0 group-hover:opacity-100"
                      title="Remove from history"
                      aria-label="Remove from history"
                    >
                      <X className="w-3 h-3" />
                    </button>

                    <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-[#282828] mb-2.5 shadow-md">
                      <img
                        src={item.coverUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    </div>

                    <div>
                      <p className="font-bold text-xs sm:text-sm text-white truncate group-hover:text-[#1ed760] transition">
                        {item.title}
                      </p>
                      <p className="text-[10px] text-[#b3b3b3] truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* B. Spotify-Style "Browse All" 2-Column Vibrant Grid */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 sm:w-5 sm:h-5 text-[#1ed760]" />
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Browse All Genres & Moods
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {browseCategories.map((cat) => (
                <div
                  key={cat.title}
                  onClick={() => handleSelectSuggestion(cat.query)}
                  className={`p-4 rounded-xl bg-gradient-to-br ${cat.color} hover:brightness-110 transition cursor-pointer select-none shadow-md group border border-white/10 flex flex-col justify-between min-h-[90px] sm:min-h-[105px]`}
                >
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-white leading-snug group-hover:scale-105 transition origin-left">
                      {cat.title}
                    </h3>
                    <p className="text-[10px] text-white/70 mt-1 line-clamp-1">
                      {cat.desc}
                    </p>
                  </div>
                  <span className="text-[10px] text-white/80 font-bold self-end mt-2">
                    Explore →
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* 4. Search Results View */}
      {query.trim() && results && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Zero Results View */}
          {results.tracks.length === 0 && results.artists.length === 0 && results.albums.length === 0 ? (
            <div className="py-16 text-center text-[#b3b3b3] space-y-4 select-none">
              <p className="text-lg font-bold text-white">No results found for "{query}"</p>
              <p className="text-xs max-w-sm mx-auto text-[#727272]">
                Please check your spelling, or try searching for one of these trending queries:
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {['Atif Aslam', 'Coke Studio', 'Arijit Singh', 'AP Dhillon', 'Pasoori', 'Drake'].map((suggest) => (
                  <button
                    key={suggest}
                    onClick={() => handleSelectSuggestion(suggest)}
                    className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/15 text-xs text-white font-semibold transition cursor-pointer border border-white/10"
                  >
                    {suggest}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* TAB: ALL */}
              {activeTab === 'all' && (
                <div className="space-y-8">
                  {/* Top Result + Songs List (50/50 Split) */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Top Result Hero Card (Smart Artist vs Song Classification) */}
                    <div className="lg:col-span-5">
                      <h2 className="text-base sm:text-lg font-bold text-white mb-3">
                        Top Result
                      </h2>

                      {isArtistTopResult && topArtist ? (
                        /* Artist Top Result Card (Spotify Style) */
                        <div
                          onClick={() => handleArtistClick(topArtist)}
                          className="bg-[#181818] hover:bg-[#242424] p-5 rounded-2xl group transition-all duration-200 cursor-pointer shadow-xl border border-white/5 relative"
                        >
                          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-[#242424] mb-4 shadow-lg border border-white/10 group-hover:border-[#1ed760]/50 transition">
                            <img
                              src={topArtist.pictureBig || topArtist.pictureMedium || topArtist.picture}
                              alt={topArtist.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            />
                          </div>

                          <h3 className="text-xl sm:text-2xl font-black text-white truncate group-hover:text-[#1ed760] transition">
                            {topArtist.name}
                          </h3>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-bold text-white uppercase tracking-wider">
                              Artist
                            </span>
                          </div>

                          {/* Play button */}
                          {topTrack && (
                            <div className="absolute right-5 bottom-5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTrackClick(topTrack, results.tracks);
                                }}
                                className="w-12 h-12 rounded-full bg-[#1ed760] text-black flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition cursor-pointer"
                                aria-label="Play artist"
                              >
                                {currentTrack?.id === topTrack.id && playbackState === 'playing' ? (
                                  <Pause className="w-5 h-5 fill-black" />
                                ) : (
                                  <Play className="w-5 h-5 fill-black ml-0.5" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      ) : topTrack ? (
                        /* Song Top Result Card */
                        <div
                          onClick={() => handleTrackClick(topTrack, results.tracks)}
                          className="bg-[#181818] hover:bg-[#242424] p-5 rounded-2xl group transition-all duration-200 cursor-pointer shadow-xl border border-white/5 relative"
                        >
                          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-[#242424] mb-4 shadow-md border border-white/10">
                            <img
                              src={topTrack.coverUrl}
                              alt={topTrack.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            />
                          </div>

                          <h3 className="text-xl font-black text-white truncate group-hover:text-[#1ed760] transition">
                            {topTrack.title}
                          </h3>
                          <p className="text-xs text-[#b3b3b3] mt-1 truncate">
                            <span className="font-semibold text-white">{topTrack.artist}</span> • Song
                          </p>

                          <div className="mt-3 flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-[#1ed760]/10 border border-[#1ed760]/20 text-[10px] font-bold text-[#1ed760] uppercase tracking-wider">
                              320k Master
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleLikeTrack(topTrack);
                              }}
                              className="p-1.5 rounded-full hover:bg-white/10 text-[#b3b3b3] hover:text-white transition cursor-pointer"
                              title={likedTracks.some(t => t.id === topTrack.id) ? 'Unlike' : 'Like'}
                            >
                              <Heart
                                className={`w-4 h-4 transition ${
                                  likedTracks.some(t => t.id === topTrack.id)
                                    ? 'fill-[#1ed760] text-[#1ed760]'
                                    : ''
                                }`}
                              />
                            </button>
                          </div>

                          {/* Play button */}
                          <div className="absolute right-5 bottom-5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTrackClick(topTrack, results.tracks);
                              }}
                              className="w-12 h-12 rounded-full bg-[#1ed760] text-black flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition cursor-pointer"
                              aria-label="Play top result"
                            >
                              {currentTrack?.id === topTrack.id && playbackState === 'playing' ? (
                                <Pause className="w-5 h-5 fill-black" />
                              ) : (
                                <Play className="w-5 h-5 fill-black ml-0.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    {/* Top 5 Songs List */}
                    <div className="lg:col-span-7">
                      <h2 className="text-base sm:text-lg font-bold text-white mb-3">
                        Songs
                      </h2>
                      <div className="space-y-1">
                        {results.tracks.slice(0, 5).map((track) => {
                          const isThisPlaying = currentTrack?.id === track.id && playbackState === 'playing';
                          const isLiked = likedTracks.some((t) => t.id === track.id);

                          return (
                            <div
                              key={track.id}
                              onClick={() => handleTrackClick(track, results.tracks)}
                              className="group flex items-center justify-between p-2 rounded-lg hover:bg-white/10 transition cursor-pointer select-none"
                            >
                              <div className="flex items-center gap-3 min-w-0 pr-3">
                                <div className="w-10 h-10 rounded-md bg-[#242424] shrink-0 relative overflow-hidden">
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
                                  <p className={`text-xs sm:text-sm font-bold truncate leading-snug group-hover:text-[#1ed760] transition ${isThisPlaying ? 'text-[#1ed760]' : 'text-white'}`}>
                                    {track.title}
                                  </p>
                                  <p className="text-[11px] text-[#b3b3b3] truncate mt-0.5">
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
                                  className="p-1.5 rounded-full hover:bg-white/10 text-[#b3b3b3] hover:text-white transition cursor-pointer"
                                  title={isLiked ? 'Unlike' : 'Like'}
                                >
                                  <Heart
                                    className={`w-3.5 h-3.5 transition ${
                                      isLiked ? 'fill-[#1ed760] text-[#1ed760]' : ''
                                    }`}
                                  />
                                </button>
                                <span className="tabular-nums text-[11px]">{formatDuration(track.duration)}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Horizontal Shelf: Artists */}
                  {results.artists.length > 0 && (
                    <section className="space-y-3">
                      <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                        Artists
                      </h2>
                      <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
                        {results.artists.map((artist) => (
                          <div
                            key={artist.id}
                            onClick={() => handleArtistClick(artist)}
                            className="w-28 sm:w-36 shrink-0 bg-[#181818] hover:bg-[#242424] p-3 rounded-xl group transition-all duration-200 cursor-pointer snap-start text-center border border-white/5"
                          >
                            <div className="relative aspect-square w-full rounded-full overflow-hidden bg-[#282828] mb-2.5 shadow-lg border border-white/10 mx-auto group-hover:border-[#1ed760]/50 transition">
                              <img
                                src={artist.pictureBig || artist.pictureMedium || artist.picture}
                                alt={artist.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              />
                            </div>
                            <p className="font-bold text-xs sm:text-sm text-white truncate group-hover:text-[#1ed760] transition">
                              {artist.name}
                            </p>
                            <p className="text-[10px] text-[#b3b3b3] mt-0.5">
                              Artist
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Horizontal Shelf: Albums */}
                  {results.albums.length > 0 && (
                    <section className="space-y-3">
                      <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                        Albums
                      </h2>
                      <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
                        {results.albums.map((album) => (
                          <div
                            key={album.id}
                            onClick={() => handleSelectSuggestion(`${album.title} ${album.artist?.name || ''}`.trim())}
                            className="w-[138px] sm:w-44 shrink-0 bg-[#181818] hover:bg-[#242424] p-2.5 sm:p-3 rounded-xl group transition-all duration-200 cursor-pointer snap-start border border-white/5"
                          >
                            <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-[#282828] mb-2.5 shadow-md group-hover:border-[#1ed760]/30 transition">
                              <img
                                src={album.coverBig || album.coverMedium || album.cover}
                                alt={album.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              />
                            </div>
                            <p className="font-bold text-xs sm:text-sm text-white truncate group-hover:text-[#1ed760] transition">
                              {album.title}
                            </p>
                            <p className="text-[10px] text-[#b3b3b3] truncate mt-0.5">
                              {album.artist?.name || 'Album'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Remaining Tracks (All Matches) */}
                  {results.tracks.length > 5 && (
                    <section className="space-y-3">
                      <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                        More Songs
                      </h2>
                      <div className="space-y-1">
                        {results.tracks.slice(5).map((track, idx) => {
                          const isThisPlaying = currentTrack?.id === track.id && playbackState === 'playing';
                          const isLiked = likedTracks.some((t) => t.id === track.id);

                          return (
                            <div
                              key={track.id}
                              onClick={() => handleTrackClick(track, results.tracks)}
                              className="group flex items-center justify-between p-2.5 rounded-lg hover:bg-white/10 transition cursor-pointer select-none"
                            >
                              <div className="flex items-center gap-3 min-w-0 pr-3">
                                <span className="w-5 text-center text-xs text-[#727272] tabular-nums shrink-0">
                                  {idx + 6}
                                </span>
                                <div className="w-10 h-10 rounded-md bg-[#242424] shrink-0 relative overflow-hidden">
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
                                  <p className={`text-xs sm:text-sm font-bold truncate leading-snug group-hover:text-[#1ed760] transition ${isThisPlaying ? 'text-[#1ed760]' : 'text-white'}`}>
                                    {track.title}
                                  </p>
                                  <p className="text-[11px] text-[#b3b3b3] truncate mt-0.5">
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
                                  className="p-1.5 rounded-full hover:bg-white/10 text-[#b3b3b3] hover:text-white transition cursor-pointer"
                                  title={isLiked ? 'Unlike' : 'Like'}
                                >
                                  <Heart
                                    className={`w-3.5 h-3.5 transition ${
                                      isLiked ? 'fill-[#1ed760] text-[#1ed760]' : ''
                                    }`}
                                  />
                                </button>
                                <span className="tabular-nums text-[11px]">{formatDuration(track.duration)}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  )}
                </div>
              )}

              {/* TAB: SONGS ONLY */}
              {activeTab === 'songs' && (
                <div className="space-y-2">
                  {results.tracks.map((track, idx) => {
                    const isThisPlaying = currentTrack?.id === track.id && playbackState === 'playing';
                    const isLiked = likedTracks.some((t) => t.id === track.id);

                    return (
                      <div
                        key={track.id}
                        onClick={() => handleTrackClick(track, results.tracks)}
                        className="group flex items-center justify-between p-2.5 rounded-lg hover:bg-white/10 transition cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-3">
                          <span className="w-5 text-center text-xs text-[#727272] tabular-nums shrink-0">
                            {idx + 1}
                          </span>
                          <div className="w-11 h-11 rounded-md bg-[#242424] shrink-0 relative overflow-hidden">
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
                            <p className={`text-xs sm:text-sm font-bold truncate leading-snug group-hover:text-[#1ed760] transition ${isThisPlaying ? 'text-[#1ed760]' : 'text-white'}`}>
                              {track.title}
                            </p>
                            <p className="text-[11px] text-[#b3b3b3] truncate mt-0.5">
                              {track.artist}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 text-xs text-[#b3b3b3]">
                          <span className="hidden sm:inline px-2 py-0.5 rounded bg-[#1ed760]/10 border border-[#1ed760]/20 text-[9px] font-bold text-[#1ed760] uppercase">
                            320k
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLikeTrack(track);
                            }}
                            className="p-1.5 rounded-full hover:bg-white/10 text-[#b3b3b3] hover:text-white transition cursor-pointer"
                            title={isLiked ? 'Unlike' : 'Like'}
                          >
                            <Heart
                              className={`w-4 h-4 transition ${
                                isLiked ? 'fill-[#1ed760] text-[#1ed760]' : ''
                              }`}
                            />
                          </button>
                          <span className="tabular-nums text-xs">{formatDuration(track.duration)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAB: ARTISTS ONLY */}
              {activeTab === 'artists' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                  {results.artists.map((artist) => (
                    <div
                      key={artist.id}
                      onClick={() => handleArtistClick(artist)}
                      className="bg-[#181818] hover:bg-[#242424] p-4 rounded-xl group transition-all duration-200 cursor-pointer text-center border border-white/5"
                    >
                      <div className="relative aspect-square w-full rounded-full overflow-hidden bg-[#282828] mb-3 shadow-lg border border-white/10 mx-auto group-hover:border-[#1ed760]/50 transition">
                        <img
                          src={artist.pictureBig || artist.pictureMedium || artist.picture}
                          alt={artist.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      </div>
                      <p className="font-bold text-sm text-white truncate group-hover:text-[#1ed760] transition">
                        {artist.name}
                      </p>
                      <p className="text-xs text-[#b3b3b3] mt-0.5">
                        Artist
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB: ALBUMS ONLY */}
              {activeTab === 'albums' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                  {results.albums.map((album) => (
                    <div
                      key={album.id}
                      onClick={() => handleSelectSuggestion(`${album.title} ${album.artist?.name || ''}`.trim())}
                      className="bg-[#181818] hover:bg-[#242424] p-3 rounded-xl group transition-all duration-200 cursor-pointer border border-white/5"
                    >
                      <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-[#282828] mb-3 shadow-md group-hover:border-[#1ed760]/30 transition">
                        <img
                          src={album.coverBig || album.coverMedium || album.cover}
                          alt={album.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      </div>
                      <p className="font-bold text-sm text-white truncate group-hover:text-[#1ed760] transition">
                        {album.title}
                      </p>
                      <p className="text-xs text-[#b3b3b3] truncate mt-0.5">
                        {album.artist?.name || 'Album'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
