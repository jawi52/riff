import React from 'react';
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
  Loader2,
  Mic2,
  ListMusic,
  Tv2
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
    isRightSidebarOpen,
    rightSidebarTab,
    togglePlayPause,
    seek,
    nextTrack,
    previousTrack,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeatMode,
    setFullscreenOpen,
    setRightSidebarTab,
    toggleRightSidebar
  } = usePlayerStore();

  const { likedTracks, toggleLikeTrack } = useLibraryStore();

  if (!currentTrack) return null;

  const isLiked = likedTracks.some((t) => t.id === currentTrack.id) || currentTrack.isLiked;
  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetSeconds = (parseFloat(e.target.value) / 100) * duration;
    seek(targetSeconds);
  };

  const handleTabToggle = (tab: 'nowplaying' | 'lyrics' | 'queue') => {
    if (isRightSidebarOpen && rightSidebarTab === tab) {
      toggleRightSidebar();
    } else {
      setRightSidebarTab(tab);
    }
  };

  return (
    <footer className="fixed md:relative bottom-0 left-0 right-0 z-30 bg-[#181818] border-t border-[#282828] select-none text-white px-4 py-3 shrink-0">
      {/* ========================================================================= */}
      {/* 1. DESKTOP SPOTIFY PLAYER BAR (md:flex) */}
      {/* ========================================================================= */}
      <div className="hidden md:flex items-center justify-between gap-4 max-w-full">
        {/* Left: Track Information & Like */}
        <div className="flex items-center gap-3.5 min-w-[180px] max-w-[280px] lg:max-w-[320px]">
          <div className="relative w-14 h-14 rounded-md overflow-hidden shrink-0 shadow-md bg-neutral-900 group cursor-pointer" onClick={() => setFullscreenOpen(true)}>
            <img
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              className="w-full h-full object-cover"
            />
            {playbackState === 'buffering' && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p
              onClick={() => setFullscreenOpen(true)}
              className="text-sm font-bold text-white truncate hover:underline cursor-pointer"
            >
              {currentTrack.title}
            </p>
            <p className="text-xs text-neutral-400 truncate hover:underline hover:text-white cursor-pointer transition">
              {currentTrack.artist}
            </p>
          </div>

          <button
            onClick={() => toggleLikeTrack(currentTrack)}
            className={`p-1.5 transition cursor-pointer hover:scale-110 active:scale-95 ${
              isLiked ? 'text-[#1db954]' : 'text-neutral-400 hover:text-white'
            }`}
            title={isLiked ? 'Remove from Your Library' : 'Save to Your Library'}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-[#1db954]' : ''}`} />
          </button>
        </div>

        {/* Center: Spotify Player Transport & Time Scrubber */}
        <div className="flex-1 max-w-2xl flex flex-col items-center gap-1.5">
          {/* Controls row */}
          <div className="flex items-center gap-5">
            {/* Shuffle */}
            <button
              onClick={toggleShuffle}
              className={`relative transition cursor-pointer ${
                isShuffled ? 'text-[#1db954]' : 'text-neutral-400 hover:text-white'
              }`}
              title="Enable shuffle"
            >
              <Shuffle className="w-4 h-4" />
              {isShuffled && <span className="w-1 h-1 rounded-full bg-[#1db954] absolute -bottom-1 left-1/2 -translate-x-1/2" />}
            </button>

            {/* Previous */}
            <button
              onClick={previousTrack}
              className="text-neutral-400 hover:text-white transition cursor-pointer"
              title="Previous"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>

            {/* Play / Pause - Solid White Circular Button */}
            <button
              onClick={togglePlayPause}
              className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-md cursor-pointer"
              title={playbackState === 'playing' ? 'Pause' : 'Play'}
            >
              {playbackState === 'playing' ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>

            {/* Next */}
            <button
              onClick={nextTrack}
              className="text-neutral-400 hover:text-white transition cursor-pointer"
              title="Next"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>

            {/* Repeat */}
            <button
              onClick={cycleRepeatMode}
              className={`relative transition cursor-pointer ${
                repeatMode !== 'off' ? 'text-[#1db954]' : 'text-neutral-400 hover:text-white'
              }`}
              title={`Repeat: ${repeatMode}`}
            >
              {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
              {repeatMode !== 'off' && <span className="w-1 h-1 rounded-full bg-[#1db954] absolute -bottom-1 left-1/2 -translate-x-1/2" />}
            </button>
          </div>

          {/* Scrubber row */}
          <div className="flex items-center gap-2.5 w-full">
            <span className="text-[11px] font-mono text-neutral-400 w-9 text-right">
              {formatTime(currentTime)}
            </span>

            <div className="relative flex-1 group flex items-center h-4 cursor-pointer">
              <input
                type="range"
                min="0"
                max="100"
                step="0.1"
                value={progressPercent}
                onChange={handleSeekChange}
                className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
              />
              <div className="w-full h-1 bg-[#4d4d4d] rounded-full overflow-hidden group-hover:h-1.5 transition-all">
                <div
                  className="h-full bg-white group-hover:bg-[#1db954] rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <span className="text-[11px] font-mono text-neutral-400 w-9 text-left">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Right: Spotify Panel Toggles & Volume Control */}
        <div className="flex items-center justify-end gap-3 min-w-[180px]">
          {/* Now Playing View Toggle */}
          <button
            onClick={() => handleTabToggle('nowplaying')}
            className={`p-1.5 transition cursor-pointer ${
              isRightSidebarOpen && rightSidebarTab === 'nowplaying'
                ? 'text-[#1db954]'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Now playing view"
          >
            <Tv2 className="w-4 h-4" />
          </button>

          {/* Lyrics Toggle */}
          <button
            onClick={() => handleTabToggle('lyrics')}
            className={`p-1.5 transition cursor-pointer ${
              isRightSidebarOpen && rightSidebarTab === 'lyrics'
                ? 'text-[#1db954]'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Lyrics"
          >
            <Mic2 className="w-4 h-4" />
          </button>

          {/* Queue Toggle */}
          <button
            onClick={() => handleTabToggle('queue')}
            className={`p-1.5 transition cursor-pointer ${
              isRightSidebarOpen && rightSidebarTab === 'queue'
                ? 'text-[#1db954]'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Queue"
          >
            <ListMusic className="w-4 h-4" />
          </button>

          {/* Volume Control */}
          <div className="flex items-center gap-2 group">
            <button
              onClick={toggleMute}
              className="text-neutral-400 hover:text-white transition cursor-pointer"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              <VolumeIcon className="w-4 h-4" />
            </button>

            <div className="relative w-20 lg:w-24 h-4 flex items-center cursor-pointer">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value));
                  if (isMuted) toggleMute();
                }}
                className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
              />
              <div className="w-full h-1 bg-[#4d4d4d] rounded-full overflow-hidden group-hover:h-1.5 transition-all">
                <div
                  className="h-full bg-white group-hover:bg-[#1db954] rounded-full transition-all"
                  style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Fullscreen Player Button */}
          <button
            onClick={() => setFullscreenOpen(true)}
            className="text-neutral-400 hover:text-white transition cursor-pointer p-1"
            title="Full screen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MOBILE FLOATING MINI PLAYER (md:hidden) */}
      {/* ========================================================================= */}
      <div
        onClick={() => setFullscreenOpen(true)}
        className="md:hidden flex items-center justify-between gap-3 p-1.5 rounded-xl bg-[#282828] cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <img
            src={currentTrack.coverUrl}
            alt=""
            className="w-10 h-10 rounded-lg object-cover shrink-0 shadow-sm"
          />
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate">{currentTrack.title}</p>
            <p className="text-[11px] text-neutral-400 truncate">{currentTrack.artist}</p>
          </div>
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => toggleLikeTrack(currentTrack)}
            className={`p-2 transition cursor-pointer ${
              isLiked ? 'text-[#1db954]' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-[#1db954]' : ''}`} />
          </button>

          <button
            onClick={togglePlayPause}
            className="p-2 text-white hover:scale-105 active:scale-95 transition cursor-pointer"
          >
            {playbackState === 'playing' ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-0.5" />
            )}
          </button>
        </div>
      </div>
    </footer>
  );
};

export default MiniPlayer;
