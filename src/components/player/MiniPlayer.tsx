import React, { useRef, useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  Volume1,
  VolumeX,
  Maximize2,
  Heart,
  Loader2
} from 'lucide-react';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useLibraryStore } from '../../stores/useLibraryStore';

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export const MiniPlayer: React.FC = () => {
  const {
    currentTrack,
    playbackState,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffled,
    repeatMode,
    togglePlayPause,
    seek,
    nextTrack,
    previousTrack,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeatMode,
    setFullscreenOpen
  } = usePlayerStore();

  const { toggleLikeTrack, likedTracks } = useLibraryStore();

  // Mobile Touch Gestures
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState<number>(0);

  if (!currentTrack) return null;

  const isLiked = likedTracks.some((t) => t.id === currentTrack.id) || currentTrack.isLiked;
  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diffX = e.touches[0].clientX - touchStartX.current;
    setSwipeOffset(diffX * 0.3);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartX.current;
    const diffY = e.changedTouches[0].clientY - touchStartY.current;

    // Horizontal Swipe (Next / Previous)
    if (Math.abs(diffX) > 60 && Math.abs(diffY) < 50) {
      if (diffX < 0) {
        if (navigator.vibrate) navigator.vibrate(20);
        nextTrack();
      } else {
        if (navigator.vibrate) navigator.vibrate(20);
        previousTrack();
      }
    }
    // Vertical Swipe Up (Expand Full Player)
    else if (diffY < -40 && Math.abs(diffX) < 40) {
      setFullscreenOpen(true);
    }

    touchStartX.current = null;
    touchStartY.current = null;
    setSwipeOffset(0);
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ transform: `translateX(${swipeOffset}px)` }}
      className="fixed bottom-[64px] md:bottom-0 left-2.5 right-2.5 md:left-0 md:right-0 z-40 rounded-2xl md:rounded-none bg-zinc-950/95 md:bg-black/95 backdrop-blur-2xl border border-white/[0.1] md:border-t md:border-b-0 md:border-x-0 shadow-2xl select-none transition-transform duration-100 ease-out"
    >
      {/* Top Hairline Progress Bar */}
      <div
        className="group relative h-1 hover:h-1.5 w-full bg-white/[0.08] cursor-pointer transition-all overflow-hidden rounded-t-2xl md:rounded-none"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          seek(pos * duration);
        }}
      >
        <div
          className="h-full bg-white transition-all duration-100 ease-linear shadow-[0_0_8px_rgba(255,255,255,0.7)]"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-3.5 md:px-6 py-2.5 flex items-center justify-between gap-3 md:gap-4">
        {/* LEFT MODULE: Artwork & Metadata */}
        <div
          onClick={() => setFullscreenOpen(true)}
          className="flex items-center gap-3 min-w-0 flex-1 md:flex-initial md:w-80 cursor-pointer group"
        >
          {/* Artwork Jacket */}
          <div className="relative w-11 h-11 md:w-13 md:h-13 rounded-xl overflow-hidden flex-shrink-0 shadow-md border border-white/10">
            <img
              src={currentTrack.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&q=80'}
              alt={currentTrack.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {playbackState === 'buffering' && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              </div>
            )}
          </div>

          {/* Title & Artist */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs md:text-sm font-bold text-white truncate hover:underline">
                {currentTrack.title}
              </span>
              <span className="hidden md:inline-flex px-1.5 py-0.2 text-[9px] font-extrabold uppercase rounded bg-white/10 text-neutral-300 border border-white/10">
                320k
              </span>
            </div>
            <p className="text-[11px] md:text-xs text-neutral-400 truncate hover:text-white transition">
              {currentTrack.artist}
            </p>
          </div>
        </div>

        {/* CENTER MODULE: Desktop Playback Transport Controls */}
        <div className="hidden md:flex flex-col items-center gap-1.5 flex-1 max-w-2xl">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleShuffle}
              className={`p-2 rounded-full transition cursor-pointer ${
                isShuffled ? 'text-white bg-white/10' : 'text-neutral-400 hover:text-white'
              }`}
              title="Shuffle"
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <button
              onClick={previousTrack}
              className="p-2 text-neutral-300 hover:text-white transition cursor-pointer"
              title="Previous"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>

            <button
              onClick={togglePlayPause}
              className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-lg cursor-pointer"
              title={playbackState === 'playing' ? 'Pause' : 'Play'}
            >
              {playbackState === 'playing' ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={nextTrack}
              className="p-2 text-neutral-300 hover:text-white transition cursor-pointer"
              title="Next"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>

            <button
              onClick={cycleRepeatMode}
              className={`p-2 rounded-full transition cursor-pointer ${
                repeatMode !== 'off' ? 'text-white bg-white/10' : 'text-neutral-400 hover:text-white'
              }`}
              title={`Repeat: ${repeatMode}`}
            >
              {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
            </button>
          </div>

          {/* Time Scrubber */}
          <div className="flex items-center gap-2.5 w-full">
            <span className="text-[11px] font-mono text-neutral-400 w-9 text-right">
              {formatTime(currentTime)}
            </span>
            <div
              className="flex-1 h-1.5 bg-neutral-800 rounded-full cursor-pointer relative group overflow-hidden"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                seek(pos * duration);
              }}
            >
              <div
                className="h-full bg-white transition-all rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[11px] font-mono text-neutral-400 w-9">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* RIGHT MODULE: Mobile Quick Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Like Heart Button */}
          <button
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(15);
              toggleLikeTrack(currentTrack);
            }}
            className="p-2 rounded-full text-neutral-400 hover:text-white transition cursor-pointer"
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-[#ff4655] text-[#ff4655]' : ''}`} />
          </button>

          {/* Mobile Play / Pause Button */}
          <button
            onClick={togglePlayPause}
            className="md:hidden w-10 h-10 rounded-full bg-white text-black flex items-center justify-center active:scale-90 transition shadow-md"
          >
            {playbackState === 'playing' ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          {/* Desktop Tools */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => setFullscreenOpen(true)}
              className="p-2 text-neutral-400 hover:text-white transition cursor-pointer"
              title="Expand (Full Player)"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 group">
              <button
                onClick={toggleMute}
                className="text-neutral-400 hover:text-white transition cursor-pointer"
              >
                <VolumeIcon className="w-4 h-4" />
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-20 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-white"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
