import React, { useState, useEffect, useCallback } from 'react';
import { fetchMultiRegionalFeeds, MultiRegionalFeed } from '../../lib/api';
import { Track } from '../../types';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { getRecentSearches, RecentItem } from '../../lib/recentSearches';
import { 
  Play, 
  Pause, 
  Radio, 
  Flame, 
  Disc, 
  Mic2, 
  RotateCw, 
  AlertCircle, 
  History, 
  Sparkles, 
  Compass,
  Music,
  Globe2,
  Zap
} from 'lucide-react';

interface HomeFeedProps {
  userName?: string;
  onSelectQuery?: (query: string) => void;
}

export const HomeFeed: React.FC<HomeFeedProps> = ({ userName, onSelectQuery }) => {
  const [feed, setFeed] = useState<MultiRegionalFeed | null>(null);
  const [recentTracks, setRecentTracks] = useState<RecentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRegion, setActiveRegion] = useState<'all' | 'pk' | 'in' | 'global'>('all');

  const { currentTrack, playbackState, playTrack, togglePlayPause } = usePlayerStore();

  // Load multi-regional live catalog from Azure backend
  const loadFeed = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchMultiRegionalFeeds();
      setFeed(data);
    } catch (err: any) {
      console.error('Failed to load multi-regional catalog from Azure API:', err);
      setError(err?.message || 'Could not connect to live music engine');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sync recent items from storage
  const syncRecentItems = useCallback(() => {
    const recents = getRecentSearches().filter((item) => item.type === 'track' && item.trackData);
    setRecentTracks(recents);
  }, []);

  useEffect(() => {
    loadFeed();
    syncRecentItems();

    const handleRecentUpdate = () => syncRecentItems();
    window.addEventListener('riff_recent_searches_updated', handleRecentUpdate);
    return () => window.removeEventListener('riff_recent_searches_updated', handleRecentUpdate);
  }, [loadFeed, syncRecentItems]);

  // Dynamic time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Dynamic time-based mood title
  const getMoodTitle = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { title: 'Morning Energy Kickstart', desc: 'Uplifting South Asian & Global hits' };
    if (hour < 17) return { title: 'Afternoon Focus Beats', desc: 'In-the-zone studio master rhythms' };
    if (hour < 21) return { title: 'Evening Unwind Session', desc: 'Coke Studio, Bollywood & Acoustic chill' };
    return { title: 'Late Night Lo-Fi & Urdu Chill', desc: 'Atmospheric midnight listening' };
  };

  const handleTrackClick = (track: Track, queueContext?: Track[]) => {
    if (currentTrack?.id === track.id) {
      togglePlayPause();
    } else {
      playTrack(track, queueContext || feed?.globalTracks || [track]);
    }
  };

  // 1. Skeletons while loading
  if (isLoading && !feed) {
    return (
      <div className="space-y-6 sm:space-y-8 animate-pulse pb-36">
        <div className="h-8 w-44 bg-white/10 rounded-lg" />
        
        {/* Filter Pills Skeleton */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <div className="h-8 w-20 bg-white/10 rounded-full shrink-0" />
          <div className="h-8 w-28 bg-white/10 rounded-full shrink-0" />
          <div className="h-8 w-32 bg-white/10 rounded-full shrink-0" />
          <div className="h-8 w-24 bg-white/10 rounded-full shrink-0" />
        </div>

        {/* 6-Tile Grid Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-14 sm:h-16 bg-white/5 rounded-md flex items-center gap-2.5 p-1">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/10 rounded shrink-0" />
              <div className="flex-1 space-y-1.5 pr-2">
                <div className="h-3 w-3/4 bg-white/10 rounded" />
                <div className="h-2.5 w-1/2 bg-white/5 rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* Spotlight Skeleton */}
        <div className="h-32 sm:h-36 bg-white/5 rounded-2xl w-full" />

        {/* Shelf Skeleton */}
        <div className="space-y-3">
          <div className="h-5 w-40 bg-white/10 rounded" />
          <div className="flex gap-3 overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-[138px] sm:w-44 shrink-0 bg-white/5 p-3 rounded-xl space-y-3">
                <div className="w-full aspect-square bg-white/10 rounded-lg" />
                <div className="h-3 w-3/4 bg-white/10 rounded" />
                <div className="h-2.5 w-1/2 bg-white/5 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 2. Error State with Retry
  if (error && !feed) {
    return (
      <div className="py-20 text-center space-y-4 select-none">
        <div className="w-12 h-12 mx-auto rounded-full bg-red-500/10 text-red-400 flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-white">Live Engine Temporarily Unavailable</h2>
        <p className="text-xs text-[#b3b3b3] max-w-sm mx-auto">{error}</p>
        <button
          onClick={loadFeed}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black font-bold text-xs hover:scale-105 active:scale-95 transition cursor-pointer"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Retry Connection</span>
        </button>
      </div>
    );
  }

  const {
    globalTracks,
    pakistanTracks,
    bollywoodTracks,
    punjabiTracks,
    newSongsTracks,
    quickAccessTracks,
    topArtists,
    topAlbums,
  } = feed!;

  // Dynamic hero track: prefers hot Pakistani/South Asian track or top Global
  const heroTrack = pakistanTracks[0] || bollywoodTracks[0] || globalTracks[0];
  const mood = getMoodTitle();

  // Jump Back In items
  const jumpBackInTracks: Track[] = recentTracks.length > 0 
    ? recentTracks.map((r) => r.trackData!).filter(Boolean)
    : pakistanTracks.slice(0, 6);

  return (
    <div className="space-y-7 sm:space-y-9 pb-36 selection:bg-[#1ed760] selection:text-black">
      {/* 1. Header Greeting & Region Selector Pills */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {getGreeting()}{userName ? `, ${userName}` : ''}
          </h1>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-[#1ed760]">
            <Sparkles className="w-3 h-3 text-[#1ed760]" />
            <span>320k Studio Master</span>
          </div>
        </div>

        {/* Region Filter Pills (Pakistan, India, Global, All) */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => setActiveRegion('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap select-none flex items-center gap-1.5 ${
              activeRegion === 'all'
                ? 'bg-white text-black shadow-md'
                : 'bg-[#242424] hover:bg-[#2e2e2e] text-white border border-white/5'
            }`}
          >
            <span>All Music</span>
          </button>

          <button
            onClick={() => setActiveRegion('pk')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap select-none flex items-center gap-1.5 ${
              activeRegion === 'pk'
                ? 'bg-[#1ed760] text-black shadow-md'
                : 'bg-[#242424] hover:bg-[#2e2e2e] text-white border border-white/5'
            }`}
          >
            <span>🇵🇰 Pakistan Hits</span>
          </button>

          <button
            onClick={() => setActiveRegion('in')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap select-none flex items-center gap-1.5 ${
              activeRegion === 'in'
                ? 'bg-[#1ed760] text-black shadow-md'
                : 'bg-[#242424] hover:bg-[#2e2e2e] text-white border border-white/5'
            }`}
          >
            <span>🇮🇳 India & Bollywood</span>
          </button>

          <button
            onClick={() => setActiveRegion('global')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap select-none flex items-center gap-1.5 ${
              activeRegion === 'global'
                ? 'bg-white text-black shadow-md'
                : 'bg-[#242424] hover:bg-[#2e2e2e] text-white border border-white/5'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>Global Hits</span>
          </button>
        </div>
      </section>

      {/* 2. Signature 6-Tile Quick Access Grid (2 columns on mobile, 3 on desktop) */}
      {(activeRegion === 'all' || activeRegion === 'pk' || activeRegion === 'in') && (
        <section>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
            {(activeRegion === 'pk' ? pakistanTracks.slice(0, 6) : activeRegion === 'in' ? bollywoodTracks.slice(0, 6) : quickAccessTracks).map((track) => {
              const isThisTrackPlaying = currentTrack?.id === track.id && playbackState === 'playing';

              return (
                <div
                  key={track.id}
                  onClick={() => handleTrackClick(track, quickAccessTracks)}
                  className="group flex items-center bg-[#242424]/80 hover:bg-[#2e2e2e] rounded-md sm:rounded-lg overflow-hidden transition-all duration-200 cursor-pointer select-none shadow-sm hover:shadow-lg border border-white/5 relative"
                >
                  <div className="w-12 h-12 sm:w-16 sm:h-16 shrink-0 bg-[#333] relative">
                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {isThisTrackPlaying && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Radio className="w-4 h-4 text-[#1ed760] animate-pulse" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 px-2 sm:px-3 py-1">
                    <p className="text-xs sm:text-sm font-bold text-white truncate leading-tight group-hover:text-[#1ed760] transition">
                      {track.title}
                    </p>
                    <p className="text-[10px] sm:text-xs text-[#b3b3b3] truncate mt-0.5">
                      {track.artist}
                    </p>
                  </div>

                  <div className="pr-2 sm:pr-3 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTrackClick(track, quickAccessTracks);
                      }}
                      className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-[#1ed760] text-black flex items-center justify-center shadow-lg transition-all duration-200 cursor-pointer ${
                        isThisTrackPlaying 
                          ? 'opacity-100 scale-100' 
                          : 'opacity-0 group-hover:opacity-100 group-hover:scale-105 active:scale-95'
                      }`}
                      aria-label="Play"
                    >
                      {isThisTrackPlaying ? (
                        <Pause className="w-3.5 h-3.5 fill-black" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 3. Spotify-Style Daylist / Mood Spotlight Banner */}
      {heroTrack && (activeRegion === 'all' || activeRegion === 'pk') && (
        <section>
          <div 
            onClick={() => handleTrackClick(heroTrack, pakistanTracks)}
            className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-4 sm:p-6 bg-gradient-to-r from-emerald-950/90 via-[#181818] to-[#121212] border border-emerald-500/25 shadow-2xl group cursor-pointer transition transform hover:scale-[1.005]"
          >
            <div className="absolute right-0 top-0 bottom-0 w-1/2 overflow-hidden pointer-events-none opacity-25">
              <img
                src={heroTrack.coverUrl}
                alt=""
                className="w-full h-full object-cover blur-2xl scale-125"
                aria-hidden="true"
              />
            </div>

            <div className="relative z-10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 sm:gap-5 min-w-0 flex-1">
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shadow-xl shrink-0 border border-white/10">
                  <img
                    src={heroTrack.coverUrl}
                    alt={heroTrack.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  {currentTrack?.id === heroTrack.id && playbackState === 'playing' && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Radio className="w-5 h-5 text-[#1ed760] animate-pulse" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-full bg-[#1ed760]/20 border border-[#1ed760]/30 text-[9px] sm:text-[10px] font-extrabold text-[#1ed760] uppercase tracking-wider">
                      Spotlight Track
                    </span>
                    <span className="text-[10px] text-[#b3b3b3] hidden sm:inline">Synced Lyrics Available</span>
                  </div>

                  <h3 className="text-sm sm:text-lg font-black text-white truncate tracking-tight group-hover:text-[#1ed760] transition">
                    {mood.title}
                  </h3>
                  <p className="text-xs text-[#b3b3b3] truncate mt-0.5 font-medium">
                    {heroTrack.title} • {heroTrack.artist}
                  </p>
                </div>
              </div>

              <div className="shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTrackClick(heroTrack, pakistanTracks);
                  }}
                  className="w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-[#1ed760] text-black flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition cursor-pointer"
                  aria-label="Play Spotlight Track"
                >
                  {currentTrack?.id === heroTrack.id && playbackState === 'playing' ? (
                    <Pause className="w-5 h-5 fill-black" />
                  ) : (
                    <Play className="w-5 h-5 fill-black ml-0.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. Horizontal Shelf: Jump Back In / Recently Played */}
      {(activeRegion === 'all') && jumpBackInTracks.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 sm:w-5 sm:h-5 text-[#1ed760]" />
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Jump Back In
            </h2>
          </div>

          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
            {jumpBackInTracks.map((track) => {
              const isThisTrackPlaying = currentTrack?.id === track.id && playbackState === 'playing';

              return (
                <div
                  key={`jump-${track.id}`}
                  onClick={() => handleTrackClick(track, jumpBackInTracks)}
                  className="w-[138px] sm:w-44 shrink-0 bg-[#181818] hover:bg-[#242424] p-2.5 sm:p-3 rounded-xl group transition-all duration-200 cursor-pointer snap-start flex flex-col justify-between border border-white/5"
                >
                  <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-[#282828] mb-2.5 shadow-md">
                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      loading="lazy"
                    />

                    <div className="absolute right-1.5 bottom-1.5 sm:right-2 sm:bottom-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTrackClick(track, jumpBackInTracks);
                        }}
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#1ed760] text-black flex items-center justify-center shadow-xl transition-all duration-200 cursor-pointer ${
                          isThisTrackPlaying
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 active:scale-95'
                        }`}
                        aria-label="Play"
                      >
                        {isThisTrackPlaying ? (
                          <Pause className="w-3.5 h-3.5 fill-black" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="font-bold text-xs sm:text-sm text-white truncate leading-snug group-hover:text-[#1ed760] transition">
                      {track.title}
                    </p>
                    <p className="text-[11px] text-[#b3b3b3] truncate mt-0.5">
                      {track.artist}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. Horizontal Shelf: ✨ Fresh Releases & New Songs */}
      {(activeRegion === 'all' || activeRegion === 'in' || activeRegion === 'pk') && newSongsTracks && newSongsTracks.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-[#1ed760]" />
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Fresh Releases & New Songs
            </h2>
          </div>

          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
            {newSongsTracks.map((track) => {
              const isThisTrackPlaying = currentTrack?.id === track.id && playbackState === 'playing';

              return (
                <div
                  key={`new-${track.id}`}
                  onClick={() => handleTrackClick(track, newSongsTracks)}
                  className="w-[138px] sm:w-44 shrink-0 bg-[#181818] hover:bg-[#242424] p-2.5 sm:p-3 rounded-xl group transition-all duration-200 cursor-pointer snap-start flex flex-col justify-between border border-white/5"
                >
                  <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-[#282828] mb-2.5 shadow-md">
                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      loading="lazy"
                    />

                    <div className="absolute right-1.5 bottom-1.5 sm:right-2 sm:bottom-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTrackClick(track, newSongsTracks);
                        }}
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#1ed760] text-black flex items-center justify-center shadow-xl transition-all duration-200 cursor-pointer ${
                          isThisTrackPlaying
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 active:scale-95'
                        }`}
                        aria-label="Play"
                      >
                        {isThisTrackPlaying ? (
                          <Pause className="w-3.5 h-3.5 fill-black" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="font-bold text-xs sm:text-sm text-white truncate leading-snug group-hover:text-[#1ed760] transition">
                      {track.title}
                    </p>
                    <p className="text-[11px] text-[#b3b3b3] truncate mt-0.5">
                      {track.artist}
                    </p>
                  </div>

                  <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-[#7c7c7c]">
                    <span className="text-[#1ed760] font-semibold">New</span>
                    <span>{Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 6. Horizontal Shelf: 🇵🇰 Trending in Pakistan (Coke Studio, Pop, Rap) */}
      {(activeRegion === 'all' || activeRegion === 'pk') && pakistanTracks.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🇵🇰</span>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Trending in Pakistan
            </h2>
          </div>

          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
            {pakistanTracks.map((track, idx) => {
              const isThisTrackPlaying = currentTrack?.id === track.id && playbackState === 'playing';

              return (
                <div
                  key={`pk-${track.id}`}
                  onClick={() => handleTrackClick(track, pakistanTracks)}
                  className="w-[138px] sm:w-44 shrink-0 bg-[#181818] hover:bg-[#242424] p-2.5 sm:p-3 rounded-xl group transition-all duration-200 cursor-pointer snap-start flex flex-col justify-between border border-white/5 relative"
                >
                  <div className="absolute top-4 left-4 z-10 w-6 h-6 rounded-full bg-black/70 backdrop-blur-md border border-white/10 flex items-center justify-center text-[10px] font-black text-[#1ed760] shadow-md">
                    #{idx + 1}
                  </div>

                  <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-[#282828] mb-2.5 shadow-md">
                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      loading="lazy"
                    />

                    <div className="absolute right-1.5 bottom-1.5 sm:right-2 sm:bottom-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTrackClick(track, pakistanTracks);
                        }}
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#1ed760] text-black flex items-center justify-center shadow-xl transition-all duration-200 cursor-pointer ${
                          isThisTrackPlaying
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 active:scale-95'
                        }`}
                        aria-label="Play"
                      >
                        {isThisTrackPlaying ? (
                          <Pause className="w-3.5 h-3.5 fill-black" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="font-bold text-xs sm:text-sm text-white truncate leading-snug group-hover:text-[#1ed760] transition">
                      {track.title}
                    </p>
                    <p className="text-[11px] text-[#b3b3b3] truncate mt-0.5">
                      {track.artist}
                    </p>
                  </div>

                  <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-[#7c7c7c]">
                    <span className="text-[#1ed760] font-semibold">320k Master</span>
                    <span>{Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 7. Horizontal Shelf: 🇮🇳 Bollywood & Indian Romance */}
      {(activeRegion === 'all' || activeRegion === 'in') && bollywoodTracks.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🇮🇳</span>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Bollywood & Indian Hits
            </h2>
          </div>

          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
            {bollywoodTracks.map((track, idx) => {
              const isThisTrackPlaying = currentTrack?.id === track.id && playbackState === 'playing';

              return (
                <div
                  key={`bolly-${track.id}`}
                  onClick={() => handleTrackClick(track, bollywoodTracks)}
                  className="w-[138px] sm:w-44 shrink-0 bg-[#181818] hover:bg-[#242424] p-2.5 sm:p-3 rounded-xl group transition-all duration-200 cursor-pointer snap-start flex flex-col justify-between border border-white/5 relative"
                >
                  <div className="absolute top-4 left-4 z-10 w-6 h-6 rounded-full bg-black/70 backdrop-blur-md border border-white/10 flex items-center justify-center text-[10px] font-black text-[#1ed760] shadow-md">
                    #{idx + 1}
                  </div>

                  <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-[#282828] mb-2.5 shadow-md">
                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      loading="lazy"
                    />

                    <div className="absolute right-1.5 bottom-1.5 sm:right-2 sm:bottom-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTrackClick(track, bollywoodTracks);
                        }}
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#1ed760] text-black flex items-center justify-center shadow-xl transition-all duration-200 cursor-pointer ${
                          isThisTrackPlaying
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 active:scale-95'
                        }`}
                        aria-label="Play"
                      >
                        {isThisTrackPlaying ? (
                          <Pause className="w-3.5 h-3.5 fill-black" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="font-bold text-xs sm:text-sm text-white truncate leading-snug group-hover:text-[#1ed760] transition">
                      {track.title}
                    </p>
                    <p className="text-[11px] text-[#b3b3b3] truncate mt-0.5">
                      {track.artist}
                    </p>
                  </div>

                  <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-[#7c7c7c]">
                    <span className="text-[#1ed760] font-semibold">320k</span>
                    <span>{Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 8. Horizontal Shelf: 🌾 Punjabi Hits & Desi Hip Hop */}
      {(activeRegion === 'all' || activeRegion === 'in' || activeRegion === 'pk') && punjabiTracks.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 sm:w-5 sm:h-5 text-[#1ed760]" />
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Punjabi Wave & Desi Hip-Hop
            </h2>
          </div>

          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
            {punjabiTracks.map((track) => {
              const isThisTrackPlaying = currentTrack?.id === track.id && playbackState === 'playing';

              return (
                <div
                  key={`punjabi-${track.id}`}
                  onClick={() => handleTrackClick(track, punjabiTracks)}
                  className="w-[138px] sm:w-44 shrink-0 bg-[#181818] hover:bg-[#242424] p-2.5 sm:p-3 rounded-xl group transition-all duration-200 cursor-pointer snap-start flex flex-col justify-between border border-white/5"
                >
                  <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-[#282828] mb-2.5 shadow-md">
                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      loading="lazy"
                    />

                    <div className="absolute right-1.5 bottom-1.5 sm:right-2 sm:bottom-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTrackClick(track, punjabiTracks);
                        }}
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#1ed760] text-black flex items-center justify-center shadow-xl transition-all duration-200 cursor-pointer ${
                          isThisTrackPlaying
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 active:scale-95'
                        }`}
                        aria-label="Play"
                      >
                        {isThisTrackPlaying ? (
                          <Pause className="w-3.5 h-3.5 fill-black" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="font-bold text-xs sm:text-sm text-white truncate leading-snug group-hover:text-[#1ed760] transition">
                      {track.title}
                    </p>
                    <p className="text-[11px] text-[#b3b3b3] truncate mt-0.5">
                      {track.artist}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 9. Horizontal Shelf: 🌍 Global Top Hits */}
      {(activeRegion === 'all' || activeRegion === 'global') && globalTracks.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-[#1ed760]" />
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Global Billboard Charts
            </h2>
          </div>

          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
            {globalTracks.map((track, idx) => {
              const isThisTrackPlaying = currentTrack?.id === track.id && playbackState === 'playing';

              return (
                <div
                  key={`chart-${track.id}`}
                  onClick={() => handleTrackClick(track, globalTracks)}
                  className="w-[138px] sm:w-44 shrink-0 bg-[#181818] hover:bg-[#242424] p-2.5 sm:p-3 rounded-xl group transition-all duration-200 cursor-pointer snap-start flex flex-col justify-between border border-white/5 relative"
                >
                  <div className="absolute top-4 left-4 z-10 w-6 h-6 rounded-full bg-black/70 backdrop-blur-md border border-white/10 flex items-center justify-center text-[10px] font-black text-[#1ed760] shadow-md">
                    #{idx + 1}
                  </div>

                  <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-[#282828] mb-2.5 shadow-md">
                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      loading="lazy"
                    />

                    <div className="absolute right-1.5 bottom-1.5 sm:right-2 sm:bottom-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTrackClick(track, globalTracks);
                        }}
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#1ed760] text-black flex items-center justify-center shadow-xl transition-all duration-200 cursor-pointer ${
                          isThisTrackPlaying
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 active:scale-95'
                        }`}
                        aria-label="Play"
                      >
                        {isThisTrackPlaying ? (
                          <Pause className="w-3.5 h-3.5 fill-black" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="font-bold text-xs sm:text-sm text-white truncate leading-snug group-hover:text-[#1ed760] transition">
                      {track.title}
                    </p>
                    <p className="text-[11px] text-[#b3b3b3] truncate mt-0.5">
                      {track.artist}
                    </p>
                  </div>

                  <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-[#7c7c7c]">
                    <span className="text-[#1ed760] font-semibold">320k</span>
                    <span>{Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 10. Horizontal Shelf: Popular Artists (Circular Cards) */}
      {topArtists.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Mic2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#1ed760]" />
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Featured Artists
            </h2>
          </div>

          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
            {topArtists.map((artist) => (
              <div
                key={`artist-${artist.id}`}
                onClick={() => onSelectQuery?.(artist.name)}
                className="w-28 sm:w-36 shrink-0 bg-[#181818] hover:bg-[#242424] p-3 rounded-xl group transition-all duration-200 cursor-pointer snap-start text-center border border-white/5 select-none"
              >
                <div className="relative aspect-square w-full rounded-full overflow-hidden bg-[#282828] mb-2.5 shadow-lg border border-white/10 mx-auto group-hover:border-[#1ed760]/50 transition">
                  <img
                    src={artist.pictureBig || artist.pictureMedium || artist.picture}
                    alt={artist.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    loading="lazy"
                  />
                </div>
                <p className="font-bold text-xs sm:text-sm text-white truncate group-hover:text-[#1ed760] transition">
                  {artist.name}
                </p>
                <p className="text-[11px] text-[#b3b3b3] mt-0.5">
                  Artist
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 11. Horizontal Shelf: Hot Albums & Releases */}
      {topAlbums.length > 0 && (activeRegion === 'all' || activeRegion === 'global') && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Disc className="w-4 h-4 sm:w-5 sm:h-5 text-[#1ed760]" />
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Hot Albums & Releases
            </h2>
          </div>

          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
            {topAlbums.map((album) => (
              <div
                key={`album-${album.id}`}
                onClick={() => onSelectQuery?.(`${album.title} ${album.artist?.name || ''}`.trim())}
                className="w-[138px] sm:w-44 shrink-0 bg-[#181818] hover:bg-[#242424] p-2.5 sm:p-3 rounded-xl group transition-all duration-200 cursor-pointer snap-start border border-white/5"
              >
                <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-[#282828] mb-2.5 shadow-md group-hover:border-[#1ed760]/30 transition">
                  <img
                    src={album.coverBig || album.coverMedium || album.cover}
                    alt={album.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    loading="lazy"
                  />
                </div>
                <p className="font-bold text-xs sm:text-sm text-white truncate group-hover:text-[#1ed760] transition">
                  {album.title}
                </p>
                <p className="text-[11px] text-[#b3b3b3] truncate mt-0.5">
                  {album.artist?.name || 'Album'}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 12. Horizontal Shelf: Curated South Asian & Global Discovery Vibe Cards */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 sm:w-5 sm:h-5 text-[#1ed760]" />
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            Explore South Asian & Global Vibes
          </h2>
        </div>

        {/* Full Horizontal Scroll for Discovery Cards instead of static grid! */}
        <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
          {[
            { title: '🇵🇰 Coke Studio & Sufi', desc: 'Acoustic, Spiritual & Pop', query: 'Coke Studio Pakistan', color: 'from-emerald-700 to-green-950' },
            { title: '🇵🇰 Pakistani Hip-Hop', desc: 'Young Stunners & Talha Anjum', query: 'Young Stunners Talha Anjum', color: 'from-stone-700 to-neutral-950' },
            { title: '🇮🇳 Bollywood Romance', desc: 'Arijit Singh & Soulful Hits', query: 'Bollywood Romance Arijit Singh', color: 'from-rose-700 to-pink-950' },
            { title: '🌾 Punjabi Hits', desc: 'AP Dhillon, Shubh & Diljit', query: 'Punjabi Top Hits', color: 'from-amber-600 to-orange-950' },
            { title: '🔥 Desi Hip Hop', desc: 'Bohemia, KR$NA & Seedhe Maut', query: 'Desi Hip Hop', color: 'from-red-800 to-black' },
            { title: '🌍 Global Viral 50', desc: 'TikTok & Social Trends', query: 'Global Viral Hits', color: 'from-cyan-700 to-blue-950' },
          ].map((vibe) => (
            <div
              key={vibe.title}
              onClick={() => onSelectQuery?.(vibe.query)}
              className={`w-[160px] sm:w-[200px] shrink-0 p-4 rounded-xl bg-gradient-to-br ${vibe.color} hover:brightness-110 transition cursor-pointer select-none shadow-md group border border-white/10 snap-start flex flex-col justify-between`}
            >
              <div>
                <p className="text-xs sm:text-sm font-black text-white leading-snug group-hover:scale-105 transition origin-left">
                  {vibe.title}
                </p>
                <p className="text-[10px] text-white/70 mt-1 line-clamp-1">
                  {vibe.desc}
                </p>
              </div>
              <p className="text-[10px] text-white/90 mt-3 flex items-center gap-1 font-bold">
                <span>Browse</span>
                <span>→</span>
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
