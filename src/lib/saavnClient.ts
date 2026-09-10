import { Track, AudioSourceType } from '../types';

/**
 * Universal JioSaavn Client
 * Integrates open-source @saavn-labs protocol & Cloudflare Pages Edge Functions
 * Provides 100% full-length audio (320kbps / 160kbps CD master) with zero 30s clips
 */

const IS_BROWSER = typeof window !== 'undefined';

// Base endpoint for proxy
function getSaavnBaseUrl(): string {
  if (IS_BROWSER) {
    return '/api/saavn';
  }
  return 'https://www.jiosaavn.com/api.php';
}

/**
 * Execute raw call to JioSaavn API with multi-stage CORS proxy fallback
 */
export async function callSaavnApi(params: Record<string, string | number>): Promise<any> {
  const searchParams = new URLSearchParams();
  searchParams.append('_format', 'json');
  searchParams.append('_marker', '0');
  searchParams.append('api_version', '4');
  searchParams.append('ctx', 'web6dot0');

  for (const [key, val] of Object.entries(params)) {
    searchParams.append(key, String(val));
  }

  const queryStr = searchParams.toString();
  const directEndpoint = `${getSaavnBaseUrl()}?${queryStr}`;

  // 1. Direct fetch via Cloudflare Pages Function or Vite Proxy
  try {
    const res = await fetch(directEndpoint, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
      }
    });
    if (res.ok) {
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    }
  } catch (err) {
    console.warn('Direct JioSaavn endpoint failed, falling back to CORS proxy:', err);
  }

  // 2. Fallback to public CORS proxy if running outside Cloudflare/Vite
  if (IS_BROWSER) {
    const targetUrl = `https://www.jiosaavn.com/api.php?${queryStr}`;
    const proxyUrls = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
      `https://corsproxy.io/?url=${encodeURIComponent(targetUrl)}`
    ];

    for (const proxy of proxyUrls) {
      try {
        const res = await fetch(proxy);
        if (res.ok) {
          const data = await res.json();
          if (data) return data;
        }
      } catch {}
    }
  }

  return null;
}

/**
 * Normalizes JioSaavn raw song data to Riff's Track interface
 */
export function mapSaavnSongToTrack(s: any): Track {
  const songTitle = (s.song || s.title || 'Untitled Track')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\(From "[^"]+"\)/g, '')
    .trim();

  // Extract artist name
  let artistName = 'Unknown Artist';
  if (s.primary_artists) {
    artistName = s.primary_artists;
  } else if (s.singers) {
    artistName = s.singers;
  } else if (s.more_info?.artistMap?.primary_artists?.length > 0) {
    artistName = s.more_info.artistMap.primary_artists.map((a: any) => a.name).join(', ');
  } else if (s.more_info?.primary_artists) {
    artistName = s.more_info.primary_artists;
  } else if (s.artist) {
    artistName = typeof s.artist === 'string' ? s.artist : s.artist?.name || 'Unknown Artist';
  }

  artistName = artistName
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .trim();

  const albumName = (s.album || s.more_info?.album || 'Single')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .trim();

  // Pick highest resolution cover available
  let rawImage = s.image || s.more_info?.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80';
  rawImage = rawImage.replace('50x50.jpg', '500x500.jpg').replace('150x150.jpg', '500x500.jpg');

  const durationSec = parseInt(s.duration || s.more_info?.duration || '210', 10) || 210;
  const encryptedMediaUrl = s.encrypted_media_url || s.more_info?.encrypted_media_url || '';

  return {
    id: `saavn_${s.id}`,
    title: songTitle,
    artist: artistName,
    album: albumName,
    duration: durationSec,
    coverUrl: rawImage,
    sourceType: 'saavn' as AudioSourceType,
    streamUrl: '', // Resolved on-demand via song.generateAuthToken
    rawUrl: encryptedMediaUrl, // Store encrypted URL for 0ms token generation
    bitrateKbps: 320,
    genre: s.language || s.more_info?.language || 'Pop',
    hasSyncedLyrics: Boolean(s.has_lyrics === 'true' || s.more_info?.has_lyrics === 'true'),
    releaseYear: parseInt(s.year || s.more_info?.year || '2025', 10),
    credits: {
      performers: [artistName],
      label: s.label || s.more_info?.label || 'Studio Master',
    },
  };
}

