import { Track } from '../types';
import { ApiArtist } from './api';
import { normalizeString } from './dedup';
import { similarityRatio } from './fuzzySearch';

/**
 * Phonetic & Multi-Tier Search Ranking Engine
 *
 * Implements Russell Soundex phonetic hashing combined with a multi-tier relevance scoring function:
 * Tier 1: Exact Match (100 pts)
 * Tier 2: Prefix Match (70 pts)
 * Tier 3: Token Substring Match (45 pts)
 * Tier 4: Soundex Phonetic Match (30 pts)
 * Tier 5: Levenshtein Fuzzy Similarity (0 - 25 pts)
 * Tier 6: User Affinity & Quality Boost (0 - 20 pts)
 */

/**
 * Converts an English or romanized word into its 4-character American Soundex code.
 * Soundex preserves the initial letter and maps subsequent consonants:
 * 1: B, F, P, V
 * 2: C, G, J, K, Q, S, X, Z
 * 3: D, T
 * 4: L
 * 5: M, N
 * 6: R
 * Drops: A, E, I, O, U, Y, H, W
 */
export function soundex(word: string): string {
  if (!word) return '';

  const clean = word.toUpperCase().replace(/[^A-Z]/g, '');
  if (clean.length === 0) return '';

  const map: Record<string, string> = {
    B: '1', F: '1', P: '1', V: '1',
    C: '2', G: '2', J: '2', K: '2', Q: '2', S: '2', X: '2', Z: '2',
    D: '3', T: '3',
    L: '4',
    M: '5', N: '5',
    R: '6'
  };

  const firstChar = clean[0];
  let result = firstChar;
  let lastCode = map[firstChar] || '0';

  for (let i = 1; i < clean.length; i++) {
    const char = clean[i];
    const code = map[char] || '0';

    if (code !== '0') {
      if (code !== lastCode) {
        result += code;
        if (result.length === 4) break;
      }
    }
    // Update lastCode unless it was H or W (which don't separate consecutive identical sounds)
    if (char !== 'H' && char !== 'W') {
      lastCode = code;
    }
  }

  // Pad with trailing zeros to guarantee 4-character length
  return (result + '000').slice(0, 4);
}

export interface TopResultArtist {
  type: 'artist';
  artist: ApiArtist;
  score: number;
}

export interface TopResultTrack {
  type: 'track';
  track: Track;
  score: number;
}

export type TopResult = TopResultArtist | TopResultTrack | null;

export interface RankedSearchResults {
  rankedTracks: Track[];
  rankedArtists: ApiArtist[];
  topResult: TopResult;
}

/**
 * Computes the multi-tier relevance score for a Track against a query string.
 */
export function scoreTrackRelevance(
  track: Track,
  rawQuery: string,
  topAffinityArtist?: string,
  topAffinityGenre?: string
): number {
  const query = normalizeString(rawQuery);
  if (!query) return 0;

  const titleNorm = normalizeString(track.title, track.artist);
  const artistNorm = normalizeString(track.artist);
  let score = 0;

  // Tier 1: Exact Match
  if (titleNorm === query) {
    score += 110;
  } else if (artistNorm === query) {
    score += 60; // Artist match for track gives moderate score, ensuring Artist entity wins on artist queries
  }

  // Tier 2: Prefix Match
  if (titleNorm.startsWith(query)) {
    score += 75;
  } else if (artistNorm.startsWith(query)) {
    score += 40;
  }

  // Tier 3: Token Substring Matches
  const queryTokens = query.split(/\s+/).filter(Boolean);
  const targetTokens = `${titleNorm} ${artistNorm}`.split(/\s+/).filter(Boolean);

  let matchedTokens = 0;
  let phoneticMatches = 0;

  for (const qToken of queryTokens) {
    // Exact token match
    if (targetTokens.some((t) => t === qToken || t.startsWith(qToken))) {
      matchedTokens++;
      continue;
    }

    // Substring containment match
    if (targetTokens.some((t) => t.includes(qToken))) {
      matchedTokens += 0.75;
      continue;
    }

    // Tier 4: Soundex Phonetic Match (only for tokens that did NOT match above)
    const qSound = soundex(qToken);
    if (targetTokens.some((t) => soundex(t) === qSound)) {
      phoneticMatches++;
    }
  }

  if (queryTokens.length > 0) {
    score += (matchedTokens / queryTokens.length) * 45;
    score += (phoneticMatches / queryTokens.length) * 20;
  }

  // Tier 5: Levenshtein Fuzzy Similarity
  const titleRatio = similarityRatio(query, titleNorm);
  const artistRatio = similarityRatio(query, artistNorm);
  const bestFuzzy = Math.max(titleRatio, artistRatio);
  if (bestFuzzy >= 0.7) {
    score += bestFuzzy * 15;
  }

  // Tier 6: User Affinity & Quality Boost (applied only if track matches the query)
  if (score > 0) {
    if (topAffinityArtist && artistNorm.includes(normalizeString(topAffinityArtist))) {
      score += 12; // Boost user's favorite artist
    }
    if (topAffinityGenre && track.genre && track.genre.toLowerCase().includes(topAffinityGenre.toLowerCase())) {
      score += 5;
    }
    if (track.sourceType === 'local' || (track as any).audioBlob) {
      score += 5; // Local offline tracks prioritized
    }
    if (track.hasSyncedLyrics) {
      score += 3;
    }
    if (track.coverUrl && !track.coverUrl.includes('favicon')) {
      score += 2;
    }
  }

  return score;
}

