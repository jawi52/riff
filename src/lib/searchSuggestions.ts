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

// Curated top entities for instant autocomplete suggestions
const POPULAR_SEARCH_ENTITIES: { name: string; type: SuggestionType; subtitle: string; imageUrl?: string }[] = [
  { name: 'Guru Randhawa', type: 'artist', subtitle: 'Artist • Punjabi Pop', imageUrl: 'https://cdn-images.dzcdn.net/images/artist/818617d3d2eaebfeac041c2c366ff48d/500x500-000000-80-0-0.jpg' },
  { name: 'Gur Sidhu', type: 'artist', subtitle: 'Artist • Punjabi Wave', imageUrl: 'https://yt3.googleusercontent.com/BsyKIlEjZ_ry_yQ-GJsHp9I7PICEaAamzwesYyFea5gEhVIFP4WfD2s1BoLDxYN4QFe0GPkjXWm0BVMg=w800-h800-l90-rj' },
  { name: 'Gurnam Bhullar', type: 'artist', subtitle: 'Artist • Punjabi Pop', imageUrl: 'https://cdn-images.dzcdn.net/images/artist/511c97a513511eb9bb6236b2ee6a5c10/500x500-000000-80-0-0.jpg' },
  { name: 'Gurdas Maan', type: 'artist', subtitle: 'Artist • Punjabi Legend', imageUrl: 'https://cdn-images.dzcdn.net/images/artist/a7ee2ef5aee08e67a06275883d5a2d64/500x500-000000-80-0-0.jpg' },
  { name: 'Diljit Dosanjh', type: 'artist', subtitle: 'Artist • Global Punjabi', imageUrl: 'https://cdn-images.dzcdn.net/images/artist/cbb01646279f041ff34ee1ca28994784/500x500-000000-80-0-0.jpg' },
  { name: 'Karan Aujla', type: 'artist', subtitle: 'Artist • Desi Hip Hop', imageUrl: 'https://cdn-images.dzcdn.net/images/artist/7783a3ec78841ba0e9d99723ec095d3d/500x500-000000-80-0-0.jpg' },
  { name: 'Talha Anjum', type: 'artist', subtitle: 'Artist • Urdu Rap', imageUrl: 'https://cdn-images.dzcdn.net/images/artist/54e7f6e07b8b7d42cf38a0c242c748aa/500x500-000000-80-0-0.jpg' },
  { name: 'Young Stunners', type: 'artist', subtitle: 'Artist • Urdu Hip Hop', imageUrl: 'https://cdn-images.dzcdn.net/images/artist/33e9b6a12ff48792070f38eb48842600/500x500-000000-80-0-0.jpg' },
  { name: 'Atif Aslam', type: 'artist', subtitle: 'Artist • Soulful Pop', imageUrl: 'https://cdn-images.dzcdn.net/images/artist/99d7e52a818c1fa266ea7be34f59df13/500x500-000000-80-0-0.jpg' },
  { name: 'Arijit Singh', type: 'artist', subtitle: 'Artist • Bollywood Romance', imageUrl: 'https://cdn-images.dzcdn.net/images/artist/4c64deec9be4d618991206ee8bf6ffcb/500x500-000000-80-0-0.jpg' },
  { name: 'Shubh', type: 'artist', subtitle: 'Artist • Punjabi Hip Hop', imageUrl: 'https://cdn-images.dzcdn.net/images/artist/cebe8b82ff6fc6dc7b37f8f6f527c1a8/500x500-000000-80-0-0.jpg' },
  { name: 'AP Dhillon', type: 'artist', subtitle: 'Artist • Punjabi Wave', imageUrl: 'https://cdn-images.dzcdn.net/images/artist/c7104b4097fdb446bf7061d40134f0d6/500x500-000000-80-0-0.jpg' },
  { name: 'Kaifi Khalil', type: 'artist', subtitle: 'Artist • Balochi Pop', imageUrl: 'https://cdn-images.dzcdn.net/images/artist/063f90e54d8f28c2ff64c53d0e98038f/500x500-000000-80-0-0.jpg' },
  { name: 'Sidhu Moose Wala', type: 'artist', subtitle: 'Artist • Punjabi Icon', imageUrl: 'https://cdn-images.dzcdn.net/images/artist/b2b71946399b1a5105e19fc35ec54f7a/500x500-000000-80-0-0.jpg' },
  { name: 'The Weeknd', type: 'artist', subtitle: 'Artist • Global Pop', imageUrl: 'https://cdn-images.dzcdn.net/images/artist/bf5b50d536c47c7c00eb5c8c50eb6fe4/500x500-000000-80-0-0.jpg' },
  { name: 'Coke Studio', type: 'query', subtitle: 'Playlist • Pakistan Live', imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80' },
  { name: 'Bollywood Top Hits', type: 'query', subtitle: 'Genre • Romance & Melodies' },
  { name: 'Desi Hip Hop', type: 'query', subtitle: 'Genre • Rap & Bars' },
];

/**
 * Generates instant typeahead suggestions for the search panel.
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

  const max = options?.maxResults || 6;
  const suggestions: SearchSuggestion[] = [];
  const seenNames = new Set<string>();

  // 1. Match recent searches first
  if (options?.recentSearches) {
    for (const item of options.recentSearches) {
      if (suggestions.length >= max) break;
      const titleLower = item.title.toLowerCase();
      if (titleLower.includes(clean) && !seenNames.has(titleLower)) {
        seenNames.add(titleLower);
        suggestions.push({
          id: `recent_${item.id}`,
          title: item.title,
          subtitle: item.subtitle || (item.type === 'track' ? 'Song • In your recents' : 'Recent search'),
          type: item.type === 'track' ? 'track' : 'recent',
          query: item.title,
          imageUrl: item.coverUrl,
          track: item.trackData,
        });
      }
    }
  }

  // 2. Match popular static entities (Instant prefix matching)
  for (const entity of POPULAR_SEARCH_ENTITIES) {
    if (suggestions.length >= max) break;
    const nameLower = entity.name.toLowerCase();
    if (nameLower.includes(clean) && !seenNames.has(nameLower)) {
      seenNames.add(nameLower);
      suggestions.push({
        id: `entity_${nameLower.replace(/\s+/g, '_')}`,
        title: entity.name,
        subtitle: entity.subtitle,
        type: entity.type,
        query: entity.name,
        imageUrl: entity.imageUrl,
      });
    }
  }

  // 3. Match live artist results from search
  if (options?.liveArtists) {
    for (const artist of options.liveArtists) {
      if (suggestions.length >= max) break;
      const nameLower = artist.name.toLowerCase();
      if (!seenNames.has(nameLower)) {
        seenNames.add(nameLower);
        suggestions.push({
          id: `live_artist_${artist.id}`,
          title: artist.name,
          subtitle: 'Artist • From Catalog',
          type: 'artist',
          query: artist.name,
          imageUrl: artist.pictureBig || artist.pictureMedium || artist.picture,
          artist,
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
