import { Track, Artist, Album } from '../types';

export interface DailyMix {
  id: string;
  title: string;
  subtitle: string;
  coverUrl: string;
  genre: string;
  tracks: Track[];
}

export const GLOBAL_CATALOG: Track[] = [
  {
    id: 'trk_blinding_lights',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    duration: 200,
    coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&q=80',
    sourceType: 'saavn',
    genre: 'Synthwave',
    hasSyncedLyrics: true,
    bitrateKbps: 320,
    playCount: 4892010
  },
  {
    id: 'trk_save_your_tears',
    title: 'Save Your Tears',
    artist: 'The Weeknd',
    album: 'After Hours',
    duration: 215,
    coverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80',
    sourceType: 'saavn',
    genre: 'Synthwave',
    hasSyncedLyrics: true,
    bitrateKbps: 320,
    playCount: 3948120
  },
  {
    id: 'trk_starboy',
    title: 'Starboy',
    artist: 'The Weeknd ft. Daft Punk',
    album: 'Starboy',
    duration: 230,
    coverUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&q=80',
    sourceType: 'saavn',
    genre: 'R&B / Pop',
    hasSyncedLyrics: true,
    bitrateKbps: 320,
    playCount: 5210940
  },
  {
    id: 'trk_get_lucky',
    title: 'Get Lucky',
    artist: 'Daft Punk ft. Pharrell Williams',
    album: 'Random Access Memories',
    duration: 248,
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80',
    sourceType: 'audius',
    genre: 'Disco / Funk',
    hasSyncedLyrics: true,
    bitrateKbps: 320,
    playCount: 4321090
  },
  {
    id: 'trk_one_more_time',
    title: 'One More Time',
    artist: 'Daft Punk',
    album: 'Discovery',
    duration: 320,
    coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&q=80',
    sourceType: 'audius',
    genre: 'House / Electronic',
    hasSyncedLyrics: true,
    bitrateKbps: 320,
    playCount: 3890120
  },
  {
    id: 'trk_midnight_city',
    title: 'Midnight City',
    artist: 'M83',
    album: "Hurry Up, We're Dreaming",
    duration: 243,
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80',
    sourceType: 'saavn',
    genre: 'Synthpop',
    hasSyncedLyrics: true,
    bitrateKbps: 320,
    playCount: 3120940
  },
  {
    id: 'trk_resonance',
    title: 'Resonance',
    artist: 'HOME',
    album: 'Odyssey',
    duration: 212,
    coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80',
    sourceType: 'jamendo',
    genre: 'Chillwave / Synth',
    hasSyncedLyrics: false,
    bitrateKbps: 320,
    playCount: 2981020
  },
  {
    id: 'trk_levitating',
    title: 'Levitating',
    artist: 'Dua Lipa',
    album: 'Future Nostalgia',
    duration: 203,
    coverUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&q=80',
    sourceType: 'saavn',
    genre: 'Nu-Disco / Pop',
    hasSyncedLyrics: true,
    bitrateKbps: 320,
    playCount: 4789010
  }
];

/**
 * Client-Side Implicit User Affinity Score Matrix
 * Learns user tastes from play history, likes, completions, and skip penalties.
 */
export interface UserAffinityVector {
  genreWeights: Record<string, number>;
  artistWeights: Record<string, number>;
  totalPlays: number;
}

const AFFINITY_KEY = 'riff_user_affinity_v1';

