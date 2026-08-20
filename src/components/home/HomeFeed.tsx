import React, { useEffect, useState } from 'react';
import { Play, Pause, Heart, Sparkles } from 'lucide-react';
import { Track } from '../../types';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useLibraryStore } from '../../stores/useLibraryStore';
import { VisualizerCanvas } from '../player/VisualizerCanvas';
import { generateDailyMixes, GLOBAL_CATALOG } from '../../lib/algorithm';

const FEATURED_TRACKS: Track[] = GLOBAL_CATALOG.slice(0, 4);

const EDITORIAL_CURATIONS = [
  {
    id: 'cur_quantum',
    title: 'QUANTUM BEATS',
    subtitle: 'HYPER-ELECTRONIC & SYNTH',
    trackCount: 24,
    curator: 'CURATED BY RIFF',
    imageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&q=80',
    query: 'Electronic Cyber'
  },
  {
    id: 'cur_amorphous',
    title: 'AMORPHOUS DREAMS',
    subtitle: 'LO-FI CHILLHOP & FOCUS',
    trackCount: 32,
    curator: 'EDITORIAL SELECTION',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80',
    query: 'Lo-Fi Chillhop'
  },
  {
    id: 'cur_vibrant',
    title: 'VIBRANT SHADES',
    subtitle: 'MODERN POP & INDIE WAVE',
    trackCount: 18,
    curator: 'GLOBAL SELECTION',
    imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&q=80',
    query: 'Indie Pop 2026'
  }
];

