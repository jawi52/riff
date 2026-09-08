import React, { useState, useEffect, useCallback } from 'react';
import { fetchCharts, ChartsResponse } from '../../lib/api';
import { Track } from '../../types';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { 
  Play, 
  Pause, 
  Radio, 
  Flame, 
  Disc, 
  Mic2, 
  RotateCw, 
  AlertCircle 
} from 'lucide-react';

interface HomeFeedProps {
  userName?: string;
}

export const HomeFeed: React.FC<HomeFeedProps> = () => {
  const [charts, setCharts] = useState<ChartsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'music' | 'charts'>('all');

  const { currentTrack, playbackState, playTrack, togglePlayPause } = usePlayerStore();

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

  useEffect(() => {
    loadCharts();
  }, [loadCharts]);

  // Dynamic time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const handleTrackClick = (track: Track) => {
    if (currentTrack?.id === track.id) {
      togglePlayPause();
    } else {
      playTrack(track, charts?.topTracks || [track]);
    }
  };

  // Skeletons while loading
  if (isLoading && !charts) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-9 w-48 bg-white/10 rounded-lg" />
        {/* Filter Pills Skeleton */}
        <div className="flex gap-2">
          <div className="h-8 w-16 bg-white/10 rounded-full" />
          <div className="h-8 w-20 bg-white/10 rounded-full" />
          <div className="h-8 w-20 bg-white/10 rounded-full" />
        </div>
        {/* 6-Tile Grid Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-14 sm:h-16 bg-white/5 rounded-md flex items-center gap-3 p-1">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/10 rounded shrink-0" />
              <div className="flex-1 space-y-1.5 pr-2">
                <div className="h-3 w-3/4 bg-white/10 rounded" />
                <div className="h-2.5 w-1/2 bg-white/5 rounded" />
              </div>
            </div>
          ))}
        </div>
        {/* Horizontal Shelf Skeleton */}
        <div className="space-y-3">
          <div className="h-6 w-40 bg-white/10 rounded" />
          <div className="flex gap-4 overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-36 sm:w-44 shrink-0 bg-white/5 p-3 rounded-lg space-y-3">
                <div className="w-full aspect-square bg-white/10 rounded-md" />
                <div className="h-3 w-3/4 bg-white/10 rounded" />
                <div className="h-2.5 w-1/2 bg-white/5 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error State with Retry
  if (error && !charts) {
    return (
      <div className="py-16 text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-red-500/10 text-red-400 flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-white">Live Charts Temporarily Unavailable</h2>
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

  const topSixTracks = (charts?.topTracks || []).slice(0, 6);
  const remainingTracks = (charts?.topTracks || []).slice(6);
  const artists = charts?.topArtists || [];
  const albums = charts?.topAlbums || [];

  return (
    <div className="space-y-8 pb-32">
      {/* 1. Header Greeting & Filter Pills */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-4">
          {getGreeting()}
        </h1>

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeFilter === 'all'
                ? 'bg-white text-black'
                : 'bg-[#242424] hover:bg-[#2a2a2a] text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveFilter('music')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeFilter === 'music'
                ? 'bg-white text-black'
                : 'bg-[#242424] hover:bg-[#2a2a2a] text-white'
            }`}
          >
            Music
          </button>
          <button
            onClick={() => setActiveFilter('charts')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeFilter === 'charts'
                ? 'bg-white text-black'
                : 'bg-[#242424] hover:bg-[#2a2a2a] text-white'
            }`}
          >
            Top Charts
          </button>
        </div>
      </div>

      {/* 2. Signature 6-Tile Quick Access Grid (2-col mobile, 3-col desktop) */}
      <section>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
          {topSixTracks.map((track) => {
            const isThisTrackPlaying = currentTrack?.id === track.id && playbackState === 'playing';

            return (
              <div
                key={track.id}
                onClick={() => handleTrackClick(track)}
                className="group flex items-center bg-[#242424]/70 hover:bg-[#2a2a2a] rounded-md overflow-hidden transition-all duration-200 cursor-pointer select-none shadow-sm hover:shadow-md relative"
              >
                {/* Artwork */}
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

                {/* Track Info */}
                <div className="flex-1 min-w-0 px-2.5 sm:px-3 py-1">
                  <p className="text-xs sm:text-sm font-bold text-white truncate leading-tight">
                    {track.title}
                  </p>
                  <p className="text-[10px] sm:text-xs text-[#b3b3b3] truncate mt-0.5">
                    {track.artist}
                  </p>
                </div>

                {/* Green Play Button */}
                <div className="pr-2.5 sm:pr-3 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTrackClick(track);
                    }}
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#1ed760] text-black flex items-center justify-center shadow-lg transition-all duration-200 cursor-pointer ${
                      isThisTrackPlaying 
                        ? 'opacity-100 scale-100' 
                        : 'opacity-0 group-hover:opacity-100 group-hover:scale-105 active:scale-95'
                    }`}
                    aria-label="Play"
                  >
                    {isThisTrackPlaying ? (
                      <Pause className="w-4 h-4 fill-black" />
                    ) : (
                      <Play className="w-4 h-4 fill-black ml-0.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Horizontal Shelf: Top Charts & Trending Now */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-[#1ed760]" />
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Top Charts & Trending Now
            </h2>
          </div>
          <span className="text-xs font-bold text-[#b3b3b3] hover:text-white transition cursor-pointer">
            Live Global API
          </span>
        </div>

        {/* Scrollable Track Cards Carousel */}
        <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
          {remainingTracks.map((track) => {
            const isThisTrackPlaying = currentTrack?.id === track.id && playbackState === 'playing';

            return (
              <div
                key={track.id}
                onClick={() => handleTrackClick(track)}
                className="w-36 sm:w-44 shrink-0 bg-[#181818] hover:bg-[#222222] p-3 rounded-lg group transition-all duration-200 cursor-pointer snap-start flex flex-col justify-between"
              >
                {/* Artwork with floating play button */}
                <div className="relative aspect-square w-full rounded-md overflow-hidden bg-[#282828] mb-3 shadow-md">
                  <img
                    src={track.coverUrl}
                    alt={track.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    loading="lazy"
                  />

                  {/* Hover Play Button */}
                  <div className="absolute right-2 bottom-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTrackClick(track);
                      }}
                      className={`w-10 h-10 rounded-full bg-[#1ed760] text-black flex items-center justify-center shadow-xl transition-all duration-200 cursor-pointer ${
                        isThisTrackPlaying
                          ? 'opacity-100 translate-y-0'
                          : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 active:scale-95'
                      }`}
                    >
                      {isThisTrackPlaying ? (
                        <Pause className="w-4 h-4 fill-black" />
                      ) : (
                        <Play className="w-4 h-4 fill-black ml-0.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Titles */}
                <div>
                  <p className="font-bold text-xs sm:text-sm text-white truncate leading-snug">
                    {track.title}
                  </p>
                  <p className="text-[11px] text-[#b3b3b3] truncate mt-1">
                    {track.artist}
                  </p>
                </div>

                <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-[#7c7c7c]">
                  <span className="text-[#1ed760] font-semibold">320kbps CD Master</span>
                  <span>{Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Horizontal Shelf: Popular Artists (Circular Cards) */}
      {artists.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Mic2 className="w-5 h-5 text-[#1ed760]" />
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Popular Artists
            </h2>
          </div>

          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
            {artists.map((artist) => (
              <div
                key={artist.id}
                className="w-32 sm:w-40 shrink-0 bg-[#181818] hover:bg-[#222222] p-3 rounded-lg group transition-all duration-200 cursor-pointer snap-start text-center"
              >
                <div className="relative aspect-square w-full rounded-full overflow-hidden bg-[#282828] mb-3 shadow-lg border border-white/10 mx-auto">
                  <img
                    src={artist.pictureBig || artist.pictureMedium || artist.picture}
                    alt={artist.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    loading="lazy"
                  />
                </div>
                <p className="font-bold text-xs sm:text-sm text-white truncate">
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

      {/* 5. Horizontal Shelf: Hot Albums & New Releases */}
      {albums.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Disc className="w-5 h-5 text-[#1ed760]" />
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Hot Albums & Releases
            </h2>
          </div>

          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
            {albums.map((album) => (
              <div
                key={album.id}
                className="w-36 sm:w-44 shrink-0 bg-[#181818] hover:bg-[#222222] p-3 rounded-lg group transition-all duration-200 cursor-pointer snap-start"
              >
                <div className="relative aspect-square w-full rounded-md overflow-hidden bg-[#282828] mb-3 shadow-md">
                  <img
                    src={album.coverBig || album.coverMedium || album.cover}
                    alt={album.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    loading="lazy"
                  />
                </div>
                <p className="font-bold text-xs sm:text-sm text-white truncate">
                  {album.title}
                </p>
                <p className="text-[11px] text-[#b3b3b3] truncate mt-1">
                  {album.artist?.name || 'Album'}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
