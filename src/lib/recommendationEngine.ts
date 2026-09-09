import { Track } from '../types';

export interface ContextualVibe {
  greeting: string;
  period: 'morning' | 'afternoon' | 'evening' | 'night';
  vibeTitle: string;
  vibeSubtitle: string;
  seedQuery: string;
  accentColor: string;
}

export interface DailyMixItem {
  id: string;
  title: string;
  subtitle: string;
  artists: string;
  coverUrl: string;
  gradient: string;
  searchQuery: string;
}

export interface ArtistAffinity {
  relatedArtists: string[];
  relatedSearchQuery: string;
  genre: string;
}

// Artist affinity mapping for smart collaborative / content filtering
const ARTIST_AFFINITY_GRAPH: Record<string, ArtistAffinity> = {
  'guru randhawa': {
    relatedArtists: ['Gur Sidhu', 'AP Dhillon', 'Diljit Dosanjh', 'Gurnam Bhullar', 'Karan Aujla'],
    relatedSearchQuery: 'Guru Randhawa AP Dhillon Diljit',
    genre: 'Punjabi & Bollywood Pop'
  },
  'atif aslam': {
    relatedArtists: ['Rahat Fateh Ali Khan', 'Ali Sethi', 'Arijit Singh', 'Kaifi Khalil'],
    relatedSearchQuery: 'Atif Aslam Coke Studio',
    genre: 'Pakistani Soul & Bollywood'
  },
  'arijit singh': {
    relatedArtists: ['Pritam', 'Shreya Ghoshal', 'Atif Aslam', 'Anuv Jain'],
    relatedSearchQuery: 'Arijit Singh Melodies',
    genre: 'Bollywood Romance'
  },
  'talha anjum': {
    relatedArtists: ['Young Stunners', 'Talhah Yunus', 'Umair', 'Hasan Raheem'],
    relatedSearchQuery: 'Young Stunners Urdu Rap',
    genre: 'Urdu Hip-Hop'
  },
  'young stunners': {
    relatedArtists: ['Talha Anjum', 'Talhah Yunus', 'Umair', 'Faris Shafi'],
    relatedSearchQuery: 'Young Stunners Talha Anjum',
    genre: 'Urdu Hip-Hop'
  },
  'diljit dosanjh': {
    relatedArtists: ['Karan Aujla', 'Guru Randhawa', 'AP Dhillon', 'Shubh'],
    relatedSearchQuery: 'Diljit Dosanjh Karan Aujla',
    genre: 'Global Punjabi'
  },
  'ap dhillon': {
    relatedArtists: ['Gur Sidhu', 'Shubh', 'Diljit Dosanjh', 'Karan Aujla'],
    relatedSearchQuery: 'AP Dhillon Shubh Punjabi',
    genre: 'Punjabi Wave'
  },
  'karan aujla': {
    relatedArtists: ['Diljit Dosanjh', 'AP Dhillon', 'Shubh', 'Guru Randhawa'],
    relatedSearchQuery: 'Karan Aujla Punjabi Hits',
    genre: 'Punjabi Hip-Hop'
  },
  'shubh': {
    relatedArtists: ['AP Dhillon', 'Karan Aujla', 'Diljit Dosanjh'],
    relatedSearchQuery: 'Shubh Punjabi Wave',
    genre: 'Punjabi Trap'
  },
  'the weeknd': {
    relatedArtists: ['Drake', 'Billie Eilish', 'Post Malone', 'Bruno Mars'],
    relatedSearchQuery: 'The Weeknd Synthwave Pop',
    genre: 'Global Pop & R&B'
  },
  'billie eilish': {
    relatedArtists: ['The Weeknd', 'Taylor Swift', 'Dua Lipa'],
    relatedSearchQuery: 'Billie Eilish Alternative Pop',
    genre: 'Alternative Pop'
  }
};

/**
 * 1. Time-Aware Contextual Recommendation Algorithm
 * Inspects local device time to generate Spotify-style greetings & personalized mood playlists
 */
