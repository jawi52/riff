import React, { useEffect, useState } from 'react';
import { Play, Pause, Zap } from 'lucide-react';
import { Track } from '../../types';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useLibraryStore } from '../../stores/useLibraryStore';
import { generateDailyMixes, getContextualDaylist, GLOBAL_CATALOG } from '../../lib/algorithm';

const FEATURED_TRACKS: Track[] = GLOBAL_CATALOG.slice(0, 4);

const POPULAR_ARTISTS = [
  { name: 'The Weeknd', avatar: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&q=80', genre: 'Synthwave' },
  { name: 'Daft Punk', avatar: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80', genre: 'Electronic' },
  { name: 'M83', avatar: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80', genre: 'Synthpop' },
  { name: 'Dua Lipa', avatar: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&q=80', genre: 'Pop' },
  { name: 'HOME', avatar: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80', genre: 'Chillwave' },
  { name: 'Diljit Dosanjh', avatar: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80', genre: 'Punjabi Pop' }
];

interface HomeFeedProps {
  onSelectGenre: (genreQuery: string) => void;
}

export const HomeFeed: React.FC<HomeFeedProps> = ({ onSelectGenre }) => {
  const { playTrack, currentTrack, playbackState, navigateToArtist } = usePlayerStore();
  const { likedTracks } = useLibraryStore();
  const [trendingTracks, setTrendingTracks] = useState<Track[]>(FEATURED_TRACKS);

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
    <div className="space-y-7 pb-36 select-none animate-in fade-in duration-300">
      {/* 1. Header Greeting & Top Pills */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            {greeting}
          </h1>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Sovereign API
            </span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {['All', 'Music', 'Podcasts', 'Synthwave', 'Lo-Fi Chill', 'Electronic', 'Punjabi'].map((pill, i) => (
            <button
              key={pill}
              onClick={() => {
                if (pill !== 'All' && pill !== 'Music') {
                  onSelectGenre(pill);
                }
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                i === 0
                  ? 'bg-white text-black font-extrabold shadow-md'
                  : 'bg-white/[0.07] text-neutral-300 hover:bg-white/[0.12] hover:text-white border border-white/[0.05]'
              }`}
            >
              {pill}
            </button>
          ))}
        </div>
      </div>

      {/* 2. 6 Quick-Access Jump Tiles (2x3 Grid) */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 md:gap-3">
        {quickAccessTiles.map((tile, i) => {
          const isPlaying = currentTrack?.id === tile.track.id && playbackState === 'playing';
          return (
            <div
              key={i}
              onClick={() => playTrack(tile.track)}
              className="group relative flex items-center gap-3 bg-white/[0.05] hover:bg-white/[0.1] active:scale-[0.98] rounded-xl overflow-hidden cursor-pointer transition-all duration-200 border border-white/[0.05] p-0"
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

              {/* 1-Tap Play Button */}
              <div className="mr-3 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-lg">
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Spotify-Style Contextual Daylist Banner */}
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

      {/* 4. Trending Worldwide (Live from Custom API) */}
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

      {/* 5. Made For You (Daily Mixes) */}
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

      {/* 6. Popular Artists */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">Popular Artists</h2>
            <p className="text-xs text-neutral-400">Top chart-topping discographies</p>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {POPULAR_ARTISTS.map((artist, idx) => (
            <div
              key={idx}
              onClick={() => navigateToArtist(artist.name)}
              className="flex flex-col items-center space-y-2 flex-shrink-0 cursor-pointer group w-24 md:w-28"
            >
              <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden shadow-lg border border-white/10 group-hover:border-emerald-500/50 transition">
                <img src={artist.avatar} alt={artist.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="text-center w-full">
                <p className="text-xs font-bold text-white truncate group-hover:text-emerald-400 transition">{artist.name}</p>
                <span className="text-[10px] text-neutral-500">Artist</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
