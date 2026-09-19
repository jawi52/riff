import { describe, it, expect, beforeEach } from 'vitest';
import { IntervalTree } from '../../src/lib/intervalTree';
import { SyncedLyricLine } from '../../src/types';

describe('Augmented Interval Tree (CLRS Chapter 14) for Lyric Sync & Seeking', () => {
  let tree: IntervalTree<string>;

  beforeEach(() => {
    tree = new IntervalTree<string>();
  });

  describe('Tree Construction & AVL Self-Balancing', () => {
    it('initializes an empty tree', () => {
      expect(tree.size()).toBe(0);
      expect(tree.findActive(100)).toBeNull();
      expect(tree.findOverlapping(0, 1000)).toEqual([]);
      expect(tree.getAll()).toEqual([]);
    });

    it('handles sequential insertions with self-balancing rotations', () => {
      // Ascending insertions (would cause an unbalanced right-skewed tree without AVL balancing)
      const intervals = [
        { start: 1000, end: 4000, text: 'Line 1' },
        { start: 4000, end: 7000, text: 'Line 2' },
        { start: 7000, end: 11000, text: 'Line 3' },
        { start: 11000, end: 15000, text: 'Line 4' },
        { start: 15000, end: 18000, text: 'Line 5' },
        { start: 18000, end: 22000, text: 'Line 6' },
        { start: 22000, end: 26000, text: 'Line 7' },
      ];

      for (const item of intervals) {
        tree.insert(item.start, item.end, item.text);
      }

      expect(tree.size()).toBe(7);

      // In-order traversal must yield monotonically increasing start times
      const all = tree.getAll();
      expect(all.length).toBe(7);
      for (let i = 0; i < all.length - 1; i++) {
        expect(all[i].start).toBeLessThanOrEqual(all[i + 1].start);
      }
    });

    it('handles reverse (descending) insertions with LL rotations', () => {
      const intervals = [
        { start: 50000, end: 55000, text: 'Chorus End' },
        { start: 40000, end: 45000, text: 'Chorus Mid' },
        { start: 30000, end: 35000, text: 'Chorus Start' },
        { start: 20000, end: 25000, text: 'Pre-Chorus' },
      ];

      for (const item of intervals) {
        tree.insert(item.start, item.end, item.text);
      }

      expect(tree.size()).toBe(4);
      const all = tree.getAll();
      expect(all.map((n) => n.data)).toEqual([
        'Pre-Chorus',
        'Chorus Start',
        'Chorus Mid',
        'Chorus End',
      ]);
    });

    it('safely normalizes intervals where end < start', () => {
      tree.insert(5000, 2000, 'Inverted Interval');
      const active = tree.findActive(5000);
      expect(active).not.toBeNull();
      expect(active?.start).toBe(5000);
      expect(active?.end).toBe(5000); // Normalized to Math.max(start, end)
    });
  });

  describe('Point Stabbing Query: findActive(timeMs)', () => {
    beforeEach(() => {
      // Typical timed lyrics layout with small gaps
      tree.insert(0, 3000, 'Intro acoustic guitar');
      tree.insert(3500, 6000, 'First verse opening');
      tree.insert(6200, 9500, 'Second verse line');
      tree.insert(10000, 14000, 'Pre-chorus crescendo');
      tree.insert(14000, 18000, 'Explosive chorus!');
    });

    it('stabs exactly inside active intervals in O(log N)', () => {
      expect(tree.findActive(1500)?.data).toBe('Intro acoustic guitar');
      expect(tree.findActive(4200)?.data).toBe('First verse opening');
      expect(tree.findActive(8000)?.data).toBe('Second verse line');
      expect(tree.findActive(12500)?.data).toBe('Pre-chorus crescendo');
      expect(tree.findActive(16000)?.data).toBe('Explosive chorus!');
    });

    it('matches boundary timestamps inclusive of [start, end]', () => {
      expect(tree.findActive(0)?.data).toBe('Intro acoustic guitar');
      expect(tree.findActive(3000)?.data).toBe('Intro acoustic guitar');
      expect(tree.findActive(3500)?.data).toBe('First verse opening');
      expect(tree.findActive(6000)?.data).toBe('First verse opening');
    });

    it('returns null during silence / gaps between intervals', () => {
      // Gap between 3000 and 3500
      expect(tree.findActive(3200)).toBeNull();
      // Gap between 6000 and 6200
      expect(tree.findActive(6100)).toBeNull();
      // Gap between 9500 and 10000
      expect(tree.findActive(9800)).toBeNull();
    });

    it('returns null for times before the first interval and after the last interval', () => {
      expect(tree.findActive(-100)).toBeNull();
      expect(tree.findActive(20000)).toBeNull();
    });
  });

  describe('Range Overlap Query: findOverlapping(startMs, endMs)', () => {
    beforeEach(() => {
      tree.insert(1000, 3000, 'Line A');
      tree.insert(2500, 4500, 'Line B (overlaps A & C)');
      tree.insert(4000, 6000, 'Line C');
      tree.insert(8000, 10000, 'Line D');
      tree.insert(12000, 15000, 'Line E');
    });

    it('finds all intervals overlapping a wide scrubber view window', () => {
      // Window [2000, 5000] should overlap Line A (1000-3000), Line B (2500-4500), Line C (4000-6000)
      const results = tree.findOverlapping(2000, 5000);
      expect(results.length).toBe(3);
      expect(results.map((r) => r.data)).toEqual(['Line A', 'Line B (overlaps A & C)', 'Line C']);
    });

    it('returns a single interval when window is strictly within it', () => {
      const results = tree.findOverlapping(8500, 9500);
      expect(results.length).toBe(1);
      expect(results[0].data).toBe('Line D');
    });

    it('returns empty array when window falls entirely within a gap', () => {
      const results = tree.findOverlapping(6500, 7500);
      expect(results).toEqual([]);
    });

    it('returns empty array when window is completely out of bounds', () => {
      expect(tree.findOverlapping(-5000, -100)).toEqual([]);
      expect(tree.findOverlapping(20000, 30000)).toEqual([]);
    });

    it('handles inverted window range gracefully', () => {
      // startMs > endMs: findOverlapping safely normalizes
      const results = tree.findOverlapping(5000, 2000);
      expect(results.length).toBe(3);
    });
  });

  describe('Lyric Synchronizer Factory: IntervalTree.fromLyrics()', () => {
    const rawLyrics: SyncedLyricLine[] = [
      { timeMs: 0, text: "Is this the real life?" },
      { timeMs: 3200, text: "Is this just fantasy?" },
      { timeMs: 6800, text: "Caught in a landslide" },
      { timeMs: 9500, text: "No escape from reality" },
      { timeMs: 14000, text: "Open your eyes..." },
    ];

    it('builds an augmented interval tree from raw SyncedLyricLine items', () => {
      const lyricTree = IntervalTree.fromLyrics(rawLyrics);
      expect(lyricTree.size()).toBe(5);

      // Line 1 should end when Line 2 starts (3200)
      const line1 = lyricTree.findActive(1500);
      expect(line1?.data).toBe("Is this the real life?");
      expect(line1?.start).toBe(0);
      expect(line1?.end).toBe(3200);

      // Line 2: 3200 to 6800
      const line2 = lyricTree.findActive(5000);
      expect(line2?.data).toBe("Is this just fantasy?");

      // Line 4: 9500 to 14000
      const line4 = lyricTree.findActive(11000);
      expect(line4?.data).toBe("No escape from reality");

      // Final line should use defaultLineDurationMs (default 3500)
      const line5 = lyricTree.findActive(16000);
      expect(line5?.data).toBe("Open your eyes...");
      expect(line5?.end).toBe(14000 + 3500);
    });

    it('supports rapid scrubber queries during audio seeking', () => {
      const lyricTree = IntervalTree.fromLyrics(rawLyrics);

      // Scrubber window from 2000ms to 7000ms (preview window)
      const previewLyrics = lyricTree.findOverlapping(2000, 7000);
      expect(previewLyrics.length).toBe(3);
      expect(previewLyrics.map((l) => l.data)).toEqual([
        "Is this the real life?",
        "Is this just fantasy?",
        "Caught in a landslide",
      ]);
    });

    it('handles empty lyrics array safely', () => {
      const emptyTree = IntervalTree.fromLyrics([]);
      expect(emptyTree.size()).toBe(0);
      expect(emptyTree.findActive(500)).toBeNull();
      expect(emptyTree.findOverlapping(0, 1000)).toEqual([]);
    });

    it('handles single-line lyric safely with fallback duration', () => {
      const single = [{ timeMs: 5000, text: "One hit wonder" }];
      const treeSingle = IntervalTree.fromLyrics(single, 4000);

      expect(treeSingle.size()).toBe(1);
      const active = treeSingle.findActive(7000);
      expect(active?.data).toBe("One hit wonder");
      expect(active?.start).toBe(5000);
      expect(active?.end).toBe(9000);
    });
  });

  describe('Lifecycle & State Reset', () => {
    it('clears all nodes correctly', () => {
      tree.insert(100, 200, 'Test 1');
      tree.insert(300, 400, 'Test 2');
      expect(tree.size()).toBe(2);

      tree.clear();
      expect(tree.size()).toBe(0);
      expect(tree.findActive(150)).toBeNull();
      expect(tree.getAll()).toEqual([]);
    });
  });
});
