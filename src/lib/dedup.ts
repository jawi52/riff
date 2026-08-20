import type { Track } from '../types/index';

/**
 * Normalizes a song title or artist name by stripping common junk metadata
 * e.g., "(Official Music Video)", "[4K Remaster]", "(feat. Artist)", "[Lyrics]", "- 4K Remaster"
 */
export function normalizeString(str: string, artistContext?: string): string {
  if (!str) return '';
  let cleaned = str.toLowerCase();

  // If artist is prefixed in title (e.g. "The Weeknd - Blinding Lights"), remove it
  if (artistContext) {
    const normArt = artistContext.toLowerCase().trim();
    if (cleaned.startsWith(normArt)) {
      cleaned = cleaned.substring(normArt.length).replace(/^[\s\-:]+/, '');
    }
  }

  return cleaned
    // Remove content in brackets/parentheses like (Official Video), [HQ Audio], etc.
    .replace(/\(.*?(video|audio|lyrics?|remaster(ed)?|hq|hd|live|feat|ft\.).*?\)/gi, '')
    .replace(/\[.*?(video|audio|lyrics?|remaster(ed)?|hq|hd|live|feat|ft\.).*?\]/gi, '')
    // Remove trailing "- 4k remaster", "- live", "- radio edit", etc.
    .replace(/[\-\s]+(4k|hd|official)?\s*remaster(ed)?(\s*\d{4})?/gi, '')
    .replace(/[\-\s]+(live|radio edit|original mix)/gi, '')
    // Remove "feat." or "ft." strings
    .replace(/\b(feat|ft)\.?\s+.*$/gi, '')
    // Remove special characters, dashes, and extra spaces
    .replace(/[^a-z0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generates a deterministic canonical hash for song deduplication.
 * Uses a duration bucket (tolerance ±3 seconds) so slight duration differences across APIs cluster together.
 */
export function generateCanonicalTrackId(artist: string, title: string, durationSec: number): string {
  const normArtist = normalizeString(artist);
  const normTitle = normalizeString(title, artist);
  // 3-second tolerance bucket: Math.round(duration / 3)
  const durationBucket = Math.round((durationSec || 0) / 3);

  const rawKey = `${normArtist}_${normTitle}_${durationBucket}`;
  
  // Fast FNV-1a hash generator for deterministic cross-platform clustering
  let hash = 0x811c9dc5;
  for (let i = 0; i < rawKey.length; i++) {
    hash ^= rawKey.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return 'trk_' + (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Clusters an array of tracks from multiple providers into deduplicated canonical tracks.
 */
export function deduplicateTracks(tracks: Track[]): Track[] {
  const map = new Map<string, Track>();

  for (const track of tracks) {
    const canonicalId = generateCanonicalTrackId(track.artist, track.title, track.duration);
    
    if (map.has(canonicalId)) {
      const existing = map.get(canonicalId)!;
      // Merge available sources
      const sources = new Set(existing.availableSources || [existing.sourceType]);
      sources.add(track.sourceType);
      if (track.availableSources) {
        track.availableSources.forEach(s => sources.add(s));
      }
      existing.availableSources = Array.from(sources);
      
      // Preserve higher quality artwork or lyrics if the existing one lacks it
      if ((!existing.hasSyncedLyrics && track.hasSyncedLyrics) || (!existing.coverUrl && track.coverUrl)) {
        if (track.coverUrl) existing.coverUrl = track.coverUrl;
        if (track.hasSyncedLyrics) existing.hasSyncedLyrics = true;
      }
      // Preserve rawUrl / streamUrl
      if (!existing.streamUrl && track.streamUrl) existing.streamUrl = track.streamUrl;
    } else {
      track.id = canonicalId;
      track.availableSources = track.availableSources || [track.sourceType];
      map.set(canonicalId, { ...track });
    }
  }

  return Array.from(map.values());
}
