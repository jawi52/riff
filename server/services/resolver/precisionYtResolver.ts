import { exec } from 'child_process';
import util from 'util';
import { getInnertubeAudioStream, searchInnertubeMusic } from '../providers/innertube';
import { searchSaavn } from '../providers/saavn';

const execPromise = util.promisify(exec);

export const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';

interface StreamCacheEntry {
  streamUrl: string;
  provider: string;
  expiresAt: number;
}

// In-Memory High-Speed Stream Cache (TTL: 12 Hours)
const streamCache = new Map<string, StreamCacheEntry>();
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;

// In-flight deduplication map
const pendingResolutions = new Map<string, Promise<{ streamUrl: string; provider: string; cached: boolean }>>();

export function getCanonicalCacheKey(artist: string, title: string): string {
  const normArtist = (artist || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();
  const normTitle = (title || '')
    .toLowerCase()
    .replace(/\(.*?\)|\[.*?\]/g, '')
    .replace(/official\s*(music\s*)?(video|audio|lyrics?|performance|hd|4k)/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
  return `${normArtist}___${normTitle}`;
}

/**
 * Ultra-Fast Multi-Tier Pure-HTTP Stream Resolver (Works on Vercel Serverless + Local Servers)
 */
export async function resolvePrecisionStream(params: {
  title: string;
  artist: string;
  duration?: number;
  rawUrl?: string;
  trackId?: string;
}): Promise<{ streamUrl: string; provider: string; cached: boolean }> {
  const { title, artist, rawUrl, trackId } = params;
  const canonicalKey = getCanonicalCacheKey(artist, title);
  const rawKey = `${artist}_${title}`.toLowerCase().replace(/[^a-z0-9]/g, '');

  // 1. Instant Memory Cache Hit (< 1ms)
  const cached = streamCache.get(canonicalKey) || streamCache.get(rawKey);
  if (cached && cached.expiresAt > Date.now()) {
    return { streamUrl: cached.streamUrl, provider: cached.provider, cached: true };
  }

  // 2. Attach to ongoing in-flight resolution if currently running
  if (pendingResolutions.has(canonicalKey)) {
    return pendingResolutions.get(canonicalKey)!;
  }

  const cleanTitle = (title || '').replace(/["'\\]/g, ' ').trim();
  const cleanArtist = (artist || '').replace(/["'\\]/g, ' ').trim();

  const resolutionPromise = (async () => {
    // 3. Direct CDN stream if already provided (0ms)
    if (rawUrl && (rawUrl.includes('saavncdn.com') || rawUrl.includes('audius.co') || rawUrl.includes('jamendo.com'))) {
      const entry = { streamUrl: rawUrl, provider: 'direct-cdn', expiresAt: Date.now() + CACHE_TTL_MS };
      streamCache.set(canonicalKey, entry);
      return { streamUrl: rawUrl, provider: 'direct-cdn', cached: false };
    }

    // 4. Tier A: High-Speed Saavn 320kbps CDN Search (~120ms)
    try {
      const saavnResults = await searchSaavn(`${cleanArtist} ${cleanTitle}`);
      if (saavnResults.length > 0 && saavnResults[0].streamUrl) {
        const entry = { streamUrl: saavnResults[0].streamUrl, provider: 'saavn-320k', expiresAt: Date.now() + CACHE_TTL_MS };
        streamCache.set(canonicalKey, entry);
        streamCache.set(rawKey, entry);
        return { streamUrl: saavnResults[0].streamUrl, provider: 'saavn-320k', cached: false };
      }
    } catch {}

    // 5. Tier B: YouTube Music Innertube Android Client (Pure HTTP: ~180ms)
    let videoId: string | null = null;
    if (trackId && trackId.startsWith('yt_')) {
      videoId = trackId.replace('yt_', '');
    } else if (rawUrl && rawUrl.includes('watch?v=')) {
      videoId = rawUrl.split('watch?v=')[1]?.split('&')[0];
    } else if (rawUrl && rawUrl.includes('youtu.be/')) {
      videoId = rawUrl.split('youtu.be/')[1]?.split('?')[0];
    }

    // If no videoId provided, quickly search Innertube via HTTP POST
    if (!videoId) {
      try {
        const ytResults = await searchInnertubeMusic(`${cleanArtist} ${cleanTitle}`);
        if (ytResults.length > 0 && ytResults[0].id) {
          videoId = ytResults[0].id.replace('yt_', '');
        }
      } catch {}
    }

    if (videoId) {
      const innertubeStream = await getInnertubeAudioStream(videoId);
      if (innertubeStream) {
        const entry = { streamUrl: innertubeStream, provider: 'innertube-android', expiresAt: Date.now() + CACHE_TTL_MS };
        streamCache.set(canonicalKey, entry);
        streamCache.set(rawKey, entry);
        return { streamUrl: innertubeStream, provider: 'innertube-android', cached: false };
      }
    }

    // 6. Tier C: yt-dlp Direct Stream Extraction (for local server environments)
    try {
      const fastSearchTarget = `ytsearch1:${cleanArtist} ${cleanTitle} audio`;
      const { stdout: streamOut } = await execPromise(
        `yt-dlp -g -f 140/ba/b --no-playlist --no-warnings --socket-timeout 8 "${fastSearchTarget}"`,
        { timeout: 12000 }
      );

      const directAudioUrl = streamOut.trim().split('\n')[0];
      if (directAudioUrl && directAudioUrl.startsWith('http')) {
        const entry = { streamUrl: directAudioUrl, provider: 'ytdlp', expiresAt: Date.now() + CACHE_TTL_MS };
        streamCache.set(canonicalKey, entry);
        streamCache.set(rawKey, entry);
        return { streamUrl: directAudioUrl, provider: 'ytdlp', cached: false };
      }
    } catch {}

    // 7. Tier D: High-Fidelity Radio Stream Fallback
    const fallbackStream = 'https://stream.zeno.fm/f3wvbbqmdg8uv';
    return { streamUrl: fallbackStream, provider: 'radio-fallback', cached: false };
  })();

  pendingResolutions.set(canonicalKey, resolutionPromise);

  try {
    const result = await resolutionPromise;
    return result;
  } finally {
    pendingResolutions.delete(canonicalKey);
  }
}

/**
 * Background Pre-warms streams for upcoming queue tracks
 */
export async function prewarmStreams(tracks: Array<{ title: string; artist: string; id?: string; streamUrl?: string }>) {
  for (const track of tracks.slice(0, 3)) {
    const key = getCanonicalCacheKey(track.artist, track.title);
    if (!streamCache.has(key) && !pendingResolutions.has(key)) {
      resolvePrecisionStream({
        title: track.title,
        artist: track.artist,
        trackId: track.id,
        rawUrl: track.streamUrl
      }).catch(() => {});
    }
  }
}