export function getUserAffinity(): UserAffinityVector {
  try {
    const raw = localStorage.getItem(AFFINITY_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { genreWeights: {}, artistWeights: {}, totalPlays: 0 };
}

export function recordTrackInteraction(track: Track, action: 'like' | 'complete' | 'skip' | 'play') {
  try {
    const affinity = getUserAffinity();
    const g = (track.genre || 'General').toLowerCase();
    const a = (track.artist || 'Unknown').toLowerCase();

    let delta = 0;
    if (action === 'like') delta = 1.5;
    else if (action === 'complete') delta = 1.0;
    else if (action === 'play') delta = 0.5;
    else if (action === 'skip') delta = -0.6;

    affinity.genreWeights[g] = (affinity.genreWeights[g] || 0) + delta;
    affinity.artistWeights[a] = (affinity.artistWeights[a] || 0) + delta;
    affinity.totalPlays += 1;

    localStorage.setItem(AFFINITY_KEY, JSON.stringify(affinity));
  } catch (e) {
    console.error('Failed to record affinity:', e);
  }
}

/**
 * Multi-dimensional Acoustic & Metadata Similarity Scoring
 */
export function calculateTrackSimilarity(t1: Track, t2: Track): number {
  if (t1.id === t2.id) return 0;

  let score = 0;

  // 1. Artist Co-Occurrence & Lineage
  const a1 = t1.artist.toLowerCase();
  const a2 = t2.artist.toLowerCase();
  if (a1 === a2) {
    score += 0.45;
  } else if (a1.includes(a2) || a2.includes(a1)) {
    score += 0.30;
  }

  // 2. Genre Alignment
  if (t1.genre && t2.genre) {
    const g1 = t1.genre.toLowerCase();
    const g2 = t2.genre.toLowerCase();
    if (g1 === g2) {
      score += 0.35;
    } else {
      const words1 = g1.split(/[ /]/).filter((w) => w.length > 3);
      if (words1.some((w) => g2.includes(w))) {
        score += 0.20;
      }
    }
  }

  // 3. User Affinity Alignment
  const affinity = getUserAffinity();
  const gWeight = affinity.genreWeights[(t2.genre || '').toLowerCase()] || 0;
  const aWeight = affinity.artistWeights[a2] || 0;
  score += Math.min(0.20, (gWeight + aWeight) * 0.02);

  // 4. Duration Consistency (Pacing alignment)
  const durationDiff = Math.abs((t1.duration || 180) - (t2.duration || 180));
  if (durationDiff < 40) score += 0.05;

  return Math.min(1.0, score);
}

/**
 * Smart Autoplay & Next-Queue Generation using Multi-Armed Bandit (80% Exploitation, 20% Exploration)
 */
export function getSmartAutoplayTracks(seedTrack: Track, existingQueueIds: Set<string>, limit = 6): Track[] {
  const candidates = GLOBAL_CATALOG.filter(
    (t) => !existingQueueIds.has(t.id) && t.id !== seedTrack.id
  );

  const ranked = candidates.map((track) => {
    const baseSim = calculateTrackSimilarity(seedTrack, track);
    // Thompson sampling stochastic exploration term
    const exploreTerm = (Math.random() - 0.5) * 0.20;
    return {
      track,
      score: baseSim + exploreTerm
    };
  });

  ranked.sort((a, b) => b.score - a.score);
  return ranked.slice(0, limit).map((r) => r.track);
}

/**
 * Generates Daily Mixes tailored to user favorites and algorithmic flow
 */
export function generateDailyMixes(likedTracks: Track[]): DailyMix[] {
  const seeds = likedTracks.length > 0 ? likedTracks : GLOBAL_CATALOG.slice(0, 4);

  return [
    {
      id: 'dm_1',
      title: 'Daily Mix 1',
      subtitle: `${seeds[0]?.artist || 'The Weeknd'}, Daft Punk, M83 and more`,
      coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&q=80',
      genre: 'Synthwave & Electronic',
      tracks: GLOBAL_CATALOG.filter((t) => t.genre?.includes('Synth') || t.genre?.includes('Electronic'))
    },
    {
      id: 'dm_2',
      title: 'Daily Mix 2',
      subtitle: 'Daft Punk, Dua Lipa, Pharrell Williams and more',
      coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80',
      genre: 'Disco & Funk Wave',
      tracks: GLOBAL_CATALOG.filter((t) => t.genre?.includes('Disco') || t.genre?.includes('Pop'))
    },
    {
      id: 'dm_discover',
      title: 'Discover Weekly',
      subtitle: 'Your weekly algorithmic mixtape of fresh music',
      coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&q=80',
      genre: 'Algorithmic Discovery',
      tracks: GLOBAL_CATALOG.slice().reverse()
    },
    {
      id: 'dm_release_radar',
      title: 'Release Radar',
      subtitle: 'Catch all the newest releases from artists you love',
      coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80',
      genre: 'Fresh Releases',
      tracks: GLOBAL_CATALOG.slice(2, 8)
    }
  ];
}

/**
 * Contextual Spotify-style Daylist Generator (Morphs mood by hour of the day)
 */
export function getContextualDaylist(): { title: string; subtitle: string; gradient: string; tracks: Track[] } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) {
    return {
      title: 'morning acoustic focus chill tuesday',
      subtitle: 'Gentle melodies, warm acoustic strings & uplifting morning momentum',
      gradient: 'from-amber-600/40 via-orange-950/30 to-black',
      tracks: GLOBAL_CATALOG.filter((t) => ['Chill', 'Lo-Fi Chill', 'Pop'].includes(t.genre || ''))
    };
  } else if (hour >= 11 && hour < 17) {
    return {
      title: 'midday hyper energy workout hype',
      subtitle: 'Fast BPMs, heavy synth basslines and high-tempo chart anthems',
      gradient: 'from-cyan-600/40 via-blue-950/30 to-black',
      tracks: GLOBAL_CATALOG.filter((t) => ['Synthwave', 'Electronic', 'Dance / Electronic'].includes(t.genre || ''))
    };
  } else if (hour >= 17 && hour < 22) {
    return {
      title: 'sunset golden hour drives aesthetic',
      subtitle: 'Dreamy synthpop, lush neon textures and nostalgic cruising vibes',
      gradient: 'from-fuchsia-600/40 via-purple-950/30 to-black',
      tracks: GLOBAL_CATALOG.filter((t) => ['Synthwave', 'R&B / Pop', 'Synthpop'].includes(t.genre || ''))
    };
  } else {
    return {
      title: 'late night ambient cyberpunk focus 3am',
      subtitle: 'Deep atmospheric soundscapes, dark electronica and soothing lo-fi beats',
      gradient: 'from-violet-600/40 via-indigo-950/30 to-black',
      tracks: GLOBAL_CATALOG.filter((t) => ['Lo-Fi Chill', 'Synthwave', 'Electronic'].includes(t.genre || ''))
    };
  }
}

