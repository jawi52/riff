import React, { useState, useMemo } from 'react';
import {
  Radio,
  Play,
  Pause,
  Search,
  Globe2,
  SlidersHorizontal,
  Flame
} from 'lucide-react';
import { RadioStation, Track } from '../../types';
import { usePlayerStore } from '../../stores/usePlayerStore';

const TOP_RADIO_STATIONS: RadioStation[] = [
  {
    id: 'rad_bbc_radio1',
    name: 'BBC Radio 1',
    url: 'https://stream.live.vc.bbcmedia.co.uk/bbc_radio_one',
    favicon: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&q=80',
    country: 'United Kingdom',
    language: 'English',
    tags: ['Pop', 'Electronic', 'Top 40', 'Hits'],
    bitrate: 320,
    votes: 48200
  },
  {
    id: 'rad_kexp_seattle',
    name: 'KEXP 90.3 FM Seattle',
    url: 'https://kexp.streamguys1.com/kexp160.mp3',
    favicon: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80',
    country: 'United States',
    language: 'English',
    tags: ['Indie', 'Alternative', 'Rock', 'Live'],
    bitrate: 160,
    votes: 39500
  },
  {
    id: 'rad_somafm_groovesalad',
    name: 'SomaFM: Groove Salad',
    url: 'https://ice1.somafm.com/groovesalad-256-mp3',
    favicon: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&q=80',
    country: 'United States',
    language: 'English',
    tags: ['Chillout', 'Ambient', 'Downtempo', 'Lo-Fi'],
    bitrate: 256,
    votes: 52100
  },
  {
    id: 'rad_ibiza_global',
    name: 'Ibiza Global Radio',
    url: 'https://stream.zeno.fm/f3wvbbqmdg8uv',
    favicon: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&q=80',
    country: 'Spain',
    language: 'Spanish',
    tags: ['Deep House', 'Electronic', 'Techno', 'Club'],
    bitrate: 320,
    votes: 34100
  },
  {
    id: 'rad_lofi_girl_live',
    name: 'Lo-Fi Beats 24/7 Live',
    url: 'https://stream.zeno.fm/f3wvbbqmdg8uv',
    favicon: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&q=80',
    country: 'Global',
    language: 'Instrumental',
    tags: ['Lo-Fi', 'Study', 'Chill', 'Beats'],
    bitrate: 192,
    votes: 68900
  },
  {
    id: 'rad_classic_fm_uk',
    name: 'Classic FM UK',
    url: 'https://stream.live.vc.bbcmedia.co.uk/bbc_radio_one',
    favicon: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&q=80',
    country: 'United Kingdom',
    language: 'English',
    tags: ['Classical', 'Symphony', 'Piano', 'Opera'],
    bitrate: 192,
    votes: 27800
  },
  {
    id: 'rad_mirchi_top20',
    name: 'Radio Mirchi Top 20',
    url: 'https://stream.zeno.fm/f3wvbbqmdg8uv',
    favicon: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&q=80',
    country: 'India',
    language: 'Hindi',
    tags: ['Bollywood', 'Desi', 'Hits', 'Pop'],
    bitrate: 128,
    votes: 41200
  },
  {
    id: 'rad_fm107_karachi',
    name: 'FM 107.4 Live Waves',
    url: 'https://stream.zeno.fm/f3wvbbqmdg8uv',
    favicon: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&q=80',
    country: 'Pakistan',
    language: 'Urdu',
    tags: ['Urdu Pop', 'Coke Studio', 'Hits', 'Talk'],
    bitrate: 128,
    votes: 19800
  },
  {
    id: 'rad_jazz_24',
    name: 'Jazz24 Seattle & Worldwide',
    url: 'https://ice1.somafm.com/groovesalad-256-mp3',
    favicon: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80',
    country: 'United States',
    language: 'English',
    tags: ['Jazz', 'Blues', 'Saxophone', 'Smooth'],
    bitrate: 256,
    votes: 31200
  },
  {
    id: 'rad_defcon_somafm',
    name: 'SomaFM: DEF CON Radio',
    url: 'https://ice1.somafm.com/groovesalad-256-mp3',
    favicon: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&q=80',
    country: 'United States',
    language: 'English',
    tags: ['Cyberpunk', 'Synthwave', 'Hacker', 'Dark Wave'],
    bitrate: 256,
    votes: 46700
  }
];

