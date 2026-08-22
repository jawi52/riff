import { Track, Artist, Album } from '../types';

export interface DailyMix {
  id: string;
  title: string;
  subtitle: string;
  coverUrl: string;
  genre: string;
  tracks: Track[];
}

export interface HeroCardItem {
  track: Track;
  badge: string;
  tagline: string;
  gradient: string;
}

export const GLOBAL_CATALOG: Track[] = [
  // 1. English Pop / Synthwave
  {
    id: 'trk_blinding_lights',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    duration: 200,
    coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=800&q=80',
    sourceType: 'saavn',
    genre: 'Synthwave',
    hasSyncedLyrics: true,
    bitrateKbps: 320,
    playCount: 4892010
  },
  {
    id: 'trk_starboy',
    title: 'Starboy',
    artist: 'The Weeknd ft. Daft Punk',
    album: 'Starboy',
    duration: 230,
    coverUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&q=80',
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
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
    sourceType: 'saavn',
    genre: 'Disco / Funk',
    hasSyncedLyrics: true,
    bitrateKbps: 320,
    playCount: 4321090
  },
  {
    id: 'trk_levitating',
    title: 'Levitating',
    artist: 'Dua Lipa',
    album: 'Future Nostalgia',
    duration: 203,
    coverUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&q=80',
    sourceType: 'saavn',
    genre: 'Dance / Pop',
    hasSyncedLyrics: true,
    bitrateKbps: 320,
    playCount: 3829100
  },

  // 2. Urdu / Pakistani Hip-Hop
  {
    id: 'trk_downers_at_dusk',
    title: 'Downers at Dusk',
    artist: 'Talha Anjum, Umair',
    album: 'Open Letter',
    duration: 224,
    coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80',
    sourceType: 'saavn',
    genre: 'Urdu Hip-Hop',
    hasSyncedLyrics: true,
    bitrateKbps: 320,
    playCount: 4120930
  },
  {
    id: 'trk_open_letter',
    title: 'Open Letter',
    artist: 'Talha Anjum, Umair',
    album: 'Open Letter',
    duration: 210,
    coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&q=80',
    sourceType: 'saavn',
    genre: 'Urdu Hip-Hop',
    hasSyncedLyrics: true,
    bitrateKbps: 320,
    playCount: 2981040
  },
  {
    id: 'trk_aisay_kaisay',
    title: 'Aisay Kaisay',
    artist: 'Hasan Raheem, Abdullah Kasumbi',
    album: 'Single',
    duration: 180,
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80',
    sourceType: 'saavn',
    genre: 'Indie / Urdu Pop',
    hasSyncedLyrics: true,
    bitrateKbps: 320,
    playCount: 1840290
  },

  // 3. Punjabi Global Hits
  {
    id: 'trk_lover_diljit',
    title: 'Lover',
    artist: 'Diljit Dosanjh',
    album: 'MoonChild Era',
    duration: 191,
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80',
    sourceType: 'saavn',
    genre: 'Punjabi Pop',
    hasSyncedLyrics: true,
    bitrateKbps: 320,
    playCount: 6102940
  },
  {
    id: 'trk_hass_hass',
    title: 'Hass Hass',
    artist: 'Diljit Dosanjh, Sia',
    album: 'Single',
    duration: 153,
    coverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80',
    sourceType: 'saavn',
    genre: 'Punjabi Pop',
    hasSyncedLyrics: true,
    bitrateKbps: 320,
    playCount: 5890210
  },
  {
    id: 'trk_softly',
    title: 'Softly',
    artist: 'Karan Aujla, Ikky',
    album: 'Four Me',
    duration: 165,
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
    sourceType: 'saavn',
    genre: 'Punjabi Pop',
    hasSyncedLyrics: true,
    bitrateKbps: 320,
    playCount: 4920190
  },

  // 4. Bollywood / Romantic Hits
  {
    id: 'trk_kesariya',
    title: 'Kesariya',
    artist: 'Arijit Singh, Pritam',
    album: 'Brahmastra',
    duration: 268,
    coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80',
    sourceType: 'saavn',
    genre: 'Bollywood Romantic',
    hasSyncedLyrics: true,
    bitrateKbps: 320,
    playCount: 8920190
  },
  {
    id: 'trk_tum_hi_ho',
    title: 'Tum Hi Ho',
    artist: 'Arijit Singh, Mithoon',
    album: 'Aashiqui 2',
    duration: 262,
    coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&q=80',
    sourceType: 'saavn',
    genre: 'Bollywood Romantic',
    hasSyncedLyrics: true,
    bitrateKbps: 320,
    playCount: 9481020
  },

  // 5. K-Pop Global Hits
  {
    id: 'trk_money_lisa',
    title: 'MONEY',
    artist: 'LISA',
    album: 'LALISA',
    duration: 168,
    coverUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&q=80',
    sourceType: 'saavn',
    genre: 'K-Pop',
    hasSyncedLyrics: true,
    bitrateKbps: 320,
    playCount: 7890120
  }
];

