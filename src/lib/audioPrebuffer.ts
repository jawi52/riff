import { Track, SyncedLyricLine } from '../types';
import { db } from './db';
import { resolveMasterStream, fetchSyncedLyrics, isPreviewUrl } from './masterAudioEngine';

export interface PrebufferedItem {
  trackId: string;
  streamUrl: string;
  syncedLyrics?: SyncedLyricLine[];
  plainLyrics?: string;
  audioElement?: HTMLAudioElement | null;
  status: 'resolving' | 'ready' | 'error';
  timestamp: number;
}

/**
 * Deterministically computes the next track in the playback sequence
 * taking into account linear queue, Fisher-Yates shuffle order, and repeat mode.
 */
export function getNextTrackInQueue(
  queue: Track[],
  queueIndex: number,
  isShuffled: boolean,
  shuffledIndices: number[],
  shufflePosition: number,
  repeatMode: 'off' | 'all' | 'one'
): Track | null {
  if (!queue || queue.length === 0) return null;

  if (repeatMode === 'one') {
    return queue[queueIndex] || null;
  }

  if (isShuffled && shuffledIndices.length > 0) {
    const nextShufflePos = shufflePosition + 1;
    if (nextShufflePos < shuffledIndices.length) {
      const idx = shuffledIndices[nextShufflePos];
      return queue[idx] || null;
    }
    if (repeatMode === 'all') {
      const idx = shuffledIndices[0];
      return queue[idx] || null;
    }
    return null;
  }

  const nextIdx = queueIndex + 1;
  if (nextIdx < queue.length) {
    return queue[nextIdx] || null;
  }
  if (repeatMode === 'all') {
    return queue[0] || null;
  }
  return null;
}

/**
 * High-Performance Predictive Audio Pre-buffering Manager
 *
 * Resolves upcoming track streams, pre-loads initial audio frames in an offscreen
 * audio element, and pre-fetches synced lyrics ahead of time. Enables 0-second
 * gapless track transitions.
 */
export class AudioPrebufferManager {
  private static instance: AudioPrebufferManager;
  private cache: Map<string, PrebufferedItem> = new Map();
  private inFlightResolutions: Map<string, Promise<boolean>> = new Map();
  private maxItems = 2;

  public static getInstance(): AudioPrebufferManager {
    if (!AudioPrebufferManager.instance) {
      AudioPrebufferManager.instance = new AudioPrebufferManager();
    }
    return AudioPrebufferManager.instance;
  }

