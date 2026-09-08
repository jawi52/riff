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
export async function searchCatalog(query: string, limit = 20): Promise<SearchResponse> {
  const clean = query.trim();
  if (!clean) {
    return { tracks: [], artists: [], albums: [], total: 0 };
  }

  const res = await fetch(`${RIFF_ENGINE_URL}/api/v1/search?q=${encodeURIComponent(clean)}&limit=${limit}`, {
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
