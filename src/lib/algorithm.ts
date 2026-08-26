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

export interface PlaylistCardItem {
  id: string;
  title: string;
  subtitle: string;
  coverUrl: string;
  badge?: string;
  tracks: Track[];
}

export const GLOBAL_CATALOG: Track[] = [
  // ==========================================
  // 1. TOP TRENDING IN PAKISTAN (1 - 30)
  // ==========================================
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
    playCount: 14201090
  },
  {
    id: 'trk_pasoori',
    title: 'Pasoori',
    artist: 'Ali Sethi, Shae Gill',
    album: 'Coke Studio Season 14',
    duration: 224,
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80',
    sourceType: 'saavn',
    genre: 'Pakistani Pop / Fusion',
    hasSyncedLyrics: true,
    bitrateKbps: 320,
    playCount: 28910400
  },
  {
    id: 'trk_kahani_suno',
    title: 'Kahani Suno 2.0',
    artist: 'Kaifi Khalil',
    album: 'Single',
    duration: 175,
    coverUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800&q=80',
    sourceType: 'saavn',
    genre: 'Urdu Indie / Soul',
    hasSyncedLyrics: true,
    bitrateKbps: 320,
    playCount: 22410800
  },
  {
    id: 'trk_bikhra',
    title: 'Bikhra',
    artist: 'Abdul Hannan, Rovalio',
    album: 'Single',
    duration: 218,
    coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&q=80',
    sourceType: 'saavn',
    genre: 'Indie Pop',
    hasSyncedLyrics: true,
    bitrateKbps: 320,
    playCount: 11980300
  },
  {
    id: 'trk_iraaday',
    title: 'Iraaday',
    artist: 'Abdul Hannan, Rovalio',
    album: 'Single',
    duration: 195,
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
    sourceType: 'saavn',
    genre: 'Indie Pop',
    hasSyncedLyrics: true,
    bitrateKbps: 320,
    playCount: 13500200
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
    playCount: 9810400
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
    playCount: 8840290
  },
  {
    id: 'trk_afsanay',
    title: 'Afsanay',
    artist: 'Young Stunners, Talha Anjum, Talhah Yunus',
    album: 'Single',
    duration: 290,
    coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80',
    sourceType: 'saavn',
    genre: 'Urdu Hip-Hop',
    hasSyncedLyrics: true,
    bitrateKbps: 320,
    playCount: 16900200
  },
  {
    id: 'trk_ghalat_fehmi',
    title: 'Ghalat Fehmi',
    artist: 'Asim Azhar, Zenab Fatimah',
    album: 'Superstar',
    duration: 245,
    coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&q=80',
    sourceType: 'saavn',
    genre: 'Pakistani Pop / OST',
    hasSyncedLyrics: true,
    bitrateKbps: 320,
    playCount: 18400100
  },
  {
    id: 'trk_tu_hai_kahan',
    title: 'Tu Hai Kahan',
    artist: 'AUR',
    album: 'Single',
    duration: 260,
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80',
    sourceType: 'saavn',
    genre: 'Urdu Pop / Melodic',
    hasSyncedLyrics: true,
    bitrateKbps: 320,
    playCount: 19800400
  },
  {
    id: 'trk_agency',
    title: 'Agency',
    artist: 'Talha Anjum, Rap Demon',
    album: 'Single',
    duration: 220,
    coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80',
    sourceType: 'saavn',
    genre: 'Urdu Hip-Hop',
    hasSyncedLyrics: true,
    bitrateKbps: 320,
    playCount: 7420100
  },
  {
    id: 'trk_kana_yaari',
    title: 'Kana Yaari',
    artist: 'Kaifi Khalil, Eva B, Wahab Bugti',
    album: 'Coke Studio Season 14',
    duration: 215,
    coverUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800&q=80',
    sourceType: 'saavn',
    genre: 'Balochi / Pop Fusion',
    hasSyncedLyrics: true,
    bitrateKbps: 320,
    playCount: 15400200
  },
  {
    id: 'trk_tajdar_e_haram',
    title: 'Tajdar-e-Haram',
    artist: 'Atif Aslam',
    album: 'Coke Studio Season 8',
    duration: 360,
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80',
    sourceType: 'saavn',
    genre: 'Sufi / Qawwali',
    hasSyncedLyrics: true,
    bitrateKbps: 320,
    playCount: 38200100
  },
  {
    id: 'trk_tu_jaane_na',
    title: 'Tu Jaane Na',
    artist: 'Atif Aslam, Pritam',
    album: 'Ajab Prem Ki Ghazab Kahani',
    duration: 280,
    coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&q=80',
    sourceType: 'saavn',
    genre: 'Romantic Pop',
    hasSyncedLyrics: true,
    bitrateKbps: 320,
    playCount: 42100800
  },
  {
    id: 'trk_joona',
    title: 'Joona',
    artist: 'Hasan Raheem, Abdullah Kasumbi',
    album: 'Single',
    duration: 192,
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
    sourceType: 'saavn',
    genre: 'Indie / Urdu Pop',
    hasSyncedLyrics: true,
    bitrateKbps: 320,
    playCount: 6840200
  },
  {
    id: 'trk_faasle',
    title: 'Faasle',
    artist: 'Shamoon Ismail',
    album: 'Juice',
    duration: 188,
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80',
    sourceType: 'saavn',
    genre: 'Punjabi Blues / Indie',
    hasSyncedLyrics: true,
    bitrateKbps: 320,
    playCount: 9200400
  },
  {
    id: 'trk_marijuana',
    title: 'Marijuana',
    artist: 'Shamoon Ismail',
    album: 'Single',
    duration: 204,
    coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80',
    sourceType: 'saavn',
    genre: 'Punjabi Blues',
    hasSyncedLyrics: true,
    bitrateKbps: 320,
    playCount: 8100200
  },
  {
    id: 'trk_jhol',
    title: 'Jhol',
    artist: 'Maanu, Annural Khalid',
    album: 'Single',
    duration: 210,
    coverUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&q=80',
    sourceType: 'saavn',
    genre: 'Pakistani Indie R&B',
    hasSyncedLyrics: true,
    bitrateKbps: 320,
    playCount: 5900300
  },
  {
    id: 'trk_peechay_hutt',
    title: 'Peechay Hutt',
    artist: 'Hasan Raheem, Justin Bibis, Talal Qureshi',
    album: 'Coke Studio Season 14',
    duration: 212,
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
    sourceType: 'saavn',
    genre: 'Electronic / Pop',
    hasSyncedLyrics: true,
    bitrateKbps: 320,
    playCount: 14200800
  },
  {
    id: 'trk_wishes',
    title: 'Wishes',
    artist: 'Talha Anjum, Umair',
    album: 'Open Letter',
    duration: 198,
    coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&q=80',
    sourceType: 'saavn',
    genre: 'Urdu Hip-Hop',
    hasSyncedLyrics: true,
    bitrateKbps: 320,
    playCount: 8900400
  },
  {
    id: 'trk_gumaan',
    title: 'Gumaan',
    artist: 'Young Stunners',
    album: 'Single',
    duration: 242,
    coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80',
    sourceType: 'saavn',
    genre: 'Urdu Hip-Hop',
    hasSyncedLyrics: true,
    bitrateKbps: 320,
    playCount: 19400200
  },
  {
    id: 'trk_haaray',
    title: 'Haaray',
    artist: 'Abdul Hannan',
    album: 'Single',
    duration: 208,
    coverUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800&q=80',
    sourceType: 'saavn',
    genre: 'Indie Pop',
    hasSyncedLyrics: true,
    bitrateKbps: 320,
    playCount: 6500100
  },
  {
    id: 'trk_harkalay',
    title: 'Harkalay',
    artist: 'Zahoor',
    album: 'Single',
    duration: 190,
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80',
    sourceType: 'saavn',
    genre: 'Pashto / Pop Fusion',
    hasSyncedLyrics: true,
    bitrateKbps: 320,
    playCount: 4200800
  },
  {
    id: 'trk_luka_chuppi',
    title: 'Luka Chuppi',
    artist: 'Talhah Yunus, Umair',
    album: 'Shikwa',
    duration: 214,
    coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&q=80',
    sourceType: 'saavn',
    genre: 'Urdu Hip-Hop',
    hasSyncedLyrics: true,
    bitrateKbps: 320,
    playCount: 5800400
  },
  {
    id: 'trk_man_kunto_maula',
    title: 'Man Kunto Maula',
    artist: 'Nusrat Fateh Ali Khan',
    album: 'Sufiana Classics',
    duration: 350,
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80',
    sourceType: 'saavn',
    genre: 'Traditional Qawwali',
    hasSyncedLyrics: true,
    bitrateKbps: 320,
    playCount: 29400200
  },
  {
    id: 'trk_hona_tha_pyar',
    title: 'Hona Tha Pyar',
    artist: 'Atif Aslam, Hadiqa Kiani',
    album: 'Bol OST',
    duration: 235,
    coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&q=80',
    sourceType: 'saavn',
    genre: 'Pakistani Film OST',
    hasSyncedLyrics: true,
    bitrateKbps: 320,
    playCount: 16500200
  },
  {
    id: 'trk_habibi',
    title: 'Habibi',
    artist: 'Asim Azhar',
    album: 'Single',
    duration: 178,
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80',
    sourceType: 'saavn',
    genre: 'Pakistani Dance Pop',
    hasSyncedLyrics: true,
    bitrateKbps: 320,
    playCount: 12400900
  },
  {
    id: 'trk_tum_naraz_ho',
    title: 'Tum Naraz Ho',
    artist: 'Talha Anjum',
    album: 'Single',
    duration: 230,
    coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80',
    sourceType: 'saavn',
    genre: 'Urdu Hip-Hop',
    hasSyncedLyrics: true,
    bitrateKbps: 320,
    playCount: 9100400
  },
  {
    id: 'trk_ye_dunya',
    title: 'Ye Dunya',
    artist: 'Karakoram ft. Talha Anjum, Faris Shafi',
    album: 'Coke Studio Season 14',
    duration: 240,
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
    sourceType: 'saavn',
    genre: 'Alt Rock / Rap',
    hasSyncedLyrics: true,
    bitrateKbps: 320,
    playCount: 11200400
  },
  {
    id: 'trk_muaziz_sarif',
    title: 'Muaziz Sarif',
    artist: 'Faris Shafi, Meesha Shafi',
    album: 'Coke Studio Season 14',
    duration: 228,
    coverUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800&q=80',
    sourceType: 'saavn',
    genre: 'Urdu Rap / Funk',
    hasSyncedLyrics: true,
    bitrateKbps: 320,
    playCount: 9800200
  },

  // ==========================================
  // 2. GLOBAL & REGIONAL HIT RECORDINGS
  // ==========================================
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
    playCount: 48920100
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
    playCount: 52109400
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
    playCount: 43210900
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
    playCount: 38291000
  },
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
    playCount: 61029400
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
    playCount: 49201900
  },
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
    playCount: 89201900
  },
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
    playCount: 78901200
  }
];

