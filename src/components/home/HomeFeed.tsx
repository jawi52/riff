import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Flame,
  ListMusic,
  Sparkles,
  TrendingUp,
  Disc
} from 'lucide-react';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useLibraryStore } from '../../stores/useLibraryStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import {
  generateDailyMixes,
  getHeroTasteTracks,
  getTopMixes,
  getRecommendedPlaylists,
  PAKISTAN_TRENDING_TRACKS,
  HeroCardItem,
  GLOBAL_CATALOG,
  fetchRealCharts,
  RealChartsData
} from '../../lib/algorithm';

const TOP_CURATED_ARTISTS = [
  { name: 'The Weeknd', avatar: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&q=80', genre: 'Synthwave / R&B' },
  { name: 'Talha Anjum', avatar: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80', genre: 'Urdu Hip-Hop' },
  { name: 'Diljit Dosanjh', avatar: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80', genre: 'Punjabi Pop' },
  { name: 'Arijit Singh', avatar: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&q=80', genre: 'Bollywood Soul' },
  { name: 'LISA', avatar: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&q=80', genre: 'K-Pop / Pop' },
  { name: 'Daft Punk', avatar: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80', genre: 'Electronic / Funk' },
  { name: 'Drake', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80', genre: 'Hip-Hop / Rap' },
  { name: 'Taylor Swift', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80', genre: 'Pop' },
  { name: 'Kendrick Lamar', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80', genre: 'Hip-Hop' },
  { name: 'Travis Scott', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80', genre: 'Trap / Rap' },
  { name: 'Dua Lipa', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80', genre: 'Dance Pop' },
  { name: 'Billie Eilish', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80', genre: 'Alt Pop' },
  { name: 'Post Malone', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&q=80', genre: 'Pop / Hip-Hop' },
  { name: 'Bruno Mars', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&q=80', genre: 'Funk / Pop' },
  { name: 'Sidhu Moose Wala', avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=400&q=80', genre: 'Punjabi Rap' },
  { name: 'AP Dhillon', avatar: 'https://images.unsplash.com/photo-1528892952291-009c663ce843?w=400&q=80', genre: 'Punjabi Wave' },
  { name: 'Atif Aslam', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&q=80', genre: 'Sufi / Pop' },
  { name: 'Karan Aujla', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80', genre: 'Punjabi Pop' },
  { name: 'Eminem', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80', genre: 'Hip-Hop' },
  { name: 'Justin Bieber', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80', genre: 'Pop / R&B' },
  { name: 'SZA', avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80', genre: 'R&B / Soul' },
  { name: 'Bad Bunny', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80', genre: 'Reggaeton / Latin' }
];

interface HomeFeedProps {
  onSelectGenre?: (genreQuery: string) => void;
}

export const HomeFeed: React.FC<HomeFeedProps> = () => {
  const { playTrack, currentTrack, playbackState, navigateToArtist } = usePlayerStore();
  const { likedTracks, playlists } = useLibraryStore();
  const { setAiPromptModalOpen } = useSettingsStore();

  // 5-Card Everyday Taste Carousel State
  const [heroIndex, setHeroIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const handleHeroTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleHeroTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartX.current;
    if (diffX < -40) {
      if (navigator.vibrate) navigator.vibrate(10);
      setHeroIndex((prev) => (prev + 1) % 5);
    } else if (diffX > 40) {
      if (navigator.vibrate) navigator.vibrate(10);
      setHeroIndex((prev) => (prev - 1 + 5) % 5);
    }
    touchStartX.current = null;
  };

  // Live Real Charts from Riff-Engine
  const [realData, setRealData] = useState<RealChartsData | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetchRealCharts().then((data) => {
      if (isMounted && data) {
        setRealData(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const heroItems: HeroCardItem[] = getHeroTasteTracks(likedTracks, []);
  const currentHero = heroItems[heroIndex] || heroItems[0];

  const dailyMixes = generateDailyMixes(likedTracks);
  const topMixes = getTopMixes();
  const recommendedPlaylists = getRecommendedPlaylists();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDay = dayNames[new Date().getDay()];
  const daylistVibe =
    hour < 5
      ? { title: `${currentDay} Late Night Euphoria`, desc: 'Deep synthwave, bass & lo-fi trance', badge: 'daylist • 3:00 AM' }
      : hour < 12
      ? { title: `${currentDay} Morning Acoustic Awakening`, desc: 'Warm coffee, acoustic indie & peaceful vocal flow', badge: 'daylist • morning' }
      : hour < 17
      ? { title: `${currentDay} Afternoon Focus & Flow`, desc: 'Deep house, lo-fi beats & productive focus', badge: 'daylist • afternoon' }
      : hour < 21
      ? { title: `${currentDay} Sunset Chillout & Highway`, desc: 'Melodic pop, neo-soul & evening highway cruise', badge: 'daylist • sunset' }
      : { title: `${currentDay} Night Drive & Phonk Energy`, desc: 'Heavy trap, phonk & midnight basslines', badge: 'daylist • night' };

  const daylistTracks = realData && realData.topTracks.length > 0 ? realData.topTracks : GLOBAL_CATALOG.slice(0, 15);

  // 6 Quick-Access Jump Tiles (Real data from Riff-Engine charts if available)
  const quickAccessTiles = realData && realData.topTracks.length >= 6
    ? realData.topTracks.slice(0, 6).map((t) => ({
        title: t.title,
        subtitle: t.artist,
        cover: t.coverUrl,
        track: t
      }))
    : [
        { title: 'Downers at Dusk', subtitle: 'Talha Anjum, Umair', cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80', track: PAKISTAN_TRENDING_TRACKS[0] },
        { title: 'Pasoori', subtitle: 'Ali Sethi, Shae Gill', cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80', track: PAKISTAN_TRENDING_TRACKS[1] },
        { title: 'After Hours', subtitle: 'The Weeknd', cover: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&q=80', track: GLOBAL_CATALOG.find((t) => t.id === 'trk_blinding_lights') || GLOBAL_CATALOG[0] },
        { title: 'Kahani Suno 2.0', subtitle: 'Kaifi Khalil', cover: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&q=80', track: PAKISTAN_TRENDING_TRACKS[2] },
        { title: 'Bikhra', subtitle: 'Abdul Hannan, Rovalio', cover: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&q=80', track: PAKISTAN_TRENDING_TRACKS[3] },
        { title: 'Lover', subtitle: 'Diljit Dosanjh', cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80', track: GLOBAL_CATALOG.find((t) => t.id === 'trk_lover_diljit') || GLOBAL_CATALOG[4] }
      ];

  return (
    <div className="space-y-6 pb-6 select-none animate-in fade-in duration-300">
      {/* 1. Greeting & Quick AI/Jam Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            {greeting}
          </h1>
          <p className="text-xs text-neutral-400 font-semibold mt-0.5">
            Your personalized audio cosmos and real-time taste graph
          </p>
        </div>

        {/* Quick Launch Action Pills */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAiPromptModalOpen(true)}
            className="px-3.5 py-1.5 rounded-full bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-sm active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI Prompt DJ</span>
          </button>
        </div>
      </div>

      {/* 2. DYNAMIC DAYLIST MIX CARD */}
      <div
        onClick={() => playTrack(daylistTracks[0], daylistTracks)}
        className="relative rounded-3xl p-5 md:p-6 bg-gradient-to-r from-violet-950/60 via-[#16132b]/80 to-cyan-950/60 border border-violet-500/30 overflow-hidden shadow-2xl transition hover:scale-[1.008] active:scale-[0.99] cursor-pointer group"
      >
        <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-violet-500/20 text-violet-300 border border-violet-500/40 backdrop-blur-md">
              {daylistVibe.badge}
            </span>
            <h2 className="text-lg md:text-2xl font-black text-white tracking-tight truncate group-hover:text-cyan-300 transition">
              {daylistVibe.title}
            </h2>
            <p className="text-xs md:text-sm text-neutral-300 font-medium truncate">
              {daylistVibe.desc}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs font-mono text-neutral-400 hidden sm:inline">15 curated songs</span>
            <div className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:bg-cyan-400 transition">
              <Play className="w-5 h-5 fill-current ml-0.5" />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. EVERYDAY 5 SONGS (HERO TASTE SPOTLIGHT) */}
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

          {/* Carousel Dot Indicators */}
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
      {/* 3. JUMP BACK IN (2x3 Grid) */}
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
                className="group relative flex items-center gap-3 bg-white/[0.06] hover:bg-white/[0.12] active:scale-[0.99] rounded-md overflow-hidden cursor-pointer transition"
              >
                <img
                  src={tile.cover}
                  alt={tile.title}
                  className="w-12 h-12 md:w-14 md:h-14 object-cover flex-shrink-0 shadow-md"
                />
                <div className="min-w-0 flex-1 pr-2">
                  <p className="text-xs md:text-sm font-bold text-white truncate transition">
                    {tile.title}
                  </p>
                  <p className="text-[10px] md:text-xs text-neutral-400 truncate">{tile.subtitle}</p>
                </div>

                <div className="mr-3 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex">
                  <div className="w-8 h-8 rounded-full bg-[#1db954] text-black flex items-center justify-center shadow-xl hover:scale-105 transition-transform">
                    {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. TOP 30 TRENDING IN PAKISTAN 🇵🇰 (Horizontal Swipable Carousel) */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
            Top 30 Trending in Pakistan 🇵🇰
          </h2>
        </div>

        {/* Horizontal Swipable All 30 Songs */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar scroll-smooth pb-2">
          {PAKISTAN_TRENDING_TRACKS.map((track, idx) => {
            const isPlaying = currentTrack?.id === track.id && playbackState === 'playing';
            return (
              <div
                key={track.id}
                onClick={() => playTrack(track, PAKISTAN_TRENDING_TRACKS)}
                className="group relative p-3 rounded-2xl glass-card cursor-pointer w-36 sm:w-44 flex-shrink-0 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden mb-2 shadow-md">
                  <img
                    src={track.coverUrl}
                    alt={track.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-black backdrop-blur-md border ${
                    idx < 3 ? 'bg-amber-500/90 text-black border-amber-400' : 'bg-black/80 text-white border-white/10'
                  }`}>
                    #{idx + 1}
                  </span>
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-xl">
                      {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                    </div>
                  </div>
                </div>
                <h3 className="text-xs font-bold text-white truncate">{track.title}</h3>
                <p className="text-[11px] text-neutral-400 truncate">{track.artist}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. YOUR PLAYLISTS (Only shown when user has generated/created playlists) */}
      {/* ========================================================================= */}
      {playlists && playlists.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ListMusic className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">Your Playlists</h2>
          </div>

          <div className="flex gap-3 overflow-x-auto no-scrollbar scroll-smooth pb-2">
            {playlists.map((pl) => (
              <div
                key={pl.id}
                onClick={() => {
                  if (pl.tracks && pl.tracks.length > 0) {
                    playTrack(pl.tracks[0], pl.tracks);
                  }
                }}
                className="group relative p-3 rounded-2xl glass-card cursor-pointer w-36 sm:w-44 flex-shrink-0 transition-all hover:scale-[1.02]"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden mb-2 shadow-md bg-neutral-900">
                  <img
                    src={pl.coverUrl || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&q=80'}
                    alt={pl.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-black/70 backdrop-blur-md text-white">
                    {pl.trackCount || pl.tracks?.length || 0} TRACKS
                  </div>
                </div>
                <h3 className="text-xs font-bold text-white truncate">{pl.title}</h3>
                <p className="text-[11px] text-neutral-400 truncate">Curated by You</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. LIVE GLOBAL TOP CHARTS (RIFF-ENGINE 320K DIRECT) */}
      {/* ========================================================================= */}
      {realData && realData.topTracks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-[#1db954]" />
              <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">Global Top Charts</h2>
            </div>
            <span className="text-[10px] font-black uppercase text-[#1db954] bg-[#1db954]/10 border border-[#1db954]/25 px-2.5 py-0.5 rounded-full">
              ⚡ 320k Direct Stream
            </span>
          </div>

          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {realData.topTracks.slice(0, 10).map((t, idx) => (
              <div
                key={t.id}
                onClick={() => playTrack(t, realData.topTracks)}
                className="group p-3 rounded-xl bg-[#181818] hover:bg-[#282828] border border-white/5 cursor-pointer w-36 sm:w-44 flex-shrink-0 transition-all"
              >
                <div className="relative aspect-square rounded-lg overflow-hidden mb-2.5 shadow-md bg-neutral-900">
                  <img
                    src={t.coverUrl}
                    alt={t.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-black/80 backdrop-blur-md flex items-center justify-center text-[10px] font-mono font-bold text-white">
                    {idx + 1}
                  </div>
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0">
                    <div className="w-9 h-9 rounded-full bg-[#1db954] text-black flex items-center justify-center shadow-xl hover:scale-105 transition-transform">
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>
                <h3 className="text-xs font-bold text-white truncate group-hover:text-[#1db954] transition-colors">{t.title}</h3>
                <p className="text-[11px] text-neutral-400 truncate mt-0.5">{t.artist}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MOST LISTENED & TRENDING ARTISTS (Real data from Riff-Engine) */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">Most Listened Artists</h2>

        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {(realData && realData.trendingArtists.length > 0
            ? realData.trendingArtists
            : TOP_CURATED_ARTISTS.map((a) => ({ id: a.name, name: a.name, avatarUrl: a.avatar, genre: a.genre }))
          ).map((artist, idx) => (
            <div
              key={idx}
              onClick={() => navigateToArtist(artist.name)}
              className="flex flex-col items-center space-y-2 flex-shrink-0 cursor-pointer group w-24 md:w-28 p-2 rounded-xl hover:bg-white/[0.04] transition"
            >
              <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden shadow-xl border border-white/10 group-hover:border-[#1db954]/50 transition-all p-0.5 bg-[#181818]">
                <img
                  src={artist.avatarUrl}
                  alt={artist.name}
                  className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="text-center w-full space-y-0.5">
                <div className="flex items-center justify-center gap-1">
                  <p className="text-xs font-bold text-white truncate group-hover:text-[#1db954] transition-colors">{artist.name}</p>
                  <CheckCircle2 className="w-3 h-3 text-[#1db954] fill-current flex-shrink-0" />
                </div>
                <span className="text-[10px] text-neutral-500 block truncate">Artist</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 8. TOP ALBUMS (Real data from Riff-Engine) */}
      {/* ========================================================================= */}
      {realData && realData.topAlbums.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Disc className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">Popular Albums</h2>
          </div>

          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {realData.topAlbums.map((alb) => (
              <div
                key={alb.id}
                onClick={() => navigateToArtist(alb.artistName)}
                className="group p-3 rounded-xl bg-[#181818] hover:bg-[#282828] border border-white/5 cursor-pointer w-36 sm:w-44 flex-shrink-0 transition-all"
              >
                <div className="relative aspect-square rounded-lg overflow-hidden mb-2.5 shadow-md bg-neutral-900">
                  <img
                    src={alb.coverUrl}
                    alt={alb.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h3 className="text-xs font-bold text-white truncate group-hover:text-[#1db954] transition-colors">{alb.title}</h3>
                <p className="text-[11px] text-neutral-400 truncate mt-0.5">{alb.artistName}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. YOUR TOP MIXES */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-400" />
          <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">Your Top Mixes</h2>
        </div>

        <div className="flex gap-3 overflow-x-auto no-scrollbar scroll-smooth pb-2">
          {topMixes.map((mix) => (
            <div
              key={mix.id}
              onClick={() => playTrack(mix.tracks[0] || GLOBAL_CATALOG[0], mix.tracks)}
              className="group p-3.5 rounded-2xl glass-card cursor-pointer w-40 sm:w-48 flex-shrink-0 transition-all hover:scale-[1.02]"
            >
              <div className="relative aspect-square rounded-xl overflow-hidden mb-2.5 shadow-md">
                <img
                  src={mix.coverUrl}
                  alt={mix.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-black/70 backdrop-blur-md text-white">
                  {mix.badge}
                </div>
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-xl">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                </div>
              </div>
              <h3 className="text-xs md:text-sm font-bold text-white truncate">{mix.title}</h3>
              <p className="text-[11px] text-neutral-400 line-clamp-1">{mix.subtitle}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 8. RECOMMENDED PLAYLISTS */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">Recommended Playlists</h2>

        <div className="flex gap-3 overflow-x-auto no-scrollbar scroll-smooth pb-2">
          {recommendedPlaylists.map((pl) => (
            <div
              key={pl.id}
              onClick={() => playTrack(pl.tracks[0] || GLOBAL_CATALOG[0], pl.tracks)}
              className="group p-3.5 rounded-2xl glass-card cursor-pointer w-40 sm:w-48 flex-shrink-0 transition-all hover:scale-[1.02]"
            >
              <div className="relative aspect-square rounded-xl overflow-hidden mb-2.5 shadow-md">
                <img
                  src={pl.coverUrl}
                  alt={pl.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-white text-black">
                  {pl.badge}
                </div>
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-xl">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                </div>
              </div>
              <h3 className="text-xs md:text-sm font-bold text-white truncate">{pl.title}</h3>
              <p className="text-[11px] text-neutral-400 line-clamp-1">{pl.subtitle}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 9. MADE FOR YOU (Daily Mixes) */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">Made For You</h2>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {dailyMixes.slice(0, 4).map((mix) => (
            <div
              key={mix.id}
              onClick={() => playTrack(mix.tracks[0] || GLOBAL_CATALOG[0], mix.tracks)}
              className="group p-3.5 rounded-2xl glass-card cursor-pointer"
            >
              <div className="relative aspect-square rounded-xl overflow-hidden mb-2.5 shadow-md">
                <img
                  src={mix.coverUrl}
                  alt={mix.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
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

      {/* ========================================================================= */}
      {/* 10. TRENDING WORLDWIDE */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">Trending Worldwide</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
          {GLOBAL_CATALOG.filter((t) => ['trk_blinding_lights', 'trk_starboy', 'trk_get_lucky', 'trk_levitating', 'trk_lover_diljit', 'trk_money_lisa'].includes(t.id)).map((t) => {
            const isPlaying = currentTrack?.id === t.id && playbackState === 'playing';
            return (
              <div
                key={t.id}
                onClick={() => playTrack(t, GLOBAL_CATALOG)}
                className="group relative p-3 rounded-2xl glass-card cursor-pointer"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden mb-2.5 shadow-md">
                  <img
                    src={t.coverUrl}
                    alt={t.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
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
    </div>
  );
};

export default HomeFeed;
