import React from 'react';
import { X, Mic2, ListMusic, Heart, CheckCircle2, Play, Trash2, Tv2 } from 'lucide-react';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useLibraryStore } from '../../stores/useLibraryStore';
import { getArtistProfile } from '../../lib/algorithm';

export const NowPlayingSidebar: React.FC = () => {
  const {
    currentTrack,
    isRightSidebarOpen,
    rightSidebarTab,
    setRightSidebarTab,
    setRightSidebarOpen,
    queue,
    queueIndex,
    navigateToArtist,
    activeLyricIndex,
    playTrack,
    seek,
    removeFromQueue,
    clearQueue
  } = usePlayerStore();

  const { toggleLikeTrack, likedTracks } = useLibraryStore();

  if (!isRightSidebarOpen || !currentTrack) return null;

  const isLiked = likedTracks.some((t) => t.id === currentTrack.id) || currentTrack.isLiked;
  const artistProfile = getArtistProfile(currentTrack.artist);
  const upcomingQueue = queue.slice(queueIndex + 1);

  return (
    <aside className="w-80 lg:w-88 rounded-lg bg-[#121212] border border-white/[0.04] flex flex-col justify-between hidden xl:flex select-none h-full overflow-hidden shadow-2xl shrink-0 p-4 space-y-3 animate-in slide-in-from-right duration-200">
      {/* 1. Top Header with Tabs & Close */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 shrink-0">
        {/* Tab Pills */}
        <div className="flex items-center gap-1 bg-white/[0.06] p-1 rounded-full text-xs font-bold">
          <button
            onClick={() => setRightSidebarTab('nowplaying')}
            className={`px-3 py-1 rounded-full transition cursor-pointer flex items-center gap-1.5 ${
              rightSidebarTab === 'nowplaying' ? 'bg-[#282828] text-white shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Tv2 className="w-3.5 h-3.5" />
            <span>Track</span>
          </button>

          <button
            onClick={() => setRightSidebarTab('lyrics')}
            className={`px-3 py-1 rounded-full transition cursor-pointer flex items-center gap-1.5 ${
              rightSidebarTab === 'lyrics' ? 'bg-[#282828] text-[#1db954] shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Mic2 className="w-3.5 h-3.5" />
            <span>Lyrics</span>
          </button>

          <button
            onClick={() => setRightSidebarTab('queue')}
            className={`px-3 py-1 rounded-full transition cursor-pointer flex items-center gap-1.5 ${
              rightSidebarTab === 'queue' ? 'bg-[#282828] text-white shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <ListMusic className="w-3.5 h-3.5" />
            <span>Queue</span>
          </button>
        </div>

        <button
          onClick={() => setRightSidebarOpen(false)}
          className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          title="Close panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. TAB 1: NOW PLAYING VIEW */}
      {rightSidebarTab === 'nowplaying' && (
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
          {/* Cover Art */}
          <div className="space-y-3">
            <div className="relative w-full aspect-square rounded-lg overflow-hidden shadow-2xl ring-1 ring-white/10 group">
              <img
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1 pr-2">
                <h4 className="text-base font-black text-white tracking-tight truncate hover:underline cursor-pointer">
                  {currentTrack.title}
                </h4>
                <p
                  onClick={() => navigateToArtist(currentTrack.artist)}
                  className="text-xs text-neutral-400 hover:text-[#1db954] cursor-pointer truncate mt-0.5"
                >
                  {currentTrack.artist}
                </p>
              </div>

              <button
                onClick={() => toggleLikeTrack(currentTrack)}
                className={`p-2 rounded-full hover:bg-white/10 transition cursor-pointer ${
                  isLiked ? 'text-[#1db954]' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-[#1db954]' : ''}`} />
              </button>
            </div>
          </div>

          {/* About The Artist Card */}
          <div className="p-4 rounded-xl bg-[#181818] border border-white/5 space-y-3 relative overflow-hidden">
            <div className="flex items-center gap-3">
              <img
                src={artistProfile.avatarUrl}
                alt={artistProfile.name}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-[#1db954]"
              />
              <div className="min-w-0 flex-1">
                <h5
                  onClick={() => navigateToArtist(artistProfile.name)}
                  className="text-sm font-bold text-white truncate cursor-pointer hover:text-[#1db954] flex items-center gap-1.5"
                >
                  <span>{artistProfile.name}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#1db954] fill-current" />
                </h5>
                <p className="text-[11px] text-neutral-400">
                  {(artistProfile.monthlyListeners || 42000000).toLocaleString()} monthly listeners
                </p>
              </div>
            </div>
            <p className="text-xs text-neutral-400 line-clamp-3 leading-relaxed">
              {artistProfile.bio}
            </p>
          </div>

          {/* Upcoming Track preview */}
          {upcomingQueue[0] && (
            <div
              onClick={() => playTrack(upcomingQueue[0])}
              className="p-3.5 rounded-xl bg-[#181818] border border-white/5 space-y-2 cursor-pointer group hover:bg-[#202020] transition"
            >
              <div className="flex items-center justify-between text-[11px] font-bold uppercase text-neutral-400">
                <span className="flex items-center gap-1.5 text-[#1db954]">
                  <ListMusic className="w-3.5 h-3.5" />
                  <span>NEXT IN QUEUE</span>
                </span>
                <span className="text-[10px] text-neutral-500 group-hover:text-white">PLAY NEXT</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <img src={upcomingQueue[0].coverUrl} alt="" className="w-10 h-10 rounded-md object-cover shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate group-hover:text-[#1db954]">{upcomingQueue[0].title}</p>
                    <p className="text-[11px] text-neutral-400 truncate">{upcomingQueue[0].artist}</p>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-white/10 text-white group-hover:bg-[#1db954] group-hover:text-black flex items-center justify-center transition-all shrink-0">
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                </div>
              </div>
            </div>
          )}

          {/* Credits */}
          <div className="p-3.5 rounded-xl bg-[#181818] border border-white/5 text-xs text-neutral-400 space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-white">Credits</p>
            <div className="flex items-center justify-between">
              <span>Source Engine</span>
              <span className="text-[#1db954] font-bold uppercase">Riff-Engine 320k</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Bitrate</span>
              <span className="text-white font-mono">320 kbps (Lossless CD)</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Format</span>
              <span className="text-white font-mono">audio/webm (Opus)</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. TAB 2: SYNCHRONIZED LYRICS VIEW */}
      {rightSidebarTab === 'lyrics' && (
        <div className="flex-1 overflow-y-auto space-y-4 px-1 custom-scrollbar py-2">
          {currentTrack.syncedLyrics && currentTrack.syncedLyrics.length > 0 ? (
            <div className="space-y-4">
              {currentTrack.syncedLyrics.map((line, idx) => {
                const isActive = idx === activeLyricIndex;
                return (
                  <p
                    key={idx}
                    onClick={() => seek(line.timeMs / 1000)}
                    className={`text-sm md:text-base font-bold transition-all duration-300 cursor-pointer ${
                      isActive
                        ? 'text-[#1db954] scale-105 origin-left drop-shadow-[0_0_12px_rgba(29,185,84,0.5)]'
                        : 'text-neutral-500 hover:text-white'
                    }`}
                  >
                    {line.text}
                  </p>
                );
              })}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-400 space-y-2">
              <Mic2 className="w-10 h-10 text-neutral-600 mb-2" />
              <p className="text-sm font-bold text-white">No lyrics available</p>
              <p className="text-xs text-neutral-500">Enjoy the music or try another verified studio track.</p>
            </div>
          )}
        </div>
      )}

      {/* 4. TAB 3: UPCOMING QUEUE VIEW */}
      {rightSidebarTab === 'queue' && (
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
          {/* Now Playing in Queue */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">Now Playing</p>
            <div className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.06]">
              <img src={currentTrack.coverUrl} alt="" className="w-10 h-10 rounded-md object-cover" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-[#1db954] truncate">{currentTrack.title}</p>
                <p className="text-[11px] text-neutral-400 truncate">{currentTrack.artist}</p>
              </div>
            </div>
          </div>

          {/* Next In Queue */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Next In Queue ({upcomingQueue.length})
              </p>
              {upcomingQueue.length > 0 && (
                <button
                  onClick={clearQueue}
                  className="text-[11px] font-bold text-neutral-400 hover:text-rose-400 transition"
                >
                  Clear
                </button>
              )}
            </div>

            {upcomingQueue.length > 0 ? (
              <div className="space-y-1">
                {upcomingQueue.map((track, i) => (
                  <div
                    key={`${track.id}_${i}`}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.06] transition group cursor-pointer"
                    onClick={() => playTrack(track)}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                      <span className="text-xs font-mono text-neutral-500 w-4">{i + 1}</span>
                      <img src={track.coverUrl} alt="" className="w-9 h-9 rounded-md object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate group-hover:text-[#1db954]">{track.title}</p>
                        <p className="text-[11px] text-neutral-400 truncate">{track.artist}</p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromQueue(queueIndex + 1 + i);
                      }}
                      className="p-1 text-neutral-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition"
                      title="Remove from queue"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-500 text-center py-6">Queue is empty</p>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};

export default NowPlayingSidebar;
