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
 * Live search across universal federated catalog
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

let cachedMultiFeed: MultiRegionalFeed | null = null;
let lastMultiFeedFetch = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches multi-regional feeds from live Azure backend:
 * - Global Charts
 * - Trending Pakistan (Coke Studio, Pop, Rap)
 * - Bollywood Top Hits (Hindi, Romance, Filmi)
 * - Punjabi Top Hits (AP Dhillon, Shubh, Diljit)
 */
export async function fetchMultiRegionalFeeds(): Promise<MultiRegionalFeed> {
  const now = Date.now();
  if (cachedMultiFeed && now - lastMultiFeedFetch < CACHE_TTL_MS) {
    return cachedMultiFeed;
  }

  const [globalCharts, pkRes, bollyRes, punjabiRes, latestRes] = await Promise.allSettled([
    fetchCharts(),
    searchCatalog('Trending Pakistan', 10),
    searchCatalog('Bollywood Top Hits', 10),
    searchCatalog('Punjabi Hits', 10),
    searchCatalog('Latest Releases', 10),
  ]);

  const global = globalCharts.status === 'fulfilled' ? globalCharts.value : { topTracks: [], topArtists: [], topAlbums: [] };
  const pkTracks = pkRes.status === 'fulfilled' ? pkRes.value.tracks : [];
  const bollyTracks = bollyRes.status === 'fulfilled' ? bollyRes.value.tracks : [];
  const punjabiTracks = punjabiRes.status === 'fulfilled' ? punjabiRes.value.tracks : [];
  const newSongs = latestRes.status === 'fulfilled' ? latestRes.value.tracks : [];

  // Merge artists across all regions
  const extraArtists: ApiArtist[] = [
    ...(pkRes.status === 'fulfilled' ? pkRes.value.artists : []),
    ...(bollyRes.status === 'fulfilled' ? bollyRes.value.artists : []),
    ...(punjabiRes.status === 'fulfilled' ? punjabiRes.value.artists : []),
    ...(latestRes.status === 'fulfilled' ? latestRes.value.artists : []),
  ];

  const seenArtistNames = new Set<string>();
  const mergedArtists: ApiArtist[] = [];
  for (const a of [...extraArtists, ...global.topArtists]) {
    const key = a.name.toLowerCase().trim();
    const pic = a.pictureBig || a.pictureMedium || a.picture;
    if (!seenArtistNames.has(key) && pic) {
      seenArtistNames.add(key);
      mergedArtists.push(a);
    }
  }

  // Build a vibrant 6-tile quick access mix:
  // [Pakistan #1, Bollywood #1, Punjabi #1, Global #1, Pakistan #2, Bollywood #2]
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
    quickAccessTracks: quickAccess.length >= 4 ? quickAccess : global.topTracks.slice(0, 6),
    topArtists: mergedArtists.slice(0, 15),
    topAlbums: global.topAlbums,
  };

  cachedMultiFeed = result;
  lastMultiFeedFetch = now;
  return result;
}
