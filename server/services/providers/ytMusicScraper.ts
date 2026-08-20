import axios from 'axios';
import { Track } from '../../../src/types';

const searchCache = new Map<string, { data: Track[]; expiresAt: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://api.piped.privacy.com.de',
  'https://piped-api.garudalinux.org',
  'https://invidious.nerdvpn.de',
  'https://inv.tux.pizza'
];

/**
 * Strips junk and extracts clean song title & artist from YouTube video title
 */
function cleanYTTitle(rawTitle: string): { title: string; artist: string } {
  let title = rawTitle
    .replace(/\(.*?\)|\[.*?\]/g, '')
    .replace(/official\s*(music\s*)?(video|audio|lyrics?|performance|hd|4k|remix|version|lofi|edit|mix|live|stage)/gi, '')
    .replace(/ft\.?|feat\.?.*$/gi, '')
    .trim();

  let artist = 'YouTube Music';

  if (title.includes(' - ')) {
    const parts = title.split(' - ');
    artist = parts[0].trim();
    title = parts.slice(1).join(' - ').trim();
  }

  return {
    title: title || rawTitle,
    artist: artist || 'YouTube Music'
  };
}

/**
 * High-Speed YouTube Music Metadata Search
 */
export async function searchYTMusicFast(query: string): Promise<Track[]> {
  const cacheKey = query.toLowerCase().trim();
  const cached = searchCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  // 1. Race multiple fast public Piped/Invidious mirror endpoints for fastest response (< 250ms)
  const fetchPromises = PIPED_INSTANCES.map(async (baseUrl) => {
    const res = await axios.get(`${baseUrl}/search`, {
      params: { q: `${query} official audio`, filter: 'music_songs' },
      timeout: 3000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const items = res.data?.items || res.data || [];
    if (!Array.isArray(items) || items.length === 0) throw new Error('Empty');
    return items;
  });

  let rawItems: any[] = [];
  try {
    rawItems = await Promise.any(fetchPromises);
  } catch {
    // Fallback to direct Invidious standard search
    try {
      const fallbackRes = await axios.get('https://invidious.nerdvpn.de/api/v1/search', {
        params: { q: `${query} audio`, type: 'video' },
        timeout: 3500
      });
      rawItems = fallbackRes.data || [];
    } catch {
      rawItems = [];
    }
  }

  const tracks: Track[] = rawItems.slice(0, 10).map((item: any) => {
    const videoId = item.url ? item.url.replace('/watch?v=', '') : item.videoId;
    const { title, artist } = cleanYTTitle(item.title || query);

    return {
      id: `yt_${videoId}`,
      title,
      artist: item.uploaderName || item.author || artist,
      album: 'YouTube Release',
      duration: item.duration || item.lengthSeconds || 210,
      coverUrl: item.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      streamUrl: '',
      sourceType: 'ytdlp',
      genre: 'Pop / Universal',
      hasSyncedLyrics: true,
      bitrateKbps: 160,
      playCount: item.views || 1000000
    };
  });

  if (tracks.length > 0) {
    searchCache.set(cacheKey, { data: tracks, expiresAt: Date.now() + CACHE_TTL });
  }

  return tracks;
}
