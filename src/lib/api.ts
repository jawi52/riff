import { Track, AudioSourceType } from '../types';
import { RIFF_ENGINE_URL } from './engineUrl';

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

// Curated top regional artists with verified permanent Google / YouTube & Saavn CDN imagery
export const ICONIC_REGIONAL_ARTISTS: ApiArtist[] = [
  {
    id: 'artist_atif',
    name: 'Atif Aslam',
    picture: 'https://yt3.googleusercontent.com/pVV52htc8C16cLhP-_eSqv-mdfq-_GwCcw4YIRWlzaO3nPbME8meyKopw_VAdlBlcz5t4XrkSsXO1Ys=w800-h800-l90-rj',
    pictureBig: 'https://yt3.googleusercontent.com/pVV52htc8C16cLhP-_eSqv-mdfq-_GwCcw4YIRWlzaO3nPbME8meyKopw_VAdlBlcz5t4XrkSsXO1Ys=w800-h800-l90-rj',
  },
  {
    id: 'artist_talha',
    name: 'Talha Anjum',
    picture: 'https://yt3.googleusercontent.com/ZaTM6LIOrSBq2IB_HlqW1L2q_9PiiTcWFcufixGNHt9_U8lLicgTbWBzVlA2yPP8ph0plFsKaJ-SSiMj=w800-h800-l90-rj',
    pictureBig: 'https://yt3.googleusercontent.com/ZaTM6LIOrSBq2IB_HlqW1L2q_9PiiTcWFcufixGNHt9_U8lLicgTbWBzVlA2yPP8ph0plFsKaJ-SSiMj=w800-h800-l90-rj',
  },
  {
    id: 'artist_arijit',
    name: 'Arijit Singh',
    picture: 'https://c.saavncdn.com/artists/Arijit_Singh_002_20230323062147_500x500.jpg',
    pictureBig: 'https://c.saavncdn.com/artists/Arijit_Singh_002_20230323062147_500x500.jpg',
  },
  {
    id: 'artist_diljit',
    name: 'Diljit Dosanjh',
    picture: 'https://yt3.googleusercontent.com/0qFbPaWYZjGP3eW8xeOx42S4nw38dU418iWaGc0W5F3a_It-7cXB880bOGH9me8N0T6pY07iD_3KHg5xJA=w800-h800-l90-rj',
    pictureBig: 'https://yt3.googleusercontent.com/0qFbPaWYZjGP3eW8xeOx42S4nw38dU418iWaGc0W5F3a_It-7cXB880bOGH9me8N0T6pY07iD_3KHg5xJA=w800-h800-l90-rj',
  },
  {
    id: 'artist_guru',
    name: 'Guru Randhawa',
    picture: 'https://yt3.googleusercontent.com/bRHk48zvXAst0-4DQ4D3gmTOWCVwMCIdb44HsjjKAkWE9oxraOhM0acyW1RooB-ULWvn8NsBFx5BgHW-=w800-h800-l90-rj',
    pictureBig: 'https://yt3.googleusercontent.com/bRHk48zvXAst0-4DQ4D3gmTOWCVwMCIdb44HsjjKAkWE9oxraOhM0acyW1RooB-ULWvn8NsBFx5BgHW-=w800-h800-l90-rj',
  },
  {
    id: 'artist_karan',
    name: 'Karan Aujla',
    picture: 'https://yt3.googleusercontent.com/BzOBERVwxHIkVDpePVN8mnT0MID3cySSHcZvY84FHusBL78dxkdpWBBk8o4O5e8BaenNlHKlI9fWb_Rccw=w800-h800-l90-rj',
    pictureBig: 'https://yt3.googleusercontent.com/BzOBERVwxHIkVDpePVN8mnT0MID3cySSHcZvY84FHusBL78dxkdpWBBk8o4O5e8BaenNlHKlI9fWb_Rccw=w800-h800-l90-rj',
  },
  {
    id: 'artist_youngstunners',
    name: 'Young Stunners',
    picture: 'https://yt3.googleusercontent.com/VZBjhahkQ-DFsinZ8_7DuIt4jNXbiF3wmcmAHYG3k7GJFYYxEQe64i9ImnhQr1w6XxHQZe35W1B3zjSo=w800-h800-l90-rj',
    pictureBig: 'https://yt3.googleusercontent.com/VZBjhahkQ-DFsinZ8_7DuIt4jNXbiF3wmcmAHYG3k7GJFYYxEQe64i9ImnhQr1w6XxHQZe35W1B3zjSo=w800-h800-l90-rj',
  },
  {
    id: 'artist_shubh',
    name: 'Shubh',
    picture: 'https://yt3.googleusercontent.com/V_w7m2kuoVshpqcS1-RlEl-aONMQcGjP84WSo1tJS5IU8IDCr0v0s0NBMMGrLXtlL4CNjUKEdXcN3gAy=w800-h800-l90-rj',
    pictureBig: 'https://yt3.googleusercontent.com/V_w7m2kuoVshpqcS1-RlEl-aONMQcGjP84WSo1tJS5IU8IDCr0v0s0NBMMGrLXtlL4CNjUKEdXcN3gAy=w800-h800-l90-rj',
  },
  {
    id: 'artist_ap',
    name: 'AP Dhillon',
    picture: 'https://yt3.googleusercontent.com/YodB8IMuc531lUrvJBl5gwh5yl242hTBKfVj-cpk4oFOqOm-wElw5Lcw3_DvagrR0arcXXs19l6xr6MN5Q=w800-h800-l90-rj',
    pictureBig: 'https://yt3.googleusercontent.com/YodB8IMuc531lUrvJBl5gwh5yl242hTBKfVj-cpk4oFOqOm-wElw5Lcw3_DvagrR0arcXXs19l6xr6MN5Q=w800-h800-l90-rj',
  },
  {
    id: 'artist_kaifi',
    name: 'Kaifi Khalil',
    picture: 'https://yt3.googleusercontent.com/8d_e8uuKP8VkRJ5et2SA4tKC7oK4a1-uD97Vn3SbgCh0vd7QjHZ875AB0Gng-jIIM9y_AgHzVeH8KNSw=w800-h800-l90-rj',
    pictureBig: 'https://yt3.googleusercontent.com/8d_e8uuKP8VkRJ5et2SA4tKC7oK4a1-uD97Vn3SbgCh0vd7QjHZ875AB0Gng-jIIM9y_AgHzVeH8KNSw=w800-h800-l90-rj',
  },
  {
    id: 'artist_theweeknd',
    name: 'The Weeknd',
    picture: 'https://yt3.googleusercontent.com/R_cjQK3wwLPEzri1jerx-79zgzGocoKvwGU3NMONaTsaMM0Idd641pfB8r5jgfpn6I8JAoFtf9RBIcI=w800-h800-l90-rj',
    pictureBig: 'https://yt3.googleusercontent.com/R_cjQK3wwLPEzri1jerx-79zgzGocoKvwGU3NMONaTsaMM0Idd641pfB8r5jgfpn6I8JAoFtf9RBIcI=w800-h800-l90-rj',
  },
];

