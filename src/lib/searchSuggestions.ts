import { Track } from '../types';
import { ApiArtist } from './api';
import { RecentItem } from './recentSearches';

export type SuggestionType = 'artist' | 'track' | 'query' | 'recent';

export interface SearchSuggestion {
  id: string;
  title: string;
  subtitle: string;
  type: SuggestionType;
  query: string;
  imageUrl?: string;
  track?: Track;
  artist?: ApiArtist;
}

interface StaticEntity {
  name: string;
  type: SuggestionType;
  subtitle: string;
  imageUrl?: string;
  aliases?: string[];
  popularity: number; // 1 to 100 for ranking
  relatedQuery?: string;
}

// Curated high-affinity South Asian (Pakistani, Indian, Punjabi, Bollywood) & Global Music Entities
const STATIC_MUSIC_ENTITIES: StaticEntity[] = [
  // --- Punjabi & Pop Superstars ---
  {
    name: 'Guru Randhawa',
    type: 'artist',
    subtitle: 'Artist • Punjabi & Bollywood Pop',
    imageUrl: 'https://cdn-images.dzcdn.net/images/artist/818617d3d2eaebfeac041c2c366ff48d/500x500-000000-80-0-0.jpg',
    aliases: ['guru', 'guru randhawa', 'randhawa', 'lahore guru'],
    popularity: 98,
  },
  {
    name: 'Gur Sidhu',
    type: 'artist',
    subtitle: 'Artist • Punjabi Wave',
    imageUrl: 'https://yt3.googleusercontent.com/BsyKIlEjZ_ry_yQ-GJsHp9I7PICEaAamzwesYyFea5gEhVIFP4WfD2s1BoLDxYN4QFe0GPkjXWm0BVMg=w800-h800-l90-rj',
    aliases: ['gur', 'sidhu', 'gur sidhu'],
    popularity: 88,
  },
  {
    name: 'Gurnam Bhullar',
    type: 'artist',
    subtitle: 'Artist • Punjabi Folk & Pop',
    imageUrl: 'https://cdn-images.dzcdn.net/images/artist/511c97a513511eb9bb6236b2ee6a5c10/500x500-000000-80-0-0.jpg',
    aliases: ['gurnam', 'bhullar', 'diamond'],
    popularity: 89,
  },
  {
    name: 'Gurdas Maan',
    type: 'artist',
    subtitle: 'Artist • Punjabi Folk Legend',
    imageUrl: 'https://cdn-images.dzcdn.net/images/artist/a7ee2ef5aee08e67a06275883d5a2d64/500x500-000000-80-0-0.jpg',
    aliases: ['gurdas', 'maan', 'punjab legend'],
    popularity: 92,
  },
  {
    name: 'Gur Nalo Ishq Mitha',
    type: 'track',
    subtitle: 'Song • Bally Sagoo / Yo Yo Honey Singh',
    imageUrl: 'https://cdn-images.dzcdn.net/images/cover/09ed249aaf47e25106df3aadc05ef9cd/500x500-000000-80-0-0.jpg',
    aliases: ['gur nalo', 'ishq mitha'],
    popularity: 85,
    relatedQuery: 'Gur Nalo Ishq Mitha',
  },
  {
    name: 'Lahore',
    type: 'track',
    subtitle: 'Song • Guru Randhawa',
    imageUrl: 'https://cdn-images.dzcdn.net/images/artist/818617d3d2eaebfeac041c2c366ff48d/500x500-000000-80-0-0.jpg',
    aliases: ['lahore', 'guru randhawa lahore'],
    popularity: 96,
    relatedQuery: 'Lahore Guru Randhawa',
  },
  {
    name: 'High Rated Gabru',
    type: 'track',
    subtitle: 'Song • Guru Randhawa',
    imageUrl: 'https://cdn-images.dzcdn.net/images/artist/818617d3d2eaebfeac041c2c366ff48d/500x500-000000-80-0-0.jpg',
    aliases: ['high rated gabru', 'gabru', 'guru randhawa high rated'],
    popularity: 95,
    relatedQuery: 'High Rated Gabru Guru Randhawa',
  },
  {
    name: 'Suit Suit',
    type: 'track',
    subtitle: 'Song • Guru Randhawa, Arjun',
    imageUrl: 'https://cdn-images.dzcdn.net/images/artist/818617d3d2eaebfeac041c2c366ff48d/500x500-000000-80-0-0.jpg',
    aliases: ['suit suit karda', 'guru randhawa suit'],
    popularity: 92,
    relatedQuery: 'Suit Suit Guru Randhawa',
  },
  {
    name: 'Ishare Tere',
    type: 'track',
    subtitle: 'Song • Guru Randhawa, Dhvani Bhanushali',
    imageUrl: 'https://cdn-images.dzcdn.net/images/artist/818617d3d2eaebfeac041c2c366ff48d/500x500-000000-80-0-0.jpg',
    aliases: ['ishare tere', 'guru randhawa ishare'],
    popularity: 90,
    relatedQuery: 'Ishare Tere Guru Randhawa',
  },

  // --- Pakistan Icons & Coke Studio ---
  {
    name: 'Atif Aslam',
    type: 'artist',
    subtitle: 'Artist • Pakistani Icon',
    imageUrl: 'https://cdn-images.dzcdn.net/images/artist/2be3f5ea7c5b61b7f0e7d08b33a27f6e/500x500-000000-80-0-0.jpg',
    aliases: ['atif', 'aslam', 'aadat', 'tajdar e haram'],
    popularity: 99,
  },
  {
    name: 'Ali Sethi',
    type: 'artist',
    subtitle: 'Artist • Coke Studio Sensation',
    imageUrl: 'https://cdn-images.dzcdn.net/images/artist/68b8137358b29c9b19e9cae5ea4eec93/500x500-000000-80-0-0.jpg',
    aliases: ['pasoori', 'ali sethi', 'sethi'],
    popularity: 95,
  },
  {
    name: 'Kaifi Khalil',
    type: 'artist',
    subtitle: 'Artist • Balochi & Urdu Soul',
    imageUrl: 'https://cdn-images.dzcdn.net/images/artist/f198b1b5e396821262d169c9bf667ebf/500x500-000000-80-0-0.jpg',
    aliases: ['kaifi', 'kahani suno', 'kana yaari'],
    popularity: 94,
  },
  {
    name: 'Talha Anjum',
    type: 'artist',
    subtitle: 'Artist • Young Stunners / Urdu Rap',
    imageUrl: 'https://cdn-images.dzcdn.net/images/artist/7735ebaf566eb0b4c09d31135cf5723b/500x500-000000-80-0-0.jpg',
    aliases: ['talha', 'anjum', 'young stunners', 'open letter', 'downers at dusk'],
    popularity: 97,
  },
  {
    name: 'Talhah Yunus',
    type: 'artist',
    subtitle: 'Artist • Young Stunners / Karachi Lingo',
    imageUrl: 'https://cdn-images.dzcdn.net/images/artist/4c44f3366ec2fe323c21a9712a44594c/500x500-000000-80-0-0.jpg',
    aliases: ['talhah', 'yunus', 'young stunners', 'shikwa'],
    popularity: 93,
  },
  {
    name: 'Young Stunners',
    type: 'artist',
    subtitle: 'Group • Urdu Rap Pioneers',
    imageUrl: 'https://cdn-images.dzcdn.net/images/artist/7735ebaf566eb0b4c09d31135cf5723b/500x500-000000-80-0-0.jpg',
    aliases: ['ys', 'gumaan', 'afsanay', 'phir milenge'],
    popularity: 96,
  },
  {
    name: 'Nusrat Fateh Ali Khan',
    type: 'artist',
    subtitle: 'Artist • Shahenshah-e-Qawwali',
    imageUrl: 'https://cdn-images.dzcdn.net/images/artist/2307bfecfa59d6e4b47e3309a3118cf9/500x500-000000-80-0-0.jpg',
    aliases: ['nusrat', 'nfak', 'qawwali king', 'afreen'],
    popularity: 99,
  },
  {
    name: 'Rahat Fateh Ali Khan',
    type: 'artist',
    subtitle: 'Artist • Sufi & Bollywood Maestro',
    imageUrl: 'https://cdn-images.dzcdn.net/images/artist/9ba6606f7dfbb43f8087702f23274291/500x500-000000-80-0-0.jpg',
    aliases: ['rahat', 'rfak', 'ore piya', 'zaroori tha'],
    popularity: 96,
  },
  {
    name: 'Shae Gill',
    type: 'artist',
    subtitle: 'Artist • Coke Studio Sensation',
    imageUrl: 'https://cdn-images.dzcdn.net/images/artist/90e797828ce2ea7d2925b42d59ff6d21/500x500-000000-80-0-0.jpg',
    aliases: ['shae', 'pasoori singer', 'sukoon'],
    popularity: 91,
  },
  {
    name: 'Asim Azhar',
    type: 'artist',
    subtitle: 'Artist • Pakistani Pop Star',
    imageUrl: 'https://cdn-images.dzcdn.net/images/artist/29ca13caefbb189912ee80e8e45f1b13/500x500-000000-80-0-0.jpg',
    aliases: ['asim', 'azhar', 'jo tu na mila', 'habibi'],
    popularity: 92,
  },
  {
    name: 'Hasan Raheem',
    type: 'artist',
    subtitle: 'Artist • Indie R&B & Soul',
    imageUrl: 'https://cdn-images.dzcdn.net/images/artist/066f125a07dd383bf9050d2c9431e78a/500x500-000000-80-0-0.jpg',
    aliases: ['hasan', 'raheem', 'peechey hutt', 'faisla'],
    popularity: 90,
  },
  {
    name: 'Abdul Hannan',
    type: 'artist',
    subtitle: 'Artist • Pakistani Indie Pop',
    imageUrl: 'https://cdn-images.dzcdn.net/images/artist/0b15b3c563e41416e788bc5fbf80e466/500x500-000000-80-0-0.jpg',
    aliases: ['abdul hannan', 'bikhra', 'iraaday'],
    popularity: 91,
  },

  // --- Bollywood & Indian Masters ---
  {
    name: 'Arijit Singh',
    type: 'artist',
    subtitle: 'Artist • King of Bollywood Melodies',
    imageUrl: 'https://cdn-images.dzcdn.net/images/artist/2e90f230bf91eb10a2bb184e98f06536/500x500-000000-80-0-0.jpg',
    aliases: ['arijit', 'tum hi ho', 'kesariya', 'channa mereya', 'ari'],
    popularity: 100,
  },
  {
    name: 'A.R. Rahman',
    type: 'artist',
    subtitle: 'Artist • Oscar-Winning Maestro',
    imageUrl: 'https://cdn-images.dzcdn.net/images/artist/23015a5105ca233a042eec8746df3c7e/500x500-000000-80-0-0.jpg',
    aliases: ['rahman', 'ar rahman', 'mozart of madras', 'jai ho'],
    popularity: 99,
  },
  {
    name: 'Pritam',
    type: 'artist',
    subtitle: 'Artist • Bollywood Hitmaker',
    imageUrl: 'https://cdn-images.dzcdn.net/images/artist/1e582845c48cb145781a8b13cf4a179c/500x500-000000-80-0-0.jpg',
    aliases: ['pritam chakraborty', 'bollywood hits'],
    popularity: 95,
  },
  {
    name: 'Shreya Ghoshal',
    type: 'artist',
    subtitle: 'Artist • Melody Queen',
    imageUrl: 'https://cdn-images.dzcdn.net/images/artist/59357484df7c8df0b4279b3294317145/500x500-000000-80-0-0.jpg',
    aliases: ['shreya', 'ghoshal', 'sun raha hai'],
    popularity: 97,
  },
  {
    name: 'Neha Kakkar',
    type: 'artist',
    subtitle: 'Artist • Bollywood Party Anthems',
    imageUrl: 'https://cdn-images.dzcdn.net/images/artist/9906ae0133c94f0fa3c15383f9829aa8/500x500-000000-80-0-0.jpg',
    aliases: ['neha', 'kakkar', 'dilbar', 'garmi'],
    popularity: 94,
  },
  {
    name: 'Badshah',
    type: 'artist',
    subtitle: 'Artist • Desi Hip Hop & Rap',
    imageUrl: 'https://cdn-images.dzcdn.net/images/artist/fafe5ea9a6cfbaebfc3a3b5a74312d8a/500x500-000000-80-0-0.jpg',
    aliases: ['badshah', 'kala chashma', 'paani paani', 'genda phool'],
    popularity: 95,
  },
  {
    name: 'Yo Yo Honey Singh',
    type: 'artist',
    subtitle: 'Artist • Desi Kalastar',
    imageUrl: 'https://cdn-images.dzcdn.net/images/artist/aa49a629b12a8a183594b9aa17961d6e/500x500-000000-80-0-0.jpg',
    aliases: ['honey singh', 'yo yo', 'blue eyes', 'brown rang', 'dheere dheere'],
    popularity: 96,
  },
  {
    name: 'Anuv Jain',
    type: 'artist',
    subtitle: 'Artist • Indie Acoustic Soul',
    imageUrl: 'https://cdn-images.dzcdn.net/images/artist/fa3a493a7d43236e768832dc9ea2a543/500x500-000000-80-0-0.jpg',
    aliases: ['anuv', 'husn', 'baarishein', 'alag aasman'],
    popularity: 93,
  },

  // --- Punjabi Global Wave ---
  {
    name: 'AP Dhillon',
    type: 'artist',
    subtitle: 'Artist • Punjabi Global Sensation',
    imageUrl: 'https://cdn-images.dzcdn.net/images/artist/b85437812239d5e38eb45d2f3484f7b4/500x500-000000-80-0-0.jpg',
    aliases: ['ap', 'dhillon', 'brown munde', 'excuses', 'with you', 'insane'],
    popularity: 99,
  },
  {
    name: 'Diljit Dosanjh',
    type: 'artist',
    subtitle: 'Artist • Global Punjabi Superstar',
    imageUrl: 'https://cdn-images.dzcdn.net/images/artist/08cb76c381c62f2ce1a0ea4c5a932e65/500x500-000000-80-0-0.jpg',
    aliases: ['diljit', 'dosanjh', 'goat', 'lover', 'born to shine', 'amar singh chamkila'],
    popularity: 100,
  },
  {
    name: 'Karan Aujla',
    type: 'artist',
    subtitle: 'Artist • Geetan Di Machine',
    imageUrl: 'https://cdn-images.dzcdn.net/images/artist/d7729bf25e4fbaebc492adfa5f838bc5/500x500-000000-80-0-0.jpg',
    aliases: ['karan', 'aujla', 'tauba tauba', 'softly', 'winning speech', 'making memories'],
    popularity: 99,
  },
  {
    name: 'Shubh',
    type: 'artist',
    subtitle: 'Artist • Still Rollin',
    imageUrl: 'https://cdn-images.dzcdn.net/images/artist/a1458e0a169b62649a2a912bb09eb49e/500x500-000000-80-0-0.jpg',
    aliases: ['shubh', 'cheques', 'baller', 'no love', 'still rollin', 'elevated', 'king shit'],
    popularity: 98,
  },
  {
    name: 'Sidhu Moose Wala',
    type: 'artist',
    subtitle: 'Artist • Immortal Punjabi Icon',
    imageUrl: 'https://cdn-images.dzcdn.net/images/artist/1e8fc64703a55bb049e29544b80b7405/500x500-000000-80-0-0.jpg',
    aliases: ['sidhu', 'moosewala', '295', 'the last ride', 'so high', 'legend'],
    popularity: 100,
  },
  {
    name: 'Talwiinder',
    type: 'artist',
    subtitle: 'Artist • Melodic Punjabi Trap',
    imageUrl: 'https://cdn-images.dzcdn.net/images/artist/ca5f3554e4df9c2c011e97669352efce/500x500-000000-80-0-0.jpg',
    aliases: ['talwiinder', 'dhundhala', 'gallan 4'],
    popularity: 91,
  },

  // --- Global Billboard Icons ---
  {
    name: 'The Weeknd',
    type: 'artist',
    subtitle: 'Artist • Global Pop & R&B Icon',
    imageUrl: 'https://cdn-images.dzcdn.net/images/artist/7733470ff4a97442ca619323ea54ef86/500x500-000000-80-0-0.jpg',
    aliases: ['weeknd', 'abel', 'blinding lights', 'starboy', 'after hours'],
    popularity: 100,
  },
  {
    name: 'Billie Eilish',
    type: 'artist',
    subtitle: 'Artist • Alternative Pop Phenomenon',
    imageUrl: 'https://cdn-images.dzcdn.net/images/artist/ec6fe992cf607519ea9119642e88126e/500x500-000000-80-0-0.jpg',
    aliases: ['billie', 'eilish', 'birds of a feather', 'bad guy', 'ocean eyes'],
    popularity: 99,
  },
  {
    name: 'Taylor Swift',
    type: 'artist',
    subtitle: 'Artist • Global Phenomenon',
    imageUrl: 'https://cdn-images.dzcdn.net/images/artist/23b361bfdcae5b6156a6a42a5c43d872/500x500-000000-80-0-0.jpg',
    aliases: ['taylor', 'swift', 'cruel summer', 'eras tour', 'anti-hero'],
    popularity: 100,
  },
  {
    name: 'Drake',
    type: 'artist',
    subtitle: 'Artist • OVO Hip Hop Titan',
    imageUrl: 'https://cdn-images.dzcdn.net/images/artist/2a2a0d18f50438cf188981e4663efdbe/500x500-000000-80-0-0.jpg',
    aliases: ['drake', 'champagnepapi', 'gods plan', 'one dance'],
    popularity: 99,
  },
  {
    name: 'Dua Lipa',
    type: 'artist',
    subtitle: 'Artist • Global Dance Pop Queen',
    imageUrl: 'https://cdn-images.dzcdn.net/images/artist/33e792c90bcba05777c5f8dfec329ef3/500x500-000000-80-0-0.jpg',
    aliases: ['dua', 'lipa', 'levitating', 'dance the night', 'houdini'],
    popularity: 98,
  },
  {
    name: 'Justin Bieber',
    type: 'artist',
    subtitle: 'Artist • Global Pop Icon',
    imageUrl: 'https://cdn-images.dzcdn.net/images/artist/0b91d2ea1e0b5cb4efea6e8284534f3b/500x500-000000-80-0-0.jpg',
    aliases: ['bieber', 'justin', 'peaches', 'sorry', 'stay'],
    popularity: 98,
  },
  {
    name: 'Eminem',
    type: 'artist',
    subtitle: 'Artist • Rap God',
    imageUrl: 'https://cdn-images.dzcdn.net/images/artist/19448835f8a0026a0ae1ca3950ef1299/500x500-000000-80-0-0.jpg',
    aliases: ['eminem', 'slim shady', 'marshall', 'lose yourself', 'houdini'],
    popularity: 99,
  },
  {
    name: 'Post Malone',
    type: 'artist',
    subtitle: 'Artist • Hip Hop & Country Cross',
    imageUrl: 'https://cdn-images.dzcdn.net/images/artist/05bc6173a110a28f4ea6c5b967d30f4e/500x500-000000-80-0-0.jpg',
    aliases: ['post malone', 'posty', 'sunflower', 'circles', 'rockstar'],
    popularity: 98,
  },
  {
    name: 'Bruno Mars',
    type: 'artist',
    subtitle: 'Artist • 24K Magic & Soul',
    imageUrl: 'https://cdn-images.dzcdn.net/images/artist/a2a912bb09eb49e29544b80b7405f6e8/500x500-000000-80-0-0.jpg',
    aliases: ['bruno', 'mars', 'uptown funk', 'die with a smile', 'locked out of heaven'],
    popularity: 99,
  },
  {
    name: 'Coldplay',
    type: 'artist',
    subtitle: 'Group • Legendary Stadium Rock',
    imageUrl: 'https://cdn-images.dzcdn.net/images/artist/48b2a3fa3df6871a9df9c4d62b535497/500x500-000000-80-0-0.jpg',
    aliases: ['coldplay', 'yellow', 'viva la vida', 'a sky full of stars', 'fix you'],
    popularity: 98,
  }
];

