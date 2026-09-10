import { Track } from '../types';
import { searchSaavnSongs } from './saavnClient';

export interface ApiArtist {
  id: string;
  name: string;
  picture: string;
  pictureSmall?: string;
  pictureMedium?: string;
  pictureBig?: string;
  pictureXl?: string;
}

export interface ApiAlbum {
  id: string;
  title: string;
  cover: string;
  coverSmall?: string;
  coverMedium?: string;
  coverBig?: string;
  coverXl?: string;
  artist?: {
    id: string;
    name: string;
  };
}

export interface ChartsResponse {
  topTracks: Track[];
  topArtists: ApiArtist[];
  topAlbums: ApiAlbum[];
}

export interface MultiRegionalFeed {
  globalTracks: Track[];
  pakistanTracks: Track[];
  bollywoodTracks: Track[];
  punjabiTracks: Track[];
  newSongsTracks: Track[];
  quickAccessTracks: Track[];
  topArtists: ApiArtist[];
  topAlbums: ApiAlbum[];
}

export interface SearchResponse {
  tracks: Track[];
  artists: ApiArtist[];
  albums: ApiAlbum[];
  total: number;
}

let cachedMultiFeed: MultiRegionalFeed | null = null;
let lastMultiFeedFetch = 0;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes cache

// Curated top regional artists with verified high-res imagery
const ICONIC_REGIONAL_ARTISTS: ApiArtist[] = [
  {
    id: 'artist_atif',
    name: 'Atif Aslam',
    picture: 'https://c.saavncdn.com/artists/Atif_Aslam_500x500.jpg',
  },
  {
    id: 'artist_talha',
    name: 'Talha Anjum',
    picture: 'https://c.saavncdn.com/artists/Talha_Anjum_002_20230221081515_500x500.jpg',
  },
  {
    id: 'artist_arijit',
    name: 'Arijit Singh',
    picture: 'https://c.saavncdn.com/artists/Arijit_Singh_002_20230323062147_500x500.jpg',
  },
  {
    id: 'artist_diljit',
    name: 'Diljit Dosanjh',
    picture: 'https://c.saavncdn.com/artists/Diljit_Dosanjh_004_20221006184545_500x500.jpg',
  },
  {
    id: 'artist_guru',
    name: 'Guru Randhawa',
    picture: 'https://c.saavncdn.com/artists/Guru_Randhawa_004_20250701125845_500x500.jpg',
  },
  {
    id: 'artist_karan',
    name: 'Karan Aujla',
    picture: 'https://c.saavncdn.com/artists/Karan_Aujla_005_20230818074415_500x500.jpg',
  },
  {
    id: 'artist_youngstunners',
    name: 'Young Stunners',
    picture: 'https://c.saavncdn.com/artists/Young_Stunners_500x500.jpg',
  },
  {
    id: 'artist_shubh',
    name: 'Shubh',
    picture: 'https://c.saavncdn.com/artists/Shubh_000_20221107122131_500x500.jpg',
  },
  {
    id: 'artist_ap',
    name: 'AP Dhillon',
    picture: 'https://c.saavncdn.com/artists/AP_Dhillon_003_20230811053434_500x500.jpg',
  },
  {
    id: 'artist_kaifi',
    name: 'Kaifi Khalil',
    picture: 'https://c.saavncdn.com/artists/Kaifi_Khalil_001_20221019082333_500x500.jpg',
  },
  {
    id: 'artist_abdul',
    name: 'Abdul Hannan',
    picture: 'https://c.saavncdn.com/artists/Abdul_Hannan_001_20230621063630_500x500.jpg',
  },
  {
    id: 'artist_theweeknd',
    name: 'The Weeknd',
    picture: 'https://c.saavncdn.com/artists/The_Weeknd_500x500.jpg',
  }
];

/**
 * Fetches multi-regional live feeds:
 * - Real Pakistan Trending (Coke Studio, Pop, Urdu Rap)
 * - Real Bollywood Top Romance & Pop
 * - Real Punjabi Wave Hits
 * - Real New Releases
 * - Real Global Top 50
 */
export async function fetchMultiRegionalFeeds(): Promise<MultiRegionalFeed> {
  const now = Date.now();
  if (cachedMultiFeed && now - lastMultiFeedFetch < CACHE_TTL_MS) {
    return cachedMultiFeed;
  }

  // Check local cache for 0ms instant startup
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('riff_multi_feed_cache');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.data && now - parsed.timestamp < CACHE_TTL_MS) {
          cachedMultiFeed = parsed.data;
          // Background revalidate
          revalidateFeedsInBackground();
          return cachedMultiFeed!;
        }
      }
    } catch {}
  }

  return await executeFeedFetch();
}

