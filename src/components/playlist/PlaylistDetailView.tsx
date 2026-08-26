import React from 'react';
import {
  Play,
  Pause,
  Heart,
  Download,
  ChevronLeft,
  Music2,
  Sparkles,
  QrCode,
  FileText
} from 'lucide-react';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useLibraryStore } from '../../stores/useLibraryStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { GLOBAL_CATALOG } from '../../lib/algorithm';
import { Track } from '../../types';

function formatDuration(sec: number): string {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const PlaylistDetailView: React.FC = () => {
  const {
    selectedPlaylist,
    selectedAlbum,
    previousMainView,
    setActiveMainView,
    playTrack,
    currentTrack,
    playbackState,
    navigateToArtist,
    toggleSmartShuffle,
    smartShuffle
  } = usePlayerStore();

  const { toggleLikeTrack, likedTracks, offlineTracks, cacheTrackForOffline } = useLibraryStore();
  const { setWaveTagModalOpen, setCreditsModalOpen } = useSettingsStore();

  const isAlbum = !!selectedAlbum;
  const title = selectedAlbum?.title || selectedPlaylist?.title || 'Editorial Collection';
  const subtitle = selectedAlbum?.artist || selectedPlaylist?.creator || 'Curated by Riff';
  const coverUrl =
    selectedAlbum?.coverUrl ||
    selectedPlaylist?.coverUrl ||
    'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&q=80';

  const tracks: Track[] =
    selectedAlbum?.tracks ||
    selectedPlaylist?.tracks ||
    GLOBAL_CATALOG.slice(0, 8);

  const totalDurationSec = tracks.reduce((acc, t) => acc + (t.duration || 0), 0);
  const totalMins = Math.floor(totalDurationSec / 60);

  const isThisSetPlaying =
    tracks.some((t) => t.id === currentTrack?.id) && playbackState === 'playing';

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      playTrack(tracks[0], tracks);
    }
  };

  const handleDownloadAll = () => {
    tracks.forEach((t) => cacheTrackForOffline(t));
  };

  return (
    <div className="space-y-6 pb-20 select-none animate-in fade-in duration-300">
      {/* Back Button */}
      <button
        onClick={() => setActiveMainView(previousMainView || 'home')}
        className="flex items-center gap-1.5 text-neutral-400 hover:text-white transition text-xs font-bold px-1 cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to {previousMainView === 'library' ? 'Library' : 'Home'}</span>
      </button>

      {/* 1. HERO HEADER */}
      <div className="relative rounded-3xl p-6 md:p-8 bg-gradient-to-b from-white/[0.08] to-transparent border border-white/[0.08] overflow-hidden">
        <div
          className="absolute -right-20 -top-20 w-80 h-80 rounded-full blur-[100px] opacity-20 pointer-events-none"
          style={{ backgroundImage: `url(${coverUrl})` }}
        />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left">
          {/* Cover Art */}
          <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl overflow-hidden shadow-2xl flex-shrink-0 border border-white/20">
            <img src={coverUrl} alt={title} className="w-full h-full object-cover" />
          </div>

          {/* Details */}
          <div className="space-y-2 flex-1 min-w-0">
            <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">
              {isAlbum ? 'ALBUM' : 'PLAYLIST'}
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight truncate">
              {title}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400">
              {subtitle} • {tracks.length} songs, ~{totalMins} min
            </p>

            {/* Action Row */}
            <div className="pt-2 flex items-center justify-center sm:justify-start gap-2.5 flex-wrap">
              <button
                onClick={handlePlayAll}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-black font-black text-xs hover:bg-neutral-200 active:scale-95 transition shadow-xl cursor-pointer"
              >
                {isThisSetPlaying ? <Pause className="w-4 h-4 fill-black text-black" /> : <Play className="w-4 h-4 fill-black text-black ml-0.5" />}
                <span>{isThisSetPlaying ? 'Pause' : 'Play All'}</span>
              </button>

              {/* Enhance / Smart Shuffle Toggle */}
              <button
                onClick={toggleSmartShuffle}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-full border text-xs font-bold transition cursor-pointer ${
                  smartShuffle
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                    : 'bg-white/[0.06] text-neutral-300 border-white/10 hover:text-white hover:bg-white/10'
                }`}
                title="Enhance Playlist with Smart Injected Recommendations"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>{smartShuffle ? 'Enhanced' : 'Enhance'}</span>
              </button>

              {/* WaveTag Barcode */}
              <button
                onClick={() =>
                  setWaveTagModalOpen(true, {
                    id: selectedPlaylist?.id || selectedAlbum?.id || 'set_1',
                    title: title,
                    subtitle: subtitle,
                    coverUrl: coverUrl,
                    type: 'playlist'
                  })
                }
                className="p-2.5 rounded-full border border-white/10 hover:border-white/30 text-neutral-300 hover:text-cyan-400 hover:bg-white/5 transition cursor-pointer"
                title="Share Riff WaveTag Barcode"
              >
                <QrCode className="w-4 h-4" />
              </button>

              <button
                onClick={handleDownloadAll}
                className="p-2.5 rounded-full border border-white/10 hover:border-white/30 text-neutral-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
                title="Download All for Offline"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. TRACKLIST */}
      <section className="space-y-2">
        <div className="flex items-center gap-2 px-1 text-white font-bold text-sm">
          <Music2 className="w-4 h-4 text-cyan-400" />
          <span>Tracks ({tracks.length})</span>
        </div>

        <div className="space-y-1">
          {tracks.map((track, index) => {
            const isPlayingThis = currentTrack?.id === track.id && playbackState === 'playing';
            const isLiked = likedTracks.some((t) => t.id === track.id);
            const isOffline = offlineTracks.some((t) => t.id === track.id);

            return (
              <div
                key={`${track.id}_${index}`}
                onClick={() => playTrack(track, tracks)}
                className="group flex items-center gap-3.5 p-2.5 rounded-2xl hover:bg-white/[0.04] active:bg-white/[0.08] transition cursor-pointer"
              >
                {/* Index / Play */}
                <span className="w-4 text-center text-xs font-mono text-neutral-500 group-hover:hidden">
                  {index + 1}
                </span>
                <div className="w-4 hidden group-hover:flex items-center justify-center text-white">
                  {isPlayingThis ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                </div>

                {/* Cover Art */}
                <img
                  src={track.coverUrl}
                  alt={track.title}
                  className="w-11 h-11 rounded-xl object-cover shadow-sm flex-shrink-0"
                />

                {/* Title & Artist */}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs md:text-sm font-bold truncate ${isPlayingThis ? 'text-cyan-400 underline' : 'text-white'}`}>
                    {track.title}
                  </p>
                  <p
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateToArtist(track.artist);
                    }}
                    className="text-[11px] text-neutral-400 truncate hover:text-white transition mt-0.5"
                  >
                    {track.artist}
                  </p>
                </div>

                {/* Duration, Credits, WaveTag & Likes */}
                <div className="flex items-center gap-2.5 shrink-0">
                  {/* Credits */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCreditsModalOpen(true, track);
                    }}
                    className="p-1 rounded-full text-neutral-500 hover:text-white transition opacity-0 group-hover:opacity-100"
                    title="View Song Credits"
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </button>

                  {/* WaveTag */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setWaveTagModalOpen(true, {
                        id: track.id,
                        title: track.title,
                        subtitle: track.artist,
                        coverUrl: track.coverUrl,
                        type: 'track'
                      });
                    }}
                    className="p-1 rounded-full text-neutral-500 hover:text-cyan-400 transition opacity-0 group-hover:opacity-100"
                    title="Share WaveTag"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                  </button>

                  {isOffline && (
                    <div className="w-4 h-4 rounded-full bg-emerald-500 text-black flex items-center justify-center text-[9px] font-black">
                      ↓
                    </div>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (navigator.vibrate) navigator.vibrate(15);
                      toggleLikeTrack(track);
                    }}
                    className="p-1.5 rounded-full text-neutral-500 hover:text-white transition cursor-pointer"
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                  </button>

                  <span className="text-[11px] font-mono text-neutral-500">
                    {formatDuration(track.duration)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default PlaylistDetailView;