/**
 * Computes autocomplete suggestions for a given query:
 * - Prioritizes matching recent searches
 * - Evaluates prefix matches and word boundary matches across artists, songs, and aliases
 * - Augments with live backend results (artists and tracks)
 */
export function getSearchSuggestions(
  query: string,
  options?: {
    maxResults?: number;
    recentSearches?: RecentItem[];
    liveArtists?: ApiArtist[];
    liveTracks?: Track[];
  }
): SearchSuggestion[] {
  const clean = query.trim().toLowerCase();
  if (!clean) return [];

  const max = options?.maxResults || 8;
  const suggestions: SearchSuggestion[] = [];
  const seenIds = new Set<string>();

  // 1. Check user recent searches first
  if (options?.recentSearches) {
    for (const item of options.recentSearches) {
      const match = item.title.toLowerCase().includes(clean) || 
        (item.subtitle && item.subtitle.toLowerCase().includes(clean));
      
      if (match && !seenIds.has(`recent_${item.title}`)) {
        seenIds.add(`recent_${item.title}`);
        suggestions.push({
          id: `recent_${item.id}`,
          title: item.title,
          subtitle: item.type === 'track' ? `Recent • Song` : `Recent search`,
          type: item.type === 'track' ? 'track' : 'recent',
          query: item.title,
          imageUrl: item.coverUrl,
          track: item.trackData,
        });
        if (suggestions.length >= 3) break;
      }
    }
  }

  // 2. Score and sort static high-velocity entities
  interface ScoredEntity {
    entity: StaticEntity;
    score: number;
  }

  const scoredEntities: ScoredEntity[] = [];

  for (const entity of STATIC_MUSIC_ENTITIES) {
    const nameLower = entity.name.toLowerCase();
    let score = 0;

    // Exact match
    if (nameLower === clean) {
      score += 150;
    }
    // Prefix match on full name (e.g. "gur" -> "Guru Randhawa")
    else if (nameLower.startsWith(clean)) {
      score += 100;
    }
    // Word boundary match (e.g. "randhawa" -> "Guru Randhawa")
    else {
      const words = nameLower.split(/\s+/);
      const matchedWord = words.some(w => w.startsWith(clean));
      if (matchedWord) {
        score += 80;
      } else if (nameLower.includes(clean)) {
        score += 50;
      }
    }

    // Alias matching
    if (entity.aliases && score < 80) {
      for (const alias of entity.aliases) {
        const aLower = alias.toLowerCase();
        if (aLower === clean) {
          score = Math.max(score, 120);
        } else if (aLower.startsWith(clean)) {
          score = Math.max(score, 75);
        } else if (aLower.includes(clean)) {
          score = Math.max(score, 45);
        }
      }
    }

    if (score > 0) {
      // Add popularity weighting
      score += (entity.popularity / 10);
      scoredEntities.push({ entity, score });
    }
  }

  // Sort descending by score
  scoredEntities.sort((a, b) => b.score - a.score);

  for (const item of scoredEntities) {
    if (suggestions.length >= max) break;
    const key = `static_${item.entity.name.toLowerCase()}`;
    if (!seenIds.has(key)) {
      seenIds.add(key);
      suggestions.push({
        id: key,
        title: item.entity.name,
        subtitle: item.entity.subtitle,
        type: item.entity.type,
        query: item.entity.relatedQuery || item.entity.name,
        imageUrl: item.entity.imageUrl,
      });
    }
  }

  // 3. Augment with live backend search results (if available)
  if (options?.liveArtists && options.liveArtists.length > 0) {
    for (const artist of options.liveArtists) {
      if (suggestions.length >= max) break;
      const key = `live_artist_${artist.id}`;
      const nameLower = artist.name.toLowerCase();
      if (!seenIds.has(`static_${nameLower}`) && !seenIds.has(key)) {
        seenIds.add(key);
        suggestions.push({
          id: key,
          title: artist.name,
          subtitle: 'Artist',
          type: 'artist',
          query: artist.name,
          imageUrl: artist.pictureBig || artist.pictureMedium || artist.picture,
          artist,
        });
      }
    }
  }

  if (options?.liveTracks && options.liveTracks.length > 0) {
    for (const track of options.liveTracks) {
      if (suggestions.length >= max) break;
      const key = `live_track_${track.id}`;
      const titleLower = track.title.toLowerCase();
      if (!seenIds.has(key) && !seenIds.has(`static_${titleLower}`)) {
        seenIds.add(key);
        suggestions.push({
          id: key,
          title: track.title,
          subtitle: `Song • ${track.artist}`,
          type: 'track',
          query: `${track.title} ${track.artist}`,
          imageUrl: track.coverUrl,
          track,
        });
      }
    }
  }

  return suggestions.slice(0, max);
}

/**
 * Splits title by matching query prefix for highlighted UI rendering
 */
export function splitHighlight(text: string, query: string): { before: string; match: string; after: string } {
  if (!query) return { before: text, match: '', after: '' };
  
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) {
    return { before: text, match: '', after: '' };
  }

  return {
    before: text.slice(0, idx),
    match: text.slice(idx, idx + query.length),
    after: text.slice(idx + query.length),
  };
}