async function executeFeedFetch(): Promise<MultiRegionalFeed> {
  const [pkRes, bollyRes, punjabiRes, latestRes, globalRes] = await Promise.allSettled([
    searchSaavnSongs('Coke Studio Pakistan Atif Aslam Talha Anjum', 14),
    searchSaavnSongs('Bollywood Top Romance Hits Arijit Singh', 14),
    searchSaavnSongs('Punjabi Wave Karan Aujla Diljit Dosanjh', 14),
    searchSaavnSongs('Latest Releases 2026', 14),
    searchSaavnSongs('Global Top 50 Billboard', 14),
  ]);

  const pkTracks = pkRes.status === 'fulfilled' ? pkRes.value : [];
  const bollyTracks = bollyRes.status === 'fulfilled' ? bollyRes.value : [];
  const punjabiTracks = punjabiRes.status === 'fulfilled' ? punjabiRes.value : [];
  const newSongs = latestRes.status === 'fulfilled' ? latestRes.value : [];
  const global = globalRes.status === 'fulfilled' ? globalRes.value : [];

  // Extract unique albums
  const allTracks = [...pkTracks, ...bollyTracks, ...punjabiTracks, ...global];
  const albumMap = new Map<string, ApiAlbum>();
  for (const t of allTracks) {
    if (t.album && !albumMap.has(t.album)) {
      albumMap.set(t.album, {
        id: `alb_${t.id}`,
        title: t.album,
        cover: t.coverUrl,
        artist: { id: `art_${t.id}`, name: t.artist },
      });
    }
  }

  // 6-Tile quick access mix (Spotify style)
  const quickAccess: Track[] = [];
  if (pkTracks[0]) quickAccess.push(pkTracks[0]);
  if (bollyTracks[0]) quickAccess.push(bollyTracks[0]);
  if (punjabiTracks[0]) quickAccess.push(punjabiTracks[0]);
  if (global[0]) quickAccess.push(global[0]);
  if (pkTracks[1]) quickAccess.push(pkTracks[1]);
  if (bollyTracks[1]) quickAccess.push(bollyTracks[1]);

  const result: MultiRegionalFeed = {
    globalTracks: global,
    pakistanTracks: pkTracks,
    bollywoodTracks: bollyTracks,
    punjabiTracks: punjabiTracks,
    newSongsTracks: newSongs,
    quickAccessTracks: quickAccess.length >= 4 ? quickAccess : allTracks.slice(0, 6),
    topArtists: ICONIC_REGIONAL_ARTISTS,
    topAlbums: Array.from(albumMap.values()).slice(0, 15),
  };

  cachedMultiFeed = result;
  lastMultiFeedFetch = Date.now();

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('riff_multi_feed_cache', JSON.stringify({ data: result, timestamp: Date.now() }));
    } catch {}
  }

  return result;
}

function revalidateFeedsInBackground() {
  setTimeout(async () => {
    try {
      await executeFeedFetch();
    } catch {}
  }, 100);
}

/**
 * Live search across the entire music catalog
 */
export async function searchCatalog(query: string, limit = 20, _signal?: AbortSignal): Promise<SearchResponse> {
  const clean = query.trim();
  if (!clean) {
    return { tracks: [], artists: [], albums: [], total: 0 };
  }

  const tracks = await searchSaavnSongs(clean, limit);

  // Derive artists and albums from search results
  const artistMap = new Map<string, ApiArtist>();
  const albumMap = new Map<string, ApiAlbum>();

  for (const t of tracks) {
    const primaryArtist = t.artist.split(',')[0]?.trim() || t.artist;
    if (primaryArtist && !artistMap.has(primaryArtist)) {
      artistMap.set(primaryArtist, {
        id: `artist_${encodeURIComponent(primaryArtist)}`,
        name: primaryArtist,
        picture: t.coverUrl,
      });
    }

    if (t.album && !albumMap.has(t.album)) {
      albumMap.set(t.album, {
        id: `album_${encodeURIComponent(t.album)}`,
        title: t.album,
        cover: t.coverUrl,
        artist: { id: `art_${t.id}`, name: t.artist },
      });
    }
  }

  return {
    tracks,
    artists: Array.from(artistMap.values()).slice(0, 8),
    albums: Array.from(albumMap.values()).slice(0, 8),
    total: tracks.length,
  };
}

export async function fetchCharts(): Promise<ChartsResponse> {
  const feed = await fetchMultiRegionalFeeds();
  return {
    topTracks: feed.globalTracks,
    topArtists: feed.topArtists,
    topAlbums: feed.topAlbums,
  };
}
