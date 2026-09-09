import React, { useState, useEffect, useCallback } from 'react';
import { fetchCharts, ChartsResponse } from '../../lib/api';
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
  Compass
} from 'lucide-react';

interface HomeFeedProps {
  userName?: string;
  onSelectQuery?: (query: string) => void;
}

export const HomeFeed: React.FC<HomeFeedProps> = ({ userName, onSelectQuery }) => {
  const [charts, setCharts] = useState<ChartsResponse | null>(null);
  const [recentTracks, setRecentTracks] = useState<RecentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'music' | 'charts' | 'foryou'>('all');

  const { currentTrack, playbackState, playTrack, togglePlayPause } = usePlayerStore();

  // Load live charts from Azure API
  const loadCharts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchCharts();
      setCharts(data);
    } catch (err: any) {
      console.error('Failed to load charts from Azure API:', err);
      setError(err?.message || 'Could not connect to live charts engine');
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
    loadCharts();
    syncRecentItems();

    const handleRecentUpdate = () => syncRecentItems();
    window.addEventListener('riff_recent_searches_updated', handleRecentUpdate);
    return () => window.removeEventListener('riff_recent_searches_updated', handleRecentUpdate);
  }, [loadCharts, syncRecentItems]);

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
    if (hour < 12) return { title: 'Morning Energy Kickstart', desc: 'Uplifting hits to power your day' };
    if (hour < 17) return { title: 'Afternoon Focus Beats', desc: 'In-the-zone studio master rhythms' };
    if (hour < 21) return { title: 'Evening Unwind Session', desc: 'Smooth sounds to relax and reset' };
    return { title: 'Late Night Lo-Fi & Chill', desc: 'Atmospheric midnight listening' };
  };

  const handleTrackClick = (track: Track, queueContext?: Track[]) => {
    if (currentTrack?.id === track.id) {
      togglePlayPause();
    } else {
      playTrack(track, queueContext || charts?.topTracks || [track]);
    }
  };

  // 1. Skeletons while loading
  if (isLoading && !charts) {
    return (
      <div className="space-y-6 sm:space-y-8 animate-pulse pb-32">
        <div className="h-8 w-44 bg-white/10 rounded-lg" />
        
        {/* Filter Pills Skeleton */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <div className="h-8 w-16 bg-white/10 rounded-full shrink-0" />
          <div className="h-8 w-20 bg-white/10 rounded-full shrink-0" />
          <div className="h-8 w-24 bg-white/10 rounded-full shrink-0" />
          <div className="h-8 w-28 bg-white/10 rounded-full shrink-0" />
        </div>

        {/* 6-Tile Grid Skeleton (2 cols mobile, 3 cols desktop) */}
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
              <div key={i} className="w-36 sm:w-44 shrink-0 bg-white/5 p-3 rounded-xl space-y-3">
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
  if (error && !charts) {
    return (
      <div className="py-20 text-center space-y-4 select-none">
        <div className="w-12 h-12 mx-auto rounded-full bg-red-500/10 text-red-400 flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-white">Live Engine Temporarily Unavailable</h2>
        <p className="text-xs text-[#b3b3b3] max-w-sm mx-auto">{error}</p>
        <button
          onClick={loadCharts}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black font-bold text-xs hover:scale-105 active:scale-95 transition cursor-pointer"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Retry Connection</span>
        </button>
      </div>
    );
  }

  const allTracks = charts?.topTracks || [];
  const topSixTracks = allTracks.slice(0, 6);
  const artists = charts?.topArtists || [];
  const albums = charts?.topAlbums || [];
  const heroTrack = allTracks[0];
  const mood = getMoodTitle();

  // Jump Back In items: use stored recents or first tracks
  const jumpBackInTracks: Track[] = recentTracks.length > 0 
    ? recentTracks.map((r) => r.trackData!).filter(Boolean)
    : allTracks.slice(2, 8);

  return (
    <div className="space-y-7 sm:space-y-9 pb-36 selection:bg-[#1ed760] selection:text-black">
      {/* 1. Header Greeting & Filter Pills */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {getGreeting()}{userName ? `, ${userName}` : ''}
          </h1>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-[#1ed760]">
            <Sparkles className="w-3 h-3 text-[#1ed760]" />
            <span className="hidden xs:inline">Live Engine</span>
          </div>
        </div>

        {/* Filter Pills Carousel */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap select-none ${
              activeFilter === 'all'
                ? 'bg-white text-black shadow-md'
                : 'bg-[#242424] hover:bg-[#2e2e2e] text-white border border-white/5'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveFilter('music')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap select-none ${
              activeFilter === 'music'
                ? 'bg-white text-black shadow-md'
                : 'bg-[#242424] hover:bg-[#2e2e2e] text-white border border-white/5'
            }`}
          >
            Music
          </button>
          <button
            onClick={() => setActiveFilter('charts')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap select-none ${
              activeFilter === 'charts'
                ? 'bg-white text-black shadow-md'
                : 'bg-[#242424] hover:bg-[#2e2e2e] text-white border border-white/5'
            }`}
          >
            Top Charts
          </button>
          <button
            onClick={() => setActiveFilter('foryou')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap select-none ${
              activeFilter === 'foryou'
                ? 'bg-white text-black shadow-md'
                : 'bg-[#242424] hover:bg-[#2e2e2e] text-white border border-white/5'
            }`}
          >
            Made For You
          </button>
        </div>
      </section>

      {/* 2. Signature 6-Tile Quick Access Grid (2 columns on mobile, 3 on desktop) */}
      {(activeFilter === 'all' || activeFilter === 'music' || activeFilter === 'charts') && (
        <section>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
            {topSixTracks.map((track) => {
              const isThisTrackPlaying = currentTrack?.id === track.id && playbackState === 'playing';

              return (
                <div
                  key={track.id}
                  onClick={() => handleTrackClick(track, allTracks)}
                  className="group flex items-center bg-[#242424]/80 hover:bg-[#2e2e2e] rounded-md sm:rounded-lg overflow-hidden transition-all duration-200 cursor-pointer select-none shadow-sm hover:shadow-lg border border-white/5 relative"
                >
                  {/* Square Cover Artwork */}
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

                  {/* Title & Artist */}
                  <div className="flex-1 min-w-0 px-2 sm:px-3 py-1">
                    <p className="text-xs sm:text-sm font-bold text-white truncate leading-tight group-hover:text-[#1ed760] transition">
                      {track.title}
                    </p>
                    <p className="text-[10px] sm:text-xs text-[#b3b3b3] truncate mt-0.5">
                      {track.artist}
                    </p>
                  </div>

                  {/* Floating Green Play Button */}
                  <div className="pr-2 sm:pr-3 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTrackClick(track, allTracks);
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
      {heroTrack && (activeFilter === 'all' || activeFilter === 'foryou') && (
        <section>
          <div 
            onClick={() => handleTrackClick(heroTrack, allTracks)}
            className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-4 sm:p-6 bg-gradient-to-r from-emerald-950/80 via-[#181818] to-[#121212] border border-emerald-500/20 shadow-2xl group cursor-pointer transition transform hover:scale-[1.005]"
          >
            {/* Ambient Background Glow */}
            <div className="absolute right-0 top-0 bottom-0 w-1/2 overflow-hidden pointer-events-none opacity-20">
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
                      Daylist Spotlight
                    </span>
                    <span className="text-[10px] text-[#b3b3b3] hidden sm:inline">320k Studio Master</span>
                  </div>

                  <h3 className="text-sm sm:text-lg font-black text-white truncate tracking-tight group-hover:text-[#1ed760] transition">
                    {mood.title}
                  </h3>
                  <p className="text-xs text-[#b3b3b3] truncate mt-0.5">
                    {heroTrack.title} • {heroTrack.artist}
                  </p>
                </div>
              </div>

              {/* Big Play Action Button */}
              <div className="shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTrackClick(heroTrack, allTracks);
                  }}
                  className="w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-[#1ed760] text-black flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition cursor-pointer"
                  aria-label="Play Daylist"
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

      {/* 4. Horizontal Shelf: Jump Back In / Recently Played (2.5-Card Tease) */}
      {(activeFilter === 'all' || activeFilter === 'foryou') && jumpBackInTracks.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 sm:w-5 sm:h-5 text-[#1ed760]" />
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Jump Back In
              </h2>
            </div>
            <span className="text-[11px] font-bold text-[#b3b3b3] uppercase tracking-wider">
              {recentTracks.length > 0 ? 'Your History' : 'Recommended'}
            </span>
          </div>

          {/* 2.5 Cards Visible Shelf with Snap-to-Card Physics */}
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

                    {/* Floating Play Button */}
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

      {/* 5. Horizontal Shelf: Today's Biggest Hits (Ranked #1 - #10) */}
      {(activeFilter === 'all' || activeFilter === 'charts' || activeFilter === 'music') && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-[#1ed760]" />
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Today's Biggest Hits
              </h2>
            </div>
            <button 
              onClick={() => onSelectQuery?.('Top 50 Global')}
              className="text-xs font-bold text-[#b3b3b3] hover:text-[#1ed760] transition cursor-pointer"
            >
              Top 10 Global
            </button>
          </div>

          {/* Ranked Cards Carousel */}
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
            {allTracks.map((track, idx) => {
              const isThisTrackPlaying = currentTrack?.id === track.id && playbackState === 'playing';

              return (
                <div
                  key={`chart-${track.id}`}
                  onClick={() => handleTrackClick(track, allTracks)}
                  className="w-[138px] sm:w-44 shrink-0 bg-[#181818] hover:bg-[#242424] p-2.5 sm:p-3 rounded-xl group transition-all duration-200 cursor-pointer snap-start flex flex-col justify-between border border-white/5 relative"
                >
                  {/* Ranked Number Badge */}
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

                    {/* Floating Play Button */}
                    <div className="absolute right-1.5 bottom-1.5 sm:right-2 sm:bottom-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTrackClick(track, allTracks);
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

      {/* 6. Horizontal Shelf: Popular Artists (Circular Cards) */}
      {artists.length > 0 && (activeFilter === 'all' || activeFilter === 'music') && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#1ed760]" />
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Popular Artists
              </h2>
            </div>
            <span className="text-[11px] font-bold text-[#b3b3b3] uppercase tracking-wider">
              Trending
            </span>
          </div>

          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
            {artists.map((artist) => (
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

      {/* 7. Horizontal Shelf: Hot Albums & New Releases */}
      {albums.length > 0 && (activeFilter === 'all' || activeFilter === 'music') && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Disc className="w-4 h-4 sm:w-5 sm:h-5 text-[#1ed760]" />
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Hot Albums & Fresh Drops
              </h2>
            </div>
            <span className="text-[11px] font-bold text-[#b3b3b3] uppercase tracking-wider">
              New Releases
            </span>
          </div>

          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
            {albums.map((album) => (
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

      {/* 8. Curated Category Explorations (Zero Hardcoding - triggers live backend queries) */}
      {(activeFilter === 'all' || activeFilter === 'music') && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 sm:w-5 sm:h-5 text-[#1ed760]" />
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Explore Moods & Genres
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {[
              { title: 'Global Hits', query: 'Global Hits', color: 'from-emerald-600 to-teal-900' },
              { title: 'Hip-Hop & Rap', query: 'Hip Hop', color: 'from-orange-600 to-amber-950' },
              { title: 'Late Night Chill', query: 'Chill Lo-Fi', color: 'from-indigo-600 to-slate-950' },
              { title: 'Punjabi & Desi', query: 'Punjabi Hits', color: 'from-rose-600 to-red-950' },
            ].map((vibe) => (
              <div
                key={vibe.title}
                onClick={() => onSelectQuery?.(vibe.query)}
                className={`p-3.5 sm:p-4 rounded-xl bg-gradient-to-br ${vibe.color} hover:brightness-110 transition cursor-pointer select-none shadow-md group`}
              >
                <p className="text-xs sm:text-sm font-black text-white leading-snug group-hover:scale-105 transition origin-left">
                  {vibe.title}
                </p>
                <p className="text-[10px] text-white/70 mt-1 flex items-center gap-1 font-semibold">
                  <span>Explore</span>
                  <span>→</span>
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
