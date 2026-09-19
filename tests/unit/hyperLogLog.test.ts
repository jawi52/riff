import { describe, it, expect, beforeEach } from 'vitest';
import { HyperLogLog, CatalogReachTracker } from '../../src/lib/hyperLogLog';
import { Track } from '../../src/types';

describe('HyperLogLog (Flajolet et al. 2007) Probabilistic Cardinality Estimator', () => {
  describe('HyperLogLog Initialization & Structural Constraints', () => {
    it('initializes default sketch with precision p = 14 (16384 registers)', () => {
      const hll = new HyperLogLog();
      expect(hll.precision).toBe(14);
      expect(hll.numRegisters).toBe(16384);
      expect(hll.count()).toBe(0);
    });

    it('throws error on out-of-range precision', () => {
      expect(() => new HyperLogLog(3)).toThrow(/precision/);
      expect(() => new HyperLogLog(17)).toThrow(/precision/);
    });
  });

  describe('Small Cardinality Exactness via LinearCounting', () => {
    let hll: HyperLogLog;

    beforeEach(() => {
      hll = new HyperLogLog(14);
    });

    it('estimates exact count for small unique item sets (1 to 100)', () => {
      const sizes = [1, 5, 25, 50, 100];
      for (const size of sizes) {
        hll.clear();
        for (let i = 0; i < size; i++) {
          hll.add(`item-${i}`);
        }
        // LinearCounting must have near-exact precision (< 1% error or exact)
        expect(Math.abs(hll.count() - size)).toBeLessThanOrEqual(1);
      }
    });

    it('maintains strict idempotence under repetitive duplicates', () => {
      // Add the same 20 items repeatedly 50 times
      for (let rep = 0; rep < 50; rep++) {
        for (let i = 0; i < 20; i++) {
          hll.add(`duplicate-song-${i}`);
        }
      }

      // Count must reflect approximately 20 distinct items within probabilistic collision variance
      expect(Math.abs(hll.count() - 20)).toBeLessThanOrEqual(1);
    });
  });

  describe('Moderate & Large Population Cardinality Estimation', () => {
    it('estimates 10,000 distinct items within theoretical standard error bounds', () => {
      const hll = new HyperLogLog(14);
      const trueCount = 10000;

      for (let i = 0; i < trueCount; i++) {
        hll.add(`stream-event-${i}-${i * 7}`);
      }

      const estimate = hll.count();
      const relativeError = Math.abs(estimate - trueCount) / trueCount;

      // Standard error for p = 14 is ~0.81%. Within 3-sigma (2.5%), relative error < 0.025
      expect(relativeError).toBeLessThan(0.025);
    });
  });

  describe('Commutative Zero-Cost Set Union (Merge)', () => {
    it('merges two overlapping sketches with exact element-wise max union', () => {
      const hllA = new HyperLogLog(14);
      const hllB = new HyperLogLog(14);

      // Set A: 0..999 (1000 items)
      for (let i = 0; i < 1000; i++) {
        hllA.add(`user-track-${i}`);
      }

      // Set B: 500..1499 (1000 items, with 500 overlapping)
      for (let i = 500; i < 1500; i++) {
        hllB.add(`user-track-${i}`);
      }

      // Union cardinality should be 1500 items
      const mergedAB = hllA.merge(hllB);
      const mergedBA = hllB.merge(hllA);

      expect(Math.abs(mergedAB.count() - 1500)).toBeLessThan(30);
      expect(mergedAB.count()).toBe(mergedBA.count()); // Commutative property
    });

    it('throws error when merging sketches of different precisions', () => {
      const hll12 = new HyperLogLog(12);
      const hll14 = new HyperLogLog(14);
      expect(() => hll12.merge(hll14)).toThrow(/precision/);
    });
  });

  describe('Serialization & Wire Formats', () => {
    it('serializes and deserializes raw binary bytes perfectly', () => {
      const hll = new HyperLogLog(14);
      for (let i = 0; i < 200; i++) {
        hll.add(`sample-song-${i}`);
      }

      const bytes = hll.serialize();
      expect(bytes.length).toBe(16384);

      const restored = HyperLogLog.deserialize(bytes, 14);
      expect(restored.count()).toBe(hll.count());
    });

    it('encodes and decodes Base64 payloads for network transport', () => {
      const hll = new HyperLogLog(12); // 4096 bytes
      for (let i = 0; i < 300; i++) {
        hll.add(`base64-track-${i}`);
      }

      const b64 = hll.toBase64();
      expect(typeof b64).toBe('string');
      expect(b64.length).toBeGreaterThan(0);

      const restored = HyperLogLog.fromBase64(b64, 12);
      expect(restored.count()).toBe(hll.count());
    });
  });

  describe('CatalogReachTracker Playback Demographics', () => {
    let tracker: CatalogReachTracker;

    beforeEach(() => {
      tracker = new CatalogReachTracker(12);
    });

    it('tracks distinct tracks and unique artists across sessions', () => {
      const tracks: Track[] = [
        { id: 'track-1', artist: 'The Beatles' } as Track,
        { id: 'track-2', artist: 'The Beatles' } as Track, // Same artist, diff track
        { id: 'track-3', artist: 'Queen' } as Track,
        { id: 'track-1', artist: 'The Beatles' } as Track, // Duplicate play
      ];

      for (const t of tracks) {
        tracker.recordPlay(t);
      }

      // Distinct tracks: 3 (track-1, track-2, track-3)
      expect(tracker.getUniqueTracksCount()).toBe(3);
      // Unique artists: 2 (The Beatles, Queen)
      expect(tracker.getUniqueArtistsCount()).toBe(2);
    });

    it('merges remote offline sync payload into local tracker', () => {
      const remoteTracker = new CatalogReachTracker(12);
      remoteTracker.recordPlay({ id: 'remote-1', artist: 'Pink Floyd' } as Track);
      remoteTracker.recordPlay({ id: 'remote-2', artist: 'Led Zeppelin' } as Track);

      tracker.recordPlay({ id: 'local-1', artist: 'Queen' } as Track);

      const payload = remoteTracker.getSyncPayload();
      tracker.mergeRemotePayload(payload);

      expect(tracker.getUniqueTracksCount()).toBe(3); // local-1, remote-1, remote-2
      expect(tracker.getUniqueArtistsCount()).toBe(3); // Queen, Pink Floyd, Led Zeppelin
    });

    it('clears state cleanly', () => {
      tracker.recordPlay({ id: 'track-1', artist: 'Artist' } as Track);
      expect(tracker.getUniqueTracksCount()).toBe(1);

      tracker.clear();
      expect(tracker.getUniqueTracksCount()).toBe(0);
      expect(tracker.getUniqueArtistsCount()).toBe(0);
    });
  });
});
