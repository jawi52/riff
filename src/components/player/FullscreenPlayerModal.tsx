import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  Sliders,
  ListMusic,
  Mic2,
  Timer,
  Info
} from 'lucide-react';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useLibraryStore } from '../../stores/useLibraryStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { VisualizerCanvas } from './VisualizerCanvas';

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export const FullscreenPlayerModal: React.FC = () => {
  const {
    currentTrack,
    playbackState,
    currentTime,
    duration,
    isShuffled,
    repeatMode,
    isFullscreenOpen,
    activeLyricIndex,
    togglePlayPause,
    seek,
    nextTrack,
    previousTrack,
    toggleShuffle,
    cycleRepeatMode,
    setFullscreenOpen,
    queue,
    playTrack
  } = usePlayerStore();

  const { toggleLikeTrack, likedTracks } = useLibraryStore();
  const { equalizerPreset, setEqualizerPreset, eqBands, setEQBand } = useSettingsStore();

  const [activeTab, setActiveTab] = useState<'lyrics' | 'queue' | 'eq' | 'sleep' | 'credits'>('lyrics');
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);
  const [showHeartPop, setShowHeartPop] = useState(false);

  const lyricsContainerRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll active lyric into center view
  useEffect(() => {
    if (activeTab === 'lyrics' && lyricsContainerRef.current) {
      const activeEl = lyricsContainerRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeLyricIndex, activeTab]);

  // Sleep Timer countdown
  useEffect(() => {
    if (sleepTimerRemaining !== null && sleepTimerRemaining > 0) {
      timerRef.current = setInterval(() => {
        setSleepTimerRemaining((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(timerRef.current!);
            togglePlayPause();
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sleepTimerRemaining]);

  if (!isFullscreenOpen || !currentTrack) return null;

  const isLiked = likedTracks.some((t) => t.id === currentTrack.id) || currentTrack.isLiked;
  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  const handleDoubleTapCover = () => {
    if (!isLiked) {
      toggleLikeTrack(currentTrack);
      if (navigator.vibrate) navigator.vibrate([15, 30, 15]);
      setShowHeartPop(true);
      setTimeout(() => setShowHeartPop(false), 900);
    }
  };

  const handleSetSleepTimer = (minutes: number) => {
    setSleepTimerRemaining(minutes * 60);
    if (navigator.vibrate) navigator.vibrate(20);
  };

  const eqPresetsList: Array<'flat' | 'bass_boost' | 'vocal' | 'electronic' | 'rock' | 'acoustic'> = [
    'flat',
    'bass_boost',
    'vocal',
    'electronic',
    'rock',
    'acoustic'
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#050608] flex flex-col justify-between overflow-hidden animate-in fade-in duration-200 select-none">
      {/* Dynamic Ambient Mesh Glow */}
      <div 
        className="absolute inset-0 opacity-20 blur-[110px] pointer-events-none transform scale-125 transition-all duration-1000"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 25%, #8b5cf6 0%, #06b6d4 40%, transparent 75%)`
        }}
      />

      {/* Top Header Bar */}
      <div className="relative z-10 flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08] bg-[#050608]/80 backdrop-blur-2xl">
        <button
          onClick={() => setFullscreenOpen(false)}
          className="p-2 -ml-2 rounded-full text-neutral-400 hover:text-white hover:bg-white/5 active:scale-90 transition cursor-pointer"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        <div className="text-center space-y-0.5 max-w-[200px] truncate">
          <span className="text-[10px] font-mono font-black tracking-widest uppercase text-violet-400">
            NOW PLAYING // 320 KBPS
          </span>
          <p className="text-xs font-bold text-white truncate">{currentTrack.album || 'Single'}</p>
        </div>

        <button
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(15);
            toggleLikeTrack(currentTrack);
          }}
          className="p-2 -mr-2 rounded-full text-neutral-400 hover:text-white transition cursor-pointer"
        >
          <Heart className={`w-6 h-6 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>
      </div>

      {/* Main Center Area */}
      <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 md:p-8 max-w-6xl mx-auto w-full min-h-0 items-center overflow-y-auto custom-scrollbar">
        {/* Left Side: Artwork & Track Metadata */}
        <div className="flex flex-col items-center justify-center space-y-5">
          <div 
            onDoubleClick={handleDoubleTapCover}
            className="relative w-64 h-64 md:w-80 md:h-80 rounded-3xl overflow-hidden shadow-2xl border border-white/10 group cursor-pointer"
          >
            <img
              src={currentTrack.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80'}
              alt={currentTrack.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Visualizer Overlay */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-center p-3">
              <VisualizerCanvas className="w-full h-12" />
            </div>

            {/* Heart Pop Overlay on Double Tap */}
            {showHeartPop && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center animate-in zoom-in-50 duration-200">
                <Heart className="w-20 h-20 fill-rose-500 text-rose-500 animate-bounce" />
              </div>
            )}
          </div>

          {/* Title & Artist */}
          <div className="text-center space-y-1.5 max-w-sm px-4">
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight line-clamp-1">
              {currentTrack.title}
            </h2>
            <p className="text-sm font-semibold text-neutral-400 hover:text-white transition cursor-pointer">
              {currentTrack.artist}
            </p>
            <div className="flex items-center justify-center gap-2 pt-1">
              <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                Lossless • 320kbps AAC
              </span>
              {sleepTimerRemaining !== null && (
                <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                  <Timer className="w-3 h-3" />
                  {formatTime(sleepTimerRemaining)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Drawer Tabs */}
        <div className="flex flex-col h-[380px] md:h-[480px] rounded-3xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl overflow-hidden shadow-2xl">
          {/* Drawer Tab Headers */}
          <div className="flex items-center border-b border-white/[0.08] bg-black/40 px-2 py-1.5">
            {[
              { key: 'lyrics', label: 'Lyrics', icon: Mic2 },
              { key: 'queue', label: 'Up Next', icon: ListMusic },
              { key: 'eq', label: 'Equalizer', icon: Sliders },
              { key: 'sleep', label: 'Sleep Timer', icon: Timer },
              { key: 'credits', label: 'Credits', icon: Info }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === key
                    ? 'bg-violet-500/25 text-violet-300 border border-violet-500/40 shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* TAB 1: KARAOKE SYNCED LYRICS */}
          {activeTab === 'lyrics' && (
            <div
              ref={lyricsContainerRef}
              className="flex-1 overflow-y-auto p-6 space-y-5 text-center custom-scrollbar"
            >
              {currentTrack.syncedLyrics && currentTrack.syncedLyrics.length > 0 ? (
                currentTrack.syncedLyrics.map((lyric, idx) => {
                  const isActive = idx === activeLyricIndex;
                  return (
                    <div
                      key={idx}
                      data-active={isActive}
                      onClick={() => seek(lyric.timeMs / 1000)}
                      className={`text-lg md:text-xl font-extrabold transition-all duration-300 cursor-pointer rounded-xl p-2 ${
                        isActive
                          ? 'text-white scale-105 bg-violet-500/20 shadow-[0_0_25px_rgba(139,92,246,0.25)] border border-violet-500/30'
                          : 'text-neutral-500 hover:text-neutral-300'
                      }`}
                    >
                      {lyric.text}
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-neutral-400 space-y-2">
                  <Mic2 className="w-8 h-8 opacity-40 text-violet-400" />
                  <p className="text-sm font-semibold">Instrumental or Lyrics Not Available</p>
                  <span className="text-xs text-neutral-500">Playing in pristine 320kbps CD Audio</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: UP NEXT QUEUE */}
          {activeTab === 'queue' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 px-2 py-1">
                Up Next ({queue.length} tracks)
              </div>
              {queue.map((t, idx) => (
                <div
                  key={`${t.id}_${idx}`}
                  onClick={() => playTrack(t)}
                  className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-white/5 transition cursor-pointer group"
                >
                  <img src={t.coverUrl} alt={t.title} className="w-10 h-10 rounded-xl object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate group-hover:text-violet-300 transition">{t.title}</p>
                    <p className="text-[11px] text-neutral-400 truncate">{t.artist}</p>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-500">{formatTime(t.duration)}</span>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: 5-BAND EQUALIZER */}
          {activeTab === 'eq' && (
            <div className="flex-1 p-5 overflow-y-auto space-y-6 custom-scrollbar">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-2">Preset</span>
                <div className="grid grid-cols-3 gap-2">
                  {eqPresetsList.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setEqualizerPreset(preset)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold uppercase transition cursor-pointer ${
                        equalizerPreset === preset
                          ? 'bg-gradient-to-r from-violet-500 to-cyan-500 text-black font-black shadow-lg'
                          : 'bg-white/5 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {preset.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5 Frequency Sliders */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block">Frequencies</span>
                {[
                  { label: '60 Hz (Sub Bass)', index: 0 },
                  { label: '250 Hz (Warmth)', index: 1 },
                  { label: '1 kHz (Vocals)', index: 2 },
                  { label: '4 kHz (Clarity)', index: 3 },
                  { label: '14 kHz (Air/High)', index: 4 }
                ].map(({ label, index }) => {
                  const val = eqBands[index] || 0;
                  return (
                    <div key={index} className="flex items-center gap-3">
                      <span className="text-xs text-neutral-300 w-32 truncate">{label}</span>
                      <input
                        type="range"
                        min="-12"
                        max="12"
                        step="1"
                        value={val}
                        onChange={(e) => setEQBand(index, parseFloat(e.target.value))}
                        className="flex-1 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                      />
                      <span className="text-[10px] font-mono text-neutral-400 w-8 text-right">{val > 0 ? `+${val}` : val}dB</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: SLEEP TIMER */}
          {activeTab === 'sleep' && (
            <div className="flex-1 p-6 flex flex-col justify-center space-y-4">
              <div className="text-center space-y-1">
                <h4 className="text-sm font-bold text-white">Stop audio automatically</h4>
                <p className="text-xs text-neutral-400">Sleep peacefully with no interrupted battery drain</p>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: '5 Minutes', min: 5 },
                  { label: '15 Minutes', min: 15 },
                  { label: '30 Minutes', min: 30 },
                  { label: '45 Minutes', min: 45 },
                  { label: '1 Hour', min: 60 },
                  { label: 'End of Track', min: Math.ceil((duration - currentTime) / 60) || 3 }
                ].map(({ label, min }) => (
                  <button
                    key={label}
                    onClick={() => handleSetSleepTimer(min)}
                    className="py-3 px-4 rounded-2xl bg-white/5 hover:bg-violet-500/20 text-white hover:text-violet-300 text-xs font-bold transition border border-white/5 hover:border-violet-500/30 cursor-pointer"
                  >
                    {label}
                  </button>
                ))}
              </div>
              {sleepTimerRemaining !== null && (
                <button
                  onClick={() => setSleepTimerRemaining(null)}
                  className="w-full py-2.5 rounded-xl bg-rose-500/10 text-rose-400 text-xs font-bold border border-rose-500/20 hover:bg-rose-500/20 transition cursor-pointer"
                >
                  Cancel Sleep Timer
                </button>
              )}
            </div>
          )}

          {/* TAB 5: CREDITS & METADATA */}
          {activeTab === 'credits' && (
            <div className="flex-1 p-6 space-y-4 text-xs text-neutral-300 overflow-y-auto custom-scrollbar">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-neutral-500">Performed by</span>
                <p className="text-sm font-bold text-white">{currentTrack.artist}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-neutral-500">Album</span>
                <p className="text-sm font-bold text-white">{currentTrack.album || 'Single'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-neutral-500">Audio Stream Quality</span>
                <p className="text-sm font-bold text-violet-400">320kbps AAC / Lossless High-Fidelity</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-neutral-500">Release Year</span>
                <p className="text-sm font-bold text-white">{currentTrack.releaseYear || 2024}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Transport Controls Bar */}
      <div className="relative z-10 px-6 py-5 border-t border-white/[0.08] bg-[#050608]/90 backdrop-blur-2xl max-w-4xl mx-auto w-full space-y-3">
        {/* Scrubber Slider */}
        <div className="space-y-1">
          <div
            className="h-2 bg-white/10 rounded-full cursor-pointer relative group overflow-hidden"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
              seek(pos * duration);
            }}
          >
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all rounded-full shadow-[0_0_12px_rgba(139,92,246,0.8)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-mono text-neutral-400 px-0.5">
            <span>{formatTime(currentTime)}</span>
            <span>-{formatTime(Math.max(0, duration - currentTime))}</span>
          </div>
        </div>

        {/* Buttons: Shuffle, Prev, Play/Pause, Next, Repeat */}
        <div className="flex items-center justify-between px-4">
          <button
            onClick={toggleShuffle}
            className={`p-2.5 rounded-full transition cursor-pointer ${
              isShuffled ? 'text-violet-400 bg-violet-500/15' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Shuffle className="w-5 h-5" />
          </button>

          <button
            onClick={previousTrack}
            className="p-2.5 text-neutral-300 hover:text-white active:scale-90 transition cursor-pointer"
          >
            <SkipBack className="w-7 h-7 fill-current" />
          </button>

          <button
            onClick={togglePlayPause}
            className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-2xl cursor-pointer"
          >
            {playbackState === 'playing' ? (
              <Pause className="w-8 h-8 fill-current" />
            ) : (
              <Play className="w-8 h-8 fill-current ml-1" />
            )}
          </button>

          <button
            onClick={nextTrack}
            className="p-2.5 text-neutral-300 hover:text-white active:scale-90 transition cursor-pointer"
          >
            <SkipForward className="w-7 h-7 fill-current" />
          </button>

          <button
            onClick={cycleRepeatMode}
            className={`p-2.5 rounded-full transition cursor-pointer ${
              repeatMode !== 'off' ? 'text-violet-400 bg-violet-500/15' : 'text-neutral-400 hover:text-white'
            }`}
          >
            {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