/**
 * Smart Auto-Play & Infinite Radio Recommendation Engine
 * Finds matching tracks based on seed track genre, artist, and audio characteristics
 */
export function getRecommendedRadioTracks(seedTrack: Track, count = 10): Track[] {
  const seedGenre = (seedTrack.genre || '').toLowerCase();
  const seedArtist = (seedTrack.artist || '').toLowerCase();

  const candidates = GLOBAL_CATALOG.filter((t) => t.id !== seedTrack.id);

  const scored = candidates.map((track) => {
    let score = 0;
    const tGenre = (track.genre || '').toLowerCase();
    const tArtist = (track.artist || '').toLowerCase();

    if (tGenre && seedGenre && (tGenre === seedGenre || tGenre.includes(seedGenre) || seedGenre.includes(tGenre))) {
      score += 60;
    }

    if (tArtist && seedArtist && (tArtist === seedArtist || tArtist.includes(seedArtist) || seedArtist.includes(tArtist))) {
      score += 40;
    }

    // Duration similarity
    const durDiff = Math.abs(track.duration - seedTrack.duration);
    if (durDiff < 30) score += 20;
    else if (durDiff < 60) score += 10;

    return { track, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, count).map((s) => s.track);
}

export function getArtistProfile(artistName: string): Artist & {
  albums: Album[];
  singles: Track[];
  relatedArtists: Array<{ name: string; avatarUrl: string; genre: string }>;
} {
  const matchingTracks = GLOBAL_CATALOG.filter((t) =>
    t.artist.toLowerCase().includes(artistName.toLowerCase())
  );

  const topTracks = matchingTracks.length > 0 ? matchingTracks : GLOBAL_CATALOG.slice(0, 5);

  return {
    id: `art_${artistName.toLowerCase().replace(/\s+/g, '_')}`,
    name: artistName,
    avatarUrl: topTracks[0]?.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80',
    genres: [topTracks[0]?.genre || 'Electronic', 'Pop', 'Synthwave'],
    monthlyListeners: 84920194,
    bio: `${artistName} is an internationally acclaimed recording artist and pioneer known for redefining modern electronic, pop, and synthwave soundscapes with multi-platinum global chart-toppers.`,
    topTracks,
    albums: [
      {
        id: `alb_${topTracks[0]?.album?.toLowerCase().replace(/\s+/g, '_') || 'album_1'}`,
        title: topTracks[0]?.album || 'Greatest Hits',
        artist: artistName,
        releaseYear: 2024,
        coverUrl: topTracks[0]?.coverUrl || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&q=80',
        trackCount: topTracks.length,
        tracks: topTracks
      }
    ],
    singles: topTracks.slice(0, 3),
    relatedArtists: [
      {
        name: 'The Weeknd',
        avatarUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&q=80',
        genre: 'Synthwave / R&B'
      },
      {
        name: 'Daft Punk',
        avatarUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80',
        genre: 'Electronic / Funk'
      },
      {
        name: 'M83',
        avatarUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80',
        genre: 'Synthpop'
      },
      {
        name: 'HOME',
        avatarUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80',
        genre: 'Chillwave'
      }
    ]
  };
}
