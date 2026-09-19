import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  AudioPrebufferManager,
  getNextTrackInQueue
} from '../../src/lib/audioPrebuffer';
import { Track } from '../../src/types';

// Mock dependencies
vi.mock('../../src/lib/masterAudioEngine', () => ({
  resolveMasterStream: vi.fn(async (track: Track) => {
    if (track.id === 'error-track') return '';
    if (track.id === 'throw-track') throw new Error('Network timeout');
    return `https://cdn.riff.audio/streams/${track.id}.m4a`;
  }),
  fetchSyncedLyrics: vi.fn(async (_artist: string, _title: string, trackId?: string) => {
    if (trackId === 'no-lyrics') return { synced: [] };
    return {
      synced: [
        { timeMs: 0, text: 'Intro chord' },
        { timeMs: 3500, text: 'First vocal line' }
      ],
      plain: 'Intro chord\nFirst vocal line'
    };
  }),
  isPreviewUrl: vi.fn((url: string) => url.includes('preview') || url.length < 10)
}));

vi.mock('../../src/lib/db', () => ({
  db: {
    tracks: {
      get: vi.fn(async (id: string) => {
        if (id === 'offline-cached-track') {
          return {
            id,
            title: 'Offline Song',
            artist: 'Local Band',
            audioBlob: new Blob(['audio-data'], { type: 'audio/mp3' })
          };
        }
        return null;
      })
    }
  }
}));

const mockTracks: Track[] = [
  {
    id: 'track-1',
    title: 'Midnight Echoes',
    artist: 'Luna Solaris',
    duration: 210,
    coverUrl: 'https://example.com/cover1.jpg',
    sourceType: 'saavn'
  },
  {
    id: 'track-2',
    title: 'Neon Skyline',
    artist: 'Cyberwave',
    duration: 180,
    coverUrl: 'https://example.com/cover2.jpg',
    sourceType: 'saavn'
  },
  {
    id: 'track-3',
    title: 'Drifting Clouds',
    artist: 'Aether',
    duration: 240,
    coverUrl: 'https://example.com/cover3.jpg',
    sourceType: 'saavn'
  }
];

describe('Predictive Lookahead Queue Engine (getNextTrackInQueue)', () => {
  it('should return null for empty queues', () => {
    expect(getNextTrackInQueue([], 0, false, [], 0, 'off')).toBeNull();
  });

  it('should return next track linearly when not shuffled and within bounds', () => {
    const next = getNextTrackInQueue(mockTracks, 0, false, [], 0, 'off');
    expect(next).toEqual(mockTracks[1]);

    const middleNext = getNextTrackInQueue(mockTracks, 1, false, [], 0, 'off');
    expect(middleNext).toEqual(mockTracks[2]);
  });

  it('should return null at end of linear queue when repeatMode is off', () => {
    const next = getNextTrackInQueue(mockTracks, 2, false, [], 0, 'off');
    expect(next).toBeNull();
  });

  it('should wrap to first track at end of linear queue when repeatMode is all', () => {
    const next = getNextTrackInQueue(mockTracks, 2, false, [], 0, 'all');
    expect(next).toEqual(mockTracks[0]);
  });

  it('should return the current track when repeatMode is one', () => {
    const next = getNextTrackInQueue(mockTracks, 1, false, [], 0, 'one');
    expect(next).toEqual(mockTracks[1]);
  });

  it('should return next track according to Fisher-Yates shuffle permutation', () => {
    // Shuffle order: [2, 0, 1]
    const shuffled = [2, 0, 1];
    // Currently at shuffle position 0 (playing track index 2)
    const next = getNextTrackInQueue(mockTracks, 2, true, shuffled, 0, 'off');
    // Next shuffle position is 1 -> track index 0
    expect(next).toEqual(mockTracks[0]);

    // Move to shuffle position 1 -> next is position 2 -> track index 1
    const nextNext = getNextTrackInQueue(mockTracks, 0, true, shuffled, 1, 'off');
    expect(nextNext).toEqual(mockTracks[1]);
  });

  it('should handle end of shuffle queue with repeatMode all vs off', () => {
    const shuffled = [2, 0, 1];
    // At last position of shuffle
    const endOff = getNextTrackInQueue(mockTracks, 1, true, shuffled, 2, 'off');
    expect(endOff).toBeNull();

    const endAll = getNextTrackInQueue(mockTracks, 1, true, shuffled, 2, 'all');
    expect(endAll).toEqual(mockTracks[2]); // first track in shuffled order
  });
});

