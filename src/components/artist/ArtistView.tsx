import React, { useState } from 'react';
import { Play, Pause, Heart, Users, ArrowLeft } from 'lucide-react';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useLibraryStore } from '../../stores/useLibraryStore';
import { getArtistProfile } from '../../lib/algorithm';

function formatDuration(sec: number): string {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const ArtistView: React.FC = () => {
  const { selectedArtistName, setActiveMainView, playTrack, currentTrack, playbackState, navigateToArtist } = usePlayerStore();
  const { toggleLikeTrack, likedTracks } = useLibraryStore();
  const [isFollowing, setIsFollowing] = useState(false);
  const [discographyTab, setDiscographyTab] = useState<'popular' | 'albums' | 'singles'>('popular');

  const artistName = selectedArtistName || 'The Weeknd';
  const profile = getArtistProfile(artistName);
  const topTracks = profile.topTracks || [];
  const monthlyListeners = profile.monthlyListeners || 42000000;

  const isCurrentArtistPlaying =
    currentTrack?.artist.toLowerCase().includes(artistName.toLowerCase()) && playbackState === 'playing';

  const handlePlayArtist = () => {
    if (topTracks.length > 0) {
      playTrack(topTracks[0], topTracks);
    }
  };

  return (
    <div className="space-y-10 pb-36 select-none animate-in fade-in duration-300">
      {/* Back Button */}
      <button
        onClick={() => setActiveMainView('home')}
        className="flex items-center gap-2 text-xs font-mono text-neutral-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>BACK TO EXPLORE</span>
      </button>

      {/* 1. ARTIST HERO BANNER */}
      <div className="relative rounded-3xl overflow-hidden glass-editorial p-6 md:p-10 border border-white/[0.08] shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent z-10" />
        <img
          src={profile.avatarUrl}
          alt={profile.name}
          className="absolute inset-0 w-full h-full object-cover object-center opacity-40 blur-sm scale-105"
        />

        <div className="relative z-20 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden shadow-2xl ring-4 ring-white/10 flex-shrink-0">
              <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#1db954]/20 border border-[#1db954]/40 text-[#1db954] text-[10px] font-mono font-black tracking-wider uppercase">
                  VERIFIED ARTIST
                </span>
                <span className="text-xs font-mono text-neutral-400">
                  {profile.genres.join(' • ')}
                </span>
              </div>

              <h1 className="text-4xl md:text-6xl font-black font-mono tracking-tight text-white uppercase leading-none">
                {profile.name}
              </h1>

              <p className="text-xs font-mono text-neutral-300 flex items-center gap-2 pt-1">
                <Users className="w-4 h-4 text-[#1db954]" />
                <span>{monthlyListeners.toLocaleString()} MONTHLY LISTENERS</span>
              </p>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePlayArtist}
              className="btn-spotify-emerald flex items-center gap-2 px-7 py-3.5 rounded-full text-black font-mono font-black text-xs tracking-wider uppercase shadow-xl"
            >
              {isCurrentArtistPlaying ? <Pause className="w-4 h-4 fill-black text-black" /> : <Play className="w-4 h-4 fill-black text-black" />}
              <span>{isCurrentArtistPlaying ? 'PAUSE' : 'PLAY ARTIST'}</span>
            </button>

            <button
              onClick={() => setIsFollowing(!isFollowing)}
              className={`px-5 py-3 rounded-full border text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                isFollowing
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'border-white/10 hover:border-white/30 text-neutral-300 hover:text-white'
              }`}
            >
              {isFollowing ? 'FOLLOWING' : 'FOLLOW'}
            </button>
          </div>
        </div>
      </div>

      {/* 2. POPULAR TRACKS (TOP 5) */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between border-b border-white/[0.08] pb-2">
          <h2 className="text-2xl font-black font-mono text-white uppercase tracking-tight">
            POPULAR TRACKS
          </h2>
          <span className="text-xs font-mono text-neutral-500">GLOBAL STREAMS</span>
        </div>

        <div className="space-y-2">
          {topTracks.map((track, idx) => {
            const isPlayingThis = currentTrack?.id === track.id && playbackState === 'playing';
            const isLiked = likedTracks.some((t) => t.id === track.id);
            const rankFormatted = (idx + 1).toString().padStart(2, '0');

            return (
              <div
                key={track.id}
                onClick={() => playTrack(track, topTracks)}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer group ${
                  isPlayingThis
                    ? 'bg-[#1db954]/15 border-[#1db954]/50 shadow-lg shadow-[#1db954]/10'
                    : 'glass-card-editorial hover:bg-white/[0.06] border-white/[0.06]'
                }`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className="font-mono text-sm font-black text-neutral-500 group-hover:text-white w-5 text-center transition-colors">
                    {rankFormatted}
                  </span>

                  <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                    <img src={track.coverUrl} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Play className="w-4 h-4 text-white fill-white" />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <p className={`text-sm font-bold font-mono tracking-tight truncate ${isPlayingThis ? 'text-[#1db954]' : 'text-white group-hover:text-[#1db954]'}`}>
                      {track.title}
                    </p>
                    <p className="text-xs text-neutral-400 font-mono truncate mt-0.5">
                      {(track.playCount || 3420100).toLocaleString()} streams
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-xs font-mono text-neutral-500 hidden sm:inline-block">
                    {formatDuration(track.duration)}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLikeTrack(track);
                    }}
                    className={`p-2 rounded-full hover:bg-white/10 transition-colors ${
                      isLiked ? 'text-[#1db954] fill-[#1db954]' : 'text-neutral-500 hover:text-white'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-[#1db954]' : ''}`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. DISCOGRAPHY */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
          <h2 className="text-2xl font-black font-mono text-white uppercase tracking-tight">
            DISCOGRAPHY
          </h2>
          <div className="flex items-center gap-2">
            {(['popular', 'albums', 'singles'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setDiscographyTab(tab)}
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase transition-all ${
                  discographyTab === tab
                    ? 'bg-white text-black'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {profile.albums.map((album) => (
            <div
              key={album.id}
              onClick={() => playTrack(topTracks[0], topTracks)}
              className="p-4 rounded-2xl glass-card-editorial hover:border-[#1db954]/50 cursor-pointer space-y-3 group transition-all"
            >
              <div className="relative w-full aspect-square rounded-xl overflow-hidden shadow-lg bg-neutral-900">
                <img src={album.coverUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Play className="w-6 h-6 text-white fill-white" />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-bold font-mono text-white uppercase truncate group-hover:text-[#1db954] transition-colors">
                  {album.title}
                </h4>
                <p className="text-xs text-neutral-400 font-mono">{album.releaseYear} • Album</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. FANS ALSO LIKE / RELATED ARTISTS */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between border-b border-white/[0.08] pb-2">
          <h2 className="text-2xl font-black font-mono text-white uppercase tracking-tight">
            FANS ALSO LIKE
          </h2>
          <span className="text-xs font-mono text-neutral-500">SIMILAR ARTIST GRAPH</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {profile.relatedArtists.map((rel) => (
            <div
              key={rel.name}
              onClick={() => navigateToArtist(rel.name)}
              className="p-4 rounded-2xl glass-card-editorial hover:border-[#1db954]/50 cursor-pointer space-y-3 group text-center transition-all"
            >
              <div className="w-24 h-24 mx-auto rounded-full overflow-hidden shadow-lg ring-2 ring-white/10 group-hover:ring-[#1db954] transition-all">
                <img src={rel.avatarUrl} alt={rel.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <h4 className="text-sm font-bold font-mono text-white uppercase truncate group-hover:text-[#1db954] transition-colors">
                  {rel.name}
                </h4>
                <p className="text-xs text-neutral-400 font-mono">{rel.genre}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. ABOUT SECTION */}
      <section className="space-y-4">
        <h2 className="text-2xl font-black font-mono text-white uppercase tracking-tight border-b border-white/[0.08] pb-2">
          ABOUT THE ARTIST
        </h2>
        <div className="p-6 md:p-8 rounded-3xl glass-editorial border border-white/[0.08] space-y-3">
          <p className="text-sm font-mono text-neutral-300 leading-relaxed max-w-3xl">
            {profile.bio}
          </p>
          <div className="pt-2 flex items-center gap-6 text-xs font-mono text-neutral-500">
            <span>VERIFIED ON UNIVERSAL MESH</span>
            <span className="text-[#1db954] font-bold">LOSSLESS AUDIO MASTER</span>
          </div>
        </div>
      </section>
    </div>
  );
};