export function getContextualVibe(): ContextualVibe {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return {
      greeting: 'Good morning',
      period: 'morning',
      vibeTitle: '☕ Morning Acoustic & Lo-Fi Focus',
      vibeSubtitle: 'Gentle melodies, acoustic guitars & peaceful Pakistani & Global indie',
      seedQuery: 'Morning Acoustic Lo-Fi',
      accentColor: 'from-amber-600/30 via-orange-900/10 to-transparent',
    };
  } else if (hour >= 12 && hour < 17) {
    return {
      greeting: 'Good afternoon',
      period: 'afternoon',
      vibeTitle: '⚡ Midday Energy & Punjabi Wave',
      vibeSubtitle: 'High BPM Punjabi drops, Bollywood party beats & energetic drops',
      seedQuery: 'Punjabi Workout Hits',
      accentColor: 'from-red-600/30 via-orange-900/10 to-transparent',
    };
  } else if (hour >= 17 && hour < 22) {
    return {
      greeting: 'Good evening',
      period: 'evening',
      vibeTitle: '🌆 Golden Hour & Coke Studio Soul',
      vibeSubtitle: 'Sunset Bollywood romance, Coke Studio classics & soulful ghazals',
      seedQuery: 'Coke Studio Sunset Melodies',
      accentColor: 'from-purple-600/30 via-pink-900/10 to-transparent',
    };
  } else {
    return {
      greeting: 'Late night vibes',
      period: 'night',
      vibeTitle: '🌙 Late Night Urdu Rap & Deep Thoughts',
      vibeSubtitle: 'Talha Anjum, Young Stunners, dark synthwave & chill midnight lo-fi',
      seedQuery: 'Late Night Urdu Hip Hop',
      accentColor: 'from-blue-600/30 via-indigo-950/20 to-transparent',
    };
  }
}

/**
 * 2. "Because You Listened To [Artist]" Recommendation Algorithm
 * Evaluates the user's last played song and matches affinity clusters
 */
export function getArtistRecommendation(lastTrack?: Track | null): {
  headline: string;
  subtext: string;
  query: string;
  recommendedArtists: string[];
} {
  if (!lastTrack || !lastTrack.artist) {
    return {
      headline: 'Recommended For You',
      subtext: 'Trending hits from Pakistan, Punjab, Bollywood & Global charts',
      query: 'Coke Studio Pakistan Hits',
      recommendedArtists: ['Guru Randhawa', 'Atif Aslam', 'Arijit Singh', 'Talha Anjum', 'AP Dhillon'],
    };
  }

  const artistClean = lastTrack.artist.toLowerCase();
  
  // Find match in affinity graph
  for (const [key, affinity] of Object.entries(ARTIST_AFFINITY_GRAPH)) {
    if (artistClean.includes(key) || key.includes(artistClean)) {
      return {
        headline: `Because you listened to ${lastTrack.artist}`,
        subtext: `Fans of ${lastTrack.artist} also love ${affinity.relatedArtists.slice(0, 3).join(', ')}`,
        query: affinity.relatedSearchQuery,
        recommendedArtists: affinity.relatedArtists,
      };
    }
  }

  // Generic fallback based on last played artist
  return {
    headline: `Because you listened to ${lastTrack.artist}`,
    subtext: `Similar tracks and top releases in ${lastTrack.genre || 'Trending Music'}`,
    query: `${lastTrack.artist} Top Hits`,
    recommendedArtists: ['Guru Randhawa', 'Atif Aslam', 'Arijit Singh', 'Diljit Dosanjh'],
  };
}

/**
 * 3. Daily Mixes Generator (Spotify-Style Daily Mix 1 - 5)
 */
export function getDailyMixes(): DailyMixItem[] {
  return [
    {
      id: 'mix_pakistan',
      title: 'Daily Mix 1',
      subtitle: 'Pakistani Pop & Coke Studio',
      artists: 'Ali Sethi, Atif Aslam, Kaifi Khalil, Young Stunners',
      coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80',
      gradient: 'from-emerald-700 to-teal-950',
      searchQuery: 'Coke Studio Pakistan Pop',
    },
    {
      id: 'mix_punjabi',
      title: 'Daily Mix 2',
      subtitle: 'Punjabi Wave & Bass',
      artists: 'Guru Randhawa, AP Dhillon, Diljit Dosanjh, Karan Aujla',
      coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80',
      gradient: 'from-amber-600 to-orange-950',
      searchQuery: 'Punjabi Top Hits Guru Randhawa',
    },
    {
      id: 'mix_bollywood',
      title: 'Daily Mix 3',
      subtitle: 'Bollywood Romantic Melodies',
      artists: 'Arijit Singh, Pritam, Shreya Ghoshal, Anuv Jain',
      coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&q=80',
      gradient: 'from-rose-700 to-pink-950',
      searchQuery: 'Bollywood Romantic Hits Arijit Singh',
    },
    {
      id: 'mix_urdurap',
      title: 'Daily Mix 4',
      subtitle: 'Urdu Hip-Hop & Street Poetry',
      artists: 'Talha Anjum, Talhah Yunus, Umair, Faris Shafi',
      coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&q=80',
      gradient: 'from-neutral-800 to-zinc-950',
      searchQuery: 'Urdu Hip Hop Young Stunners',
    },
    {
      id: 'mix_global',
      title: 'Daily Mix 5',
      subtitle: 'Global Billboard Hot 100',
      artists: 'The Weeknd, Billie Eilish, Drake, Taylor Swift',
      coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&q=80',
      gradient: 'from-blue-700 to-indigo-950',
      searchQuery: 'Global Billboard Hits',
    }
  ];
}