export const PAKISTAN_TRENDING_TRACKS: Track[] = GLOBAL_CATALOG.slice(0, 30);

export function getTopMixes(): PlaylistCardItem[] {
  return [
    {
      id: 'mix_urdu_hiphop',
      title: 'Urdu Hip-Hop Mix',
      subtitle: 'Talha Anjum, Young Stunners, Umair, Rap Demon',
      coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80',
      badge: 'TOP MIX',
      tracks: GLOBAL_CATALOG.filter((t) => t.genre?.includes('Urdu Hip-Hop'))
    },
    {
      id: 'mix_desi_chill',
      title: 'Desi Chill Vibes Mix',
      subtitle: 'Abdul Hannan, Hasan Raheem, Kaifi Khalil, Shamoon',
      coverUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&q=80',
      badge: 'POPULAR',
      tracks: GLOBAL_CATALOG.filter((t) => t.genre?.includes('Indie') || t.genre?.includes('Soul'))
    },
    {
      id: 'mix_synthwave',
      title: 'Synthwave & 80s Cyber Mix',
      subtitle: 'The Weeknd, Daft Punk, Kavinsky, M83',
      coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&q=80',
      badge: 'ATMOSPHERE',
      tracks: GLOBAL_CATALOG.filter((t) => t.genre?.includes('Synth') || t.genre?.includes('Disco'))
    },
    {
      id: 'mix_punjabi_wave',
      title: 'Punjabi Wave Mix',
      subtitle: 'Diljit Dosanjh, Karan Aujla, AP Dhillon, Sidhu',
      coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80',
      badge: 'TRENDING',
      tracks: GLOBAL_CATALOG.filter((t) => t.genre?.includes('Punjabi'))
    },
    {
      id: 'mix_sufi_soul',
      title: 'Sufi & Qawwali Soul Mix',
      subtitle: 'Atif Aslam, Nusrat Fateh Ali Khan, Rahat',
      coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80',
      badge: 'TIMELESS',
      tracks: GLOBAL_CATALOG.filter((t) => t.genre?.includes('Sufi') || t.genre?.includes('Qawwali'))
    },
    {
      id: 'mix_late_night',
      title: 'Late Night 3 AM Mix',
      subtitle: 'Atmospheric 808s, dreamy guitars & lo-fi vocals',
      coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&q=80',
      badge: 'VIBE',
      tracks: GLOBAL_CATALOG.slice(3, 12)
    }
  ];
}

