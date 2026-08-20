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
  Sparkles
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
    queue
  } = usePlayerStore();

  const { toggleLikeTrack, likedTracks } = useLibraryStore();
  const { equalizerPreset, setEqualizerPreset, eqBands, setEQBand } = useSettingsStore();

  const [activeTab, setActiveTab] = useState<'lyrics' | 'queue' | 'eq'>('lyrics');
  const lyricsContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll active lyric into center view
  useEffect(() => {
    if (activeTab === 'lyrics' && lyricsContainerRef.current) {
      const activeEl = lyricsContainerRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeLyricIndex, activeTab]);

  if (!isFullscreenOpen || !currentTrack) return null;

  const isLiked = likedTracks.some((t) => t.id === currentTrack.id) || currentTrack.isLiked;

  const eqPresetsList: Array<'flat' | 'bass_boost' | 'vocal' | 'electronic' | 'rock' | 'acoustic'> = [
    'flat',
    'bass_boost',
    'vocal',
    'electronic',
    'rock',
    'acoustic'
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#08080a] flex flex-col justify-between overflow-hidden animate-in fade-in zoom-in-95 duration-300 select-none">
      {/* Subtle Ambient Emerald Radial Glow */}
      <div 
        className="absolute inset-0 opacity-20 blur-[120px] pointer-events-none transform scale-125 transition-all duration-1000"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 30%, #1db954 0%, #0d1f14 45%, transparent 70%)`
        }}
      />

      {/* Top Bar Header */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#08080a]/80 backdrop-blur-2xl">
        <button
          onClick={() => setFullscreenOpen(false)}
          className="p-2 rounded-full text-neutral-400 hover:text-white hover:bg-white/5 transition-all"
          title="Minimize (Esc)"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        <div className="text-center space-y-0.5">
          <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-[#1db954]">
            NOW STREAMING // {currentTrack.sourceType.toUpperCase()}
          </span>
          <h3 className="text-xs font-mono text-neutral-300 truncate max-w-xs md:max-w-md">
            {currentTrack.album || 'RIFF AUDIO'}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleLikeTrack(currentTrack)}
            className={`p-2 rounded-full hover:bg-white/5 transition-colors ${
              isLiked ? 'text-[#1db954] fill-[#1db954]' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-[#1db954]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Center Dynamic Split: Left (Vinyl Showcase + Waveform) / Right (Lyrics, Queue, EQ) */}
      <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 md:p-10 items-center max-w-7xl mx-auto w-full overflow-hidden">
        {/* Left Column: Visual Artwork, Spinning Vinyl & Spectrum */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center space-y-6 text-center">
          {/* Vinyl + Cover Showcase */}
          <div className="relative group flex items-center justify-center">
            {/* Spinning Vinyl Record Disc */}
            <div
              className={`absolute w-56 h-56 md:w-72 md:h-72 rounded-full bg-[#0a0a0d] border-4 border-[#1c1e27] shadow-2xl flex items-center justify-center transition-all duration-700 ${
                playbackState === 'playing' ? 'translate-x-14 md:translate-x-20 animate-vinyl-spin' : 'translate-x-8'
              }`}
              style={{
                backgroundImage: `radial-gradient(circle, #1a1c24 15%, #0d0e12 40%, #161820 65%, #08090c 90%)`
              }}
            >
              <div className="w-24 h-24 rounded-full border-2 border-white/20 flex items-center justify-center bg-black/70">
                <div className="w-7 h-7 rounded-full bg-[#1db954] shadow-lg shadow-[#1db954]/50" />
              </div>
            </div>

            {/* Foreground Album Artwork */}
            <div className="relative z-10 w-60 h-60 md:w-72 md:h-72 rounded-2xl overflow-hidden shadow-2xl shadow-black ring-1 ring-white/15">
              <img
                src={currentTrack.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80'}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>
          </div>

          <div className="space-y-1 max-w-md">
            <h1 className="text-2xl md:text-3xl font-black font-mono text-white tracking-tight uppercase truncate">
              {currentTrack.title}
            </h1>
            <p className="text-sm font-mono text-neutral-400 truncate">
              Artist // <span className="text-white font-bold">{currentTrack.artist}</span>
            </p>
          </div>

          {/* Real-time Oscilloscope Waveform */}
          <div className="w-full max-w-xs p-2 rounded-xl bg-black/40 border border-white/[0.08]">
            <VisualizerCanvas mode="oscilloscope" color="green" />
          </div>
        </div>

        {/* Right Column: Tabbed Lyrics / Queue / 5-Band EQ */}
        <div className="lg:col-span-6 flex flex-col h-full max-h-[460px] glass-editorial rounded-3xl overflow-hidden shadow-2xl border border-white/[0.08]">
          {/* Tabs Navigation */}
          <div className="flex items-center justify-around border-b border-white/[0.08] p-2 bg-black/20 text-xs font-mono font-bold uppercase tracking-wider">
            <button
              onClick={() => setActiveTab('lyrics')}
              className={`flex items-center gap-2 py-2 px-4 rounded-xl transition-all ${
                activeTab === 'lyrics' ? 'bg-white text-black shadow-md' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Mic2 className={`w-3.5 h-3.5 ${activeTab === 'lyrics' ? 'text-[#1db954]' : ''}`} />
              SYNCED LYRICS
            </button>

            <button
              onClick={() => setActiveTab('queue')}
              className={`flex items-center gap-2 py-2 px-4 rounded-xl transition-all ${
                activeTab === 'queue' ? 'bg-white text-black shadow-md' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <ListMusic className={`w-3.5 h-3.5 ${activeTab === 'queue' ? 'text-[#1db954]' : ''}`} />
              UP NEXT ({queue.length})
            </button>

            <button
              onClick={() => setActiveTab('eq')}
              className={`flex items-center gap-2 py-2 px-4 rounded-xl transition-all ${
                activeTab === 'eq' ? 'bg-white text-black shadow-md' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Sliders className={`w-3.5 h-3.5 ${activeTab === 'eq' ? 'text-[#1db954]' : ''}`} />
              EQUALIZER DSP
            </button>
          </div>

          {/* Tab 1: Synced Lyrics View */}
          {activeTab === 'lyrics' && (
            <div
              ref={lyricsContainerRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 text-center select-none font-mono"
            >
              {currentTrack.syncedLyrics && currentTrack.syncedLyrics.length > 0 ? (
                currentTrack.syncedLyrics.map((line, idx) => {
                  const isActive = idx === activeLyricIndex;
                  return (
                    <p
                      key={idx}
                      data-active={isActive}
                      onClick={() => seek(line.timeMs / 1000)}
                      className={`text-base md:text-lg font-bold transition-all duration-300 cursor-pointer ${
                        isActive
                          ? 'text-[#1db954] scale-110 drop-shadow-[0_0_12px_rgba(29,185,84,0.6)] font-black'
                          : 'text-neutral-500 hover:text-neutral-300'
                      }`}
                    >
                      {line.text}
                    </p>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-neutral-500 space-y-2">
                  <Sparkles className="w-8 h-8 text-neutral-600 animate-pulse" />
                  <p className="text-xs font-mono uppercase tracking-wider">Instrumental or Unsynced Track</p>
                  {currentTrack.plainLyrics && (
                    <p className="text-xs text-neutral-400 whitespace-pre-line text-left max-w-sm mt-4 font-sans">
                      {currentTrack.plainLyrics}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Queue View */}
          {activeTab === 'queue' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {queue.map((song, i) => (
                <div
                  key={song.id + '_' + i}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    song.id === currentTrack.id
                      ? 'bg-[#1db954]/15 border-[#1db954]/40 text-[#1db954]'
                      : 'bg-white/[0.04] border-white/[0.06] text-neutral-300 hover:bg-white/[0.08]'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className="font-mono text-xs font-bold text-neutral-500 w-4">{i + 1}</span>
                    <img src={song.coverUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold font-mono tracking-tight truncate">{song.title}</p>
                      <p className="text-[11px] text-neutral-400 truncate">{song.artist}</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-neutral-500">{formatTime(song.duration)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Tab 3: 5-Band Equalizer DSP */}
          {activeTab === 'eq' && (
            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
              <div className="flex flex-wrap gap-2 justify-center">
                {eqPresetsList.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setEqualizerPreset(preset)}
                    className={`text-xs px-3 py-1.5 rounded-full uppercase font-mono font-bold tracking-wider transition-all ${
                      equalizerPreset === preset
                        ? 'bg-white text-black shadow-md'
                        : 'bg-white/[0.04] text-neutral-400 hover:text-white border border-white/[0.08]'
                    }`}
                  >
                    {preset.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {/* 5-Band Slider Sliders */}
              <div className="grid grid-cols-5 gap-3 text-center pt-2">
                {['60Hz', '250Hz', '1kHz', '4kHz', '14kHz'].map((label, idx) => (
                  <div key={label} className="flex flex-col items-center gap-2">
                    <span className="text-[10px] font-mono text-[#1db954] font-bold">{eqBands[idx]} dB</span>
                    <input
                      type="range"
                      min={-12}
                      max={12}
                      step={1}
                      value={eqBands[idx] || 0}
                      onChange={(e) => setEQBand(idx, parseFloat(e.target.value))}
                      className="h-28 w-2 appearance-none bg-white/10 rounded-lg accent-[#1db954] [writing-mode:vertical-lr] [direction:rtl]"
                    />
                    <span className="text-[10px] font-mono text-neutral-400">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Large Controls & Scrub Bar */}
      <div className="relative z-10 px-6 md:px-12 py-6 bg-[#08080a]/90 backdrop-blur-2xl border-t border-white/[0.08] max-w-4xl mx-auto w-full space-y-4">
        {/* Scrub Bar */}
        <div className="space-y-1">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime || 0}
            onChange={(e) => seek(parseFloat(e.target.value))}
            className="w-full editorial-scrubber"
          />
          <div className="flex justify-between text-xs font-mono text-neutral-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <button
            onClick={toggleShuffle}
            className={`p-3 rounded-full transition-colors ${
              isShuffled ? 'text-[#1db954]' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Shuffle className="w-5 h-5" />
          </button>

          <button onClick={previousTrack} className="p-3 text-neutral-300 hover:text-white transition-colors">
            <SkipBack className="w-7 h-7" />
          </button>

          <button
            onClick={togglePlayPause}
            className="w-16 h-16 rounded-full btn-spotify-emerald flex items-center justify-center text-black shadow-2xl hover:scale-105 active:scale-95 transition-all"
          >
            {playbackState === 'playing' ? (
              <Pause className="w-8 h-8 fill-black text-black" />
            ) : (
              <Play className="w-8 h-8 fill-black text-black ml-1" />
            )}
          </button>

          <button onClick={nextTrack} className="p-3 text-neutral-300 hover:text-white transition-colors">
            <SkipForward className="w-7 h-7" />
          </button>

          <button
            onClick={cycleRepeatMode}
            className={`p-3 rounded-full transition-colors ${
              repeatMode !== 'off' ? 'text-[#1db954]' : 'text-neutral-400 hover:text-white'
            }`}
          >
            {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