/**
 * Maps raw API track data from Riff-Engine into Riff's domain Track model
 */
export function mapApiTrackToTrack(t: any): Track {
  const artistName = typeof t.artist === 'string'
    ? t.artist
    : (t.artist?.name || 'Unknown Artist');

  const albumTitle = typeof t.album === 'string'
    ? t.album
    : (t.album?.title || '');

  const cover = t.album?.coverBig ||
    t.album?.coverMedium ||
    t.album?.cover ||
    t.coverUrl ||
    t.cover ||
    t.artist?.picture ||
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80';

  return {
    id: String(t.id),
    title: t.title || 'Untitled Track',
    artist: artistName,
    album: albumTitle,
    duration: typeof t.duration === 'number' ? t.duration : 210,
    coverUrl: cover,
    sourceType: 'riff-engine' as AudioSourceType,
    streamUrl: t.streamUrl || `${RIFF_ENGINE_URL}/api/v1/stream/${t.id}`,
    bitrateKbps: 320,
    genre: 'Global',
    hasSyncedLyrics: Boolean(t.lyricsEndpoint),
    credits: {
      performers: [artistName],
      label: albumTitle || 'Studio Master',
    },
  };
}

/**
 * Fetches global charts from live Azure backend API
 */
export async function fetchCharts(): Promise<ChartsResponse> {
  const res = await fetch(`${RIFF_ENGINE_URL}/api/v1/charts`, {
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`Charts API returned status ${res.status}`);
  }

  const data = await res.json();

  const topTracks: Track[] = (data.topTracks || []).map(mapApiTrackToTrack);
  const topArtists: ApiArtist[] = data.topArtists || [];
  const topAlbums: ApiAlbum[] = data.topAlbums || [];

  return {
    topTracks,
    topArtists,
    topAlbums,
  };
}

