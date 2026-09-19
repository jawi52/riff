import type { Track, AudioSourceType } from '../types/index';
import { DisjointSet } from './disjointSet';
import { similarityRatio } from './fuzzySearch';

export { DisjointSet } from './disjointSet';

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
    .replace(/\(.*?(video|audio|lyrics?|remaster(ed)?|hq|hd|live|feat|ft\.|visualizer|radio edit).*?\)/gi, '')
    .replace(/\[.*?(video|audio|lyrics?|remaster(ed)?|hq|hd|live|feat|ft\.|visualizer|radio edit).*?\]/gi, '')
    // Remove trailing "- 4k remaster", "- live", "- radio edit", etc.
    .replace(/[\-\s]+(4k|hd|official)?\s*remaster(ed)?(\s*\d{4})?/gi, '')
    .replace(/[\-\s]+(live|radio edit|original mix|visualizer)/gi, '')
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
 * Computes a quality score for a track to choose the best representative
 * in a clustered equivalence set.
 */
function getTrackQualityScore(t: Track): number {
  let score = 0;
  // Local offline track has highest priority (immediate offline playability)
  if (t.sourceType === 'local' || (t as any).audioBlob) score += 100;
  // Synced lyrics presence
  if (t.hasSyncedLyrics || (t.syncedLyrics && t.syncedLyrics.length > 0)) score += 50;
  // Cover art presence
  if (t.coverUrl && !t.coverUrl.includes('favicon') && !t.coverUrl.includes('default')) score += 25;
  // High quality / valid stream URL
  if (t.streamUrl) score += 20;
  // Album metadata
  if (t.album) score += 10;
  // Non-zero duration
  if (t.duration && t.duration > 0) score += 5;
  return score;
}

/**
 * Clusters an array of tracks from multiple providers into deduplicated canonical tracks
 * using Disjoint-Set Union (Union-Find) with Path Compression and Union by Rank.
 *
 * Multi-criterion transitive equivalence:
 * 1. Exact Canonical Hash (Normalized Title + Artist + 3s Duration Bucket)
 * 2. ISRC / Shared External Identification
 * 3. Fuzzy Levenshtein Similarity (Normalized Title >= 88% similarity, same Artist, <= 4s duration difference)
 */