/**
 * Computes the multi-tier relevance score for an Artist against a query string.
 */
export function scoreArtistRelevance(
  artist: ApiArtist,
  rawQuery: string,
  topAffinityArtist?: string
): number {
  const query = normalizeString(rawQuery);
  if (!query) return 0;

  const nameNorm = normalizeString(artist.name);
  let score = 0;

  // Tier 1: Exact Match (High weight so Artist cards appropriately win on pure artist searches)
  if (nameNorm === query) {
    score += 120;
  } else if (nameNorm.startsWith(query)) {
    score += 75;
  } else if (nameNorm.includes(query)) {
    score += 45;
  }

  // Token matching & Phonetic matching
  const queryTokens = query.split(/\s+/).filter(Boolean);
  const artistTokens = nameNorm.split(/\s+/).filter(Boolean);

  let matched = 0;
  let phonetic = 0;

  for (const qToken of queryTokens) {
    if (artistTokens.some((t) => t === qToken || t.startsWith(qToken))) {
      matched++;
      continue;
    }
    if (artistTokens.some((t) => soundex(t) === soundex(qToken))) {
      phonetic++;
    }
  }

  if (queryTokens.length > 0) {
    score += (matched / queryTokens.length) * 40;
    score += (phonetic / queryTokens.length) * 20;
  }

  // Fuzzy Levenshtein
  const ratio = similarityRatio(query, nameNorm);
  if (ratio >= 0.7) {
    score += ratio * 15;
  }

  // Affinity Boost (only if artist matches query)
  if (score > 0 && topAffinityArtist && nameNorm.includes(normalizeString(topAffinityArtist))) {
    score += 15;
  }

  return score;
}

/**
 * Ranks search results (Tracks and Artists) by composite multi-tier relevance score
 * and determines the unambiguous Top Result hero card.
 */
export function rankSearchResults(
  query: string,
  tracks: Track[],
  artists: ApiArtist[],
  topAffinityArtist?: string,
  topAffinityGenre?: string
): RankedSearchResults {
  const clean = query.trim();
  if (!clean) {
    return {
      rankedTracks: tracks,
      rankedArtists: artists,
      topResult: null
    };
  }

  // Score and sort tracks
  const scoredTracks = tracks.map((track) => ({
    track,
    score: scoreTrackRelevance(track, clean, topAffinityArtist, topAffinityGenre)
  }));
  scoredTracks.sort((a, b) => b.score - a.score);

  // Score and sort artists
  const scoredArtists = artists.map((artist) => ({
    artist,
    score: scoreArtistRelevance(artist, clean, topAffinityArtist)
  }));
  scoredArtists.sort((a, b) => b.score - a.score);

  const bestTrack = scoredTracks[0];
  const bestArtist = scoredArtists[0];

  let topResult: TopResult = null;

  if (bestArtist && (!bestTrack || bestArtist.score >= bestTrack.score)) {
    topResult = {
      type: 'artist',
      artist: bestArtist.artist,
      score: bestArtist.score
    };
  } else if (bestTrack) {
    topResult = {
      type: 'track',
      track: bestTrack.track,
      score: bestTrack.score
    };
  }

  return {
    rankedTracks: scoredTracks.map((s) => s.track),
    rankedArtists: scoredArtists.map((s) => s.artist),
    topResult
  };
}
