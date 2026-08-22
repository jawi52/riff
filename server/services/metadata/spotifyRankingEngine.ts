import { Track } from '../../../src/types';
import { searchAppleMusicMetadata } from './itunes';
import { searchDeezerMetadata } from './deezer';
import { searchSaavn } from '../providers/saavn';
import { searchInnertubeMusic } from '../providers/innertube';
import { prewarmStreams } from '../resolver/precisionYtResolver';
import { GLOBAL_CATALOG } from '../../../src/lib/algorithm';

export interface SpotifySearchResult {
  query: string;
  topResult: Track | null;
  sameArtistTracks: Track[];
  similarVibeTracks: Track[];
  tracks: Track[];
  artists: any[];
  albums: any[];
}

function cleanStr(s: string): string {
  return (s || '')
    .toLowerCase()
    .replace(/\(.*?\)|\[.*?\]/g, '')
    .replace(/official\s*(music\s*)?(video|audio|lyrics?|performance|hd|4k|dance practice video)/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))
  ]);
}

/**
 * Spotify-Style Search & Multi-Provider Ranking Engine
 */
export async function searchSpotifyStyle(query: string): Promise<SpotifySearchResult> {
  const rawQ = query.trim();
  const searchPromises: Promise<Track[]>[] = [
    withTimeout(searchSaavn(rawQ).catch(() => []), 3500, []),
    withTimeout(searchAppleMusicMetadata(rawQ).catch(() => []), 3500, []),
    withTimeout(searchDeezerMetadata(rawQ).catch(() => []), 3500, []),
    withTimeout(searchInnertubeMusic(rawQ).catch(() => []), 3500, [])
  ];

  // If query has "by" or " - ", search structured title + artist combinations
  if (rawQ.toLowerCase().includes(' by ') || rawQ.includes(' - ')) {
    const parts = rawQ.toLowerCase().includes(' by ') ? rawQ.split(/ by /i) : rawQ.split(' - ');
    const titlePart = parts[0].trim();
    const artistPart = parts[1]?.trim() || '';
    if (titlePart && artistPart) {
      searchPromises.push(withTimeout(searchAppleMusicMetadata(`${artistPart} ${titlePart}`).catch(() => []), 3500, []));
      searchPromises.push(withTimeout(searchInnertubeMusic(`${artistPart} ${titlePart}`).catch(() => []), 3500, []));
      searchPromises.push(withTimeout(searchSaavn(`${artistPart} ${titlePart}`).catch(() => []), 3500, []));
    }
  }

  const results = await Promise.all(searchPromises);
  const localMatching = GLOBAL_CATALOG.filter(
    (t) =>
      cleanStr(t.title).includes(cleanStr(rawQ)) ||
      cleanStr(t.artist).includes(cleanStr(rawQ))
  );

  const allInitial = [...results.flat(), ...localMatching];

  if (allInitial.length === 0) {
    return {
      query: rawQ,
      topResult: null,
      sameArtistTracks: [],
      similarVibeTracks: [],
      tracks: [],
      artists: [],
      albums: []
    };
  }

  // Token-based fuzzy ranking
  const cleanQ = cleanStr(rawQ);
  const qTokens = cleanQ.split(' ').filter(Boolean);

  let targetTitle = '';
  let targetArtist = '';
  if (rawQ.toLowerCase().includes(' by ')) {
    const p = rawQ.split(/ by /i);
    targetTitle = cleanStr(p[0]);
    targetArtist = cleanStr(p[1]);
  }

  const scored = allInitial.map((track) => {
    const cTitle = cleanStr(track.title);
    const cArtist = cleanStr(track.artist);
    const combined = `${cArtist} ${cTitle}`;

    let score = 0;

    // Specific "Title by Artist" bonus (e.g. money by lisa)
    if (targetTitle && targetArtist) {
      if (cTitle.includes(targetTitle) && cArtist.includes(targetArtist)) {
        score += 200;
      }
    }

    // Exact phrase match
    if (cTitle === cleanQ || combined === cleanQ) score += 120;
    else if (combined.includes(cleanQ) || cleanQ.includes(cTitle)) score += 80;

    // Token matches
    let matchedTokens = 0;
    for (const token of qTokens) {
      if (cTitle.includes(token)) { score += 40; matchedTokens++; }
      if (cArtist.includes(token)) { score += 35; matchedTokens++; }
    }
    if (matchedTokens === qTokens.length) score += 50;

    // Bonus for high-quality audio
    if (track.sourceType === 'saavn' && track.streamUrl) score += 10;

    return { track, score };
  });

  scored.sort((a, b) => b.score - a.score);

  // Deduplicate while preserving all songs with same title from DIFFERENT artists
  const seen = new Set<string>();
  const uniqueTracks: Track[] = [];

  for (const item of scored) {
    const key = `${cleanStr(item.track.title)}___${cleanStr(item.track.artist)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    uniqueTracks.push(item.track);
  }

  const topResult = uniqueTracks[0] || null;
  const primaryArtist = topResult?.artist?.split(/,|ft\.|feat\.|&/i)[0].trim() || 'Artist';

  const sameArtistTracks = uniqueTracks.filter(
    (t) => t.id !== topResult?.id && t.artist.toLowerCase().includes(primaryArtist.toLowerCase())
  ).slice(0, 6);

  const similarVibeTracks = uniqueTracks.filter(
    (t) => t.id !== topResult?.id && !t.artist.toLowerCase().includes(primaryArtist.toLowerCase())
  );

  // Prewarm streams for top tracks in background
  prewarmStreams(uniqueTracks.slice(0, 4));

  return {
    query: rawQ,
    topResult,
    sameArtistTracks,
    similarVibeTracks,
    tracks: uniqueTracks.slice(0, 30),
    artists: [
      {
        id: `art_${primaryArtist.toLowerCase().replace(/\s+/g, '_')}`,
        name: primaryArtist,
        avatarUrl: topResult?.coverUrl,
        monthlyListeners: 45000000
      }
    ],
    albums: [
      {
        id: `alb_${topResult?.album?.toLowerCase().replace(/\s+/g, '_') || 'alb_1'}`,
        title: topResult?.album || 'Single',
        artist: primaryArtist,
        coverUrl: topResult?.coverUrl
      }
    ]
  };
}
