import { describe, it, expect, beforeEach } from 'vitest';
import { IndexableSkipList, AudioPlaylistQueue } from '../../src/lib/skipList';
import { Track } from '../../src/types';

describe('Augmented Indexable Skip List (Pugh 1990) for Playlist & Queue', () => {
  describe('IndexableSkipList Construction & Sequential Invariants', () => {
    let list: IndexableSkipList<string>;

    beforeEach(() => {
      list = new IndexableSkipList<string>(16, 0.5);
    });

    it('initializes an empty skip list', () => {
      expect(list.size()).toBe(0);
      expect(list.getByRank(0)).toBeNull();
      expect(list.getByRank(-1)).toBeNull();
      expect(list.getByRank(10)).toBeNull();
      expect(list.getRank('none')).toBe(-1);
      expect(list.toArray()).toEqual([]);
      expect(list.toArrayReverse()).toEqual([]);
    });

    it('appends elements sequentially and accesses them by rank in O(log N)', () => {
      const items = ['Track 0', 'Track 1', 'Track 2', 'Track 3', 'Track 4'];
      for (let i = 0; i < items.length; i++) {
        list.insert(`id-${i}`, items[i]);
      }

      expect(list.size()).toBe(5);
      for (let i = 0; i < items.length; i++) {
        expect(list.getByRank(i)).toBe(items[i]);
        expect(list.getRank(`id-${i}`)).toBe(i);
      }

      expect(list.toArray()).toEqual(items);
      expect(list.toArrayReverse()).toEqual([...items].reverse());
    });

    it('inserts at arbitrary ranks (head, middle, tail)', () => {
      // Start with [B, D]
      list.insert('b', 'B');
      list.insert('d', 'D');

      // Prepend 'A' at rank 0: [A, B, D]
      list.insert('a', 'A', 0);
      expect(list.toArray()).toEqual(['A', 'B', 'D']);
      expect(list.getByRank(0)).toBe('A');

      // Insert 'C' at rank 2: [A, B, C, D]
      list.insert('c', 'C', 2);
      expect(list.toArray()).toEqual(['A', 'B', 'C', 'D']);
      expect(list.getByRank(2)).toBe('C');

      // Insert 'E' at rank 4 (tail): [A, B, C, D, E]
      list.insert('e', 'E', 4);
      expect(list.toArray()).toEqual(['A', 'B', 'C', 'D', 'E']);
      expect(list.getByRank(4)).toBe('E');
      expect(list.size()).toBe(5);
    });
  });

  describe('Deletions by Rank and by ID', () => {
    let list: IndexableSkipList<number>;

    beforeEach(() => {
      list = new IndexableSkipList<number>();
      for (let i = 0; i < 6; i++) {
        list.insert(`item-${i}`, i * 10);
      }
      // [0, 10, 20, 30, 40, 50]
    });

    it('deletes from the head (rank 0) and maintains backward pointers', () => {
      const removed = list.deleteByRank(0);
      expect(removed).toBe(0);
      expect(list.size()).toBe(5);
      expect(list.toArray()).toEqual([10, 20, 30, 40, 50]);
      expect(list.getByRank(0)).toBe(10);
    });

    it('deletes from the tail (last rank)', () => {
      const removed = list.deleteByRank(5);
      expect(removed).toBe(50);
      expect(list.size()).toBe(5);
      expect(list.toArray()).toEqual([0, 10, 20, 30, 40]);
      expect(list.toArrayReverse()).toEqual([40, 30, 20, 10, 0]);
    });

    it('deletes from the middle (rank 2)', () => {
      const removed = list.deleteByRank(2);
      expect(removed).toBe(20);
      expect(list.size()).toBe(5);
      expect(list.toArray()).toEqual([0, 10, 30, 40, 50]);
      expect(list.getByRank(2)).toBe(30);
    });

    it('deletes by ID', () => {
      const removed = list.deleteById('item-3');
      expect(removed).toBe(30);
      expect(list.size()).toBe(5);
      expect(list.getRank('item-3')).toBe(-1);
      expect(list.toArray()).toEqual([0, 10, 20, 40, 50]);
    });

    it('returns null on invalid rank or ID deletion', () => {
      expect(list.deleteByRank(-1)).toBeNull();
      expect(list.deleteByRank(100)).toBeNull();
      expect(list.deleteById('non-existent')).toBeNull();
    });
  });

  describe('Drag-and-Drop Reordering: move(fromRank, toRank)', () => {
    let list: IndexableSkipList<string>;

    beforeEach(() => {
      list = new IndexableSkipList<string>();
      ['A', 'B', 'C', 'D', 'E'].forEach((v) => list.insert(v, v));
    });

    it('moves an element from the beginning to the end', () => {
      // Move 'A' (rank 0) to rank 4 -> [B, C, D, E, A]
      const ok = list.move(0, 4);
      expect(ok).toBe(true);
      expect(list.toArray()).toEqual(['B', 'C', 'D', 'E', 'A']);
      expect(list.getByRank(4)).toBe('A');
    });

    it('moves an element from the end to the beginning', () => {
      // Move 'E' (rank 4) to rank 0 -> [E, A, B, C, D]
      const ok = list.move(4, 0);
      expect(ok).toBe(true);
      expect(list.toArray()).toEqual(['E', 'A', 'B', 'C', 'D']);
      expect(list.getByRank(0)).toBe('E');
    });

    it('moves an element within the middle forwards and backwards', () => {
      // Move 'B' (rank 1) to rank 3 -> [A, C, D, B, E]
      list.move(1, 3);
      expect(list.toArray()).toEqual(['A', 'C', 'D', 'B', 'E']);

      // Move 'B' back from rank 3 to rank 1 -> [A, B, C, D, E]
      list.move(3, 1);
      expect(list.toArray()).toEqual(['A', 'B', 'C', 'D', 'E']);
    });

    it('rejects invalid or identity moves', () => {
      expect(list.move(2, 2)).toBe(false);
      expect(list.move(-1, 2)).toBe(false);
      expect(list.move(1, 10)).toBe(false);
    });
  });

  describe('AudioPlaylistQueue Integration', () => {
    const mockTracks: Track[] = [
      { id: 'track-1', title: 'Song 1', artist: 'Artist A', duration: 180 } as Track,
      { id: 'track-2', title: 'Song 2', artist: 'Artist B', duration: 210 } as Track,
      { id: 'track-3', title: 'Song 3', artist: 'Artist C', duration: 195 } as Track,
    ];

    let queue: AudioPlaylistQueue;

    beforeEach(() => {
      queue = new AudioPlaylistQueue(mockTracks);
    });

    it('initializes with tracks and starts at index 0', () => {
      expect(queue.size()).toBe(3);
      expect(queue.getCurrentIndex()).toBe(0);
      expect(queue.getCurrentTrack()?.id).toBe('track-1');
    });

    it('navigates forward and backward sequentially in O(1)', () => {
      const t2 = queue.nextTrack();
      expect(t2?.id).toBe('track-2');
      expect(queue.getCurrentIndex()).toBe(1);

      const t3 = queue.nextTrack();
      expect(t3?.id).toBe('track-3');
      expect(queue.getCurrentIndex()).toBe(2);

      // Boundary check
      expect(queue.nextTrack()).toBeNull();

      // Backwards
      const prev = queue.previousTrack();
      expect(prev?.id).toBe('track-2');
      expect(queue.getCurrentIndex()).toBe(1);
    });

    it('implements playNext (queuing immediately after current playing track)', () => {
      // Currently at index 0 (track-1)
      const urgentTrack = { id: 'urgent-track', title: 'Breaking Hit', artist: 'Star' } as Track;
      queue.playNext(urgentTrack);

      expect(queue.size()).toBe(4);
      // Next track must now be urgent-track
      expect(queue.getTracks().map((t) => t.id)).toEqual([
        'track-1',
        'urgent-track',
        'track-2',
        'track-3',
      ]);
    });

    it('reorders queue and automatically adjusts current playing index', () => {
      // Set playing to index 1 (track-2)
      queue.setCurrentIndex(1);
      expect(queue.getCurrentTrack()?.id).toBe('track-2');

      // Move track-3 (index 2) to index 0: [track-3, track-1, track-2]
      // Since track-3 moved before current index 1, current index shifts to 2
      queue.reorder(2, 0);

      expect(queue.getTracks().map((t) => t.id)).toEqual(['track-3', 'track-1', 'track-2']);
      expect(queue.getCurrentIndex()).toBe(2);
      expect(queue.getCurrentTrack()?.id).toBe('track-2');
    });

    it('removes tracks by index and by ID', () => {
      queue.removeById('track-2');
      expect(queue.size()).toBe(2);
      expect(queue.getTracks().map((t) => t.id)).toEqual(['track-1', 'track-3']);
    });
  });
});