export function calculateTrackSimilarity(a: Track, b: Track): number {
  if (a.id === b.id) return 1.0;
  let score = 0;

  // Genre match
  if (a.genre && b.genre) {
    if (a.genre.toLowerCase() === b.genre.toLowerCase()) score += 0.5;
    else if (a.genre.toLowerCase().includes(b.genre.toLowerCase()) || b.genre.toLowerCase().includes(a.genre.toLowerCase())) score += 0.3;
  }

  // Artist match
  if (a.artist && b.artist) {
    const artA = a.artist.toLowerCase().split(/,|ft\.|feat\.|&/)[0].trim();
    const artB = b.artist.toLowerCase().split(/,|ft\.|feat\.|&/)[0].trim();
    if (artA === artB) score += 0.35;
  }

  // Duration proximity
  const diff = Math.abs(a.duration - b.duration);
  if (diff < 30) score += 0.15;

  return Math.min(1.0, score);
}

export function getSmartAutoplayTracks(seedTrack: Track, existingQueueIds: Set<string>, limit = 6): Track[] {
  const candidates = GLOBAL_CATALOG.filter((t) => !existingQueueIds.has(t.id) && t.id !== seedTrack.id);
  const ranked = candidates.map((track) => ({
    track,
    score: calculateTrackSimilarity(seedTrack, track) + (Math.random() - 0.5) * 0.2
  }));
  ranked.sort((a, b) => b.score - a.score);
  return ranked.slice(0, limit).map((r) => r.track);
}

export function recordTrackInteraction(trackOrId: Track | string, action: 'play' | 'skip' | 'complete' | 'like'): void {
  try {
    const trackId = typeof trackOrId === 'string' ? trackOrId : trackOrId.id;
    const raw = localStorage.getItem('riff_user_interactions');
    const data: Record<string, { plays: number; skips: number; likes: number }> = raw ? JSON.parse(raw) : {};
    if (!data[trackId]) data[trackId] = { plays: 0, skips: 0, likes: 0 };
    if (action === 'play' || action === 'complete') data[trackId].plays++;
    if (action === 'skip') data[trackId].skips++;
    if (action === 'like') data[trackId].likes++;
    localStorage.setItem('riff_user_interactions', JSON.stringify(data));
  } catch {}
}

