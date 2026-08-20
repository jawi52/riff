import { Track } from '../types';

export interface RecentItem {
  id: string;
  title: string;
  subtitle: string;
  coverUrl: string;
  type: 'track' | 'artist' | 'query';
  trackData?: Track;
  timestamp: number;
}

const STORAGE_KEY = 'riff_recent_searches_v2';

export function getRecentSearches(): RecentItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (e) {
    console.error('Failed to parse recent searches:', e);
    return [];
  }
}

export function addRecentTrack(track: Track): RecentItem[] {
  try {
    const current = getRecentSearches();
    const newItem: RecentItem = {
      id: track.id,
      title: track.title,
      subtitle: `Song • ${track.artist}`,
      coverUrl: track.coverUrl || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=120&q=80',
      type: 'track',
      trackData: track,
      timestamp: Date.now(),
    };

    const updated = [newItem, ...current.filter((item) => item.id !== track.id)].slice(0, 15);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('riff_recent_searches_updated', { detail: updated }));
    return updated;
  } catch (e) {
    console.error('Failed to add recent track:', e);
    return getRecentSearches();
  }
}

export function addRecentQuery(query: string, topTrack?: Track): RecentItem[] {
  try {
    if (!query || !query.trim()) return getRecentSearches();
    const trimmed = query.trim();
    const current = getRecentSearches();
    const id = topTrack ? topTrack.id : `query_${trimmed.toLowerCase()}`;
    
    const newItem: RecentItem = topTrack
      ? {
          id: topTrack.id,
          title: topTrack.title,
          subtitle: `Song • ${topTrack.artist}`,
          coverUrl: topTrack.coverUrl || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=120&q=80',
          type: 'track',
          trackData: topTrack,
          timestamp: Date.now(),
        }
      : {
          id,
          title: trimmed,
          subtitle: 'Search query',
          coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&q=80',
          type: 'query',
          timestamp: Date.now(),
        };

    const updated = [newItem, ...current.filter((item) => item.id !== id && item.title.toLowerCase() !== trimmed.toLowerCase())].slice(0, 15);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('riff_recent_searches_updated', { detail: updated }));
    return updated;
  } catch (e) {
    console.error('Failed to add recent query:', e);
    return getRecentSearches();
  }
}

export function removeRecentItem(id: string): RecentItem[] {
  try {
    const current = getRecentSearches();
    const updated = current.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('riff_recent_searches_updated', { detail: updated }));
    return updated;
  } catch (e) {
    console.error('Failed to remove recent item:', e);
    return getRecentSearches();
  }
}

export function clearAllRecentItems(): RecentItem[] {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('riff_recent_searches_updated', { detail: [] }));
    return [];
  } catch (e) {
    console.error('Failed to clear recent items:', e);
    return [];
  }
}