export function deduplicateTracks(tracks: Track[]): Track[] {
  if (!tracks || tracks.length === 0) {
    return [];
  }
  if (tracks.length === 1) {
    const single = { ...tracks[0] };
    single.availableSources = single.availableSources || [single.sourceType];
    return [single];
  }

  const n = tracks.length;
  const dsu = new DisjointSet<number>();

  for (let i = 0; i < n; i++) {
    dsu.makeSet(i);
  }

  // Pass 1: Canonical Track ID Bucket Index
  const canonicalMap = new Map<string, number>();
  for (let i = 0; i < n; i++) {
    const track = tracks[i];
    const canId = generateCanonicalTrackId(track.artist, track.title, track.duration);
    if (canonicalMap.has(canId)) {
      dsu.union(canonicalMap.get(canId)!, i);
    } else {
      canonicalMap.set(canId, i);
    }
  }

  // Pass 2: ISRC / External ID Matching (if provided)
  const isrcMap = new Map<string, number>();
  for (let i = 0; i < n; i++) {
    const isrc = (tracks[i] as any).isrc;
    if (isrc && typeof isrc === 'string' && isrc.trim()) {
      const cleanIsrc = isrc.trim().toUpperCase();
      if (isrcMap.has(cleanIsrc)) {
        dsu.union(isrcMap.get(cleanIsrc)!, i);
      } else {
        isrcMap.set(cleanIsrc, i);
      }
    }
  }

  // Pass 3: Normalized Artist Grouping & Fuzzy Levenshtein Similarity
  const artistGroups = new Map<string, number[]>();
  for (let i = 0; i < n; i++) {
    const normArtist = normalizeString(tracks[i].artist);
    if (!normArtist) continue;

    let group = artistGroups.get(normArtist);
    if (!group) {
      group = [];
      artistGroups.set(normArtist, group);
    }
    group.push(i);
  }

  for (const group of artistGroups.values()) {
    if (group.length <= 1) continue;

    for (let a = 0; a < group.length; a++) {
      const idxA = group[a];
      const trackA = tracks[idxA];
      const normTitleA = normalizeString(trackA.title, trackA.artist);

      for (let b = a + 1; b < group.length; b++) {
        const idxB = group[b];
        // Skip if already in the same connected component
        if (dsu.connected(idxA, idxB)) continue;

        const trackB = tracks[idxB];
        const durA = trackA.duration || 0;
        const durB = trackB.duration || 0;

        // Duration guard: must be within 4 seconds (or duration missing on one track)
        const durationMatch = durA === 0 || durB === 0 || Math.abs(durA - durB) <= 4;
        if (!durationMatch) continue;

        const normTitleB = normalizeString(trackB.title, trackB.artist);

        // Exact normalized title match
        if (normTitleA === normTitleB) {
          dsu.union(idxA, idxB);
          continue;
        }

        // Substring / prefix containment match (e.g. "Blinding Lights" vs "Blinding Lights Remaster")
        if (
          normTitleA.length >= 5 &&
          normTitleB.length >= 5 &&
          (normTitleA.includes(normTitleB) || normTitleB.includes(normTitleA))
        ) {
          dsu.union(idxA, idxB);
          continue;
        }

        // Fuzzy Levenshtein ratio match
        const ratio = similarityRatio(normTitleA, normTitleB);
        if (ratio >= 0.85) {
          dsu.union(idxA, idxB);
        }
      }
    }
  }

  // Consolidate clusters into canonical track representations
  const clusters = dsu.getClusters();
  const result: Track[] = [];

  for (const memberIndices of clusters.values()) {
    if (memberIndices.length === 1) {
      const single = { ...tracks[memberIndices[0]] };
      single.availableSources = single.availableSources || [single.sourceType];
      result.push(single);
      continue;
    }

    // Sort member tracks by quality score descending
    const memberTracks = memberIndices.map((idx) => tracks[idx]);
    memberTracks.sort((a, b) => getTrackQualityScore(b) - getTrackQualityScore(a));

    const primary = { ...memberTracks[0] };

    // Aggregate sources across all tracks in the connected component
    const sources = new Set<AudioSourceType>(primary.availableSources || [primary.sourceType]);
    for (const track of memberTracks) {
      sources.add(track.sourceType);
      if (track.availableSources) {
        track.availableSources.forEach((s) => sources.add(s));
      }
    }
    primary.availableSources = Array.from(sources);

    // Merge high quality assets from other tracks in the component
    for (const track of memberTracks) {
      // Inherit synced lyrics if primary lacks them
      if (!primary.hasSyncedLyrics && track.hasSyncedLyrics) {
        primary.hasSyncedLyrics = true;
        primary.syncedLyrics = track.syncedLyrics;
        primary.plainLyrics = track.plainLyrics || primary.plainLyrics;
      }
      // Inherit cover art if primary lacks or has fallback
      if ((!primary.coverUrl || primary.coverUrl.includes('favicon')) && track.coverUrl) {
        primary.coverUrl = track.coverUrl;
      }
      // Inherit streamUrl if primary lacks it
      if (!primary.streamUrl && track.streamUrl) {
        primary.streamUrl = track.streamUrl;
      }
      // Inherit audioBlob if local track present
      if (!(primary as any).audioBlob && (track as any).audioBlob) {
        (primary as any).audioBlob = (track as any).audioBlob;
      }
      // Inherit album if missing
      if (!primary.album && track.album) {
        primary.album = track.album;
      }
    }

    result.push(primary);
  }

  return result;
}