const POPULAR_ARTISTS = [
  { name: 'The Weeknd', avatar: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&q=80', genre: 'Synthwave' },
  { name: 'Daft Punk', avatar: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80', genre: 'Electronic' },
  { name: 'M83', avatar: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80', genre: 'Synthpop' },
  { name: 'Dua Lipa', avatar: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&q=80', genre: 'Pop' },
  { name: 'HOME', avatar: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80', genre: 'Chillwave' },
  { name: 'Kygo', avatar: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80', genre: 'Tropical' }
];

function formatDuration(sec: number): string {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface HomeFeedProps {
  onSelectGenre: (genreQuery: string) => void;
}

export const HomeFeed: React.FC<HomeFeedProps> = ({ onSelectGenre }) => {
  const { playTrack, currentTrack, playbackState, navigateToArtist } = usePlayerStore();
  const { toggleLikeTrack, likedTracks } = useLibraryStore();
  const [trendingTracks, setTrendingTracks] = useState<Track[]>(FEATURED_TRACKS);

  const dailyMixes = generateDailyMixes(likedTracks);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'GOOD MORNING' : hour < 18 ? 'GOOD AFTERNOON' : 'GOOD EVENING';

  useEffect(() => {
    fetch('/api/v1/discover/trending')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setTrendingTracks(data);
        }
      })
      .catch(() => {});
  }, []);

  const heroTrack = trendingTracks[0] || FEATURED_TRACKS[0];
  const isHeroPlaying = currentTrack?.id === heroTrack.id && playbackState === 'playing';
  const isHeroLiked = likedTracks.some((t) => t.id === heroTrack.id);

  // 6 Quick-Access Tiles
  const quickAccessTiles = [
    { title: 'After Hours', subtitle: 'The Weeknd', cover: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&q=80', track: GLOBAL_CATALOG[0] },
    { title: 'Random Access Memories', subtitle: 'Daft Punk', cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80', track: GLOBAL_CATALOG[3] },
    { title: 'Hurry Up, We\'re Dreaming', subtitle: 'M83', cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80', track: GLOBAL_CATALOG[5] },
    { title: 'Future Nostalgia', subtitle: 'Dua Lipa', cover: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&q=80', track: GLOBAL_CATALOG[7] },
    { title: 'Odyssey', subtitle: 'HOME', cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80', track: GLOBAL_CATALOG[6] },
    { title: 'Daily Mix 1', subtitle: 'Synthwave & Electronic', cover: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&q=80', track: GLOBAL_CATALOG[1] }
  ];

  return (
    <div className="space-y-8 pb-36 select-none animate-in fade-in duration-300">
      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {['All', 'Music', 'Podcasts & Radio', 'Synthwave', 'Lo-Fi Chill', 'Electronic'].map((pill, i) => (
          <button
            key={pill}
            onClick={() => {
              if (pill !== 'All' && pill !== 'Music') {
                onSelectGenre(pill);
              }
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              i === 0
                ? 'bg-white text-black shadow-md'
                : 'bg-white/10 text-white hover:bg-white/15'
            }`}
          >
            {pill}
          </button>
        ))}
      </div>

      {/* 1. SPOTIFY SIGNATURE TIME-OF-DAY GREETING & 6 QUICK ACCESS TILES */}
      <section className="space-y-4">
        <h2 className="text-2xl sm:text-3xl font-black font-sans tracking-tight text-white">
          {greeting}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickAccessTiles.map((tile, i) => {
            const isPlayingThis = currentTrack?.id === tile.track.id && playbackState === 'playing';

            return (
              <div
                key={i}
                onClick={() => playTrack(tile.track, GLOBAL_CATALOG)}
                className={`flex items-center justify-between rounded-xl overflow-hidden glass-card-editorial border border-white/[0.08] hover:bg-white/[0.08] transition-all cursor-pointer group shadow-md ${
                  isPlayingThis ? 'bg-[#1db954]/15 border-[#1db954]/40 text-[#1db954]' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img src={tile.cover} alt="" className="w-14 h-14 object-cover flex-shrink-0" />
                  <div className="min-w-0 pr-2">
                    <p className={`text-xs font-bold font-mono tracking-tight truncate ${isPlayingThis ? 'text-[#1db954]' : 'text-white'}`}>
                      {tile.title}
                    </p>
                    <p className="text-[11px] font-mono text-neutral-400 truncate">
                      {tile.subtitle}
                    </p>
                  </div>
                </div>

                <div className="pr-3">
                  <div className="w-10 h-10 rounded-full btn-spotify-emerald flex items-center justify-center text-black shadow-lg opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0">
                    {isPlayingThis ? (
                      <Pause className="w-4 h-4 fill-black text-black" />
                    ) : (
                      <Play className="w-4 h-4 fill-black text-black ml-0.5" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. SWISS EDITORIAL HERO: "NOW STREAMING" POSTER */}
      <section className="relative rounded-3xl overflow-hidden glass-editorial p-6 md:p-10 border border-white/[0.08] shadow-2xl">
        <div className="absolute top-0 right-1/4 -mt-16 w-96 h-96 bg-[#1db954]/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-10 -mb-16 w-72 h-72 bg-blue-600/10 rounded-full blur-[90px] pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Swiss Headline & Playback Info */}
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-neutral-300 text-xs font-mono tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 text-[#1db954]" />
              <span>EDITORIAL ISSUE #04 • SPOTLIGHT</span>
            </div>

            <div className="space-y-1">
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter text-white uppercase font-mono leading-[0.95]">
                NOW <span className="text-[#1db954]">STREAMING</span>
              </h1>
              <p className="text-lg md:text-2xl font-mono text-neutral-300 font-bold tracking-tight pt-2">
                01. {heroTrack.title}
              </p>
              <p className="text-sm font-mono text-neutral-400">
                Artist //{' '}
                <span
                  onClick={() => navigateToArtist(heroTrack.artist)}
                  className="text-white font-bold cursor-pointer hover:underline hover:text-[#1db954]"
                >
                  {heroTrack.artist}
                </span>{' '}
                • {heroTrack.album}
              </p>
            </div>

            {/* Live Audio Oscilloscope Waveform Preview */}
            <div className="pt-2 max-w-sm">
              <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 pb-1">
                <span>SIGNAL FREQUENCY</span>
                <span className="text-[#1db954] font-bold">{heroTrack.bitrateKbps || 320} KBPS LOSSLESS</span>
              </div>
              <div className="p-2 rounded-xl bg-black/40 border border-white/[0.06]">
                <VisualizerCanvas mode="oscilloscope" color="green" />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-4">
              <button
                onClick={() => playTrack(heroTrack, trendingTracks)}
                className="btn-spotify-emerald flex items-center gap-2.5 px-7 py-3.5 rounded-full text-black font-black text-xs font-mono tracking-wider uppercase shadow-xl"
              >
                {isHeroPlaying ? (
                  <Pause className="w-4 h-4 fill-black text-black" />
                ) : (
                  <Play className="w-4 h-4 fill-black text-black ml-0.5" />
                )}
                <span>{isHeroPlaying ? 'PAUSE PLAYBACK' : 'LISTEN NOW'}</span>
              </button>

              <button
                onClick={() => toggleLikeTrack(heroTrack)}
                className={`p-3 rounded-full border transition-all ${
                  isHeroLiked
                    ? 'bg-[#1db954]/20 border-[#1db954]/50 text-[#1db954]'
                    : 'bg-white/[0.04] border-white/10 text-neutral-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Heart className={`w-4 h-4 ${isHeroLiked ? 'fill-[#1db954]' : ''}`} />
              </button>
            </div>
          </div>

          {/* Right Column: Vinyl Disc & Album Art Showcase */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative group flex items-center justify-center">
              <div
                className={`absolute w-52 h-52 md:w-64 md:h-64 rounded-full bg-[#0a0a0d] border-4 border-[#1c1e27] shadow-2xl flex items-center justify-center transition-all duration-700 ${
                  isHeroPlaying ? 'translate-x-12 animate-vinyl-spin' : 'group-hover:translate-x-8'
                }`}
                style={{
                  backgroundImage: `radial-gradient(circle, #1a1c24 15%, #0d0e12 40%, #161820 65%, #08090c 90%)`
                }}
              >
                <div className="w-20 h-20 rounded-full border-2 border-white/20 flex items-center justify-center bg-black/60">
                  <div className="w-6 h-6 rounded-full bg-[#1db954] shadow-md shadow-[#1db954]/50" />
                </div>
              </div>

              <div className="relative z-10 w-56 h-56 md:w-64 md:h-64 rounded-2xl overflow-hidden shadow-2xl shadow-black ring-1 ring-white/15">
                <img
                  src={heroTrack.coverUrl}
                  alt={heroTrack.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. "MADE FOR YOU" ALGORITHMIC DISCOVERY MIXES */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between border-b border-white/[0.08] pb-2">
          <div>
            <h2 className="text-2xl font-black font-mono text-white uppercase tracking-tight">
              MADE FOR YOU
            </h2>
            <p className="text-xs font-mono text-neutral-400">
              Personalized algorithmic mixes updated continuously
            </p>
          </div>
          <span className="text-xs font-mono text-[#1db954] font-bold">ALGORITHMIC MESH</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {dailyMixes.map((mix) => (
            <div
              key={mix.id}
              onClick={() => playTrack(mix.tracks[0], mix.tracks)}
              className="p-4 rounded-2xl glass-card-editorial hover:border-[#1db954]/50 cursor-pointer space-y-3 group transition-all"
            >
              <div className="relative w-full aspect-square rounded-xl overflow-hidden shadow-lg bg-neutral-900">
                <img
                  src={mix.coverUrl}
                  alt={mix.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-3 right-3 w-10 h-10 rounded-full btn-spotify-emerald flex items-center justify-center text-black shadow-lg opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0">
                  <Play className="w-4 h-4 fill-black text-black ml-0.5" />
                </div>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black font-mono text-white uppercase tracking-tight group-hover:text-[#1db954] transition-colors">
                  {mix.title}
                </h4>
                <p className="text-xs font-mono text-neutral-400 line-clamp-2">
                  {mix.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. POPULAR ARTISTS CAROUSEL */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between border-b border-white/[0.08] pb-2">
          <h2 className="text-2xl font-black font-mono text-white uppercase tracking-tight">
            POPULAR ARTISTS
          </h2>
          <span className="text-xs font-mono text-neutral-400">DISCOGRAPHIES & PROFILES</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {POPULAR_ARTISTS.map((artist) => (
            <div
              key={artist.name}
              onClick={() => navigateToArtist(artist.name)}
              className="p-3.5 rounded-2xl glass-card-editorial hover:border-[#1db954]/50 cursor-pointer space-y-3 group text-center transition-all"
            >
              <div className="w-20 h-20 mx-auto rounded-full overflow-hidden shadow-lg ring-2 ring-white/10 group-hover:ring-[#1db954] transition-all">
                <img src={artist.avatar} alt={artist.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <h4 className="text-xs font-black font-mono text-white uppercase truncate group-hover:text-[#1db954] transition-colors">
                  {artist.name}
                </h4>
                <p className="text-[10px] font-mono text-neutral-400">Artist • {artist.genre}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. FEATURED CURATIONS: POSTER GRID */}
      <section className="space-y-5">
        <div className="flex items-baseline justify-between border-b border-white/[0.08] pb-2">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight font-mono">
            FEATURED CURATIONS
          </h2>
          <span className="text-xs font-mono text-[#1db954] font-bold">EDITORIAL SELECTIONS</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {EDITORIAL_CURATIONS.map((cur) => (
            <div
              key={cur.id}
              onClick={() => onSelectGenre(cur.query)}
              className="group relative rounded-2xl overflow-hidden glass-card-editorial p-5 cursor-pointer space-y-4 border border-white/[0.07] hover:border-[#1db954]/40 transition-all duration-300"
            >
              <div className="relative w-full h-48 rounded-xl overflow-hidden shadow-lg bg-neutral-900">
                <img
                  src={cur.imageUrl}
                  alt={cur.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-3 right-3 w-11 h-11 rounded-full btn-spotify-emerald flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                  <Play className="w-4 h-4 fill-black text-black ml-0.5" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                  <span>{cur.curator}</span>
                  <span className="text-[#1db954] font-bold">{cur.trackCount} TRACKS</span>
                </div>
                <h3 className="text-lg font-black text-white uppercase font-mono tracking-tight group-hover:text-[#1db954] transition-colors">
                  {cur.title}
                </h3>
                <p className="text-xs text-neutral-400 font-mono">
                  {cur.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. TOP EDITORIAL CHARTS: NUMBERED TRACKLIST */}
      <section className="space-y-5">
        <div className="flex items-baseline justify-between border-b border-white/[0.08] pb-2">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight font-mono">
            TOP EDITORIAL CHARTS
          </h2>
          <span className="text-xs font-mono text-neutral-400">
            AUTO-DEDUPLICATED
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {trendingTracks.map((track, index) => {
            const isPlayingThis = currentTrack?.id === track.id && playbackState === 'playing';
            const isLiked = likedTracks.some((t) => t.id === track.id);
            const rankFormatted = (index + 1).toString().padStart(2, '0');

            return (
              <div
                key={track.id + '_' + index}
                onClick={() => playTrack(track, trendingTracks)}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer group select-none ${
                  isPlayingThis
                    ? 'bg-[#1db954]/15 border-[#1db954]/50 shadow-lg shadow-[#1db954]/10'
                    : 'glass-card-editorial hover:bg-white/[0.06] border-white/[0.06]'
                }`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className="font-mono text-base font-black text-neutral-500 group-hover:text-white w-6 text-center transition-colors">
                    {rankFormatted}
                  </span>

                  <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                    <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Play className="w-4 h-4 text-white fill-white" />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <h4 className={`text-sm font-bold font-mono tracking-tight truncate ${isPlayingThis ? 'text-[#1db954]' : 'text-white group-hover:text-[#1db954]'}`}>
                      {track.title}
                    </h4>
                    <p className="text-xs text-neutral-400 truncate mt-0.5">
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateToArtist(track.artist);
                        }}
                        className="hover:underline hover:text-white"
                      >
                        {track.artist}
                      </span>{' '}
                      • <span className="text-neutral-500 uppercase font-mono text-[10px]">{track.sourceType}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
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
    </div>
  );
};