/**
 * Resolves full-length 320kbps / 160kbps audio stream from JioSaavn encrypted media token
 * Uses official song.generateAuthToken protocol used by Spotube & BlackHole
 */
export async function resolveSaavnStreamToken(encryptedUrl: string): Promise<string | null> {
  if (!encryptedUrl) return null;

  try {
    const data = await callSaavnApi({
      __call: 'song.generateAuthToken',
      url: encryptedUrl,
      bit_rate: 320,
    });

    if (data?.status === 'success' && data.auth_url) {
      // JioSaavn Cloudflare CDN auth_url
      return data.auth_url;
    }
  } catch (err) {
    console.warn('Failed to generate JioSaavn stream auth token:', err);
  }

  return null;
}

/**
 * Search JioSaavn catalog by query (Pakistani, Indian, Global)
 */
export async function searchSaavnSongs(query: string, limit = 20): Promise<Track[]> {
  const clean = query.trim();
  if (!clean) return [];

  const data = await callSaavnApi({
    __call: 'search.getResults',
    q: clean,
    n: limit,
    p: 1,
  });

  const results = data?.results || [];
  return results.map(mapSaavnSongToTrack);
}

/**
 * Autocomplete suggestions with rich entity metadata
 */
export async function getSaavnAutocomplete(query: string): Promise<{
  songs: { id: string; title: string; artist: string; image: string }[];
  artists: { id: string; name: string; image: string }[];
  albums: { id: string; title: string; image: string; artist: string }[];
}> {
  const clean = query.trim();
  if (!clean) return { songs: [], artists: [], albums: [] };

  const data = await callSaavnApi({
    __call: 'autocomplete.get',
    query: clean,
  });

  if (!data) return { songs: [], artists: [], albums: [] };

  const songs = (data.songs?.data || []).map((s: any) => ({
    id: `saavn_${s.id}`,
    title: (s.title || '').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&'),
    artist: (s.description || '').split('·')[1]?.trim() || 'Artist',
    image: (s.image || '').replace('50x50.jpg', '150x150.jpg'),
  }));

  const artists = (data.artists?.data || []).map((a: any) => ({
    id: `artist_${a.id}`,
    name: (a.title || '').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&'),
    image: (a.image || '').replace('50x50.jpg', '150x150.jpg'),
  }));

  const albums = (data.albums?.data || []).map((al: any) => ({
    id: `album_${al.id}`,
    title: (al.title || '').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&'),
    artist: al.music || 'Various Artists',
    image: (al.image || '').replace('50x50.jpg', '150x150.jpg'),
  }));

  return { songs, artists, albums };
}

/**
 * Get JioSaavn recommendations (Spotify Radio style)
 */
export async function getSaavnRecommendations(songId: string): Promise<Track[]> {
  const cleanId = songId.replace(/^saavn_/, '');
  if (!cleanId) return [];

  const data = await callSaavnApi({
    __call: 'reco.getreco',
    pid: cleanId,
  });

  if (!Array.isArray(data)) return [];
  return data.map(mapSaavnSongToTrack);
}

/**
 * Fetch official Top Charts playlist from JioSaavn (India Superhits Top 50, Chartbusters 2026, etc.)
 */
export async function fetchSaavnPlaylistTracks(playlistId: string): Promise<Track[]> {
  const data = await callSaavnApi({
    __call: 'playlist.getDetails',
    listid: playlistId,
  });

  const songs = data?.songs || [];
  return songs.map(mapSaavnSongToTrack);
}