describe('AudioPrebufferManager', () => {
  let manager: AudioPrebufferManager;

  beforeEach(() => {
    manager = AudioPrebufferManager.getInstance();
    manager.clear();
  });

  it('should prewarm and cache stream URL and synced lyrics for upcoming track', async () => {
    const success = await manager.prewarm(mockTracks[0]);
    expect(success).toBe(true);

    expect(manager.isPrebuffered('track-1')).toBe(true);
    const peeked = manager.peek('track-1');
    expect(peeked).not.toBeNull();
    expect(peeked?.status).toBe('ready');
    expect(peeked?.streamUrl).toBe('https://cdn.riff.audio/streams/track-1.m4a');
    expect(peeked?.syncedLyrics?.length).toBe(2);
    expect(peeked?.syncedLyrics?.[0].text).toBe('Intro chord');
  });

  it('should be idempotent and coalesce concurrent prewarm requests for the same track', async () => {
    const p1 = manager.prewarm(mockTracks[1]);
    const p2 = manager.prewarm(mockTracks[1]);

    const [res1, res2] = await Promise.all([p1, p2]);
    expect(res1).toBe(true);
    expect(res2).toBe(true);

    expect(manager.size()).toBe(1);
  });

  it('should consume pre-buffered track for instant 0ms hand-off and delete from cache', async () => {
    await manager.prewarm(mockTracks[0]);
    expect(manager.isPrebuffered('track-1')).toBe(true);

    const consumed = manager.consume('track-1');
    expect(consumed).not.toBeNull();
    expect(consumed?.trackId).toBe('track-1');
    expect(consumed?.streamUrl).toBe('https://cdn.riff.audio/streams/track-1.m4a');

    // Consumed item should no longer be in cache
    expect(manager.isPrebuffered('track-1')).toBe(false);
    expect(manager.consume('track-1')).toBeNull();
  });

  it('should return null when consuming a track that is not pre-buffered', () => {
    expect(manager.consume('non-existent-track')).toBeNull();
  });

  it('should respect memory bounds and evict oldest entry when capacity is reached', async () => {
    await manager.prewarm(mockTracks[0]); // track-1
    await manager.prewarm(mockTracks[1]); // track-2
    expect(manager.size()).toBe(2);

    // Prewarming a 3rd track should evict oldest (track-1)
    await manager.prewarm(mockTracks[2]); // track-3
    expect(manager.size()).toBeLessThanOrEqual(2);
    expect(manager.isPrebuffered('track-1')).toBe(false);
    expect(manager.isPrebuffered('track-3')).toBe(true);
  });

  it('should gracefully handle stream resolution failures', async () => {
    const failTrack: Track = {
      id: 'error-track',
      title: 'Missing Track',
      artist: 'Unknown',
      duration: 100,
      coverUrl: '',
      sourceType: 'saavn'
    };

    const res = await manager.prewarm(failTrack);
    expect(res).toBe(false);
    expect(manager.isPrebuffered('error-track')).toBe(false);

    const peeked = manager.peek('error-track');
    expect(peeked?.status).toBe('error');
  });

  it('should preserve existing synced lyrics if track already contains them', async () => {
    const trackWithLyrics: Track = {
      ...mockTracks[0],
      id: 'track-with-own-lyrics',
      syncedLyrics: [{ timeMs: 1200, text: 'Pre-existing lyric line' }],
      plainLyrics: 'Pre-existing lyric line'
    };

    await manager.prewarm(trackWithLyrics);
    const item = manager.peek('track-with-own-lyrics');
    expect(item?.syncedLyrics?.[0].text).toBe('Pre-existing lyric line');
  });

  it('should clear all cached items cleanly', async () => {
    await manager.prewarm(mockTracks[0]);
    await manager.prewarm(mockTracks[1]);
    expect(manager.size()).toBe(2);

    manager.clear();
    expect(manager.size()).toBe(0);
    expect(manager.isPrebuffered('track-1')).toBe(false);
    expect(manager.isPrebuffered('track-2')).toBe(false);
  });
});