export function getHeroTasteTracks(likedTracks: Track[] = [], recentTracks: Track[] = []): HeroCardItem[] {
  const allUserHistory = [...likedTracks, ...recentTracks];

  if (allUserHistory.length <= 1) {
    return [
      {
        track: GLOBAL_CATALOG.find((t) => t.id === 'trk_blinding_lights') || GLOBAL_CATALOG[0],
        badge: 'GLOBAL SMASH #1',
        tagline: 'Billboard #1 Global Sensation • 4.8B Streams',
        gradient: 'from-amber-600/40 via-red-950/40 to-[#07080c]'
      },
      {
        track: GLOBAL_CATALOG.find((t) => t.id === 'trk_downers_at_dusk') || GLOBAL_CATALOG[4],
        badge: 'URDU HIP-HOP SPOTLIGHT',
        tagline: 'Deep introspective lyrical poetry by Talha Anjum',
        gradient: 'from-cyan-600/40 via-blue-950/40 to-[#07080c]'
      },
      {
        track: GLOBAL_CATALOG.find((t) => t.id === 'trk_lover_diljit') || GLOBAL_CATALOG[7],
        badge: 'PUNJABI GLOBAL WAVE',
        tagline: 'Electrifying Punjabi pop anthem by Diljit Dosanjh',
        gradient: 'from-fuchsia-600/40 via-purple-950/40 to-[#07080c]'
      },
      {
        track: GLOBAL_CATALOG.find((t) => t.id === 'trk_kesariya') || GLOBAL_CATALOG[10],
        badge: 'BOLLYWOOD ESSENTIAL',
        tagline: 'Timeless soulful melody sung by Arijit Singh',
        gradient: 'from-orange-600/40 via-amber-950/40 to-[#07080c]'
      },
      {
        track: GLOBAL_CATALOG.find((t) => t.id === 'trk_money_lisa') || GLOBAL_CATALOG[12],
        badge: 'K-POP VIRAL ICON',
        tagline: 'High-energy chart destroyer by LISA',
        gradient: 'from-pink-600/40 via-rose-950/40 to-[#07080c]'
      }
    ];
  }

  const genreCount = new Map<string, number>();
  const artistCount = new Map<string, number>();

  allUserHistory.forEach((t) => {
    if (t.genre) genreCount.set(t.genre, (genreCount.get(t.genre) || 0) + 2);
    if (t.artist) {
      const primary = t.artist.split(/,|ft\.|feat\.|&/i)[0].trim();
      artistCount.set(primary, (artistCount.get(primary) || 0) + 3);
    }
  });

  const scoredCatalog = GLOBAL_CATALOG.map((track) => {
    let score = 0;
    if (track.genre && genreCount.has(track.genre)) score += genreCount.get(track.genre)! * 15;
    const primary = track.artist.split(/,|ft\.|feat\.|&/i)[0].trim();
    if (artistCount.has(primary)) score += artistCount.get(primary)! * 25;
    score += Math.random() * 20;
    return { track, score };
  });

  scoredCatalog.sort((a, b) => b.score - a.score);

  const top5 = scoredCatalog.slice(0, 5).map((item, idx) => {
    const badges = [
      'BASED ON YOUR TASTE',
      'HEAVY ROTATION',
      'ALGORITHMIC RECOMMENDATION',
      'TOP ARTIST PICK',
      'DAILY DISCOVERY'
    ];
    const gradients = [
      'from-emerald-600/40 via-teal-950/40 to-[#07080c]',
      'from-cyan-600/40 via-blue-950/40 to-[#07080c]',
      'from-violet-600/40 via-purple-950/40 to-[#07080c]',
      'from-fuchsia-600/40 via-rose-950/40 to-[#07080c]',
      'from-amber-600/40 via-orange-950/40 to-[#07080c]'
    ];
    return {
      track: item.track,
      badge: badges[idx % badges.length],
      tagline: `Curated especially for you • ${item.track.genre || 'Lossless Audio'}`,
      gradient: gradients[idx % gradients.length]
    };
  });

  return top5;
}

export function generateDailyMixes(likedTracks: Track[] = []): DailyMix[] {
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
      subtitle: 'Talha Anjum, Umair, Hasan Raheem and more',
      coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80',
      genre: 'Urdu Hip-Hop & Rap',
      tracks: GLOBAL_CATALOG.filter((t) => t.genre?.includes('Urdu') || t.genre?.includes('Hip-Hop'))
    },
    {
      id: 'dm_3',
      title: 'Daily Mix 3',
      subtitle: 'Diljit Dosanjh, Karan Aujla, AP Dhillon and more',
      coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80',
      genre: 'Punjabi Hits & Pop',
      tracks: GLOBAL_CATALOG.filter((t) => t.genre?.includes('Punjabi'))
    },
    {
      id: 'dm_4',
      title: 'Daily Mix 4',
      subtitle: 'Arijit Singh, Pritam, Mithoon and more',
      coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&q=80',
      genre: 'Bollywood & Soul',
      tracks: GLOBAL_CATALOG.filter((t) => t.genre?.includes('Bollywood') || t.genre?.includes('Romantic'))
    }
  ];
}

