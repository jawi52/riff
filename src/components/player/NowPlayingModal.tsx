import React, { useState, useEffect, useRef } from 'react';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useLibraryStore } from '../../stores/useLibraryStore';
import { LyricsView } from './LyricsView';
import { 
  ChevronDown, 
  Heart, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat, 
  Repeat1, 
  Mic2, 
  Share2, 
  Sparkles,
  Volume2,
  VolumeX,
  Radio,
  ListMusic,
  Moon,
  Download,
  CheckCircle2,
  X
} from 'lucide-react';

export const NowPlayingModal: React.FC = () => {
  const {
    currentTrack,
    queue,
    queueIndex,
    playbackState,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffled,
    repeatMode,
    isFullscreenOpen,
    isLyricsOpen,
    activeLyricIndex,
    sleepTimerMinutes,
    sleepTimerMode,
    setFullscreenOpen,
    setLyricsOpen,
    togglePlayPause,
    seek,
    nextTrack,
    previousTrack,
    toggleShuffle,
    cycleRepeatMode,
    setVolume,
    toggleMute,
    removeFromQueue,
    clearQueue,
    playTrack,
    setSleepTimer,
  } = usePlayerStore();

  const { likedTracks, offlineTracks, toggleLikeTrack, cacheTrackForOffline, deleteOfflineTrack } = useLibraryStore();
  const [activeTab, setActiveTab] = useState<'artwork' | 'lyrics' | 'queue'>('artwork');
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubValue, setScrubValue] = useState(0);
  const [showSleepTimerModal, setShowSleepTimerModal] = useState(false);
  const scrubberRef = useRef<HTMLDivElement | null>(null);

  // Touch swipe-down state
  const touchStartY = useRef<number>(0);
  const touchCurrentY = useRef<number>(0);

  // Sync tab with store's isLyricsOpen
  useEffect(() => {
    if (isLyricsOpen) {
      setActiveTab('lyrics');
    }
  }, [isLyricsOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreenOpen) {
        setFullscreenOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreenOpen, setFullscreenOpen]);

  if (!isFullscreenOpen || !currentTrack) {
    return null;
  }

  const isPlaying = playbackState === 'playing';
  const isBuffering = playbackState === 'buffering';
  const isLiked = likedTracks.some((t) => t.id === currentTrack.id);
  const isDownloaded = offlineTracks.some((t) => t.id === currentTrack.id);

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const currentDisplayTime = isScrubbing ? scrubValue : currentTime;
  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (currentDisplayTime / duration) * 100)) : 0;

  const handleScrubberChange = (clientX: number) => {
    if (!scrubberRef.current || duration <= 0) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const targetSeconds = ratio * duration;
    setScrubValue(targetSeconds);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!e.touches[0]) return;
    setIsScrubbing(true);
    handleScrubberChange(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!e.touches[0] || !isScrubbing) return;
    handleScrubberChange(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (isScrubbing) {
      seek(scrubValue);
      setIsScrubbing(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsScrubbing(true);
    handleScrubberChange(e.clientX);

    const onMouseMove = (moveEvent: MouseEvent) => {
      handleScrubberChange(moveEvent.clientX);
    };

    const onMouseUp = () => {
      setIsScrubbing(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Header Swipe-Down to Dismiss gesture
  const handleHeaderTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleHeaderTouchMove = (e: React.TouchEvent) => {
    touchCurrentY.current = e.touches[0].clientY;
  };

  const handleHeaderTouchEnd = () => {
    if (touchCurrentY.current - touchStartY.current > 70) {
      setFullscreenOpen(false);
    }
  };

  const activeLyric = currentTrack.syncedLyrics?.[activeLyricIndex]?.text;
  const upcomingQueue = queue.slice(queueIndex + 1);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#121212] overflow-hidden select-none animate-in fade-in slide-in-from-bottom-8 duration-300">
      {/* Dynamic Ambient Glow Backdrop */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <img
          src={currentTrack.coverUrl}
          alt=""
          className="w-full h-full object-cover blur-3xl scale-125 opacity-25"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#121212]/60 via-[#121212]/90 to-[#121212]" />
      </div>

      {/* Top Header Bar (With Pull-Down Touch Gesture) */}
      <header 
        onTouchStart={handleHeaderTouchStart}
        onTouchMove={handleHeaderTouchMove}
        onTouchEnd={handleHeaderTouchEnd}
        className="relative z-10 flex items-center justify-between px-4 sm:px-8 pt-4 pb-2 sm:pt-6 sm:pb-4 shrink-0"
      >
        <button
          onClick={() => setFullscreenOpen(false)}
          className="p-2 -ml-2 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition cursor-pointer"
          title="Minimize player (or swipe down)"
        >
          <ChevronDown className="w-6 h-6 sm:w-7 sm:h-7" />
        </button>

        <div className="text-center px-4 min-w-0 flex-1">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#b3b3b3] truncate">
            {currentTrack.album ? `Playing from ${currentTrack.album}` : 'Playing from Riff Master'}
          </p>
          <p className="text-xs sm:text-sm font-semibold text-white truncate mt-0.5">
            {currentTrack.title}
          </p>
        </div>

        {/* Right Tools: Sleep Timer & 320k Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowSleepTimerModal(true)}
            className={`p-2 rounded-full transition cursor-pointer ${
              sleepTimerMinutes || sleepTimerMode
                ? 'bg-[#1ed760]/20 text-[#1ed760]'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
            title="Sleep Timer"
          >
            <Moon className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-[10px] font-bold text-[#1ed760]">
            <Sparkles className="w-3 h-3 text-[#1ed760]" />
            <span className="hidden xs:inline">320k Master</span>
          </div>
        </div>
      </header>

      {/* Main Content Area: Artwork vs Lyrics vs Up Next Queue */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center min-h-0 px-4 sm:px-8 max-w-2xl mx-auto w-full">
        {activeTab === 'artwork' && (
          <div className="w-full flex-1 flex flex-col items-center justify-center min-h-0 py-2 sm:py-4">
            {/* Square Album Art Stage */}
            <div 
              onClick={() => setActiveTab('lyrics')}
              className="relative aspect-square w-full max-w-[340px] sm:max-w-[400px] max-h-[46vh] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl shadow-black/80 border border-white/10 group cursor-pointer transition transform hover:scale-[1.01]"
              title="Click to view synchronized lyrics"
            >
              <img
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
              {isPlaying && (
                <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-1.5 text-[10px] font-bold text-[#1ed760]">
                  <Radio className="w-3 h-3 animate-pulse" />
                  <span>320k Master</span>
                </div>
              )}

              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 text-white font-bold text-sm backdrop-blur-xs">
                <Mic2 className="w-5 h-5 text-[#1ed760]" />
                <span>Show Synced Lyrics</span>
              </div>
            </div>

            {/* Quick Live Lyric Line Preview Card */}
            {activeLyric && (
              <div
                onClick={() => setActiveTab('lyrics')}
                className="w-full max-w-[340px] sm:max-w-[400px] mt-3 sm:mt-4 p-3 sm:p-3.5 rounded-xl bg-[#1ed760]/10 hover:bg-[#1ed760]/15 border border-[#1ed760]/20 transition cursor-pointer group flex items-center justify-between gap-3 shadow-lg"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <Mic2 className="w-4 h-4 text-[#1ed760] shrink-0" />
                  <p className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-[#1ed760] transition">
                    "{activeLyric}"
                  </p>
                </div>
                <span className="text-[10px] font-bold text-[#1ed760] shrink-0 bg-[#1ed760]/20 px-2 py-0.5 rounded-full">
                  Lyrics
                </span>
              </div>
            )}
          </div>
        )}

        {activeTab === 'lyrics' && (
          <div className="w-full h-full flex flex-col min-h-0 py-2">
            <LyricsView className="flex-1 min-h-0" />
          </div>
        )}

        {activeTab === 'queue' && (
          <div className="w-full h-full flex flex-col min-h-0 py-2 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h2 className="text-base sm:text-lg font-bold text-white">Up Next Queue</h2>
              {queue.length > 1 && (
                <button
                  onClick={clearQueue}
                  className="text-xs font-bold text-[#b3b3b3] hover:text-red-400 transition"
                >
                  Clear Queue
                </button>
              )}
            </div>

            {/* Now Playing in Queue */}
            <div className="p-3 rounded-xl bg-[#1ed760]/10 border border-[#1ed760]/20 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <img src={currentTrack.coverUrl} alt="" className="w-10 h-10 rounded-md object-cover" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#1ed760] uppercase">Now Playing</p>
                  <p className="text-sm font-bold text-white truncate">{currentTrack.title}</p>
                  <p className="text-xs text-[#b3b3b3] truncate">{currentTrack.artist}</p>
                </div>
              </div>
              <Radio className="w-4 h-4 text-[#1ed760] animate-pulse" />
            </div>

            {/* Upcoming Tracks List */}
            <div className="flex-1 overflow-y-auto space-y-1 pr-1">
              {upcomingQueue.length === 0 ? (
                <p className="text-xs text-[#727272] py-8 text-center">
                  Queue is empty. Infinite autoplay will automatically discover similar tracks!
                </p>
              ) : (
                upcomingQueue.map((track, i) => (
                  <div
                    key={`${track.id}_${i}`}
                    onClick={() => playTrack(track)}
                    className="group flex items-center justify-between p-2 rounded-lg hover:bg-white/10 transition cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs text-[#727272] w-4 text-right tabular-nums">{i + 1}</span>
                      <img src={track.coverUrl} alt="" className="w-9 h-9 rounded object-cover" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate group-hover:text-[#1ed760] transition">{track.title}</p>
                        <p className="text-[11px] text-[#b3b3b3] truncate">{track.artist}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromQueue(queueIndex + 1 + i);
                      }}
                      className="p-1.5 text-[#727272] hover:text-red-400 transition"
                      title="Remove from queue"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls Section */}
      <footer className="relative z-10 w-full max-w-2xl mx-auto px-6 sm:px-8 pb-6 sm:pb-8 pt-2 shrink-0 space-y-4">
        {/* Track Info & Action Buttons */}
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-black text-white truncate tracking-tight">
              {currentTrack.title}
            </h1>
            <p className="text-sm sm:text-base font-semibold text-[#b3b3b3] truncate mt-0.5">
              {currentTrack.artist}
            </p>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Single Track Offline Download Button */}
            <button
              onClick={() => {
                if (isDownloaded) {
                  deleteOfflineTrack(currentTrack.id);
                } else {
                  cacheTrackForOffline(currentTrack);
                }
              }}
              className={`p-2.5 rounded-full transition cursor-pointer ${
                isDownloaded
                  ? 'text-[#1ed760] bg-[#1ed760]/10 hover:bg-red-500/10 hover:text-red-400'
                  : 'text-[#b3b3b3] hover:text-white hover:bg-white/10'
              }`}
              title={isDownloaded ? 'Saved Offline (Click to remove)' : 'Download for offline playback'}
            >
              {isDownloaded ? (
                <CheckCircle2 className="w-5 h-5 fill-[#1ed760]/20" />
              ) : (
                <Download className="w-5 h-5" />
              )}
            </button>

            {/* Queue View Switcher Button */}
            <button
              onClick={() => {
                setActiveTab(activeTab === 'queue' ? 'artwork' : 'queue');
              }}
              className={`p-2.5 rounded-full transition cursor-pointer ${
                activeTab === 'queue'
                  ? 'bg-[#1ed760] text-black shadow-lg shadow-[#1ed760]/30'
                  : 'text-[#b3b3b3] hover:text-white hover:bg-white/10'
              }`}
              title="Toggle Up Next Queue"
            >
              <ListMusic className="w-5 h-5" />
            </button>

            {/* Lyrics View Switcher Button */}
            <button
              onClick={() => {
                const next = activeTab === 'lyrics' ? 'artwork' : 'lyrics';
                setActiveTab(next);
                setLyricsOpen(next === 'lyrics');
              }}
              className={`p-2.5 rounded-full transition cursor-pointer ${
                activeTab === 'lyrics'
                  ? 'bg-[#1ed760] text-black shadow-lg shadow-[#1ed760]/30'
                  : 'text-[#b3b3b3] hover:text-white hover:bg-white/10'
              }`}
              title={activeTab === 'lyrics' ? 'Show Cover Art' : 'Show Synced Lyrics'}
            >
              <Mic2 className="w-5 h-5" />
            </button>

            {/* Favorite / Heart Button */}
            <button
              onClick={() => toggleLikeTrack(currentTrack)}
              className="p-2.5 text-[#b3b3b3] hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
              title={isLiked ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
            >
              <Heart
                className={`w-6 h-6 transition ${
                  isLiked ? 'fill-[#1ed760] text-[#1ed760]' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* Touch-Ready Progress Scrubber */}
        <div className="space-y-1.5">
          <div
            ref={scrubberRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="group relative h-4 flex items-center cursor-pointer touch-none"
          >
            <div className="w-full h-1.5 bg-white/20 group-hover:h-2 rounded-full overflow-hidden transition-all duration-150 relative">
              <div
                className="h-full bg-white group-hover:bg-[#1ed760] rounded-full transition-[width] duration-75 ease-linear"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md transition-opacity pointer-events-none group-hover:scale-110"
              style={{ left: `calc(${progressPercent}% - 7px)` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs font-semibold text-[#b3b3b3] tabular-nums">
            <span>{formatTime(currentDisplayTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Primary Playback Controls */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={toggleShuffle}
            className={`p-2 rounded-full transition cursor-pointer relative ${
              isShuffled ? 'text-[#1ed760]' : 'text-[#b3b3b3] hover:text-white'
            }`}
            title={isShuffled ? 'Shuffle: On' : 'Shuffle: Off'}
          >
            <Shuffle className="w-5 h-5 sm:w-6 sm:h-6" />
            {isShuffled && (
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#1ed760] rounded-full" />
            )}
          </button>

          <button
            onClick={previousTrack}
            className="p-2 text-[#b3b3b3] hover:text-white transition active:scale-90 cursor-pointer"
            title="Previous"
          >
            <SkipBack className="w-7 h-7 sm:w-8 sm:h-8" />
          </button>

          <button
            onClick={togglePlayPause}
            className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-white hover:bg-white/95 text-black flex items-center justify-center transition transform active:scale-95 shadow-2xl shadow-white/20 cursor-pointer"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isBuffering ? (
              <div className="w-6 h-6 border-3 border-black border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-7 h-7 sm:w-8 sm:h-8 fill-black" />
            ) : (
              <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-black ml-1" />
            )}
          </button>

          <button
            onClick={nextTrack}
            className="p-2 text-[#b3b3b3] hover:text-white transition active:scale-90 cursor-pointer"
            title="Next"
          >
            <SkipForward className="w-7 h-7 sm:w-8 sm:h-8" />
          </button>

          <button
            onClick={cycleRepeatMode}
            className={`p-2 rounded-full transition cursor-pointer relative ${
              repeatMode !== 'off' ? 'text-[#1ed760]' : 'text-[#b3b3b3] hover:text-white'
            }`}
            title={`Repeat: ${repeatMode}`}
          >
            {repeatMode === 'one' ? (
              <Repeat1 className="w-5 h-5 sm:w-6 sm:h-6" />
            ) : (
              <Repeat className="w-5 h-5 sm:w-6 sm:h-6" />
            )}
            {repeatMode !== 'off' && (
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#1ed760] rounded-full" />
            )}
          </button>
        </div>

        {/* Volume & Bottom Bar */}
        <div className="flex items-center justify-between pt-1 text-xs text-[#b3b3b3]">
          <div className="flex items-center gap-2.5 flex-1 max-w-[200px]">
            <button
              onClick={toggleMute}
              className="text-[#b3b3b3] hover:text-white transition cursor-pointer"
              title={isMuted ? 'Unmute' : 'Mute'}
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
              className="w-full h-1 bg-white/20 rounded-full accent-white hover:accent-[#1ed760] cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (navigator.share && currentTrack) {
                  navigator.share({
                    title: currentTrack.title,
                    text: `Listening to ${currentTrack.title} by ${currentTrack.artist} on Riff`,
                    url: window.location.href,
                  }).catch(() => {});
                }
              }}
              className="p-1.5 text-[#b3b3b3] hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
              title="Share Track"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </footer>

      {/* Sleep Timer Modal */}
      {showSleepTimerModal && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1e1e1e] border border-white/10 rounded-2xl max-w-xs w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Moon className="w-4 h-4 text-[#1ed760]" />
                <span>Sleep Timer</span>
              </h3>
              <button
                onClick={() => setShowSleepTimerModal(false)}
                className="text-[#727272] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              {[
                { label: '15 Minutes', mins: 15, mode: 'minutes' as const },
                { label: '30 Minutes', mins: 30, mode: 'minutes' as const },
                { label: '45 Minutes', mins: 45, mode: 'minutes' as const },
                { label: '1 Hour', mins: 60, mode: 'minutes' as const },
                { label: 'End of this track', mins: null, mode: 'end_of_track' as const },
              ].map((preset) => {
                const isActive = preset.mode === 'end_of_track' 
                  ? sleepTimerMode === 'end_of_track'
                  : sleepTimerMinutes === preset.mins;

                return (
                  <button
                    key={preset.label}
                    onClick={() => {
                      setSleepTimer(preset.mins, preset.mode);
                      setShowSleepTimerModal(false);
                    }}
                    className={`w-full py-2.5 px-3.5 rounded-xl text-left text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                      isActive 
                        ? 'bg-[#1ed760]/20 text-[#1ed760] border border-[#1ed760]/30'
                        : 'bg-white/5 hover:bg-white/10 text-white'
                    }`}
                  >
                    <span>{preset.label}</span>
                    {isActive && <CheckCircle2 className="w-4 h-4 text-[#1ed760]" />}
                  </button>
                );
              })}

              {(sleepTimerMinutes || sleepTimerMode) && (
                <button
                  onClick={() => {
                    setSleepTimer(null);
                    setShowSleepTimerModal(false);
                  }}
                  className="w-full py-2 px-3 text-center text-xs font-bold text-red-400 hover:text-red-300 pt-2 transition"
                >
                  Turn off timer
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
