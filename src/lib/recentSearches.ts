import { Track } from '../types';
import { CircularBuffer } from './ringBuffer';

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
const MAX_RECENT_ITEMS = 15;

// In-memory circular ring buffer instance for O(1) recents tracking
let recentBuffer: CircularBuffer<RecentItem> | null = null;

function getBuffer(): CircularBuffer<RecentItem> {
  if (!recentBuffer) {
    recentBuffer = new CircularBuffer<RecentItem>(MAX_RECENT_ITEMS);
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            recentBuffer.fromArray(parsed);
          }
        }
      } catch (e) {
        console.error('Failed to parse recent searches from storage:', e);
      }
    }
  }
  return recentBuffer;
}

function persistBuffer(buffer: CircularBuffer<RecentItem>): RecentItem[] {
  const items = buffer.toArray();
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      window.dispatchEvent(new CustomEvent('riff_recent_searches_updated', { detail: items }));
    } catch (e) {
      console.error('Failed to persist recent searches:', e);
    }
  }
  return items;
}

export function getRecentSearches(): RecentItem[] {
  return getBuffer().toArray();
}

export function addRecentTrack(track: Track): RecentItem[] {
  const buffer = getBuffer();
  const newItem: RecentItem = {
    id: track.id,
    title: track.title,
    subtitle: `Song • ${track.artist}`,
    coverUrl: track.coverUrl || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=120&q=80',
    type: 'track',
    trackData: track,
    timestamp: Date.now(),
  };

  buffer.pushFrontUnique(newItem, (item) => item.id);
  return persistBuffer(buffer);
}

export function addRecentQuery(query: string, topTrack?: Track): RecentItem[] {
  if (!query || !query.trim()) return getRecentSearches();
  const trimmed = query.trim();
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

  const buffer = getBuffer();
  buffer.pushFrontUnique(newItem, (item) => (item.type === 'query' ? item.title.toLowerCase() : item.id));
  return persistBuffer(buffer);
}

export function removeRecentItem(id: string): RecentItem[] {
  const buffer = getBuffer();
  buffer.removeWhere((item) => item.id === id);
  return persistBuffer(buffer);
}

export function clearAllRecentItems(): RecentItem[] {
  const buffer = getBuffer();
  buffer.clear();
  return persistBuffer(buffer);
}
