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

// Global Spotify Artist Follower & Popularity Weights
const ARTIST_SPOTIFY_FOLLOWERS: Record<string, number> = {
  'the weeknd': 112000000,
  'taylor swift': 110000000,
  'drake': 88000000,
  'ariana grande': 95000000,
  'billie eilish': 84000000,
  'ed sheeran': 114000000,
  'justin bieber': 75000000,
  'eminem': 79000000,
  'arijit singh': 45000000,
  'lisa': 28500000,
  'blackpink': 48000000,
  'bts': 72000000,
  'cardi b': 24000000,
  'pink floyd': 20500000,
  'diljit dosanjh': 21000000,
  'daft punk': 24000000,
  'pritam': 18000000,
  'sidhu moose wala': 16000000,
  'shubh': 8000000,
  'ap dhillon': 9500000,
  'karan aujla': 11000000,
  'talha anjum': 4800000,
  'young stunners': 3900000,
  'umair': 2800000,
  'kendrick lamar': 42000000,
  'travis scott': 32000000,
  'post malone': 43000000,
  'dua lipa': 45000000,
  'bruno mars': 55000000,
  'coldplay': 49000000,
  'queen': 36000000
};

function getArtistSpotifyFollowers(artistName: string): number {
  const clean = (artistName || '').toLowerCase().trim();
  for (const [key, followers] of Object.entries(ARTIST_SPOTIFY_FOLLOWERS)) {
    if (clean.includes(key)) {
      return followers;
    }
  }
  return 100000;
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
 * Spotify-Style Search & Multi-Provider Ranking Engine with Artist Follower Ordering
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
      searchPromises.push(withTimeout(searchDeezerMetadata(`${artistPart} ${titlePart}`).catch(() => []), 3500, []));
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

    // 1. Specific "Title by Artist" bonus (e.g. money by lisa)
    if (targetTitle && targetArtist) {
      if (cTitle.includes(targetTitle) && cArtist.includes(targetArtist)) {
        score += 300;
      }
    }

    // 2. Exact Title Match
    if (cTitle === cleanQ) {
      score += 150;
    } else if (cTitle.startsWith(cleanQ)) {
      score += 90;
    } else if (cTitle.includes(cleanQ)) {
      score += 60;
    }

    // 3. Artist or Combined Exact Match
    if (combined === cleanQ || cArtist === cleanQ) {
      score += 120;
    } else if (combined.includes(cleanQ)) {
      score += 50;
    }

    // 4. Token matches
    let matchedTokens = 0;
    for (const token of qTokens) {
      if (cTitle.includes(token)) { score += 30; matchedTokens++; }
      if (cArtist.includes(token)) { score += 25; matchedTokens++; }
    }
    if (matchedTokens === qTokens.length) score += 40;

    // 5. SPOTIFY ARTIST FOLLOWER & POPULARITY BOOST (High-follower artists rank first when songs have same name!)
    const spotifyFollowers = getArtistSpotifyFollowers(track.artist);
    const followerBoost = Math.min(80, Math.log10(spotifyFollowers + 1) * 10);
    score += followerBoost;

    // Direct 320k Saavn stream bonus
    if (track.sourceType === 'saavn' && track.streamUrl) score += 5;

    return { track, score, followers: spotifyFollowers };
  });

  // Sort by score descending (highest followed artists with that song name come first)
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
        monthlyListeners: getArtistSpotifyFollowers(primaryArtist)
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