/**
 * Live search across the entire music catalog
 */
export async function searchCatalog(query: string, limit = 20, signal?: AbortSignal): Promise<SearchResponse> {
  const clean = query.trim();
  if (!clean) {
    return { tracks: [], artists: [], albums: [], total: 0 };
  }

  const res = await fetch(`${RIFF_ENGINE_URL}/api/v1/search?q=${encodeURIComponent(clean)}&limit=${limit}`, {
    signal,
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`Search API returned status ${res.status}`);
  }

  const data = await res.json();

  const tracks: Track[] = (data.tracks || []).map(mapApiTrackToTrack);
  const artists: ApiArtist[] = data.artists || [];
  const albums: ApiAlbum[] = data.albums || [];

  return {
    tracks,
    artists,
    albums,
    total: data.total || tracks.length,
  };
}

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
  const [globalCharts, pkRes, bollyRes, punjabiRes, latestRes] = await Promise.allSettled([
    fetchCharts(),
    searchCatalog('Trending Pakistan', 14),
    searchCatalog('Bollywood Top Hits', 14),
    searchCatalog('Punjabi Hits', 14),
    searchCatalog('Latest Releases', 14),
  ]);

  const global = globalCharts.status === 'fulfilled' ? globalCharts.value : { topTracks: [], topArtists: [], topAlbums: [] };
  const pkTracks = pkRes.status === 'fulfilled' ? pkRes.value.tracks : [];
  const bollyTracks = bollyRes.status === 'fulfilled' ? bollyRes.value.tracks : [];
  const punjabiTracks = punjabiRes.status === 'fulfilled' ? punjabiRes.value.tracks : [];
  const newSongs = latestRes.status === 'fulfilled' ? latestRes.value.tracks : [];

  // Extract unique albums across all regions
  const allTracks = [...pkTracks, ...bollyTracks, ...punjabiTracks, ...newSongs, ...global.topTracks];
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

  // Merge discovered artists with iconic regional artists
  const extraArtists: ApiArtist[] = [
    ...(pkRes.status === 'fulfilled' ? pkRes.value.artists : []),
    ...(bollyRes.status === 'fulfilled' ? bollyRes.value.artists : []),
    ...(punjabiRes.status === 'fulfilled' ? punjabiRes.value.artists : []),
    ...(latestRes.status === 'fulfilled' ? latestRes.value.artists : []),
  ];

  const seenArtistNames = new Set<string>();
  const mergedArtists: ApiArtist[] = [];

  // Priority to iconic artists with permanent high-res avatars
  for (const a of ICONIC_REGIONAL_ARTISTS) {
    seenArtistNames.add(a.name.toLowerCase().trim());
    mergedArtists.push(a);
  }

  for (const a of [...extraArtists, ...global.topArtists]) {
    const key = a.name.toLowerCase().trim();
    const pic = a.pictureBig || a.pictureMedium || a.picture;
    if (!seenArtistNames.has(key) && pic) {
      seenArtistNames.add(key);
      mergedArtists.push(a);
    }
  }

  // 6-Tile quick access mix (Spotify style)
  const quickAccess: Track[] = [];
  if (pkTracks[0]) quickAccess.push(pkTracks[0]);
  if (bollyTracks[0]) quickAccess.push(bollyTracks[0]);
  if (punjabiTracks[0]) quickAccess.push(punjabiTracks[0]);
  if (global.topTracks[0]) quickAccess.push(global.topTracks[0]);
  if (pkTracks[1]) quickAccess.push(pkTracks[1]);
  if (bollyTracks[1]) quickAccess.push(bollyTracks[1]);

  const result: MultiRegionalFeed = {
    globalTracks: global.topTracks,
    pakistanTracks: pkTracks,
    bollywoodTracks: bollyTracks,
    punjabiTracks: punjabiTracks,
    newSongsTracks: newSongs,
    quickAccessTracks: quickAccess.length >= 4 ? quickAccess : allTracks.slice(0, 6),
    topArtists: mergedArtists.slice(0, 15),
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
