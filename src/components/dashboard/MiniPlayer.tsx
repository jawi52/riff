import React, { useRef } from 'react';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useLibraryStore } from '../../stores/useLibraryStore';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Radio,
  Heart
} from 'lucide-react';

export const MiniPlayer: React.FC = () => {
  const {
    currentTrack,
    playbackState,
    currentTime,
    duration,
    volume,
    isMuted,
    togglePlayPause,
    seek,
    nextTrack,
    previousTrack,
    setVolume,
    toggleMute,
  } = usePlayerStore();

  const { likedTracks, toggleLikeTrack } = useLibraryStore();
  const progressRef = useRef<HTMLDivElement | null>(null);

  const isPlaying = playbackState === 'playing';
  const isBuffering = playbackState === 'buffering';
  const isCurrentTrackLiked = currentTrack 
    ? likedTracks.some((t) => t.id === currentTrack.id) 
    : false;

  const handleToggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentTrack) return;
    await toggleLikeTrack(currentTrack);
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  const handleSeekClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || duration <= 0) return;
    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    seek(percentage * duration);
  };

  const handleSeekTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!progressRef.current || duration <= 0 || !e.touches[0]) return;
    const rect = progressRef.current.getBoundingClientRect();
    const touchX = e.touches[0].clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, touchX / rect.width));
    seek(percentage * duration);
  };

  return (
    <div className="fixed bottom-[60px] md:bottom-0 left-0 right-0 z-40 px-2.5 pb-2 md:pb-0 md:px-0 pointer-events-none">
      <div className="pointer-events-auto max-w-7xl mx-auto md:max-w-none bg-[#181818]/95 backdrop-blur-xl border border-white/10 md:border-x-0 md:border-b-0 md:border-t md:border-white/10 rounded-xl md:rounded-none px-3.5 py-2.5 md:px-6 md:py-3 shadow-2xl transition-all duration-200">
        {/* Slim Top Progress Line for Mobile Touch Bar */}
        <div 
          ref={progressRef}
          onClick={handleSeekClick}
          onTouchStart={handleSeekTouch}
          className="md:hidden -mx-3.5 -mt-2.5 mb-2.5 h-1.5 bg-white/10 relative cursor-pointer overflow-hidden rounded-t-xl"
        >
          <div 
            className="h-full bg-[#1ed760] transition-[width] duration-100 ease-linear rounded-r-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          {/* Left: Track Information */}
          <div className="flex items-center gap-3 min-w-0 flex-1 md:flex-initial md:w-[30%]">
            {currentTrack ? (
              <>
                <div className="relative w-11 h-11 sm:w-13 sm:h-13 shrink-0 rounded-lg overflow-hidden bg-[#282828] border border-white/10">
                  <img
                    src={currentTrack.coverUrl}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {isPlaying && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <Radio className="w-4 h-4 text-[#1ed760] animate-pulse" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs sm:text-sm font-bold text-white truncate leading-snug">
                      {currentTrack.title}
                    </p>
                    <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-[#1ed760]/10 border border-[#1ed760]/20 text-[9px] font-bold text-[#1ed760] shrink-0 uppercase tracking-wider">
                      320k Master
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-[#b3b3b3] truncate mt-0.5">
                    {currentTrack.artist}
                  </p>
                </div>

                {/* Heart / Favorite Button */}
                <button
                  onClick={handleToggleLike}
                  className="p-1.5 text-[#b3b3b3] hover:text-white transition cursor-pointer shrink-0"
                  aria-label={isCurrentTrackLiked ? 'Unlike track' : 'Like track'}
                  title={isCurrentTrackLiked ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
                >
                  <Heart
                    className={`w-4 h-4 transition ${
                      isCurrentTrackLiked ? 'fill-[#1ed760] text-[#1ed760]' : ''
                    }`}
                  />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2.5 py-1 text-xs text-[#b3b3b3]">
                <div className="w-10 h-10 rounded-lg bg-[#242424] flex items-center justify-center shrink-0 text-[#1ed760]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <p className="text-white font-bold truncate">Ready to stream</p>
                  <p className="text-[10px] text-[#7c7c7c] truncate">Select any track to start 320kbps playback</p>
                </div>
              </div>
            )}
          </div>

          {/* Center: Playback Controls & Desktop Scrubber */}
          <div className="flex flex-col items-center justify-center gap-1.5 flex-1 max-w-xl">
            {/* Control Buttons */}
            <div className="flex items-center gap-3 sm:gap-5">
              <button
                onClick={previousTrack}
                disabled={!currentTrack}
                className="text-[#b3b3b3] hover:text-white disabled:opacity-30 transition cursor-pointer p-1"
                aria-label="Previous track"
              >
                <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button
                onClick={togglePlayPause}
                disabled={!currentTrack}
                className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white hover:bg-white/90 active:scale-95 text-black flex items-center justify-center transition shadow-lg shadow-black/40 cursor-pointer disabled:opacity-40"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isBuffering ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-black" />
                ) : (
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-black ml-0.5" />
                )}
              </button>

              <button
                onClick={nextTrack}
                disabled={!currentTrack}
                className="text-[#b3b3b3] hover:text-white disabled:opacity-30 transition cursor-pointer p-1"
                aria-label="Next track"
              >
                <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Desktop Timeline Scrubber */}
            <div className="hidden md:flex items-center gap-2.5 w-full text-[11px] text-[#b3b3b3]">
              <span className="w-9 text-right tabular-nums">{formatTime(currentTime)}</span>
              
              <div 
                ref={progressRef}
                onClick={handleSeekClick}
                className="relative flex-1 h-1.5 bg-white/20 hover:bg-white/30 rounded-full cursor-pointer group"
              >
                <div 
                  className="h-full bg-white group-hover:bg-[#1ed760] rounded-full relative"
                  style={{ width: `${progressPercent}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition shadow-sm" />
                </div>
              </div>

              <span className="w-9 text-left tabular-nums">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right: Volume & Format (Desktop Only) */}
          <div className="hidden md:flex items-center justify-end gap-3 md:w-[30%]">
            <button
              onClick={toggleMute}
              className="text-[#b3b3b3] hover:text-white transition cursor-pointer"
              aria-label="Mute / Unmute"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-24 h-1 bg-white/20 rounded-full accent-white hover:accent-[#1ed760] cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
