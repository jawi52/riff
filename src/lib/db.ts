import Dexie, { type EntityTable } from 'dexie';
import { Track, Playlist, SyncedLyricLine } from '../types';

export interface DBTrack extends Track {
  audioBlob?: Blob;
  addedAt: number;
}

export interface DBPlaylist extends Playlist {
  trackIds: string[];
}

export interface DBLyrics {
  trackId: string;
  syncedLyrics: SyncedLyricLine[];
  plainLyrics: string;
  cachedAt: number;
}

export interface DBHistory {
  id?: number;
  trackId: string;
  title: string;
  artist: string;
  coverUrl: string;
  listenedAt: number;
  durationSec: number;
  completed: boolean;
}

// Client Dexie Database
const db = new Dexie('RiffMusicDB') as Dexie & {
  tracks: EntityTable<DBTrack, 'id'>;
  playlists: EntityTable<DBPlaylist, 'id'>;
  lyrics: EntityTable<DBLyrics, 'trackId'>;
  history: EntityTable<DBHistory, 'id'>;
};

db.version(1).stores({
  tracks: 'id, title, artist, album, genre, sourceType, isOfflineCached, isLiked, addedAt',
  playlists: 'id, title, updatedAt',
  lyrics: 'trackId, cachedAt',
  history: '++id, trackId, artist, listenedAt'
});

export { db };

// Request persistent storage to protect offline library from browser cache eviction
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
    return await navigator.storage.persist();
  }
  return false;
}

// Retrieve storage metrics
export async function getStorageQuotaMetrics() {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
    const { quota = 0, usage = 0 } = await navigator.storage.estimate();
    return {
      usedMB: (usage / (1024 * 1024)).toFixed(1),
      quotaMB: (quota / (1024 * 1024)).toFixed(0),
      usagePercent: ((usage / (quota || 1)) * 100).toFixed(1)
    };
  }
  return { usedMB: '0', quotaMB: '0', usagePercent: '0' };
}