export function getRecommendedPlaylists(): PlaylistCardItem[] {
  return [
    {
      id: 'pl_pakistan_top50',
      title: 'Hot Hits Pakistan',
      subtitle: 'The 30 biggest and most streamed tracks in Pakistan right now',
      coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80',
      badge: 'CHART #1',
      tracks: PAKISTAN_TRENDING_TRACKS
    },
    {
      id: 'pl_coke_studio',
      title: 'Coke Studio Soundscapes',
      subtitle: 'Pasoori, Kana Yaari, Tajdar-e-Haram, Peechay Hutt and more',
      coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80',
      badge: 'ICONIC',
      tracks: GLOBAL_CATALOG.filter((t) => t.album?.includes('Coke Studio'))
    },
    {
      id: 'pl_urdu_rap_gods',
      title: 'Urdu Rap Essentials',
      subtitle: 'Young Stunners, Talha Anjum, Faris Shafi, Rap Demon',
      coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&q=80',
      badge: 'ESSENTIAL',
      tracks: GLOBAL_CATALOG.filter((t) => t.genre?.includes('Hip-Hop'))
    },
    {
      id: 'pl_desi_indie',
      title: 'Pakistani Indie Discovery',
      subtitle: 'Abdul Hannan, Hasan Raheem, Kaifi Khalil, Maanu',
      coverUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&q=80',
      badge: 'CURATED',
      tracks: GLOBAL_CATALOG.filter((t) => t.genre?.includes('Indie'))
    },
    {
      id: 'pl_global_top50',
      title: 'Today’s Top Hits (Global)',
      subtitle: 'The Weeknd, Dua Lipa, LISA, Daft Punk and more worldwide anthems',
      coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&q=80',
      badge: 'GLOBAL',
      tracks: GLOBAL_CATALOG.filter((t) => ['Synthwave', 'K-Pop', 'Dance / Pop', 'Disco / Funk'].includes(t.genre || ''))
    }
  ];
}

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

export function getSmartAutoplayTracks(seedTrack: Track, existingQueueIds?: Set<string> | number, limit = 6): Track[] {
  let idSet = new Set<string>();
  let actualLimit = limit;

  if (typeof existingQueueIds === 'number') {
    actualLimit = existingQueueIds;
  } else if (existingQueueIds instanceof Set) {
    idSet = existingQueueIds;
  }

  const candidates = GLOBAL_CATALOG.filter((t) => !idSet.has(t.id) && t.id !== seedTrack.id);
  const ranked = candidates.map((track) => ({
    track,
    score: calculateTrackSimilarity(seedTrack, track) + (Math.random() - 0.5) * 0.2
  }));
  ranked.sort((a, b) => b.score - a.score);
  return ranked.slice(0, actualLimit).map((r) => r.track);
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
