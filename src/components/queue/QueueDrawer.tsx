import React from 'react';
import {
  ListMusic,
  X,
  Trash2,
  GripVertical,
  Volume2,
  Sparkles
} from 'lucide-react';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { GLOBAL_CATALOG } from '../../lib/algorithm';

function formatDuration(sec: number): string {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const QueueDrawer: React.FC = () => {
  const {
    isQueueOpen,
    setQueueOpen,
    queue,
    queueIndex,
    currentTrack,
    playTrack,
    removeFromQueue,
    clearQueue,
    addToQueue
  } = usePlayerStore();

  if (!isQueueOpen) return null;

  const upcomingTracks = queue.slice(queueIndex + 1);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md h-full bg-[#12131d] border-l border-white/10 p-6 flex flex-col justify-between shadow-2xl space-y-4 animate-in slide-in-from-right duration-300">
        {/* 1. Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <ListMusic className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-black text-white">Up Next Queue</h2>
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-bold text-neutral-300">
              {queue.length} songs
            </span>
          </div>

          <div className="flex items-center gap-2">
            {queue.length > 0 && (
              <button
                onClick={clearQueue}
                className="text-xs font-bold text-neutral-400 hover:text-rose-400 transition cursor-pointer"
              >
                Clear All
              </button>
            )}
            <button
              onClick={() => setQueueOpen(false)}
              className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Now Playing Section */}
        {currentTrack && (
          <div className="space-y-2 shrink-0">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-400">Currently Playing</p>
            <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30">
              <img src={currentTrack.coverUrl} alt="" className="w-12 h-12 rounded-xl object-cover shadow-md" />
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm font-black text-white truncate">{currentTrack.title}</p>
                <p className="text-[11px] text-neutral-300 truncate">{currentTrack.artist}</p>
              </div>
              <Volume2 className="w-4 h-4 text-cyan-400 animate-pulse shrink-0" />
            </div>
          </div>
        )}

        {/* 3. Upcoming Queue Scrollable List */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar min-h-0">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 px-1">
            Next Up ({upcomingTracks.length})
          </p>

          {upcomingTracks.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
              <Sparkles className="w-8 h-8 text-neutral-500 mx-auto" />
              <p className="text-xs text-neutral-400">Queue is currently empty.</p>
              <button
                onClick={() => {
                  GLOBAL_CATALOG.slice(0, 5).forEach((t) => addToQueue(t));
                }}
                className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition border border-white/10 cursor-pointer"
              >
                + Add Recommended Songs
              </button>
            </div>
          ) : (
            upcomingTracks.map((track, idx) => {
              const actualQueueIndex = queueIndex + 1 + idx;

              return (
                <div
                  key={`${track.id}_${idx}`}
                  className="group flex items-center justify-between p-2.5 rounded-2xl hover:bg-white/[0.06] transition"
                >
                  <div
                    onClick={() => playTrack(track)}
                    className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                  >
                    <GripVertical className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400 cursor-grab shrink-0" />
                    <img src={track.coverUrl} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0 shadow-sm" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate group-hover:text-cyan-400 transition">
                        {track.title}
                      </p>
                      <p className="text-[11px] text-neutral-400 truncate">{track.artist}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-mono text-neutral-500">{formatDuration(track.duration)}</span>
                    <button
                      onClick={() => removeFromQueue(actualQueueIndex)}
                      className="p-1 text-neutral-500 hover:text-rose-400 rounded-full transition cursor-pointer"
                      title="Remove from Queue"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 4. Bottom Autoplay Info */}
        <div className="pt-2 border-t border-white/[0.08] text-[11px] text-neutral-400 flex items-center justify-between shrink-0">
          <span>Smart Autoplay Active</span>
          <span className="text-emerald-400 font-bold">Infinite Play</span>
        </div>
      </div>
    </div>
  );
};

export default QueueDrawer;
