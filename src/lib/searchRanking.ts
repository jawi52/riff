import { Track } from '../types';

/**
 * Computes Levenshtein edit distance between two strings
 */
export function levenshtein(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;

  const matrix = Array.from({ length: bn + 1 }, () => new Array(an + 1).fill(0));

  for (let i = 0; i <= an; i++) matrix[0][i] = i;
  for (let j = 0; j <= bn; j++) matrix[j][0] = j;

  for (let j = 1; j <= bn; j++) {
    for (let i = 1; i <= an; i++) {
      if (b[j - 1] === a[i - 1]) {
        matrix[j][i] = matrix[j - 1][i - 1];
      } else {
        matrix[j][i] = Math.min(
          matrix[j - 1][i - 1] + 1, // substitution
          matrix[j][i - 1] + 1,     // insertion
          matrix[j - 1][i] + 1      // deletion
        );
      }
    }
  }

  return matrix[bn][an];
}

/**
 * Simplified Soundex phonetic encoding for typo & phonetic tolerance
 */
export function soundex(s: string): string {
  const clean = (s || '').toUpperCase().replace(/[^A-Z]/g, '');
  if (!clean) return '0000';

  const firstLetter = clean[0];
  const mappings: Record<string, string> = {
    B: '1', F: '1', P: '1', V: '1',
    C: '2', G: '2', J: '2', K: '2', Q: '2', S: '2', X: '2', Z: '2',
    D: '3', T: '3',
    L: '4',
    M: '5', N: '5',
    R: '6'
  };

  let code = firstLetter;
  let prevCode = mappings[firstLetter] || '0';

  for (let i = 1; i < clean.length && code.length < 4; i++) {
    const currentCode = mappings[clean[i]] || '0';
    if (currentCode !== '0' && currentCode !== prevCode) {
      code += currentCode;
    }
    prevCode = currentCode;
  }

  return code.padEnd(4, '0');
}

/**
 * Strips noisy metadata tags from song titles
 * e.g. "Downers at Dusk (Official Music Video)" -> "downers at dusk"
 */
export function cleanTitle(title: string): string {
  return (title || '')
    .toLowerCase()
    .replace(/\(.*?\)|\[.*?\]/g, '')
    .replace(/official\s*(music\s*)?(video|audio|lyrics?|performance|hd|4k|remix|version|lofi|edit|mix|live|stage)/gi, '')
    .replace(/ft\.?|feat\.?.*$/gi, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface ScoredTrack {
  track: Track;
  relevanceScore: number;
  matchType: 'exact' | 'prefix' | 'substring' | 'phonetic' | 'fuzzy' | 'artist';
}

/**
 * Multi-Tier Hybrid Fuzzy + Phonetic Search Ranker
 */
export function rankTrackRelevance(query: string, track: Track): ScoredTrack {
  const q = cleanTitle(query);
  const qTokens = q.split(' ').filter(Boolean);
  const tTitle = cleanTitle(track.title);
  const tArtist = cleanTitle(track.artist);

  let score = 0;
  let matchType: ScoredTrack['matchType'] = 'fuzzy';

  // 1. Exact Full Matches
  if (tTitle === q) {
    score = 150;
    matchType = 'exact';
  } else if (tArtist === q) {
    score = 130;
    matchType = 'artist';
  }
  // 2. Prefix Match
  else if (tTitle.startsWith(q)) {
    score = 110;
    matchType = 'prefix';
  } else if (tArtist.startsWith(q)) {
    score = 100;
    matchType = 'prefix';
  }
  // 3. Substring Containment
  else if (tTitle.includes(q)) {
    score = 85;
    matchType = 'substring';
  } else if (tArtist.includes(q)) {
    score = 75;
    matchType = 'artist';
  }
  // 4. Token Intersection (e.g. "Talha Anjum Downers" matching title + artist)
  else {
    let tokenMatches = 0;
    for (const token of qTokens) {
      if (tTitle.includes(token) || tArtist.includes(token)) {
        tokenMatches++;
      }
    }

    if (tokenMatches > 0) {
      score = 50 + (tokenMatches / qTokens.length) * 35;
      matchType = 'substring';
    }
  }

  // 5. Phonetic Soundex Match (Typo & Multilingual Tolerance)
  if (score < 60) {
    const qSoundex = soundex(q);
    const titleSoundex = soundex(tTitle);
    const artistSoundex = soundex(tArtist);

    if (qSoundex === titleSoundex || qSoundex === artistSoundex) {
      score = Math.max(score, 55);
      matchType = 'phonetic';
    }
  }

  // 6. Levenshtein Fuzzy Distance fallback
  if (score < 50 && q.length > 3) {
    const distTitle = levenshtein(q, tTitle.slice(0, q.length + 2));
    const distArtist = levenshtein(q, tArtist.slice(0, q.length + 2));
    const minDist = Math.min(distTitle, distArtist);

    if (minDist <= 2) {
      score = Math.max(score, 45 - minDist * 10);
      matchType = 'fuzzy';
    }
  }

  // 7. Metadata Quality Bonuses
  if (track.bitrateKbps && track.bitrateKbps >= 320) score += 5;
  if (track.hasSyncedLyrics) score += 3;
  if (track.coverUrl && !track.coverUrl.includes('placeholder')) score += 2;

  return { track, relevanceScore: score, matchType };
}

/**
 * Sorts and filters catalog tracks according to relevance
 */
export function rankCatalog(query: string, tracks: Track[], limit = 20): ScoredTrack[] {
  if (!query || !query.trim()) {
    return tracks.slice(0, limit).map((t) => ({ track: t, relevanceScore: 10, matchType: 'exact' }));
  }

  return tracks
    .map((track) => rankTrackRelevance(query, track))
    .filter((st) => st.relevanceScore > 20)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit);
}
