import React, { useEffect, useRef, useState } from 'react';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { SyncedLyricLine } from '../../types';
import { Mic2, AlignLeft, Sparkles, RefreshCw } from 'lucide-react';

interface LyricsViewProps {
  onLineClick?: (line: SyncedLyricLine) => void;
  className?: string;
  isCompact?: boolean;
}

export const LyricsView: React.FC<LyricsViewProps> = ({
  onLineClick,
  className = '',
  isCompact = false,
}) => {
  const {
    currentTrack,
    activeLyricIndex,
    isLyricsLoading,
    seek,
  } = usePlayerStore();

  const [isPlainTextMode, setIsPlainTextMode] = useState(false);
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const syncedLyrics = currentTrack?.syncedLyrics || [];
  const hasSynced = syncedLyrics.length > 0;
  const plainLyrics = currentTrack?.plainLyrics;

  // Auto-scroll active line to center unless user recently scrolled manually
  useEffect(() => {
    if (!userHasScrolled && activeLineRef.current && !isPlainTextMode && hasSynced) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeLyricIndex, userHasScrolled, isPlainTextMode, hasSynced]);

  // Track user manual scrolling to pause auto-scroll temporarily
  const handleScroll = () => {
    setUserHasScrolled(true);
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    // Resume auto-scroll after 3 seconds of scroll inactivity
    scrollTimeoutRef.current = setTimeout(() => {
      setUserHasScrolled(false);
    }, 3000);
  };

  const handleSnapBack = () => {
    setUserHasScrolled(false);
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  };

  const handleLineClick = (line: SyncedLyricLine) => {
    seek(line.timeMs / 1000);
    setUserHasScrolled(false);
    if (onLineClick) {
      onLineClick(line);
    }
  };

  // 1. Loading Skeleton State
  if (isLyricsLoading) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 space-y-6 ${className}`}>
        <div className="flex items-center gap-2 text-[#1ed760] font-bold text-sm animate-pulse">
          <Sparkles className="w-4 h-4" />
          <span>Syncing lyrics from Riff Engine...</span>
        </div>
        <div className="w-full max-w-lg space-y-4">
          <div className="h-6 bg-white/10 rounded-full w-3/4 animate-pulse" />
          <div className="h-8 bg-white/20 rounded-full w-4/5 animate-pulse" />
          <div className="h-10 bg-white/30 rounded-full w-2/3 animate-pulse" />
          <div className="h-8 bg-white/20 rounded-full w-5/6 animate-pulse" />
          <div className="h-6 bg-white/10 rounded-full w-1/2 animate-pulse" />
        </div>
      </div>
    );
  }

  // 2. Empty State (No lyrics available)
  if (!hasSynced && !plainLyrics) {
    return (
      <div className={`flex flex-col items-center justify-center text-center p-8 select-none ${className}`}>
        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-[#727272]">
          <Mic2 className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-white mb-1">Lyrics not available yet</h3>
        <p className="text-xs text-[#b3b3b3] max-w-sm">
          We could not find synchronized lyrics for{' '}
          <span className="text-white font-medium">{currentTrack?.title || 'this track'}</span>.
        </p>
      </div>
    );
  }

  return (
    <div className={`relative flex flex-col h-full ${className}`}>
      {/* Top Header bar with view toggles & sync chip */}
      <div className="flex items-center justify-between pb-3 px-2 border-b border-white/5 shrink-0 select-none">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#b3b3b3]">
            {isPlainTextMode || !hasSynced ? 'Plain Lyrics' : 'Synced Karaoke'}
          </span>
          {hasSynced && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#1ed760]/20 text-[#1ed760] border border-[#1ed760]/30">
              Live
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {userHasScrolled && hasSynced && (
            <button
              onClick={handleSnapBack}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1ed760] text-black text-xs font-bold shadow-lg shadow-[#1ed760]/20 hover:scale-105 active:scale-95 transition cursor-pointer"
            >
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Sync</span>
            </button>
          )}

          {hasSynced && plainLyrics && (
            <button
              onClick={() => setIsPlainTextMode(!isPlainTextMode)}
              className="p-1.5 rounded-lg text-[#b3b3b3] hover:text-white hover:bg-white/10 transition cursor-pointer"
              title={isPlainTextMode ? 'Switch to Synced Karaoke' : 'Switch to Plain Text'}
            >
              {isPlainTextMode ? <Mic2 className="w-4 h-4" /> : <AlignLeft className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Main Lyrics Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        onTouchMove={handleScroll}
        onWheel={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden py-8 px-2 sm:px-4 space-y-5 no-scrollbar scroll-smooth"
      >
        {isPlainTextMode || !hasSynced ? (
          /* Plain Lyrics Rendering */
          <div className="text-[#d1d1d1] text-base sm:text-lg leading-relaxed whitespace-pre-line select-text font-medium max-w-xl mx-auto">
            {plainLyrics || 'No plain lyrics text available.'}
          </div>
        ) : (
          /* Synced Karaoke Lines */
          syncedLyrics.map((line, index) => {
            const isActive = index === activeLyricIndex;
            const isPast = index < activeLyricIndex;

            return (
              <div
                key={`${line.timeMs}-${index}`}
                ref={isActive ? activeLineRef : null}
                onClick={() => handleLineClick(line)}
                className={`group cursor-pointer transition-all duration-300 rounded-xl px-3 py-2 select-none ${
                  isActive
                    ? 'scale-102 sm:scale-105 origin-left'
                    : 'hover:bg-white/5 opacity-80 hover:opacity-100'
                }`}
              >
                <p
                  className={`font-black tracking-tight transition-all duration-300 ${
                    isActive
                      ? isCompact
                        ? 'text-lg sm:text-xl text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.3)]'
                        : 'text-2xl sm:text-3xl md:text-4xl text-white drop-shadow-[0_4px_16px_rgba(30,215,96,0.35)]'
                      : isPast
                      ? isCompact
                        ? 'text-sm sm:text-base text-white/50 font-semibold'
                        : 'text-lg sm:text-2xl text-white/40 font-bold group-hover:text-white/80'
                      : isCompact
                      ? 'text-sm sm:text-base text-[#6a6a6a] font-semibold'
                      : 'text-lg sm:text-2xl text-[#6a6a6a] font-bold group-hover:text-[#b3b3b3]'
                  }`}
                >
                  {line.text}
                </p>
              </div>
            );
          })
        )}

        {/* Bottom Attribution */}
        <div className="pt-12 pb-6 text-center text-[10px] text-[#555] select-none">
          Lyrics synced and provided by Riff Master Engine
        </div>
      </div>
    </div>
  );
};
