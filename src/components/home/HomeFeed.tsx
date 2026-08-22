import React, { useEffect, useState, useRef } from 'react';
import { Play, Pause, Zap, ChevronLeft, ChevronRight, CheckCircle2, Sparkles } from 'lucide-react';
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
  { name: 'The Weeknd', avatar: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&q=80', genre: 'Synthwave / R&B', followers: '112M listeners' },
  { name: 'Talha Anjum', avatar: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80', genre: 'Urdu Hip-Hop', followers: '4.8M listeners' },
  { name: 'Diljit Dosanjh', avatar: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80', genre: 'Punjabi Pop', followers: '21M listeners' },
  { name: 'Arijit Singh', avatar: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&q=80', genre: 'Bollywood Soul', followers: '42M listeners' },
  { name: 'LISA', avatar: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&q=80', genre: 'K-Pop / Pop', followers: '28M listeners' },
  { name: 'Daft Punk', avatar: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80', genre: 'Electronic / Funk', followers: '24M listeners' }
];

const SOUNDSCAPE_VIBES = [
  { id: 'vibe_latenight', title: 'Late Night 3 AM', desc: 'Dark synth, atmospheric bass & lo-fi focus', gradient: 'from-violet-900/60 to-indigo-950/80', query: 'Late Night Chill' },
  { id: 'vibe_gym', title: 'Gym & Adrenaline Hype', desc: 'Fast BPMs, heavy 808s and workout motivation', gradient: 'from-red-900/60 to-rose-950/80', query: 'Workout Hype' },
  { id: 'vibe_goldenhour', title: 'Golden Hour Drives', desc: 'Warm nostalgic synthpop & sunset cruising', gradient: 'from-amber-900/60 to-orange-950/80', query: 'Golden Hour' },
  { id: 'vibe_coding', title: 'Deep Cyber Focus', desc: 'Zero vocal electronica, ambient techno & coding flow', gradient: 'from-cyan-900/60 to-slate-950/80', query: 'Cyberpunk Synthwave' }
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
      // Swipe Left -> Next Hero
      if (navigator.vibrate) navigator.vibrate(10);
      setHeroIndex((prev) => (prev + 1) % heroItems.length);
    } else if (diffX > 40) {
      // Swipe Right -> Prev Hero
      if (navigator.vibrate) navigator.vibrate(10);
      setHeroIndex((prev) => (prev - 1 + heroItems.length) % heroItems.length);
    }
    touchStartX.current = null;
  };

  // 6 Quick-Access Tiles
  const quickAccessTiles = [
    { title: 'After Hours', subtitle: 'The Weeknd', cover: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&q=80', track: GLOBAL_CATALOG[0] },
    { title: 'Open Letter', subtitle: 'Talha Anjum, Umair', cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80', track: GLOBAL_CATALOG[4] },
    { title: 'Lover', subtitle: 'Diljit Dosanjh', cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80', track: GLOBAL_CATALOG[7] },
    { title: 'Random Access Memories', subtitle: 'Daft Punk', cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80', track: GLOBAL_CATALOG[2] },
    { title: 'Brahmastra', subtitle: 'Arijit Singh, Pritam', cover: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&q=80', track: GLOBAL_CATALOG[10] },
    { title: 'LALISA', subtitle: 'LISA', cover: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&q=80', track: GLOBAL_CATALOG[12] }
  ];

  return (
    <div className="space-y-7 pb-36 select-none animate-in fade-in duration-300">
      {/* 1. Header Greeting & Quick Filter Pills */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              {greeting}
            </h1>
            <p className="text-xs text-neutral-400">Your personalized 320kbps sovereign soundscape</p>
          </div>
          <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            320k Lossless
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {['All', 'Music', 'Podcasts', 'Urdu Hip-Hop', 'Punjabi', 'Bollywood', 'Synthwave', 'K-Pop'].map((pill, i) => (
            <button
              key={pill}
              onClick={() => {
                if (pill !== 'All' && pill !== 'Music') {
                  onSelectGenre(pill);
                }
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                i === 0
                  ? 'bg-white text-black font-black shadow-md'
                  : 'bg-white/[0.06] text-neutral-300 hover:bg-white/[0.12] hover:text-white border border-white/[0.05]'
              }`}
            >
              {pill}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. THE SWIPEABLE 5-TRACK "HERO KING" TASTE CAROUSEL */}
      {/* ========================================================================= */}
      <div className="space-y-2.5">
        <div
          onTouchStart={handleHeroTouchStart}
          onTouchEnd={handleHeroTouchEnd}
          className={`relative rounded-3xl p-5 md:p-7 bg-gradient-to-br ${currentHero.gradient} border border-white/10 overflow-hidden shadow-2xl transition-all duration-500`}
        >
          {/* Background Ambient Cover Glow */}
          <div
            className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full blur-3xl opacity-30 pointer-events-none"
            style={{ backgroundImage: `url(${currentHero.track.coverUrl})` }}
          />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-5">
            {/* Left Info Module */}
            <div className="space-y-2 text-center md:text-left flex-1 min-w-0">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Sparkles className="w-3 h-3" />
                {currentHero.badge}
              </span>

              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight line-clamp-1">
                {currentHero.track.title}
              </h2>

              <p className="text-sm font-semibold text-neutral-300">
                {currentHero.track.artist}
              </p>

              <p className="text-xs text-neutral-400 line-clamp-1 max-w-md">
                {currentHero.tagline}
              </p>

              {/* Action Buttons */}
              <div className="flex items-center justify-center md:justify-start gap-3 pt-2">
                <button
                  onClick={() => playTrack(currentHero.track, heroItems.map((h) => h.track))}
                  className="px-6 py-2.5 rounded-full bg-white text-black font-extrabold text-xs flex items-center gap-2 hover:scale-105 active:scale-95 transition shadow-xl cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                  Play Now
                </button>
                <span className="text-[11px] font-mono text-neutral-400">
                  {currentHero.track.genre}
                </span>
              </div>
            </div>

            {/* Right Artwork Module */}
            <div 
              onClick={() => playTrack(currentHero.track, heroItems.map((h) => h.track))}
              className="relative w-36 h-36 md:w-44 md:h-44 rounded-2xl overflow-hidden shadow-2xl flex-shrink-0 border border-white/10 group cursor-pointer"
            >
              <img
                src={currentHero.track.coverUrl}
                alt={currentHero.track.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <div className="w-12 h-12 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-xl">
                  <Play className="w-6 h-6 fill-current ml-0.5" />
                </div>
              </div>
            </div>
          </div>

          {/* Carousel Dot Indicators & Arrows */}
          <div className="flex items-center justify-between pt-4 mt-2 border-t border-white/10">
            <button
              onClick={() => setHeroIndex((prev) => (prev - 1 + heroItems.length) % heroItems.length)}
              className="p-1 rounded-full text-neutral-400 hover:text-white transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5">
              {heroItems.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setHeroIndex(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    heroIndex === idx ? 'w-6 bg-emerald-400' : 'w-1.5 bg-white/20 hover:bg-white/40'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => setHeroIndex((prev) => (prev + 1) % heroItems.length)}
              className="p-1 rounded-full text-neutral-400 hover:text-white transition cursor-pointer"
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
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 px-1">
          Jump Back In
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 md:gap-3">
          {quickAccessTiles.map((tile, i) => {
            const isPlaying = currentTrack?.id === tile.track.id && playbackState === 'playing';
            return (
              <div
                key={i}
                onClick={() => playTrack(tile.track)}
                className="group relative flex items-center gap-3 bg-white/[0.04] hover:bg-white/[0.09] active:scale-[0.98] rounded-xl overflow-hidden cursor-pointer transition-all duration-200 border border-white/[0.05] p-0"
              >
                <img
                  src={tile.cover}
                  alt={tile.title}
                  className="w-12 h-12 md:w-14 md:h-14 object-cover flex-shrink-0"
                />
                <div className="min-w-0 flex-1 pr-2">
                  <p className="text-xs md:text-sm font-bold text-white truncate group-hover:text-emerald-400 transition">
                    {tile.title}
                  </p>
                  <p className="text-[10px] md:text-xs text-neutral-400 truncate">{tile.subtitle}</p>
                </div>

                <div className="mr-3 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-lg">
                    {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MOST LISTENED ARTISTS SECTION */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">Most Listened Artists</h2>
            <p className="text-xs text-neutral-400">Spotify Global Verified Discographies</p>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {TOP_CURATED_ARTISTS.map((artist, idx) => (
            <div
              key={idx}
              onClick={() => navigateToArtist(artist.name)}
              className="flex flex-col items-center space-y-2 flex-shrink-0 cursor-pointer group w-24 md:w-28"
            >
              <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden shadow-xl border-2 border-emerald-500/20 group-hover:border-emerald-400 transition-all p-0.5 bg-gradient-to-tr from-emerald-500 to-cyan-500">
                <img src={artist.avatar} alt={artist.name} className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="text-center w-full space-y-0.5">
                <div className="flex items-center justify-center gap-1">
                  <p className="text-xs font-bold text-white truncate group-hover:text-emerald-400 transition">{artist.name}</p>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 fill-emerald-500/20 flex-shrink-0" />
                </div>
                <span className="text-[10px] text-neutral-400 block">{artist.followers}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. SPOTIFY-STYLE CONTEXTUAL DAYLIST */}
      {/* ========================================================================= */}
      <div 
        onClick={() => playTrack(daylist.tracks[0] || GLOBAL_CATALOG[0])}
        className={`relative p-5 md:p-6 rounded-3xl bg-gradient-to-br ${daylist.gradient} border border-white/10 overflow-hidden cursor-pointer group shadow-xl`}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-emerald-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 fill-current" />
              SPOTIFY-STYLE DAYLIST
            </span>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight lowercase">
              {daylist.title}
            </h2>
            <p className="text-xs text-neutral-300 max-w-lg">{daylist.subtitle}</p>
          </div>

          <div className="flex items-center gap-3">
            <button className="px-5 py-2.5 rounded-full bg-white text-black font-extrabold text-xs flex items-center gap-2 hover:scale-105 active:scale-95 transition shadow-lg">
              <Play className="w-3.5 h-3.5 fill-current" />
              Play Daylist
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. VIBE SOUNDSCAPES & MOODS */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">Soundscape Vibes</h2>
          <p className="text-xs text-neutral-400">Sonic atmosphere tailored to your routine</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {SOUNDSCAPE_VIBES.map((vibe) => (
            <div
              key={vibe.id}
              onClick={() => onSelectGenre(vibe.query)}
              className={`group p-4 rounded-2xl bg-gradient-to-br ${vibe.gradient} border border-white/10 hover:border-white/20 cursor-pointer transition shadow-lg space-y-1.5`}
            >
              <h3 className="text-xs md:text-sm font-extrabold text-white tracking-tight">{vibe.title}</h3>
              <p className="text-[11px] text-neutral-300 line-clamp-2">{vibe.desc}</p>
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
            <p className="text-xs text-neutral-400">Direct 320kbps CD Quality Audio Streams</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
          {trendingTracks.slice(0, 6).map((t) => {
            const isPlaying = currentTrack?.id === t.id && playbackState === 'playing';
            return (
              <div
                key={t.id}
                onClick={() => playTrack(t)}
                className="group relative p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] cursor-pointer transition-all duration-200"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden mb-2.5 shadow-md">
                  <img src={t.coverUrl} alt={t.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-9 h-9 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-xl">
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
            <p className="text-xs text-neutral-400">Personalized algorithmic daily playlists</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {dailyMixes.slice(0, 4).map((mix) => (
            <div
              key={mix.id}
              onClick={() => playTrack(mix.tracks[0] || GLOBAL_CATALOG[0])}
              className="group p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] cursor-pointer transition-all"
            >
              <div className="relative aspect-square rounded-xl overflow-hidden mb-2.5 shadow-md">
                <img src={mix.coverUrl} alt={mix.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute bottom-0 inset-x-0 p-2.5 bg-gradient-to-t from-black/90 to-transparent">
                  <span className="text-[10px] font-extrabold uppercase text-emerald-400 tracking-wider">{mix.genre}</span>
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
