import React, { useEffect, useState, useRef } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Track } from '../../types';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useLibraryStore } from '../../stores/useLibraryStore';
import {
  generateDailyMixes,
  getContextualDaylist,
  getHeroTasteTracks,
  HeroCardItem,
  GLOBAL_CATALOG
} from '../../lib/algorithm';

const FEATURED_TRACKS: Track[] = GLOBAL_CATALOG.slice(0, 4);

const TOP_CURATED_ARTISTS = [
  { name: 'The Weeknd', avatar: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&q=80', genre: 'Synthwave / R&B', followers: '112M monthly listeners' },
  { name: 'Talha Anjum', avatar: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80', genre: 'Urdu Hip-Hop', followers: '4.8M monthly listeners' },
  { name: 'Diljit Dosanjh', avatar: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80', genre: 'Punjabi Pop', followers: '21M monthly listeners' },
  { name: 'Arijit Singh', avatar: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&q=80', genre: 'Bollywood Soul', followers: '42M monthly listeners' },
  { name: 'LISA', avatar: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&q=80', genre: 'K-Pop / Pop', followers: '28M monthly listeners' },
  { name: 'Daft Punk', avatar: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80', genre: 'Electronic / Funk', followers: '24M monthly listeners' }
];

const SOUNDSCAPE_VIBES = [
  { id: 'vibe_latenight', title: 'Late Night 3 AM', desc: 'Dark synth, atmospheric bass & lo-fi focus', gradient: 'from-slate-900/60 to-black/80', query: 'Late Night Chill' },
  { id: 'vibe_gym', title: 'Gym & Adrenaline Hype', desc: 'Fast BPMs, heavy 808s and workout motivation', gradient: 'from-zinc-900/60 to-black/80', query: 'Workout Hype' },
  { id: 'vibe_goldenhour', title: 'Golden Hour Drives', desc: 'Warm nostalgic synthpop & sunset cruising', gradient: 'from-stone-900/60 to-black/80', query: 'Golden Hour' },
  { id: 'vibe_coding', title: 'Deep Cyber Focus', desc: 'Zero vocal electronica & coding flow', gradient: 'from-cyan-950/40 to-black/80', query: 'Cyberpunk Synthwave' }
];

interface HomeFeedProps {
  onSelectGenre: (genreQuery: string) => void;
}

export const HomeFeed: React.FC<HomeFeedProps> = ({ onSelectGenre }) => {
  const { playTrack, currentTrack, playbackState, navigateToArtist } = usePlayerStore();
  const { likedTracks } = useLibraryStore();
  const [trendingTracks, setTrendingTracks] = useState<Track[]>(FEATURED_TRACKS);

  // 5-Card Hero Carousel State
  const [heroIndex, setHeroIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const heroItems: HeroCardItem[] = getHeroTasteTracks(likedTracks, []);
  const currentHero = heroItems[heroIndex] || heroItems[0];

  const dailyMixes = generateDailyMixes(likedTracks);
  const daylist = getContextualDaylist();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

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

  // Hero Touch Gesture Handlers
  const handleHeroTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleHeroTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartX.current;
    if (diffX < -40) {
      if (navigator.vibrate) navigator.vibrate(10);
      setHeroIndex((prev) => (prev + 1) % heroItems.length);
    } else if (diffX > 40) {
      if (navigator.vibrate) navigator.vibrate(10);
      setHeroIndex((prev) => (prev - 1 + heroItems.length) % heroItems.length);
    }
    touchStartX.current = null;
  };

  // 6 Quick-Access Jump Tiles
  const quickAccessTiles = [
    { title: 'After Hours', subtitle: 'The Weeknd', cover: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&q=80', track: GLOBAL_CATALOG[0] },
    { title: 'Open Letter', subtitle: 'Talha Anjum, Umair', cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80', track: GLOBAL_CATALOG[4] },
    { title: 'Lover', subtitle: 'Diljit Dosanjh', cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80', track: GLOBAL_CATALOG[7] },
    { title: 'Random Access Memories', subtitle: 'Daft Punk', cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80', track: GLOBAL_CATALOG[2] },
    { title: 'Brahmastra', subtitle: 'Arijit Singh, Pritam', cover: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&q=80', track: GLOBAL_CATALOG[10] },
    { title: 'LALISA', subtitle: 'LISA', cover: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&q=80', track: GLOBAL_CATALOG[12] }
  ];

  return (
    <div className="space-y-6 pb-36 select-none animate-in fade-in duration-300">
      {/* 1. Ultra-Clean Greeting Only */}
      <div className="pt-1 flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
          {greeting}
        </h1>
        <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-white/[0.04] backdrop-blur-md text-neutral-300 border border-white/[0.08] flex items-center gap-1.5 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          320k Lossless
        </span>
      </div>

      {/* ========================================================================= */}
      {/* 2. THE SMOKED DARK GLASS HERO SPOTLIGHT CAROUSEL */}
      {/* ========================================================================= */}
      <div className="space-y-2">
        <div
          onTouchStart={handleHeroTouchStart}
          onTouchEnd={handleHeroTouchEnd}
          className="relative rounded-3xl p-5 md:p-6 glass-panel overflow-hidden transition-all duration-300"
        >
          {/* Subtle Ambient Vignette */}
          <div
            className="absolute -right-8 -top-8 w-64 h-64 rounded-full blur-[90px] opacity-20 pointer-events-none"
            style={{ backgroundImage: `url(${currentHero.track.coverUrl})` }}
          />

          <div className="relative z-10 flex items-center justify-between gap-4">
            {/* Left: Artwork Jacket */}
            <div 
              onClick={() => playTrack(currentHero.track, heroItems.map((h) => h.track))}
              className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden shadow-2xl flex-shrink-0 border border-white/10 group cursor-pointer"
            >
              <img
                src={currentHero.track.coverUrl}
                alt={currentHero.track.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-xl">
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </div>
              </div>
            </div>

            {/* Right: Metadata & Actions */}
            <div className="flex-1 min-w-0 space-y-1.5">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-white/[0.08] text-neutral-300 border border-white/10 backdrop-blur-md">
                {currentHero.badge}
              </span>

              <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight truncate">
                {currentHero.track.title}
              </h2>

              <p className="text-xs sm:text-sm font-semibold text-neutral-400 truncate">
                {currentHero.track.artist}
              </p>

              <div className="pt-1 flex items-center gap-3">
                <button
                  onClick={() => playTrack(currentHero.track, heroItems.map((h) => h.track))}
                  className="px-5 py-2 rounded-full bg-white text-black font-black text-xs flex items-center gap-1.5 hover:scale-105 active:scale-95 transition shadow-lg cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Play
                </button>
                <span className="text-[11px] font-medium text-neutral-500 truncate">
                  {currentHero.track.genre}
                </span>
              </div>
            </div>
          </div>

          {/* Carousel Dot Indicators & Navigation */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/[0.06]">
            <button
              onClick={() => setHeroIndex((prev) => (prev - 1 + heroItems.length) % heroItems.length)}
              className="p-1 text-neutral-500 hover:text-white transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5">
              {heroItems.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setHeroIndex(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    heroIndex === idx ? 'w-5 bg-white' : 'w-1.5 bg-white/20 hover:bg-white/40'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => setHeroIndex((prev) => (prev + 1) % heroItems.length)}
              className="p-1 text-neutral-500 hover:text-white transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. RECENT SONGS & JUMP-BACK-IN TILES (2x3 Grid) */}
      {/* ========================================================================= */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
          Jump Back In
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
          {quickAccessTiles.map((tile, i) => {
            const isPlaying = currentTrack?.id === tile.track.id && playbackState === 'playing';
            return (
              <div
                key={i}
                onClick={() => playTrack(tile.track)}
                className="group relative flex items-center gap-3 glass-card active:scale-[0.98] rounded-xl overflow-hidden cursor-pointer p-0"
              >
                <img
                  src={tile.cover}
                  alt={tile.title}
                  className="w-12 h-12 md:w-14 md:h-14 object-cover flex-shrink-0"
                />
                <div className="min-w-0 flex-1 pr-2">
                  <p className="text-xs md:text-sm font-bold text-white truncate group-hover:text-neutral-200 transition">
                    {tile.title}
                  </p>
                  <p className="text-[10px] md:text-xs text-neutral-400 truncate">{tile.subtitle}</p>
                </div>

                <div className="mr-3 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex">
                  <div className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
                    {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MOST LISTENED ARTISTS */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">Most Listened Artists</h2>
            <p className="text-xs text-neutral-500">Global Verified Discographies</p>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {TOP_CURATED_ARTISTS.map((artist, idx) => (
            <div
              key={idx}
              onClick={() => navigateToArtist(artist.name)}
              className="flex flex-col items-center space-y-2 flex-shrink-0 cursor-pointer group w-24 md:w-28"
            >
              <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden shadow-xl border border-white/10 group-hover:border-white/30 transition-all p-0.5 bg-white/[0.04]">
                <img src={artist.avatar} alt={artist.name} className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="text-center w-full space-y-0.5">
                <div className="flex items-center justify-center gap-1">
                  <p className="text-xs font-bold text-white truncate group-hover:text-neutral-200 transition">{artist.name}</p>
                  <CheckCircle2 className="w-3 h-3 text-white/80 fill-white/20 flex-shrink-0" />
                </div>
                <span className="text-[10px] text-neutral-500 block truncate">{artist.followers}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. SMOKED GLASS CONTEXTUAL DAYLIST */}
      {/* ========================================================================= */}
      <div 
        onClick={() => playTrack(daylist.tracks[0] || GLOBAL_CATALOG[0])}
        className="relative p-5 md:p-6 rounded-3xl glass-panel overflow-hidden cursor-pointer group shadow-xl"
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-neutral-400">
              CONTEXTUAL DAYLIST
            </span>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight lowercase">
              {daylist.title}
            </h2>
            <p className="text-xs text-neutral-400 max-w-lg">{daylist.subtitle}</p>
          </div>

          <div className="flex items-center gap-3">
            <button className="px-5 py-2.5 rounded-full bg-white text-black font-black text-xs flex items-center gap-2 hover:scale-105 active:scale-95 transition shadow-lg">
              <Play className="w-3.5 h-3.5 fill-current" />
              Play Daylist
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. VIBE SOUNDSCAPES */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">Soundscapes & Moods</h2>
          <p className="text-xs text-neutral-500">Sonic atmosphere tailored to your routine</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3">
          {SOUNDSCAPE_VIBES.map((vibe) => (
            <div
              key={vibe.id}
              onClick={() => onSelectGenre(vibe.query)}
              className="group p-4 rounded-2xl glass-card cursor-pointer transition space-y-1"
            >
              <h3 className="text-xs md:text-sm font-bold text-white tracking-tight">{vibe.title}</h3>
              <p className="text-[11px] text-neutral-400 line-clamp-2">{vibe.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 7. TRENDING WORLDWIDE (Live from Custom API) */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">Trending Worldwide</h2>
            <p className="text-xs text-neutral-500">Direct 320kbps CD Quality Audio Streams</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
          {trendingTracks.slice(0, 6).map((t) => {
            const isPlaying = currentTrack?.id === t.id && playbackState === 'playing';
            return (
              <div
                key={t.id}
                onClick={() => playTrack(t)}
                className="group relative p-3 rounded-2xl glass-card cursor-pointer"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden mb-2.5 shadow-md">
                  <img src={t.coverUrl} alt={t.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-xl">
                      {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                    </div>
                  </div>
                </div>
                <h3 className="text-xs font-bold text-white truncate">{t.title}</h3>
                <p className="text-[11px] text-neutral-400 truncate">{t.artist}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 8. MADE FOR YOU (Daily Mixes) */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">Made For You</h2>
            <p className="text-xs text-neutral-500">Personalized algorithmic daily playlists</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {dailyMixes.slice(0, 4).map((mix) => (
            <div
              key={mix.id}
              onClick={() => playTrack(mix.tracks[0] || GLOBAL_CATALOG[0])}
              className="group p-3.5 rounded-2xl glass-card cursor-pointer"
            >
              <div className="relative aspect-square rounded-xl overflow-hidden mb-2.5 shadow-md">
                <img src={mix.coverUrl} alt={mix.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute bottom-0 inset-x-0 p-2.5 bg-gradient-to-t from-black/90 to-transparent">
                  <span className="text-[10px] font-extrabold uppercase text-neutral-300 tracking-wider">{mix.genre}</span>
                </div>
              </div>
              <h3 className="text-xs md:text-sm font-bold text-white truncate">{mix.title}</h3>
              <p className="text-[11px] text-neutral-400 line-clamp-1">{mix.subtitle}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