  /**
   * Prewarms the stream URL, media buffer, and lyrics for an upcoming track.
   * Idempotent: returns existing promise if already in flight.
   */
  public async prewarm(track: Track): Promise<boolean> {
    if (!track || !track.id) return false;

    // If already ready, return immediately
    const existing = this.cache.get(track.id);
    if (existing && existing.status === 'ready') {
      return true;
    }

    // If currently resolving, return the active promise
    if (this.inFlightResolutions.has(track.id)) {
      return this.inFlightResolutions.get(track.id)!;
    }

    const resolutionPromise = (async () => {
      this.cache.set(track.id, {
        trackId: track.id,
        streamUrl: '',
        status: 'resolving',
        timestamp: Date.now()
      });

      try {
        let streamUrl = '';

        // 1. Check IndexedDB cached blob (offline storage)
        try {
          if (typeof db !== 'undefined' && db.tracks) {
            const cachedTrack = await db.tracks.get(track.id);
            if (cachedTrack?.audioBlob && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
              streamUrl = URL.createObjectURL(cachedTrack.audioBlob);
            }
          }
        } catch {
          // Ignore Dexie errors in non-browser or test envs
        }

        // 2. Resolve via Master Stream Engine if not cached offline
        if (!streamUrl || isPreviewUrl(streamUrl)) {
          streamUrl = await resolveMasterStream(track);
        }

        if (!streamUrl) {
          const item = this.cache.get(track.id);
          if (item) item.status = 'error';
          return false;
        }

        // 3. Proactively fetch synced lyrics if not already present
        let lyricsData: { synced?: SyncedLyricLine[]; plain?: string } = {};
        if (track.syncedLyrics && track.syncedLyrics.length > 0) {
          lyricsData = { synced: track.syncedLyrics, plain: track.plainLyrics };
        } else {
          try {
            const fetched = await fetchSyncedLyrics(track.artist, track.title, track.id);
            if (fetched && fetched.synced && fetched.synced.length > 0) {
              lyricsData = fetched;
            }
          } catch {
            // Lyrics fetch failure is non-fatal
          }
        }

        // 4. Pre-fill browser media cache via offscreen Audio element if supported
        let preloadAudio: HTMLAudioElement | null = null;
        if (typeof Audio !== 'undefined') {
          try {
            preloadAudio = new Audio();
            preloadAudio.preload = 'auto';
            preloadAudio.src = streamUrl;
            preloadAudio.load();
          } catch {
            preloadAudio = null;
          }
        }

        // 5. Enforce cache capacity limit (evict oldest non-current entry)
        while (this.cache.size > this.maxItems) {
          let evicted = false;
          for (const [key] of this.cache.entries()) {
            if (key !== track.id) {
              this.evict(key);
              evicted = true;
              break;
            }
          }
          if (!evicted) break;
        }

        this.cache.set(track.id, {
          trackId: track.id,
          streamUrl,
          syncedLyrics: lyricsData.synced,
          plainLyrics: lyricsData.plain,
          audioElement: preloadAudio,
          status: 'ready',
          timestamp: Date.now()
        });

        return true;
      } catch (err) {
        console.warn(`[AudioPrebuffer] Prewarming failed for track ${track.id}:`, err);
        const item = this.cache.get(track.id);
        if (item) item.status = 'error';
        return false;
      } finally {
        this.inFlightResolutions.delete(track.id);
      }
    })();

    this.inFlightResolutions.set(track.id, resolutionPromise);
    return resolutionPromise;
  }

  /**
   * Consumes a pre-buffered track for instant playback.
   * Hands off resolved data and cleans up preload audio reference.
   */
  public consume(trackId: string): PrebufferedItem | null {
    const item = this.cache.get(trackId);
    if (!item || item.status !== 'ready') {
      return null;
    }

    // Ownership hand-off: remove from cache
    this.cache.delete(trackId);

    // Clean up offscreen preload audio reference (the chunks are already in browser media cache)
    if (item.audioElement) {
      try {
        item.audioElement.src = '';
        item.audioElement.load();
      } catch {}
      item.audioElement = null;
    }

    return item;
  }

  /**
   * Peeks at a pre-buffered item without removing it.
   */
  public peek(trackId: string): PrebufferedItem | null {
    return this.cache.get(trackId) || null;
  }

  /**
   * Checks if a track is pre-buffered and ready for playback.
   */
  public isPrebuffered(trackId: string): boolean {
    const item = this.cache.get(trackId);
    return !!item && item.status === 'ready';
  }

  /**
   * Evicts a track from the prebuffer cache and releases offscreen audio memory.
   */
  public evict(trackId: string): void {
    const item = this.cache.get(trackId);
    if (item?.audioElement) {
      try {
        item.audioElement.src = '';
        item.audioElement.load();
      } catch {}
      item.audioElement = null;
    }
    this.cache.delete(trackId);
    this.inFlightResolutions.delete(trackId);
  }

  /**
   * Clears the entire prebuffer cache and resets in-flight resolutions.
   */
  public clear(): void {
    for (const [id] of this.cache) {
      this.evict(id);
    }
    this.cache.clear();
    this.inFlightResolutions.clear();
  }

  /**
   * Returns current cache size.
   */
  public size(): number {
    return this.cache.size;
  }
}

export const audioPrebufferManager = AudioPrebufferManager.getInstance();
