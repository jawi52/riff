import React from 'react';
import { X, Mic2, ListMusic, Heart, CheckCircle2, Play } from 'lucide-react';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useLibraryStore } from '../../stores/useLibraryStore';
import { getArtistProfile } from '../../lib/algorithm';

export const NowPlayingSidebar: React.FC = () => {
  const {
    currentTrack,
    isRightSidebarOpen,
    setRightSidebarOpen,
    queue,
    queueIndex,
    navigateToArtist,
    activeLyricIndex,
    setFullscreenOpen,
    setLyricsOpen,
    playTrack
  } = usePlayerStore();

  const { toggleLikeTrack, likedTracks } = useLibraryStore();

  if (!isRightSidebarOpen || !currentTrack) return null;

  const isLiked = likedTracks.some((t) => t.id === currentTrack.id) || currentTrack.isLiked;
  const artistProfile = getArtistProfile(currentTrack.artist);
  const nextTrack = queue[queueIndex + 1] || null;

  return (
    <aside className="w-80 rounded-2xl bg-[#12131a]/90 backdrop-blur-2xl border border-white/[0.07] flex flex-col justify-between hidden xl:flex select-none h-full overflow-hidden shadow-2xl shrink-0 p-4 space-y-4 animate-in slide-in-from-right duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 shrink-0">
        <h3 className="text-sm font-bold tracking-tight text-white font-sans truncate pr-2">
          {currentTrack.title}
        </h3>
        <button
          onClick={() => setRightSidebarOpen(false)}
          className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Close panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Middle Scrollable Inspection Hub */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
        {/* 1. Large Cover Artwork Jacket */}
        <div className="space-y-3">
          <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/15 group">
            <img
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Ambient Overlay Glow */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1 pr-2">
              <h4 className="text-base font-black font-sans text-white tracking-tight truncate">
                {currentTrack.title}
              </h4>
              <p
                onClick={() => navigateToArtist(currentTrack.artist)}
                className="text-xs text-neutral-400 hover:text-[#1ed760] cursor-pointer truncate mt-0.5"
              >
                {currentTrack.artist}
              </p>
            </div>

            <button
              onClick={() => toggleLikeTrack(currentTrack)}
              className={`p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer ${
                isLiked ? 'text-[#1ed760] fill-[#1ed760]' : 'text-neutral-400 hover:text-white'
              }`}
              title={isLiked ? 'Remove from favorites' : 'Save to favorites'}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-[#1ed760]' : ''}`} />
            </button>
          </div>
        </div>

        {/* 2. About The Artist Card */}
        <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.06] space-y-3 relative overflow-hidden">
          <div className="flex items-center gap-3">
            <img
              src={artistProfile.avatarUrl}
              alt={artistProfile.name}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-[#1ed760]"
            />
            <div className="min-w-0 flex-1">
              <h5
                onClick={() => navigateToArtist(artistProfile.name)}
                className="text-sm font-bold text-white truncate cursor-pointer hover:text-[#1ed760] flex items-center gap-1.5"
              >
                <span>{artistProfile.name}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#1ed760] fill-current" />
              </h5>
              <p className="text-[11px] text-neutral-400">
                {(artistProfile.monthlyListeners || 42000000).toLocaleString()} monthly listeners
              </p>
            </div>
          </div>
          <p className="text-xs text-neutral-400 line-clamp-3 leading-relaxed font-sans">
            {artistProfile.bio}
          </p>
        </div>

        {/* 3. Live Synced Lyrics Snippet */}
        {currentTrack.syncedLyrics && currentTrack.syncedLyrics.length > 0 && (
          <div
            onClick={() => {
              setLyricsOpen(true);
              setFullscreenOpen(true);
            }}
            className="p-4 rounded-2xl bg-[#1ed760]/10 border border-[#1ed760]/30 space-y-2 cursor-pointer group hover:bg-[#1ed760]/15 hover:border-[#1ed760]/50 transition-all"
          >
            <div className="flex items-center justify-between text-xs font-bold uppercase text-[#1ed760]">
              <span className="flex items-center gap-1.5">
                <Mic2 className="w-4 h-4" />
                <span>LYRICS PREVIEW</span>
              </span>
              <span className="text-[11px] font-mono group-hover:underline">OPEN →</span>
            </div>
            <p className="text-sm font-bold text-white line-clamp-2 leading-relaxed">
              "{currentTrack.syncedLyrics[activeLyricIndex]?.text || currentTrack.syncedLyrics[0]?.text}"
            </p>
          </div>
        )}

        {/* 4. Next in Queue Preview */}
        {nextTrack && (
          <div
            onClick={() => playTrack(nextTrack)}
            className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.06] space-y-2 cursor-pointer group hover:bg-white/[0.08] transition-all"
          >
            <div className="flex items-center justify-between text-[11px] font-bold uppercase text-neutral-400">
              <span className="flex items-center gap-1.5 text-[#1ed760]">
                <ListMusic className="w-3.5 h-3.5" />
                <span>NEXT IN QUEUE</span>
              </span>
              <span className="text-[10px] text-neutral-500 group-hover:text-white">PLAY NEXT</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <img src={nextTrack.coverUrl} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate group-hover:text-[#1ed760] transition-colors">{nextTrack.title}</p>
                  <p className="text-[11px] text-neutral-400 truncate">{nextTrack.artist}</p>
                </div>
              </div>
              <div className="w-7 h-7 rounded-full bg-white/10 text-white group-hover:bg-[#1ed760] group-hover:text-black flex items-center justify-center transition-all shrink-0">
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              </div>
            </div>
          </div>
        )}

        {/* 5. Audio Master Credits */}
        <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-white/[0.06] text-[11px] font-mono text-neutral-400 space-y-1.5">
          <div className="flex items-center justify-between">
            <span>BITRATE / CODEC</span>
            <span className="text-[#1ed760] font-bold">320 KBPS AAC</span>
          </div>
          <div className="flex items-center justify-between">
            <span>AUDIO MESH</span>
            <span className="text-neutral-200 uppercase">{currentTrack.sourceType}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>SANDBOX STORAGE</span>
            <span className="text-neutral-200">OPFS ENCRYPTED</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default NowPlayingSidebar;
