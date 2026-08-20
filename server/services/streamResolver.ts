import { extractStreamViaYtDlp } from './providers/ytdlp';
import { searchSaavn } from './providers/saavn';
import { searchAudius } from './providers/audius';
import { searchJamendo } from './providers/jamendo';

interface StreamCacheEntry {
  streamUrl: string;
  provider: string;
  expiresAt: number;
}

const streamCache = new Map<string, StreamCacheEntry>();
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 Hours

export async function resolveStream(params: {
  trackId?: string;
  title: string;
  artist: string;
  rawUrl?: string;
  qualityTier?: string;
}) {
  const { title, artist, rawUrl } = params;
  const cacheKey = `${artist}_${title}`.toLowerCase();

  // 1. Check in-memory stream URL cache
  const cached = streamCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return {
      streamUrl: cached.streamUrl,
      provider: cached.provider,
      cached: true
    };
  }

  // 2. If rawUrl exists (e.g. YouTube / SoundCloud URL), extract directly
  if (rawUrl) {
    try {
      const directUrl = await extractStreamViaYtDlp(rawUrl);
      if (directUrl) {
        streamCache.set(cacheKey, { streamUrl: directUrl, provider: 'ytdlp', expiresAt: Date.now() + CACHE_TTL_MS });
        return { streamUrl: directUrl, provider: 'ytdlp', cached: false };
      }
    } catch {}
  }

  const query = `${title} ${artist}`;

  // 3. Primary: Universal extraction via yt-dlp (covers 100% of songs)
  try {
    const ytdlpUrl = await extractStreamViaYtDlp(query);
    if (ytdlpUrl) {
      streamCache.set(cacheKey, { streamUrl: ytdlpUrl, provider: 'ytdlp', expiresAt: Date.now() + CACHE_TTL_MS });
      return { streamUrl: ytdlpUrl, provider: 'ytdlp', cached: false };
    }
  } catch {}

  // 4. Secondary: JioSaavn direct CDN
  try {
    const saavnResults = await searchSaavn(query);
    if (saavnResults.length > 0 && saavnResults[0].streamUrl) {
      const url = saavnResults[0].streamUrl;
      streamCache.set(cacheKey, { streamUrl: url, provider: 'saavn', expiresAt: Date.now() + CACHE_TTL_MS });
      return { streamUrl: url, provider: 'saavn', cached: false };
    }
  } catch {}

  // 5. Tertiary: Audius & Jamendo
  try {
    const audiusResults = await searchAudius(query);
    if (audiusResults.length > 0 && audiusResults[0].streamUrl) {
      const url = audiusResults[0].streamUrl;
      streamCache.set(cacheKey, { streamUrl: url, provider: 'audius', expiresAt: Date.now() + CACHE_TTL_MS });
      return { streamUrl: url, provider: 'audius', cached: false };
    }
  } catch {}

  try {
    const jamendoResults = await searchJamendo(query);
    if (jamendoResults.length > 0 && jamendoResults[0].streamUrl) {
      const url = jamendoResults[0].streamUrl;
      streamCache.set(cacheKey, { streamUrl: url, provider: 'jamendo', expiresAt: Date.now() + CACHE_TTL_MS });
      return { streamUrl: url, provider: 'jamendo', cached: false };
    }
  } catch {}

  throw new Error('All streaming tiers failed to resolve audio stream');
}
