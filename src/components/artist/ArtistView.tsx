import React, { useState } from 'react';
import { Play, Pause, Heart, Users, ChevronLeft, CheckCircle2, Music2, Disc3 } from 'lucide-react';
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
  const {
    selectedArtistName,
    previousMainView,
    setActiveMainView,
    playTrack,
    currentTrack,
    playbackState,
    navigateToArtist,
    navigateToPlaylist
  } = usePlayerStore();

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
    <div className="space-y-6 pb-20 select-none animate-in fade-in duration-300">
      {/* Back Button */}
      <button
        onClick={() => setActiveMainView(previousMainView || 'home')}
        className="flex items-center gap-1.5 text-xs font-bold text-neutral-400 hover:text-white transition cursor-pointer -ml-1"
      >
        <ChevronLeft className="w-5 h-5" />
        <span className="capitalize">Back to {previousMainView || 'Home'}</span>
      </button>

      {/* 1. ARTIST HERO BANNER */}
      <div className="relative rounded-3xl overflow-hidden glass-panel p-6 md:p-8 border border-white/[0.08] shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent z-10" />
        <img
          src={profile.avatarUrl}
          alt={profile.name}
          className="absolute inset-0 w-full h-full object-cover object-center opacity-30 blur-sm scale-105"
        />

        <div className="relative z-20 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-5 text-center sm:text-left">
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden shadow-2xl ring-4 ring-white/10 flex-shrink-0 border border-white/15">
              <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-extrabold tracking-wider uppercase flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Verified Artist</span>
                </span>
                <span className="text-xs text-neutral-400 font-medium">
                  {profile.genres.join(' • ')}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
                {profile.name}
              </h1>

              <p className="text-xs text-neutral-300 flex items-center justify-center sm:justify-start gap-1.5 pt-0.5">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                <span>{monthlyListeners.toLocaleString()} monthly listeners</span>
              </p>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-start">
            <button
              onClick={handlePlayArtist}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-black text-xs hover:bg-neutral-200 active:scale-95 transition shadow-xl cursor-pointer"
            >
              {isCurrentArtistPlaying ? <Pause className="w-4 h-4 fill-black text-black" /> : <Play className="w-4 h-4 fill-black text-black ml-0.5" />}
              <span>{isCurrentArtistPlaying ? 'Pause' : 'Play Artist'}</span>
            </button>

            <button
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(10);
                setIsFollowing(!isFollowing);
              }}
              className={`px-5 py-3 rounded-full text-xs font-bold transition cursor-pointer border ${
                isFollowing
                  ? 'bg-white/20 border-white/30 text-white'
                  : 'bg-white/[0.06] border-white/10 hover:bg-white/10 text-neutral-300 hover:text-white'
              }`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          </div>
        </div>
      </div>

      {/* 2. POPULAR TRACKS (TOP 5) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Music2 className="w-4 h-4 text-cyan-400" />
            <span>Popular Tracks</span>
          </div>
          <span className="text-xs text-neutral-500 font-medium">Global Top Streams</span>
        </div>

        <div className="space-y-1">
          {topTracks.map((track: any, idx: number) => {
            const isPlayingThis = currentTrack?.id === track.id && playbackState === 'playing';
            const isLiked = likedTracks.some((t) => t.id === track.id);

            return (
              <div
                key={track.id}
                onClick={() => playTrack(track, topTracks)}
                className="group flex items-center gap-3.5 p-2.5 rounded-2xl hover:bg-white/[0.04] active:bg-white/[0.08] transition cursor-pointer"
              >
                {/* Number / Play */}
                <span className="w-4 text-center text-xs font-mono text-neutral-500 group-hover:hidden">
                  {idx + 1}
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

                {/* Title & Streams */}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs md:text-sm font-bold truncate ${isPlayingThis ? 'text-cyan-400 underline' : 'text-white'}`}>
                    {track.title}
                  </p>
                  <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                    {(track.playCount || 3420100).toLocaleString()} streams
                  </p>
                </div>

                {/* Duration & Like */}
                <div className="flex items-center gap-3">
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

      {/* 3. DISCOGRAPHY */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Disc3 className="w-4 h-4 text-cyan-400" />
            <span>Discography</span>
          </div>
          <div className="flex items-center gap-1 bg-white/[0.06] p-0.5 rounded-full border border-white/[0.06]">
            {(['popular', 'albums', 'singles'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setDiscographyTab(tab)}
                className={`px-3 py-1 rounded-full text-xs font-bold capitalize transition cursor-pointer ${
                  discographyTab === tab
                    ? 'bg-white text-black shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {profile.albums.map((album: any) => (
            <div
              key={album.id}
              onClick={() => {
                navigateToPlaylist({
                  id: album.id,
                  title: album.title,
                  description: `${album.releaseYear} • Album by ${profile.name}`,
                  coverUrl: album.coverUrl,
                  creator: profile.name,
                  trackCount: topTracks.length,
                  tracks: topTracks,
                  updatedAt: Date.now()
                });
              }}
              className="p-3 rounded-2xl glass-card hover:scale-[1.02] cursor-pointer space-y-2.5 group transition-all"
            >
              <div className="relative w-full aspect-square rounded-xl overflow-hidden shadow-md bg-neutral-900">
                <img src={album.coverUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                </div>
              </div>
              <div className="min-w-0">
                <h4 className="text-xs md:text-sm font-bold text-white truncate group-hover:text-cyan-400 transition-colors">
                  {album.title}
                </h4>
                <p className="text-[11px] text-neutral-400 truncate mt-0.5">{album.releaseYear} • Album</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. FANS ALSO LIKE / RELATED ARTISTS */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Users className="w-4 h-4 text-cyan-400" />
            <span>Fans Also Like</span>
          </div>
          <span className="text-xs text-neutral-500 font-medium">Similar Artists</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {profile.relatedArtists.map((rel: any) => (
            <div
              key={rel.name}
              onClick={() => navigateToArtist(rel.name)}
              className="p-3.5 rounded-2xl glass-card hover:scale-[1.02] cursor-pointer space-y-2.5 group text-center transition-all flex flex-col items-center"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden shadow-md border border-white/10 group-hover:border-cyan-400 transition-all p-0.5 bg-white/[0.04]">
                <img src={rel.avatarUrl} alt={rel.name} className="w-full h-full object-cover rounded-full" />
              </div>
              <div className="min-w-0 w-full">
                <h4 className="text-xs md:text-sm font-bold text-white truncate group-hover:text-cyan-400 transition-colors">
                  {rel.name}
                </h4>
                <p className="text-[11px] text-neutral-400 truncate mt-0.5">{rel.genre}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. ABOUT SECTION */}
      <section className="space-y-2">
        <div className="flex items-center gap-2 px-1 text-white font-bold text-sm">
          <span>About {profile.name}</span>
        </div>
        <div className="p-5 md:p-6 rounded-3xl glass-panel border border-white/[0.08] space-y-3">
          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
            {profile.bio}
          </p>
          <div className="pt-2 flex items-center gap-3 text-[11px] text-neutral-400 border-t border-white/10">
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Verified Artist</span>
            </span>
            <span>•</span>
            <span className="text-cyan-400 font-semibold">Lossless Audio Master</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ArtistView;