export function getContextualDaylist(): { title: string; subtitle: string; gradient: string; tracks: Track[] } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) {
    return {
      title: 'morning acoustic focus chill tuesday',
      subtitle: 'Gentle melodies, warm acoustic strings & uplifting morning momentum',
      gradient: 'from-amber-600/40 via-orange-950/30 to-black',
      tracks: GLOBAL_CATALOG.filter((t) => ['Bollywood Romantic', 'Indie / Urdu Pop', 'Synthwave'].includes(t.genre || ''))
    };
  } else if (hour >= 11 && hour < 17) {
    return {
      title: 'midday hyper energy workout hype',
      subtitle: 'Fast BPMs, heavy synth basslines and high-tempo chart anthems',
      gradient: 'from-cyan-600/40 via-blue-950/30 to-black',
      tracks: GLOBAL_CATALOG.filter((t) => ['Synthwave', 'K-Pop', 'Punjabi Pop'].includes(t.genre || ''))
    };
  } else if (hour >= 17 && hour < 22) {
    return {
      title: 'sunset golden hour drives aesthetic',
      subtitle: 'Dreamy synthpop, lush neon textures and nostalgic cruising vibes',
      gradient: 'from-fuchsia-600/40 via-purple-950/30 to-black',
      tracks: GLOBAL_CATALOG.filter((t) => ['Synthwave', 'Urdu Hip-Hop', 'Punjabi Pop'].includes(t.genre || ''))
    };
  } else {
    return {
      title: 'late night ambient cyberpunk focus 3am',
      subtitle: 'Deep atmospheric soundscapes, dark electronica and soothing lo-fi beats',
      gradient: 'from-violet-600/40 via-indigo-950/30 to-black',
      tracks: GLOBAL_CATALOG.filter((t) => ['Urdu Hip-Hop', 'Synthwave', 'Disco / Funk'].includes(t.genre || ''))
    };
  }
}

export function getArtistProfile(artistName: string): Artist & {
  albums: Album[];
  singles: Track[];
  relatedArtists: Array<{ name: string; avatarUrl: string; genre: string; monthlyListeners: string }>;
} {
  const matchingTracks = GLOBAL_CATALOG.filter((t) =>
    t.artist.toLowerCase().includes(artistName.toLowerCase())
  );

  const topTracks = matchingTracks.length > 0 ? matchingTracks : GLOBAL_CATALOG.slice(0, 5);

  return {
    id: `art_${artistName.toLowerCase().replace(/\s+/g, '_')}`,
    name: artistName,
    avatarUrl: topTracks[0]?.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80',
    genres: [topTracks[0]?.genre || 'Pop', 'Urban', 'Hip-Hop'],
    monthlyListeners: 84920194,
    bio: `${artistName} is an internationally celebrated recording artist with billions of streams worldwide.`,
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
        genre: 'Synthwave / R&B',
        monthlyListeners: '112M'
      },
      {
        name: 'Talha Anjum',
        avatarUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80',
        genre: 'Urdu Hip-Hop',
        monthlyListeners: '4.8M'
      },
      {
        name: 'Diljit Dosanjh',
        avatarUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80',
        genre: 'Punjabi Pop',
        monthlyListeners: '21M'
      },
      {
        name: 'Arijit Singh',
        avatarUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&q=80',
        genre: 'Bollywood Soul',
        monthlyListeners: '42M'
      },
      {
        name: 'LISA',
        avatarUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&q=80',
        genre: 'K-Pop',
        monthlyListeners: '28M'
      }
    ]
  };
}
