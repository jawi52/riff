import React from 'react';
import { Play, Pause, Heart, Download, CheckCircle2, Clock, ArrowLeft } from 'lucide-react';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useLibraryStore } from '../../stores/useLibraryStore';
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
    setActiveMainView,
    playTrack,
    currentTrack,
    playbackState,
    navigateToArtist
  } = usePlayerStore();

  const { toggleLikeTrack, likedTracks, offlineTracks, cacheTrackForOffline } = useLibraryStore();

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
    GLOBAL_CATALOG.slice(0, 6);

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
    <div className="space-y-8 pb-36 select-none animate-in fade-in duration-300">
      {/* Back Button */}
      <button
        onClick={() => setActiveMainView('home')}
        className="flex items-center gap-2 text-xs font-mono text-neutral-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>BACK TO EXPLORE</span>
      </button>

      {/* 1. PLAYLIST / ALBUM HERO HEADER */}
      <div className="relative rounded-3xl overflow-hidden glass-editorial p-6 md:p-10 border border-white/[0.08] shadow-2xl">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8">
          {/* Cover Artwork */}
          <div className="w-48 h-48 md:w-56 md:h-56 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/15 flex-shrink-0 bg-neutral-900">
            <img src={coverUrl} alt={title} className="w-full h-full object-cover" />
          </div>

          {/* Details */}
          <div className="space-y-3 text-center md:text-left flex-1 min-w-0">
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-[#1db954]">
              {isAlbum ? 'STUDIO ALBUM // MASTER AUDIO' : 'CURATED PLAYLIST // VERIFIED'}
            </span>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-mono text-white tracking-tight uppercase leading-tight truncate">
              {title}
            </h1>

            <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-mono text-neutral-300 flex-wrap">
              <span
                onClick={() => isAlbum && navigateToArtist(subtitle)}
                className={`font-bold ${isAlbum ? 'text-white hover:text-[#1db954] cursor-pointer underline' : ''}`}
              >
                {subtitle}
              </span>
              <span>•</span>
              <span>{tracks.length} TRACKS</span>
              <span>•</span>
              <span className="text-neutral-500">{totalMins} MINS TOTAL</span>
            </div>

            {/* Action Row */}
            <div className="pt-2 flex items-center justify-center md:justify-start gap-4">
              <button
                onClick={handlePlayAll}
                className="btn-spotify-emerald flex items-center gap-2.5 px-7 py-3.5 rounded-full text-black font-mono font-black text-xs tracking-wider uppercase shadow-xl"
              >
                {isThisSetPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black" />}
                <span>{isThisSetPlaying ? 'PAUSE' : 'PLAY ALL'}</span>
              </button>

              <button
                onClick={handleDownloadAll}
                className="p-3 rounded-full border border-white/10 hover:border-white/30 text-neutral-400 hover:text-white hover:bg-white/5 transition-all"
                title="Download All for Offline"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. TRACKLIST TABLE */}
      <section className="space-y-4">
        {/* Table Header */}
        <div className="grid grid-cols-12 px-4 py-2 text-[11px] font-mono font-bold text-neutral-500 uppercase border-b border-white/[0.08]">
          <span className="col-span-1 text-center">#</span>
          <span className="col-span-6 md:col-span-5">TITLE</span>
          <span className="col-span-3 hidden md:block">ALBUM</span>
          <span className="col-span-2 hidden md:block">GENRE</span>
          <span className="col-span-5 md:col-span-1 text-right flex items-center justify-end">
            <Clock className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* Track Rows */}
        <div className="space-y-1">
          {tracks.map((track, index) => {
            const isPlayingThis = currentTrack?.id === track.id && playbackState === 'playing';
            const isLiked = likedTracks.some((t) => t.id === track.id);
            const isOffline = offlineTracks.some((t) => t.id === track.id);
            const rankFormatted = (index + 1).toString().padStart(2, '0');

            return (
              <div
                key={track.id}
                onClick={() => playTrack(track, tracks)}
                className={`grid grid-cols-12 items-center px-4 py-3 rounded-xl border transition-all cursor-pointer group select-none ${
                  isPlayingThis
                    ? 'bg-[#1db954]/15 border-[#1db954]/50 text-[#1db954]'
                    : 'border-transparent hover:bg-white/[0.04] text-neutral-300'
                }`}
              >
                {/* Number / Play */}
                <div className="col-span-1 text-center flex items-center justify-center">
                  <span className="font-mono text-xs text-neutral-500 group-hover:hidden">
                    {rankFormatted}
                  </span>
                  <Play className="w-3.5 h-3.5 text-white fill-white hidden group-hover:block" />
                </div>

                {/* Title & Artist */}
                <div className="col-span-6 md:col-span-5 flex items-center gap-3 min-w-0 pr-2">
                  <img src={track.coverUrl} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  <div className="min-w-0">
                    <p className={`text-xs font-bold font-mono tracking-tight truncate ${isPlayingThis ? 'text-[#1db954]' : 'text-white group-hover:text-[#1db954]'}`}>
                      {track.title}
                    </p>
                    <p
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateToArtist(track.artist);
                      }}
                      className="text-[11px] text-neutral-400 font-mono truncate hover:underline hover:text-white mt-0.5"
                    >
                      {track.artist}
                    </p>
                  </div>
                </div>

                {/* Album */}
                <div className="col-span-3 hidden md:block text-xs font-mono text-neutral-400 truncate pr-2">
                  {track.album || title}
                </div>

                {/* Genre */}
                <div className="col-span-2 hidden md:block text-[11px] font-mono text-neutral-500 uppercase truncate">
                  {track.genre || 'Lossless'}
                </div>

                {/* Duration & Like */}
                <div className="col-span-5 md:col-span-1 flex items-center justify-end gap-3">
                  {isOffline && <CheckCircle2 className="w-3.5 h-3.5 text-[#1db954]" />}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLikeTrack(track);
                    }}
                    className={`p-1.5 rounded-full hover:bg-white/10 transition-colors ${
                      isLiked ? 'text-[#1db954] fill-[#1db954]' : 'text-neutral-500 opacity-0 group-hover:opacity-100 hover:text-white'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-[#1db954]' : ''}`} />
                  </button>

                  <span className="text-xs font-mono text-neutral-500">
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
