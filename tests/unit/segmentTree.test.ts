import { describe, it, expect } from 'vitest';
import { AudioSegmentTree, WaveformAnalyzer } from '../../src/lib/segmentTree';

describe('AudioSegmentTree with Lazy Propagation for Range Waveform Metrics', () => {
  describe('Tree Construction & Basic Range Queries', () => {
    it('initializes and computes exact range metrics for small buffers', () => {
      // Samples: [-0.5, 0.2, 0.8, -0.9, 0.4]
      const samples = new Float32Array([-0.5, 0.2, 0.8, -0.9, 0.4]);
      const tree = new AudioSegmentTree(samples);

      expect(tree.size()).toBe(5);

      const metrics = tree.queryRange(0, 4);
      expect(metrics.min).toBeCloseTo(-0.9, 4);
      expect(metrics.max).toBeCloseTo(0.8, 4);
      expect(metrics.peak).toBeCloseTo(0.9, 4); // max(|-0.9|, |0.8|)

      // Sum: -0.5 + 0.2 + 0.8 - 0.9 + 0.4 = 0.0
      expect(metrics.mean).toBeCloseTo(0.0, 4);

      // Sum of squares: 0.25 + 0.04 + 0.64 + 0.81 + 0.16 = 1.90
      // RMS: sqrt(1.90 / 5) = sqrt(0.38) ~ 0.61644
      const expectedRMS = Math.sqrt((0.25 + 0.04 + 0.64 + 0.81 + 0.16) / 5);
      expect(metrics.rms).toBeCloseTo(expectedRMS, 4);

      // Crest Factor: peak / rms
      expect(metrics.crestFactor).toBeCloseTo(0.9 / expectedRMS, 4);
      expect(metrics.count).toBe(5);
    });

    it('returns exact point metrics for single-sample range queries [i, i]', () => {
      const data = [0.1, -0.7, 0.35, 0.99];
      const tree = new AudioSegmentTree(data);

      for (let i = 0; i < data.length; i++) {
        const q = tree.queryRange(i, i);
        expect(q.min).toBeCloseTo(data[i], 5);
        expect(q.max).toBeCloseTo(data[i], 5);
        expect(q.peak).toBeCloseTo(Math.abs(data[i]), 5);
        expect(q.rms).toBeCloseTo(Math.abs(data[i]), 5);
        expect(q.count).toBe(1);
      }
    });

    it('computes arbitrary sub-range queries [L, R] accurately', () => {
      const data = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8];
      const tree = new AudioSegmentTree(data);

      // Range [2, 5]: [0.3, 0.4, 0.5, 0.6]
      const sub = tree.queryRange(2, 5);
      expect(sub.min).toBeCloseTo(0.3, 5);
      expect(sub.max).toBeCloseTo(0.6, 5);
      expect(sub.mean).toBeCloseTo((0.3 + 0.4 + 0.5 + 0.6) / 4, 5);
      expect(sub.count).toBe(4);
    });
  });

  describe('Lazy Propagation: Dynamic Gain Range Automation', () => {
    it('applies range gain multiplication in O(log N) without eager buffer mutation', () => {
      const data = [0.1, 0.2, 0.3, 0.4, 0.5];
      const tree = new AudioSegmentTree(data);

      // Boost range [1, 3] by 2.0x (elements 0.2, 0.3, 0.4 -> 0.4, 0.6, 0.8)
      tree.applyGainRange(1, 3, 2.0);

      // Unmodified boundary elements
      expect(tree.queryRange(0, 0).max).toBeCloseTo(0.1, 5);
      expect(tree.queryRange(4, 4).max).toBeCloseTo(0.5, 5);

      // Modified sub-range
      const boosted = tree.queryRange(1, 3);
      expect(boosted.min).toBeCloseTo(0.4, 5);
      expect(boosted.max).toBeCloseTo(0.8, 5);
      expect(boosted.mean).toBeCloseTo((0.4 + 0.6 + 0.8) / 3, 5);

      // Global range reflecting the new maximum
      const full = tree.queryRange(0, 4);
      expect(full.max).toBeCloseTo(0.8, 5);
    });

    it('correctly inverts phase when applying negative gain factor', () => {
      const data = [0.2, 0.8, -0.4];
      const tree = new AudioSegmentTree(data);

      // Phase inversion by -1.0x on full range
      tree.applyGainRange(0, 2, -1.0);

      const inverted = tree.queryRange(0, 2);
      // Original max was 0.8 -> new min should be -0.8
      // Original min was -0.4 -> new max should be +0.4
      expect(inverted.min).toBeCloseTo(-0.8, 5);
      expect(inverted.max).toBeCloseTo(0.4, 5);
      expect(inverted.peak).toBeCloseTo(0.8, 5);
    });

    it('applies additive DC offset across ranges', () => {
      const data = [0.0, 0.1, 0.2];
      const tree = new AudioSegmentTree(data);

      // Add DC bias +0.05
      tree.applyOffsetRange(0, 2, 0.05);

      const offsetMetrics = tree.queryRange(0, 2);
      expect(offsetMetrics.min).toBeCloseTo(0.05, 5);
      expect(offsetMetrics.max).toBeCloseTo(0.25, 5);
      expect(offsetMetrics.mean).toBeCloseTo((0.05 + 0.15 + 0.25) / 3, 5);
    });

    it('correctly flattens chained lazy updates via toArray()', () => {
      const data = [1.0, 2.0, 3.0, 4.0, 5.0];
      const tree = new AudioSegmentTree(data);

      // Double all elements: [2, 4, 6, 8, 10]
      tree.applyGainRange(0, 4, 2.0);

      // Add 1.0 to range [1, 3]: [2, 5, 7, 9, 10]
      tree.applyOffsetRange(1, 3, 1.0);

      const exported = tree.toArray();
      expect(Array.from(exported)).toEqual([2.0, 5.0, 7.0, 9.0, 10.0]);
    });
  });

  describe('Point Updates & Real-Time Adjustments', () => {
    it('updates single sample value and recalculates ancestor path', () => {
      const data = [0.1, 0.2, 0.3, 0.4];
      const tree = new AudioSegmentTree(data);

      expect(tree.queryRange(0, 3).max).toBeCloseTo(0.4, 5);

      // Spike at index 1: 0.2 -> 1.5
      tree.pointUpdate(1, 1.5);

      expect(tree.queryRange(1, 1).max).toBeCloseTo(1.5, 5);
      expect(tree.queryRange(0, 3).max).toBeCloseTo(1.5, 5);
      expect(tree.queryRange(0, 3).peak).toBeCloseTo(1.5, 5);
    });
  });

  describe('WaveformAnalyzer Downsampled Overview', () => {
    it('generates multi-bucket waveform overview for 60 FPS viewport rendering', () => {
      // 1000 synthetic audio samples
      const samples = new Float32Array(1000);
      for (let i = 0; i < 1000; i++) {
        samples[i] = Math.sin((2 * Math.PI * 5 * i) / 1000);
      }

      const tree = new AudioSegmentTree(samples);
      const overview = WaveformAnalyzer.createOverview(tree, 10);

      expect(overview.length).toBe(10);
      for (const bucket of overview) {
        expect(bucket.count).toBe(100);
        expect(bucket.peak).toBeGreaterThan(0);
        expect(bucket.rms).toBeGreaterThan(0);
      }
    });

    it('handles empty audio buffer in overview generation safely', () => {
      const tree = new AudioSegmentTree([]);
      const overview = WaveformAnalyzer.createOverview(tree, 50);
      expect(overview).toEqual([]);
    });
  });

  describe('Boundary Conditions & Edge Cases', () => {
    it('handles empty tree safely', () => {
      const tree = new AudioSegmentTree([]);
      expect(tree.size()).toBe(0);
      const q = tree.queryRange(0, 10);
      expect(q.count).toBe(0);
      expect(q.peak).toBe(0);
      expect(tree.toArray()).toEqual(new Float32Array([]));
    });

    it('handles inverted query ranges [R, L] by returning default zeroes', () => {
      const tree = new AudioSegmentTree([0.1, 0.2, 0.3]);
      // queryL > queryR is safely normalized or clamped by queryRange
      const q = tree.queryRange(2, 1);
      // Returns valid range metrics for [1, 2] after safe normalization
      expect(q.count).toBe(2);
      expect(q.min).toBeCloseTo(0.2, 5);
      expect(q.max).toBeCloseTo(0.3, 5);
    });

    it('safely clamps out-of-bounds queries', () => {
      const tree = new AudioSegmentTree([0.2, 0.4, 0.6]);
      const q = tree.queryRange(-10, 100);
      expect(q.count).toBe(3);
      expect(q.min).toBeCloseTo(0.2, 5);
      expect(q.max).toBeCloseTo(0.6, 5);
    });
  });
});
