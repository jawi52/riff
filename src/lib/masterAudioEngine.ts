/**
 * RIFF AUDIO ENGINE (Ponytail Architecture)
 * Ultra-Lean 320kbps Studio Master Stream Resolver & Synced Lyrics Service
 */

import { Track, SyncedLyricLine } from '../types';
import { RIFF_ENGINE_URL } from './engineUrl';

// In-Memory Single-Flight LRU Cache for 0ms Instant Replay
const streamCache = new Map<string, { url: string; timestamp: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Checks whether an audio URL is a 30-second preview
 */
export function isPreviewUrl(url?: string): boolean {
  if (!url) return false;
  return (
    url.includes('AudioPreview') ||
    url.includes('.p.m4a') ||
    url.includes('preview.saavncdn.com') ||
    url.includes('audio-ssl.itunes.apple.com') ||
    url.includes('preview')
  );
}

/**
 * Resolves full-length 320kbps studio stream for any track.
 * Bypasses 30-second clips by querying direct CDN edge endpoints.
 */
export async function resolveMasterStream(track: Track): Promise<string> {
  // 1. If track already has a valid full-length direct CDN URL, return immediately
  if (track.streamUrl && !isPreviewUrl(track.streamUrl) && (track.streamUrl.startsWith('http://') || track.streamUrl.startsWith('https://'))) {
    return track.streamUrl;
  }

  // 2. Check in-memory stream cache
  if (streamCache.has(track.id)) {
    const cached = streamCache.get(track.id)!;
    if (Date.now() - cached.timestamp < CACHE_TTL_MS && !isPreviewUrl(cached.url)) {
      return cached.url;
    }
  }

  const cleanId = String(track.id).replace(/^saavn_|^itunes_/, '');

  // 3. Query Azure backend direct stream-url endpoint
  if (cleanId && !cleanId.startsWith('381')) {
    try {
      const res = await fetch(`${RIFF_ENGINE_URL}/api/v1/stream-url/${cleanId}`);
      if (res.ok) {
        const d = await res.json();
        if (d.audioUrl && !isPreviewUrl(d.audioUrl)) {
          streamCache.set(track.id, { url: d.audioUrl, timestamp: Date.now() });
          return d.audioUrl;
        }
      }
    } catch (err) {
      console.warn('Backend stream-url lookup error:', err);
    }
  }

  // 4. Fallback search resolution: Match title + artist on backend to get full 320kbps stream
  try {
    const query = `${track.title} ${track.artist}`.trim();
    const sRes = await fetch(`${RIFF_ENGINE_URL}/api/v1/search?q=${encodeURIComponent(query)}&limit=1`);
    if (sRes.ok) {
      const sData = await sRes.json();
      const first = sData.tracks?.[0];
      if (first?.id) {
        const uRes = await fetch(`${RIFF_ENGINE_URL}/api/v1/stream-url/${first.id}`);
        if (uRes.ok) {
          const uData = await uRes.json();
          if (uData.audioUrl && !isPreviewUrl(uData.audioUrl)) {
            streamCache.set(track.id, { url: uData.audioUrl, timestamp: Date.now() });
            return uData.audioUrl;
          }
        }
      }
    }
  } catch (err) {
    console.warn('Stream search fallback error:', err);
  }

  // 5. Direct backend streaming proxy fallback
  if (cleanId) {
    const streamProxy = `${RIFF_ENGINE_URL}/api/v1/stream/${cleanId}`;
    streamCache.set(track.id, { url: streamProxy, timestamp: Date.now() });
    return streamProxy;
  }

  return '';
}

/**
 * Fetches Real-Time Synced (.lrc) Lyrics
 * 1. Checks live Azure backend /api/v1/lyrics/:id
 * 2. Fallback to LRCLIB API
 */
export async function fetchSyncedLyrics(artist: string, title: string, trackId?: string): Promise<{ synced: SyncedLyricLine[]; plain?: string }> {
  // 1. Check Azure backend lyrics API
  if (trackId) {
    try {
      const cleanId = trackId.replace(/^saavn_|^itunes_/, '');
      const res = await fetch(`${RIFF_ENGINE_URL}/api/v1/lyrics/${cleanId}`, {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.syncedLyrics && Array.isArray(data.syncedLyrics) && data.syncedLyrics.length > 0) {
          const formatted: SyncedLyricLine[] = data.syncedLyrics
            .filter((l: any) => l.text && l.text.trim())
            .map((l: any) => ({
              timeMs: Number(l.timeMs) || 0,
              text: String(l.text).trim(),
            }));

          if (formatted.length > 0) {
            return { synced: formatted, plain: data.plainLyrics };
          }
        }
      }
    } catch (err) {
      console.warn('Azure lyrics fetch warning:', err);
    }
  }

  // 2. Fallback to LRCLIB
  try {
    const cleanTitle = title.replace(/\s*\(.*?\)\s*/g, ' ').trim();
    const cleanArtist = artist.split(/,|&|feat\./i)[0].trim();

    const res = await fetch(
      `https://lrclib.net/api/get?artist_name=${encodeURIComponent(cleanArtist)}&track_name=${encodeURIComponent(cleanTitle)}`
    );
    if (!res.ok) return { synced: [] };

    const data = await res.json();
    const rawLrc = data.syncedLyrics || '';
    const plainLyrics = data.plainLyrics || '';

    if (!rawLrc) {
      return { synced: [], plain: plainLyrics };
    }

    const lines: SyncedLyricLine[] = [];
    const lrcRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;

    for (const line of rawLrc.split('\n')) {
      const match = line.match(lrcRegex);
      if (match) {
        const mins = parseInt(match[1], 10);
        const secs = parseInt(match[2], 10);
        const ms = parseInt(match[3].padEnd(3, '0'), 10);
        const timeMs = mins * 60 * 1000 + secs * 1000 + ms;
        const text = match[4].trim();
        if (text) lines.push({ timeMs, text });
      }
    }
    return { synced: lines, plain: plainLyrics };
  } catch {
    return { synced: [] };
  }
}