export const RadioDirectoryView: React.FC = () => {
  const [selectedCountry, setSelectedCountry] = useState<string>('All');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { playTrack, currentTrack, playbackState } = usePlayerStore();

  const countries = ['All', 'Global', 'United States', 'United Kingdom', 'Spain', 'India', 'Pakistan'];
  const genres = ['All', 'Pop', 'Electronic', 'Indie', 'Chillout', 'Lo-Fi', 'Classical', 'Bollywood', 'Jazz', 'Synthwave'];

  const filteredStations = useMemo(() => {
    return TOP_RADIO_STATIONS.filter((station) => {
      const matchCountry = selectedCountry === 'All' || station.country === selectedCountry;
      const matchGenre = selectedGenre === 'All' || station.tags.some((t) => t.toLowerCase() === selectedGenre.toLowerCase());
      const matchQuery =
        !searchQuery.trim() ||
        station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        station.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        station.country.toLowerCase().includes(searchQuery.toLowerCase());

      return matchCountry && matchGenre && matchQuery;
    });
  }, [selectedCountry, selectedGenre, searchQuery]);

  const handlePlayStation = (station: RadioStation) => {
    const radioTrack: Track = {
      id: station.id,
      title: station.name,
      artist: `Live Radio • ${station.country}`,
      album: station.tags.join(', '),
      coverUrl: station.favicon,
      duration: 0,
      sourceType: 'radio',
      streamUrl: station.url,
      bitrateKbps: station.bitrate
    };
    playTrack(radioTrack);
  };

  return (
    <div className="space-y-6 pb-20 select-none animate-in fade-in duration-300">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
              <Radio className="w-3 h-3 text-cyan-400" />
              <span>Worldwide Live Mesh</span>
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Live Radio Stations
          </h1>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search 30,000+ stations..."
            className="w-full pl-10 pr-4 py-2 rounded-full bg-white/[0.06] border border-white/10 text-white placeholder-neutral-400 text-xs font-semibold focus:outline-none focus:border-white/30 transition"
          />
        </div>
      </div>

      {/* 2. Country Filter Chips */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-bold px-1">
          <Globe2 className="w-3.5 h-3.5" />
          <span>Filter by Region</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          {countries.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCountry(c)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                selectedCountry === c
                  ? 'bg-white text-black shadow-md'
                  : 'bg-white/[0.06] text-neutral-300 hover:bg-white/[0.12] hover:text-white border border-white/[0.06]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Genre Filter Chips */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-bold px-1">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filter by Vibe & Genre</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          {genres.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGenre(g)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedGenre === g
                  ? 'bg-cyan-500 text-black font-extrabold shadow-md'
                  : 'bg-white/[0.04] text-neutral-400 hover:bg-white/[0.08] hover:text-white border border-white/[0.04]'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Station Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
        {filteredStations.map((station) => {
          const isPlaying = currentTrack?.id === station.id && playbackState === 'playing';

          return (
            <div
              key={station.id}
              onClick={() => handlePlayStation(station)}
              className={`group p-4 rounded-2xl glass-card transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex flex-col justify-between space-y-3 ${
                isPlaying ? 'border-cyan-400/50 bg-cyan-950/20' : ''
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="relative w-14 h-14 rounded-2xl overflow-hidden shadow-lg bg-neutral-900 shrink-0 border border-white/10">
                  <img src={station.favicon} alt="" className="w-full h-full object-cover group-hover:scale-105 transition" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                    {isPlaying ? <Pause className="w-5 h-5 text-cyan-400 fill-cyan-400" /> : <Play className="w-5 h-5 text-white fill-white ml-0.5" />}
                  </div>
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <h3 className="text-xs md:text-sm font-black text-white truncate group-hover:text-cyan-400 transition">
                      {station.name}
                    </h3>
                  </div>
                  <p className="text-[11px] text-neutral-400 truncate">
                    {station.country} • {station.language}
                  </p>
                </div>
              </div>

              {/* Tags & Bitrate Bar */}
              <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-[10px] font-mono">
                <div className="flex items-center gap-1 overflow-hidden">
                  {station.tags.slice(0, 2).map((t) => (
                    <span key={t} className="px-2 py-0.5 rounded-full bg-white/[0.06] text-neutral-300 truncate">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-cyan-400 font-bold">{station.bitrate}k MP3</span>
                  <span className="text-neutral-400 flex items-center gap-0.5 font-sans">
                    <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
                    {(station.votes / 1000).toFixed(0)}k
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RadioDirectoryView;
