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
  Mic2,
  Heart,
  Download,
  CheckCircle2,
  Loader2,
  ListMusic,
  SlidersHorizontal,
  PanelRight
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
    setFullscreenOpen,
    setLyricsOpen,
    isLyricsOpen,
    setEqualizerOpen,
    toggleRightSidebar,
    isRightSidebarOpen,
    navigateToArtist,
    queue,
    qualityTier
  } = usePlayerStore();

  const { toggleLikeTrack, cacheTrackForOffline, likedTracks, offlineTracks } = useLibraryStore();

  if (!currentTrack) return null;

  const isLiked = likedTracks.some((t) => t.id === currentTrack.id) || currentTrack.isLiked;
  const isOffline = offlineTracks.some((t) => t.id === currentTrack.id) || currentTrack.isOfflineCached;
  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 glass-dock-editorial select-none transition-all duration-300">
      {/* Top Hairline Progress Bar */}
      <div
        className="group relative h-1 hover:h-1.5 w-full bg-white/[0.08] cursor-pointer transition-all"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          seek(pos * duration);
        }}
      >
        <div
          className="h-full bg-[#1db954] transition-all duration-100 ease-linear shadow-[0_0_10px_rgba(29,185,84,0.7)]"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* LEFT MODULE: Artwork & Metadata */}
        <div className="flex items-center gap-3.5 min-w-0 flex-1 md:flex-initial md:w-80">
          {/* Artwork Jacket */}
          <div
            onClick={() => setFullscreenOpen(true)}
            className="relative w-12 h-12 md:w-13 md:h-13 rounded-xl overflow-hidden cursor-pointer group flex-shrink-0 shadow-lg border border-white/10"
          >
            <img
              src={currentTrack.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&q=80'}
              alt={currentTrack.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Maximize2 className="w-4 h-4 text-[#1db954]" />
            </div>
          </div>

          {/* Title & Artist */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4
                onClick={() => setFullscreenOpen(true)}
                className="text-sm font-bold font-mono text-white truncate cursor-pointer hover:text-[#1db954] transition-colors"
                title={currentTrack.title}
              >
                {currentTrack.title}
              </h4>
              {currentTrack.hasSyncedLyrics && (
                <span className="hidden xl:inline-block text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-white/10 text-neutral-300">
                  LRC
                </span>
              )}
            </div>
            <p
              onClick={() => navigateToArtist(currentTrack.artist)}
              className="text-xs text-neutral-400 truncate mt-0.5 cursor-pointer hover:underline hover:text-white"
              title={currentTrack.artist}
            >
              {currentTrack.artist}
            </p>
          </div>

          {/* Favorite & Download Action Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => toggleLikeTrack(currentTrack)}
              className={`p-2 rounded-full transition-all active:scale-90 ${
                isLiked ? 'text-[#1db954] fill-[#1db954]' : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
              title={isLiked ? 'In Favorites' : 'Add to Favorites'}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-[#1db954]' : ''}`} />
            </button>

            <button
              onClick={() => cacheTrackForOffline(currentTrack)}
              className={`p-2 rounded-full transition-all hidden sm:inline-flex ${
                isOffline ? 'text-[#1db954]' : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
              title={isOffline ? 'Saved Offline' : 'Download for Offline'}
            >
              {isOffline ? <CheckCircle2 className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* CENTER MODULE: Playback Controls & Time Scrubber */}
        <div className="flex flex-col items-center gap-1.5 flex-1 max-w-xl px-2">
          {/* Controls Bar */}
          <div className="flex items-center gap-5">
            {/* Shuffle */}
            <button
              onClick={toggleShuffle}
              className={`p-2 rounded-full transition-colors relative hidden sm:inline-flex ${
                isShuffled ? 'text-[#1db954]' : 'text-neutral-500 hover:text-neutral-300'
              }`}
              title="Shuffle"
            >
              <Shuffle className="w-4 h-4" />
              {isShuffled && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#1db954]" />}
            </button>

            {/* Previous */}
            <button
              onClick={previousTrack}
              className="p-1.5 text-neutral-300 hover:text-white transition-all active:scale-95"
              title="Previous (P)"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>

            {/* SPOTIFY EMERALD PLAY/PAUSE CIRCLE */}
            <button
              onClick={togglePlayPause}
              disabled={playbackState === 'resolving'}
              className="w-10 h-10 md:w-11 md:h-11 rounded-full btn-spotify-emerald flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all duration-150 disabled:opacity-60"
              title={playbackState === 'playing' ? 'Pause (Space)' : 'Play (Space)'}
            >
              {playbackState === 'resolving' || playbackState === 'buffering' ? (
                <Loader2 className="w-5 h-5 animate-spin text-black" />
              ) : playbackState === 'playing' ? (
                <Pause className="w-5 h-5 fill-black text-black" />
              ) : (
                <Play className="w-5 h-5 fill-black text-black ml-0.5" />
              )}
            </button>

            {/* Next */}
            <button
              onClick={nextTrack}
              className="p-1.5 text-neutral-300 hover:text-white transition-all active:scale-95"
              title="Next (N)"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>

            {/* Repeat Mode */}
            <button
              onClick={cycleRepeatMode}
              className={`p-2 rounded-full transition-colors relative hidden sm:inline-flex ${
                repeatMode !== 'off' ? 'text-[#1db954]' : 'text-neutral-500 hover:text-neutral-300'
              }`}
              title={`Repeat: ${repeatMode}`}
            >
              {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
              {repeatMode !== 'off' && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#1db954]" />
              )}
            </button>
          </div>

          {/* Desktop Time Scrubber */}
          <div className="hidden md:flex items-center gap-3 w-full text-[11px] font-mono text-neutral-400 select-none">
            <span className="w-10 text-right">{formatTime(currentTime)}</span>
            <div className="relative flex-1 flex items-center group">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime || 0}
                onChange={(e) => seek(parseFloat(e.target.value))}
                className="w-full editorial-scrubber"
              />
            </div>
            <span className="w-10 text-left">{formatTime(duration)}</span>
          </div>
        </div>

        {/* RIGHT MODULE: Synced Lyrics, DSP, Volume & Fullscreen */}
        <div className="flex items-center gap-2 md:gap-3 min-w-0 justify-end md:w-80">
          {/* Synced Lyrics Trigger */}
          <button
            onClick={() => {
              setLyricsOpen(!isLyricsOpen);
              setFullscreenOpen(true);
            }}
            className={`p-2 rounded-xl transition-all hidden sm:inline-flex ${
              isLyricsOpen
                ? 'bg-[#1db954] text-black shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
            title="Synced Lyrics (L)"
          >
            <Mic2 className="w-4 h-4" />
          </button>

          {/* Equalizer Quick Trigger */}
          <button
            onClick={() => {
              setEqualizerOpen(true);
              setFullscreenOpen(true);
            }}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 transition-all hidden lg:inline-flex"
            title="Audio Equalizer DSP"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          {/* Right Now Playing Panel Toggle */}
          <button
            onClick={toggleRightSidebar}
            className={`p-2 rounded-xl transition-all hidden xl:inline-flex ${
              isRightSidebarOpen
                ? 'bg-[#1db954] text-black shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
            title="Now Playing Inspection Panel"
          >
            <PanelRight className="w-4 h-4" />
          </button>

          {/* Quality Badge */}
          <span className="hidden xl:inline-block text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-white/[0.06] text-neutral-300 border border-white/[0.08]">
            {currentTrack.bitrateKbps ? `${currentTrack.bitrateKbps}K` : qualityTier.toUpperCase()}
          </span>

          {/* Volume Slider */}
          <div className="hidden lg:flex items-center gap-2 pl-1">
            <button
              onClick={toggleMute}
              className="text-neutral-400 hover:text-white transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              <VolumeIcon className="w-4 h-4" />
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-20 editorial-scrubber"
            />
          </div>

          {/* Queue Drawer Trigger */}
          <button
            onClick={() => setFullscreenOpen(true)}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 transition-all relative hidden sm:inline-flex"
            title="Up Next Queue"
          >
            <ListMusic className="w-4 h-4" />
            {queue.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#1db954]" />
            )}
          </button>

          {/* Expand Fullscreen */}
          <button
            onClick={() => setFullscreenOpen(true)}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 transition-all"
            title="Fullscreen Player (F)"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
