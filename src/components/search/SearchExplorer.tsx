import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Play,
  Pause,
  Heart,
  Loader2,
  X,
  Clock,
  ArrowUpRight,
  ChevronLeft
} from 'lucide-react';
import { Track } from '../../types';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useLibraryStore } from '../../stores/useLibraryStore';
import {
  getTopMixes,
  getRecommendedPlaylists,
  GLOBAL_CATALOG,
  PAKISTAN_TRENDING_TRACKS
} from '../../lib/algorithm';
import { searchMasterCatalog } from '../../lib/masterAudioEngine';

interface SearchExplorerProps {
  initialQuery?: string;
}

interface RecentSearchItem {
  id: string;
  title: string;
  subtitle: string;
  type: 'song' | 'artist' | 'playlist' | 'album' | 'query';
  coverUrl?: string;
  trackData?: Track;
}

interface SearchApiResponse {
  query: string;
  topResult: Track | null;
  sameArtistTracks: Track[];
  similarVibeTracks: Track[];
  tracks: Track[];
  artists: any[];
  albums: any[];
}

function formatDuration(sec: number): string {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const TOP_SUGGESTION_ARTISTS = [
  { name: 'Talha Anjum', avatar: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80', genre: 'Urdu Hip-Hop' },
  { name: 'The Weeknd', avatar: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&q=80', genre: 'Synthwave / R&B' },
  { name: 'Ali Sethi', avatar: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80', genre: 'Coke Studio' },
  { name: 'Shae Gill', avatar: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80', genre: 'Pakistani Pop' },
  { name: 'Kaifi Khalil', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&q=80', genre: 'Indie Soul' },
  { name: 'Abdul Hannan', avatar: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&q=80', genre: 'Indie Pop' },
  { name: 'Hasan Raheem', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80', genre: 'Indie Pop' },
  { name: 'Atif Aslam', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&q=80', genre: 'Sufi / Pop' },
  { name: 'Diljit Dosanjh', avatar: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80', genre: 'Punjabi Pop' },
  { name: 'Arijit Singh', avatar: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&q=80', genre: 'Bollywood Soul' },
  { name: 'Young Stunners', avatar: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80', genre: 'Urdu Rap' },
  { name: 'Daft Punk', avatar: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80', genre: 'Electronic' },
  { name: 'LISA', avatar: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&q=80', genre: 'K-Pop' },
  { name: 'Shamoon Ismail', avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=400&q=80', genre: 'Punjabi Blues' }
];

// 16 Spotify-Style Vibrant Categories with Tilted Artwork
const BROWSE_CATEGORIES = [
  {
    id: 'cat_pk',
    name: 'Trending Pakistan 🇵🇰',
    color: 'from-emerald-900 to-green-950',
    query: 'Trending Pakistan',
    cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&q=80'
  },
  {
    id: 'cat_urdu_rap',
    name: 'Urdu Hip-Hop',
    color: 'from-purple-900 to-indigo-950',
    query: 'Urdu Hip-Hop Talha Anjum',
    cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80'
  },
  {
    id: 'cat_pop',
    name: 'Pop & Global Hits',
    color: 'from-pink-900 to-rose-950',
    query: 'Top Pop Hits',
    cover: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&q=80'
  },
  {
    id: 'cat_punjabi',
    name: 'Punjabi Wave',
    color: 'from-amber-900 to-yellow-950',
    query: 'Punjabi Hits Diljit',
    cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&q=80'
  },
  {
    id: 'cat_synthwave',
    name: 'Synthwave & 80s',
    color: 'from-cyan-900 to-blue-950',
    query: 'Synthwave Cyberpunk',
    cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&q=80'
  },
  {
    id: 'cat_bollywood',
    name: 'Bollywood Soul',
    color: 'from-red-900 to-rose-950',
    query: 'Arijit Singh Pritam Bollywood',
    cover: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&q=80'
  },
  {
    id: 'cat_lofi',
    name: 'Lo-Fi Chill Beats',
    color: 'from-slate-900 to-zinc-950',
    query: 'Lo-Fi Chill Beats',
    cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&q=80'
  },
  {
    id: 'cat_coke',
    name: 'Coke Studio Soundscapes',
    color: 'from-rose-900 to-red-950',
    query: 'Coke Studio Pasoori',
    cover: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&q=80'
  },
  {
    id: 'cat_workout',
    name: 'Workout & Hype',
    color: 'from-orange-900 to-amber-950',
    query: 'Workout Gym Hype',
    cover: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&q=80'
  },
  {
    id: 'cat_focus',
    name: 'Deep Cyber Focus',
    color: 'from-blue-900 to-sky-950',
    query: 'Deep Focus Coding',
    cover: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&q=80'
  },
  {
    id: 'cat_sufi',
    name: 'Sufi & Qawwali Soul',
    color: 'from-yellow-900 to-amber-950',
    query: 'Sufi Qawwali Nusrat Fateh Ali Khan',
    cover: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&q=80'
  },
  {
    id: 'cat_kpop',
    name: 'K-Pop & Asian Pop',
    color: 'from-fuchsia-900 to-pink-950',
    query: 'K-Pop LISA BLACKPINK',
    cover: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300&q=80'
  },
  {
    id: 'cat_rnb',
    name: 'R&B & Late Night',
    color: 'from-violet-900 to-purple-950',
    query: 'The Weeknd R&B Soul',
    cover: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&q=80'
  },
  {
    id: 'cat_rock',
    name: 'Rock & Alternative',
    color: 'from-stone-900 to-neutral-950',
    query: 'Rock Karakoram',
    cover: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=300&q=80'
  },
  {
    id: 'cat_edm',
    name: 'Electronic / EDM',
    color: 'from-teal-900 to-cyan-950',
    query: 'Electronic Daft Punk',
    cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&q=80'
  },
  {
    id: 'cat_indie',
    name: 'Pakistani Indie Discovery',
    color: 'from-sky-900 to-indigo-950',
    query: 'Hasan Raheem Abdul Hannan Indie',
    cover: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&q=80'
  }
];

export const SearchExplorer: React.FC<SearchExplorerProps> = ({ initialQuery = '' }) => {
  const [query, setQuery] = useState(initialQuery);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [results, setResults] = useState<SearchApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'songs' | 'artists' | 'playlists' | 'albums'>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  const { playTrack, currentTrack, playbackState, navigateToArtist } = usePlayerStore();
  const { toggleLikeTrack, likedTracks, playlists: userPlaylists } = useLibraryStore();

  // Load Recent Searches from LocalStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('riff_rich_recent_searches');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const normalized: RecentSearchItem[] = parsed.map((item: any) => {
            if (typeof item === 'string') {
              return {
                id: `q_${item}`,
                title: item,
                subtitle: 'Search query',
                type: 'query'
              };
            }
            return item;
          });
          setRecentSearches(normalized);
        }
      }
    } catch {}
  }, []);

  const saveRecentItem = (item: RecentSearchItem) => {
    if (!item.title.trim()) return;
    try {
      const filtered = recentSearches.filter(
        (r) => r.title.toLowerCase() !== item.title.toLowerCase() || r.type !== item.type
      );
      const updated = [item, ...filtered].slice(0, 10);
      setRecentSearches(updated);
      localStorage.setItem('riff_rich_recent_searches', JSON.stringify(updated));
    } catch {}
  };

  const removeRecentItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter((item) => item.id !== id);
    setRecentSearches(updated);
    localStorage.setItem('riff_rich_recent_searches', JSON.stringify(updated));
  };

  const clearAllRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem('riff_rich_recent_searches');
  };

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  const performSearch = async (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setResults(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setIsInputFocused(false);

    try {
      const searchRes = await searchMasterCatalog(trimmed);
      const sameArtist = searchRes.topResult
        ? searchRes.tracks
            .filter((t) => t.artist.toLowerCase().includes(searchRes.topResult!.artist.toLowerCase()) && t.id !== searchRes.topResult!.id)
            .slice(0, 6)
        : [];
      const similar = searchRes.tracks.slice(6, 16);

      setResults({
        query: trimmed,
        topResult: searchRes.topResult,
        sameArtistTracks: sameArtist,
        similarVibeTracks: similar,
        tracks: searchRes.tracks,
        artists: [],
        albums: []
      });
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (!val.trim()) {
      setResults(null);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      saveRecentItem({
        id: `q_${query.trim()}`,
        title: query.trim(),
        subtitle: 'Search query',
        type: 'query'
      });
      performSearch(query);
      if (inputRef.current) inputRef.current.blur();
    }
  };

  // Instant Live Suggestions (0ms typing feedback)
  const liveSuggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 1) return [];

    const suggestions: RecentSearchItem[] = [];
    const seen = new Set<string>();

    // 1. Check Matching Tracks from Catalog
    const allCatalogTracks = [...PAKISTAN_TRENDING_TRACKS, ...GLOBAL_CATALOG];
    for (const t of allCatalogTracks) {
      if (t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)) {
        const key = `trk_${t.title}_${t.artist}`;
        if (!seen.has(key)) {
          seen.add(key);
          suggestions.push({
            id: t.id,
            title: t.title,
            subtitle: `Song • ${t.artist}`,
            type: 'song',
            coverUrl: t.coverUrl,
            trackData: t
          });
        }
      }
      if (suggestions.length >= 4) break;
    }

    // 2. Check Matching Artists
    for (const a of TOP_SUGGESTION_ARTISTS) {
      if (a.name.toLowerCase().includes(q)) {
        const key = `art_${a.name}`;
        if (!seen.has(key)) {
          seen.add(key);
          suggestions.push({
            id: key,
            title: a.name,
            subtitle: `Artist • ${a.genre}`,
            type: 'artist',
            coverUrl: a.avatar
          });
        }
      }
      if (suggestions.length >= 6) break;
    }

    // 3. Check Matching Playlists
    const mixes = [...getTopMixes(), ...getRecommendedPlaylists()];
    for (const p of mixes) {
      if (p.title.toLowerCase().includes(q)) {
        const key = `pl_${p.id}`;
        if (!seen.has(key)) {
          seen.add(key);
          suggestions.push({
            id: key,
            title: p.title,
            subtitle: 'Playlist',
            type: 'playlist',
            coverUrl: p.coverUrl
          });
        }
      }
      if (suggestions.length >= 7) break;
    }

    return suggestions;
  }, [query]);

  // Derived unique artists from search results
  const derivedArtists = useMemo(() => {
    if (!results || !results.tracks) return [];
    const map = new Map<string, { name: string; avatarUrl: string; genre: string }>();

    for (const t of results.tracks) {
      const primary = t.artist.split(/,|ft\.|feat\.|&/i)[0].trim();
      if (!map.has(primary.toLowerCase())) {
        map.set(primary.toLowerCase(), {
          name: primary,
          avatarUrl: t.coverUrl,
          genre: t.genre || 'Artist'
        });
      }
    }
    return Array.from(map.values()).slice(0, 8);
  }, [results]);

  // Derived matching playlists
  const matchingPlaylists = useMemo(() => {
    if (!query.trim()) return [];
    const qLower = query.toLowerCase();
    const allPlaylists = [
      ...getTopMixes(),
      ...getRecommendedPlaylists(),
      ...(userPlaylists || [])
    ];
    return allPlaylists.filter(
      (p) =>
        p.title.toLowerCase().includes(qLower) ||
        (p as any).subtitle?.toLowerCase().includes(qLower) ||
        (p as any).genre?.toLowerCase().includes(qLower)
    );
  }, [query, userPlaylists]);

  // Derived unique albums
  const derivedAlbums = useMemo(() => {
    if (!results || !results.tracks) return [];
    const map = new Map<string, { id: string; title: string; artist: string; coverUrl: string }>();

    for (const t of results.tracks) {
      if (t.album && !map.has(t.album.toLowerCase())) {
        map.set(t.album.toLowerCase(), {
          id: `alb_${t.album.toLowerCase().replace(/\s+/g, '_')}`,
          title: t.album,
          artist: t.artist,
          coverUrl: t.coverUrl
        });
      }
    }
    return Array.from(map.values()).slice(0, 6);
  }, [results]);

  // Action on selecting a recent item or suggestion
  const handleSelectRecentOrSuggestion = (item: RecentSearchItem) => {
    saveRecentItem(item);
    setIsInputFocused(false);

    if (item.type === 'song' && item.trackData) {
      playTrack(item.trackData);
      setQuery(item.title);
      performSearch(item.title);
    } else if (item.type === 'artist') {
      navigateToArtist(item.title);
    } else if (item.type === 'playlist') {
      const pl = [...getTopMixes(), ...getRecommendedPlaylists()].find((p) => p.title === item.title);
      if (pl && pl.tracks && pl.tracks.length > 0) {
        playTrack(pl.tracks[0], pl.tracks);
      }
      setQuery(item.title);
      performSearch(item.title);
    } else {
      setQuery(item.title);
      performSearch(item.title);
    }
  };

  const handleExitSearch = () => {
    setQuery('');
    setResults(null);
    setIsInputFocused(false);
    if (inputRef.current) inputRef.current.blur();
  };

  return (
    <div className="space-y-5 pb-6 select-none animate-in fade-in duration-300">
      {/* 1. Header & Full-Width Search Bar Container */}
      <div className="relative space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {results && (
              <button
                onClick={handleExitSearch}
                className="p-1 -ml-1 text-neutral-400 hover:text-white transition cursor-pointer"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Search
            </h1>
          </div>
        </div>

        {/* Search Form Row */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setTimeout(() => setIsInputFocused(false), 250)}
              onChange={(e) => {
                handleQueryChange(e.target.value);
                setIsInputFocused(true);
              }}
              placeholder="What do you want to play?"
              className="w-full pl-12 pr-11 py-3.5 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-white placeholder-neutral-400 text-sm font-semibold focus:outline-none focus:border-white/30 focus:bg-white/[0.09] transition shadow-lg"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setResults(null);
                  if (inputRef.current) inputRef.current.focus();
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {(isInputFocused || query || results) && (
            <button
              type="button"
              onClick={handleExitSearch}
              className="text-xs font-bold text-neutral-400 hover:text-white transition px-2 py-2 cursor-pointer whitespace-nowrap"
            >
              Cancel
            </button>
          )}
        </form>

        {/* ========================================================================= */}
        {/* FULL-WIDTH FLOATING OVERLAY: RECENT SEARCHES OR LIVE SUGGESTIONS */}
        {/* ========================================================================= */}
        {isInputFocused && !results && (
          <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-3xl bg-[#13141f]/95 backdrop-blur-2xl border border-white/15 shadow-2xl overflow-hidden p-3 space-y-2 animate-in fade-in zoom-in-95 duration-150">
            {/* Case A: User has NOT typed anything -> Show Recent Searches in Floating Overlay */}
            {!query.trim() && (
              <div className="space-y-2">
                <div className="px-2 py-1 flex items-center justify-between border-b border-white/[0.06]">
                  <div className="flex items-center gap-1.5 text-neutral-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">
                      Recent Searches
                    </span>
                  </div>
                  {recentSearches.length > 0 && (
                    <button
                      onMouseDown={(e) => {
                        e.preventDefault();
                        clearAllRecent();
                      }}
                      className="text-[11px] text-neutral-500 hover:text-neutral-300 font-semibold cursor-pointer"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {recentSearches.length > 0 ? (
                  <div className="max-h-72 overflow-y-auto custom-scrollbar space-y-0.5">
                    {recentSearches.map((item) => (
                      <div
                        key={item.id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectRecentOrSuggestion(item);
                        }}
                        className="group flex items-center justify-between p-2 rounded-xl hover:bg-white/[0.08] active:bg-white/[0.12] transition cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {item.coverUrl ? (
                            <img
                              src={item.coverUrl}
                              alt=""
                              className={`w-9 h-9 object-cover shadow-sm flex-shrink-0 ${
                                item.type === 'artist' ? 'rounded-full' : 'rounded-lg'
                              }`}
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-neutral-400 flex-shrink-0">
                              <Search className="w-4 h-4" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs md:text-sm font-bold text-white truncate group-hover:text-cyan-400 transition">
                              {item.title}
                            </p>
                            <p className="text-[11px] text-neutral-400 truncate">{item.subtitle}</p>
                          </div>
                        </div>

                        <button
                          onMouseDown={(e) => {
                            e.preventDefault();
                            removeRecentItem(item.id, e as any);
                          }}
                          className="p-1.5 text-neutral-500 hover:text-white rounded-full hover:bg-white/10 transition cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-neutral-500 font-medium">
                    No recent searches. Try typing an artist or song name above.
                  </div>
                )}
              </div>
            )}

            {/* Case B: User HAS typed something -> Show Live Instant Suggestions */}
            {query.trim().length > 0 && (
              <div className="space-y-1">
                <div className="px-2 py-1 flex items-center justify-between border-b border-white/[0.06]">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">
                    Top Suggestions
                  </span>
                  <span className="text-[10px] font-mono text-neutral-500">
                    Press ↵ to search all
                  </span>
                </div>

                <div className="max-h-72 overflow-y-auto custom-scrollbar space-y-0.5">
                  {liveSuggestions.map((sug) => (
                    <div
                      key={sug.id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectRecentOrSuggestion(sug);
                      }}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.08] active:bg-white/[0.12] transition cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {sug.coverUrl ? (
                          <img
                            src={sug.coverUrl}
                            alt=""
                            className={`w-9 h-9 object-cover flex-shrink-0 shadow-md ${
                              sug.type === 'artist' ? 'rounded-full' : 'rounded-lg'
                            }`}
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-neutral-400 flex-shrink-0">
                            <Search className="w-4 h-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs md:text-sm font-bold text-white truncate group-hover:text-cyan-400 transition">
                            {sug.title}
                          </p>
                          <p className="text-[11px] text-neutral-400 truncate">{sug.subtitle}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/[0.08] text-neutral-300 border border-white/10">
                          {sug.type}
                        </span>
                        <ArrowUpRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition flex-shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom Row: Execute Full Search on Enter / Tap */}
                <div
                  onMouseDown={(e) => {
                    e.preventDefault();
                    saveRecentItem({
                      id: `q_${query.trim()}`,
                      title: query.trim(),
                      subtitle: 'Search query',
                      type: 'query'
                    });
                    performSearch(query);
                  }}
                  className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-between text-xs font-bold text-neutral-300 hover:text-white cursor-pointer border-t border-white/[0.06] transition"
                >
                  <div className="flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Search for &ldquo;<span className="text-white underline">{query}</span>&rdquo;</span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400">Search All ↵</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Loading Spinner */}
      {isLoading && (
        <div className="text-center py-20 space-y-3">
          <Loader2 className="w-8 h-8 text-white animate-spin mx-auto" />
          <p className="text-xs text-neutral-400 font-medium">Searching verified catalog and decrypting 320k streams...</p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. DEFAULT BROWSE SCREEN: 16 Spotify Categories with Tilted Artwork */}
      {/* ========================================================================= */}
      {!results && !isLoading && (
        <div className="space-y-4 pt-1">
          <h2 className="text-base md:text-lg font-bold text-white tracking-tight">
            Browse All
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {BROWSE_CATEGORIES.map((cat) => (
              <div
                key={cat.id}
                onClick={() => {
                  setQuery(cat.query);
                  saveRecentItem({
                    id: `cat_${cat.id}`,
                    title: cat.name,
                    subtitle: 'Category',
                    type: 'playlist',
                    coverUrl: cat.cover
                  });
                  performSearch(cat.query);
                }}
                className={`relative h-28 sm:h-32 rounded-2xl bg-gradient-to-br ${cat.color} p-3.5 flex flex-col justify-between overflow-hidden cursor-pointer shadow-lg active:scale-[0.98] transition-all hover:scale-[1.02] border border-white/[0.08] group`}
              >
                <span className="text-xs sm:text-sm font-black text-white tracking-tight leading-snug z-10 pr-6">
                  {cat.name}
                </span>

                {/* Tilted Cover Art Peeking from Bottom-Right Corner (Spotify Signature) */}
                <div className="absolute -right-3 -bottom-3 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shadow-2xl rotate-[22deg] group-hover:rotate-[15deg] group-hover:scale-110 transition-transform duration-300 border border-white/20">
                  <img src={cat.cover} alt="" className="w-full h-full object-cover" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DEDICATED FULL SEARCH RESULTS SCREEN (Shown when search is executed) */}
      {/* ========================================================================= */}
      {results && !isLoading && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Active Search Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: 'all', label: 'All' },
              { id: 'songs', label: 'Songs' },
              { id: 'artists', label: 'Artists' },
              { id: 'playlists', label: 'Playlists' },
              { id: 'albums', label: 'Albums' }
            ].map((chip) => {
              const isActive = activeFilter === chip.id;
              return (
                <button
                  key={chip.id}
                  onClick={() => {
                    if (navigator.vibrate) navigator.vibrate(10);
                    setActiveFilter(chip.id as any);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-black shadow-md'
                      : 'bg-[#242424] text-neutral-200 hover:bg-[#2a2a2a] hover:text-white'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: ALL (SPOTIFY 2-COLUMN HERO + SUBSECTIONS) */}
          {/* ========================================================================= */}
          {activeFilter === 'all' && (
            <div className="space-y-8">
              {/* Row 1: Top Result (Left 5 cols) + Songs (Right 7 cols) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left: Top Result */}
                <div className="lg:col-span-5 space-y-3">
                  <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">Top result</h3>
                  {results.topResult && (
                    <div
                      onClick={() => {
                        saveRecentItem({
                          id: results.topResult!.id,
                          title: results.topResult!.title,
                          subtitle: `Song • ${results.topResult!.artist}`,
                          type: 'song',
                          coverUrl: results.topResult!.coverUrl,
                          trackData: results.topResult!
                        });
                        playTrack(results.topResult!, results.tracks);
                      }}
                      className="group relative p-5 rounded-lg bg-[#181818] hover:bg-[#282828] transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[220px]"
                    >
                      <div className="space-y-4">
                        <img
                          src={results.topResult.coverUrl}
                          alt={results.topResult.title}
                          className="w-24 h-24 rounded-md object-cover shadow-2xl"
                        />
                        <div>
                          <h2 className="text-2xl lg:text-3xl font-black text-white tracking-tight truncate group-hover:underline">
                            {results.topResult.title}
                          </h2>
                          <div className="flex items-center gap-2 text-xs md:text-sm text-neutral-400 mt-1">
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                navigateToArtist(results.topResult!.artist);
                              }}
                              className="font-bold text-white hover:underline cursor-pointer truncate"
                            >
                              {results.topResult.artist}
                            </span>
                            <span>•</span>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/60 text-white border border-white/10">
                              Song
                            </span>
                            {results.topResult.sourceType === 'riff-engine' && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#1db954]/20 text-[#1db954] border border-[#1db954]/30">
                                ⚡ 320k
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Floating Spotify Green Play Button */}
                      <div className="absolute bottom-5 right-5 w-12 h-12 rounded-full bg-[#1db954] text-black flex items-center justify-center shadow-2xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
                        {currentTrack?.id === results.topResult.id && playbackState === 'playing' ? (
                          <Pause className="w-6 h-6 fill-current" />
                        ) : (
                          <Play className="w-6 h-6 fill-current ml-0.5" />
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Songs (Top 4 Rows) */}
                <div className="lg:col-span-7 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">Songs</h3>
                    <button
                      onClick={() => setActiveFilter('songs')}
                      className="text-xs font-bold text-neutral-400 hover:text-white hover:underline cursor-pointer"
                    >
                      See all
                    </button>
                  </div>

                  <div className="space-y-1">
                    {results.tracks.slice(0, 4).map((track, i) => {
                      const isPlaying = currentTrack?.id === track.id && playbackState === 'playing';
                      const isLiked = likedTracks.some((t) => t.id === track.id);
                      return (
                        <div
                          key={`${track.id}_${i}`}
                          onClick={() => {
                            saveRecentItem({
                              id: track.id,
                              title: track.title,
                              subtitle: `Song • ${track.artist}`,
                              type: 'song',
                              coverUrl: track.coverUrl,
                              trackData: track
                            });
                            playTrack(track, results.tracks);
                          }}
                          className="group flex items-center justify-between p-2 rounded-md hover:bg-white/10 active:bg-white/15 transition cursor-pointer"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
                            <div className="relative w-10 h-10 rounded overflow-hidden shrink-0 bg-neutral-900">
                              <img src={track.coverUrl} alt="" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                {isPlaying ? (
                                  <Pause className="w-4 h-4 fill-current text-white" />
                                ) : (
                                  <Play className="w-4 h-4 fill-current text-white ml-0.5" />
                                )}
                              </div>
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className={`text-sm font-bold truncate ${isPlaying ? 'text-[#1db954]' : 'text-white'}`}>
                                {track.title}
                              </p>
                              <p className="text-xs text-neutral-400 truncate hover:underline hover:text-white transition">
                                {track.artist}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleLikeTrack(track);
                              }}
                              className={`p-1.5 rounded-full transition cursor-pointer ${
                                isLiked ? 'text-[#1db954]' : 'text-neutral-500 hover:text-white opacity-0 group-hover:opacity-100'
                              }`}
                            >
                              <Heart className={`w-4 h-4 ${isLiked ? 'fill-[#1db954]' : ''}`} />
                            </button>
                            <span className="text-xs font-mono text-neutral-400 w-10 text-right">
                              {formatDuration(track.duration)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Artists Row */}
              {derivedArtists.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">Artists</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {derivedArtists.slice(0, 6).map((artist, idx) => (
                      <div
                        key={idx}
                        onClick={() => navigateToArtist(artist.name)}
                        className="p-4 rounded-lg bg-[#181818] hover:bg-[#282828] transition-all cursor-pointer group flex flex-col items-center text-center space-y-3"
                      >
                        <div className="relative w-28 h-28 rounded-full overflow-hidden shadow-xl bg-neutral-900">
                          <img
                            src={artist.avatarUrl}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="w-full">
                          <p className="text-sm font-bold text-white truncate">{artist.name}</p>
                          <p className="text-xs text-neutral-400 mt-0.5">Artist</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Albums Row */}
              {derivedAlbums.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">Albums</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {derivedAlbums.slice(0, 6).map((alb, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          const albTracks = results.tracks.filter((t) => t.album === alb.title);
                          if (albTracks.length > 0) playTrack(albTracks[0], albTracks);
                        }}
                        className="p-4 rounded-lg bg-[#181818] hover:bg-[#282828] transition-all cursor-pointer group space-y-3"
                      >
                        <div className="relative aspect-square rounded-md overflow-hidden shadow-xl bg-neutral-900">
                          <img
                            src={alb.coverUrl}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0">
                            <div className="w-10 h-10 rounded-full bg-[#1db954] text-black flex items-center justify-center shadow-xl hover:scale-105 transition-transform">
                              <Play className="w-4 h-4 fill-current ml-0.5" />
                            </div>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white truncate">{alb.title}</p>
                          <p className="text-xs text-neutral-400 truncate mt-0.5">{alb.artist}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Playlists Row */}
              {matchingPlaylists.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">Playlists</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {matchingPlaylists.slice(0, 6).map((pl) => (
                      <div
                        key={pl.id}
                        onClick={() => {
                          if (pl.tracks && pl.tracks.length > 0) playTrack(pl.tracks[0], pl.tracks);
                        }}
                        className="p-4 rounded-lg bg-[#181818] hover:bg-[#282828] transition-all cursor-pointer group space-y-3"
                      >
                        <div className="relative aspect-square rounded-md overflow-hidden shadow-xl bg-neutral-900">
                          <img
                            src={pl.coverUrl}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0">
                            <div className="w-10 h-10 rounded-full bg-[#1db954] text-black flex items-center justify-center shadow-xl hover:scale-105 transition-transform">
                              <Play className="w-4 h-4 fill-current ml-0.5" />
                            </div>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white truncate">{pl.title}</p>
                          <p className="text-xs text-neutral-400 truncate mt-0.5">By Riff</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: SONGS ONLY (FULL SPOTIFY TRACKLIST TABLE) */}
          {/* ========================================================================= */}
          {activeFilter === 'songs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-2 px-3 text-xs font-mono text-neutral-400">
                <div className="flex items-center gap-4">
                  <span className="w-6 text-center">#</span>
                  <span>TITLE</span>
                </div>
                <div className="flex items-center gap-8">
                  <span className="hidden md:inline">ALBUM</span>
                  <span>TIME</span>
                </div>
              </div>

              <div className="space-y-0.5">
                {results.tracks.map((track, i) => {
                  const isPlaying = currentTrack?.id === track.id && playbackState === 'playing';
                  const isLiked = likedTracks.some((t) => t.id === track.id);
                  return (
                    <div
                      key={`${track.id}_${i}`}
                      onClick={() => {
                        saveRecentItem({
                          id: track.id,
                          title: track.title,
                          subtitle: `Song • ${track.artist}`,
                          type: 'song',
                          coverUrl: track.coverUrl,
                          trackData: track
                        });
                        playTrack(track, results.tracks);
                      }}
                      className="group flex items-center justify-between p-2.5 rounded-md hover:bg-white/10 active:bg-white/15 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1 pr-4">
                        <span className="w-6 text-center text-xs font-mono text-neutral-500 group-hover:hidden">
                          {i + 1}
                        </span>
                        <div className="w-6 hidden group-hover:flex items-center justify-center text-white">
                          {isPlaying ? (
                            <Pause className="w-3.5 h-3.5 fill-current" />
                          ) : (
                            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                          )}
                        </div>

                        <img
                          src={track.coverUrl}
                          alt=""
                          className="w-10 h-10 rounded object-cover shadow-sm shrink-0"
                        />

                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-bold truncate ${isPlaying ? 'text-[#1db954]' : 'text-white'}`}>
                            {track.title}
                          </p>
                          <p className="text-xs text-neutral-400 truncate hover:underline hover:text-white transition">
                            {track.artist}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <span className="text-xs text-neutral-400 truncate max-w-[140px] hidden md:inline">
                          {track.album || 'Single'}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLikeTrack(track);
                          }}
                          className={`p-1.5 transition cursor-pointer ${
                            isLiked ? 'text-[#1db954]' : 'text-neutral-500 hover:text-white opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${isLiked ? 'fill-[#1db954]' : ''}`} />
                        </button>
                        <span className="text-xs font-mono text-neutral-400 w-10 text-right">
                          {formatDuration(track.duration)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: ARTISTS ONLY */}
          {/* ========================================================================= */}
          {activeFilter === 'artists' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {derivedArtists.map((artist, idx) => (
                <div
                  key={idx}
                  onClick={() => navigateToArtist(artist.name)}
                  className="p-4 rounded-lg bg-[#181818] hover:bg-[#282828] transition-all cursor-pointer group flex flex-col items-center text-center space-y-3"
                >
                  <div className="relative w-32 h-32 rounded-full overflow-hidden shadow-xl bg-neutral-900">
                    <img
                      src={artist.avatarUrl}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="w-full">
                    <p className="text-sm font-bold text-white truncate">{artist.name}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">Artist</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: ALBUMS ONLY */}
          {/* ========================================================================= */}
          {activeFilter === 'albums' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {derivedAlbums.map((alb, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    const albTracks = results.tracks.filter((t) => t.album === alb.title);
                    if (albTracks.length > 0) playTrack(albTracks[0], albTracks);
                  }}
                  className="p-4 rounded-lg bg-[#181818] hover:bg-[#282828] transition-all cursor-pointer group space-y-3"
                >
                  <div className="relative aspect-square rounded-md overflow-hidden shadow-xl bg-neutral-900">
                    <img
                      src={alb.coverUrl}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0">
                      <div className="w-10 h-10 rounded-full bg-[#1db954] text-black flex items-center justify-center shadow-xl hover:scale-105 transition-transform">
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white truncate">{alb.title}</p>
                    <p className="text-xs text-neutral-400 truncate mt-0.5">{alb.artist}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: PLAYLISTS ONLY */}
          {/* ========================================================================= */}
          {activeFilter === 'playlists' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {matchingPlaylists.map((pl) => (
                <div
                  key={pl.id}
                  onClick={() => {
                    if (pl.tracks && pl.tracks.length > 0) playTrack(pl.tracks[0], pl.tracks);
                  }}
                  className="p-4 rounded-lg bg-[#181818] hover:bg-[#282828] transition-all cursor-pointer group space-y-3"
                >
                  <div className="relative aspect-square rounded-md overflow-hidden shadow-xl bg-neutral-900">
                    <img
                      src={pl.coverUrl}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0">
                      <div className="w-10 h-10 rounded-full bg-[#1db954] text-black flex items-center justify-center shadow-xl hover:scale-105 transition-transform">
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white truncate">{pl.title}</p>
                    <p className="text-xs text-neutral-400 truncate mt-0.5">By Riff</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty Search State */}
          {results.tracks.length === 0 && !results.topResult && (
            <div className="text-center py-16 space-y-2">
              <p className="text-base font-bold text-white">No results found for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-neutral-400">Please check your spelling or search for another song, artist, or playlist.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchExplorer;
