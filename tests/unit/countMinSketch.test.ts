import { describe, it, expect, beforeEach } from 'vitest';
import {
  CountMinSketch,
  HeavyHittersTracker,
  playbackTrendingTracker
} from '../../src/lib/countMinSketch';

describe('Count-Min Sketch & Heavy Hitters Streaming Analytics', () => {
  describe('CountMinSketch Algorithmic Invariants', () => {
    let sketch: CountMinSketch;

    beforeEach(() => {
      // epsilon = 0.01 (1% error), delta = 0.01 (99% confidence)
      sketch = new CountMinSketch({ epsilon: 0.01, delta: 0.01 });
    });

    it('initializes with strictly bounded dimensions and typed memory', () => {
      const dims = sketch.getDimensions();
      expect(dims.width).toBeGreaterThan(200);
      expect(dims.depth).toBeGreaterThanOrEqual(4);
      expect(dims.byteSize).toBe(dims.totalCells * 4);
      expect(sketch.getTotalCount()).toBe(0);
    });

    it('never underestimates true frequency: estimate(x) >= true_count(x)', () => {
      sketch.add('song-heavy', 50);
      sketch.add('song-mid', 25);
      sketch.add('song-light', 5);

      expect(sketch.estimate('song-heavy')).toBeGreaterThanOrEqual(50);
      expect(sketch.estimate('song-mid')).toBeGreaterThanOrEqual(25);
      expect(sketch.estimate('song-light')).toBeGreaterThanOrEqual(5);
    });

    it('satisfies theoretical upper error bound: estimate(x) <= true_count + (epsilon * N)', () => {
      const epsilon = 0.01;
      const testSketch = new CountMinSketch({ epsilon, delta: 0.01 });

      const trueCounts: Record<string, number> = {
        'hit-1': 100,
        'hit-2': 50,
        'hit-3': 20
      };

      for (const [id, count] of Object.entries(trueCounts)) {
        testSketch.add(id, count);
      }

      // Add 200 background noise items with 1 count each
      for (let i = 0; i < 200; i++) {
        testSketch.add(`noise-${i}`, 1);
      }

      const totalN = testSketch.getTotalCount();
      expect(totalN).toBe(100 + 50 + 20 + 200);

      const maxAllowedError = epsilon * totalN;

      for (const [id, trueCount] of Object.entries(trueCounts)) {
        const est = testSketch.estimate(id);
        expect(est).toBeGreaterThanOrEqual(trueCount);
        expect(est - trueCount).toBeLessThanOrEqual(maxAllowedError + 2); // allowance for rounding
      }
    });

    it('handles non-existent items and returns 0 or minimal noise', () => {
      expect(sketch.estimate('unseen-song')).toBe(0);
      sketch.add('song-a', 10);
      expect(sketch.estimate('song-b')).toBeLessThanOrEqual(10);
    });

    it('ignores invalid updates (empty string, non-positive count)', () => {
      sketch.add('', 10);
      sketch.add('song-valid', 0);
      sketch.add('song-valid', -5);
      expect(sketch.getTotalCount()).toBe(0);
    });

    it('clears state and resets total count', () => {
      sketch.add('song-1', 40);
      expect(sketch.getTotalCount()).toBe(40);

      sketch.clear();
      expect(sketch.getTotalCount()).toBe(0);
      expect(sketch.estimate('song-1')).toBe(0);
    });
  });

  describe('HeavyHittersTracker & Trending Analytics', () => {
    let tracker: HeavyHittersTracker<{ title: string }>;

    beforeEach(() => {
      tracker = new HeavyHittersTracker<{ title: string }>(
        { epsilon: 0.01, delta: 0.01 },
        50
      );
    });

    it('accurately identifies and ranks real-time heavy hitters', () => {
      // Ingest clear streaming distribution
      tracker.recordEvent('track-platinum', 500, { title: 'Viral Megahit' });
      tracker.recordEvent('track-gold', 250, { title: 'Radio Single' });
      tracker.recordEvent('track-silver', 100, { title: 'Album Deep Cut' });

      // Ingest background noise
      for (let i = 0; i < 50; i++) {
        tracker.recordEvent(`noise-track-${i}`, 2, { title: `Indie Track ${i}` });
      }

      const trending = tracker.getTrending(3);
      expect(trending.length).toBe(3);

      expect(trending[0].item).toBe('track-platinum');
      expect(trending[0].metadata?.title).toBe('Viral Megahit');
      expect(trending[0].estimatedFrequency).toBeGreaterThanOrEqual(500);

      expect(trending[1].item).toBe('track-gold');
      expect(trending[1].estimatedFrequency).toBeGreaterThanOrEqual(250);

      expect(trending[2].item).toBe('track-silver');
      expect(trending[2].estimatedFrequency).toBeGreaterThanOrEqual(100);

      // Relative share is calculated accurately
      expect(trending[0].relativeShare).toBeGreaterThan(trending[1].relativeShare);
    });

    it('prunes low-frequency candidates without losing heavy hitters', () => {
      const smallTracker = new HeavyHittersTracker(
        { epsilon: 0.01, delta: 0.01 },
        25 // small candidate capacity to force pruning
      );

      smallTracker.recordEvent('megahit', 200);

      // Ingest 60 unique noise items to trigger pruneCandidates (2 * 25 = 50 limit)
      for (let i = 0; i < 60; i++) {
        smallTracker.recordEvent(`stream-${i}`, 1);
      }

      const trending = smallTracker.getTrending(5);
      expect(trending[0].item).toBe('megahit');
      expect(trending[0].estimatedFrequency).toBeGreaterThanOrEqual(200);
    });

    it('calculates trending thresholds based on traffic fractions', () => {
      tracker.recordEvent('song-1', 400);
      tracker.recordEvent('song-2', 600);

      // Total = 1000
      // 5% threshold = 50
      expect(tracker.getTrendingThreshold(0.05)).toBe(50);
      // 20% threshold = 200
      expect(tracker.getTrendingThreshold(0.20)).toBe(200);
    });

    it('exports singleton playbackTrendingTracker', () => {
      expect(playbackTrendingTracker).toBeDefined();
      expect(playbackTrendingTracker instanceof HeavyHittersTracker).toBe(true);
    });
  });
});
