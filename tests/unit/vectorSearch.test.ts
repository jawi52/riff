import { describe, it, expect, beforeEach } from 'vitest';
import {
  euclideanNorm,
  normalize,
  dotProduct,
  cosineSimilarity,
  computeCentroid,
  VectorIndex,
  trackVectorIndex
} from '../../src/lib/vectorSearch';

describe('Offline Vector Embedding Search & Acoustic Recommendation Engine', () => {
  describe('Vector Mathematics & Cosine Similarity', () => {
    it('computes accurate Euclidean (L2) norms', () => {
      expect(euclideanNorm([3, 4])).toBe(5);
      expect(euclideanNorm([1, 2, 2])).toBe(3);
      expect(euclideanNorm([0, 0, 0])).toBe(0);
    });

    it('computes accurate vector dot products', () => {
      expect(dotProduct([1, 2, 3], [4, 5, 6])).toBe(32);
      expect(dotProduct([1, 0], [0, 1])).toBe(0);
    });

    it('normalizes arbitrary vectors to unit length', () => {
      const v = [3, 4];
      const normV = normalize(v);
      expect(normV[0]).toBeCloseTo(0.6, 5);
      expect(normV[1]).toBeCloseTo(0.8, 5);
      expect(euclideanNorm(normV)).toBeCloseTo(1.0, 5);
    });

    it('handles zero vectors gracefully without throwing', () => {
      const zero = normalize([0, 0, 0]);
      expect(zero).toEqual([0, 0, 0]);
      expect(cosineSimilarity([0, 0], [1, 1])).toBe(0);
    });

    it('evaluates cosine similarities across angle orientations', () => {
      // Parallel (identical direction) -> 1.0
      expect(cosineSimilarity([2, 4], [4, 8])).toBeCloseTo(1.0, 5);

      // Orthogonal (perpendicular) -> 0.0
      expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0.0, 5);

      // Opposite (anti-parallel) -> -1.0
      expect(cosineSimilarity([5, 0], [-10, 0])).toBeCloseTo(-1.0, 5);
    });

    it('computes unit-normalized centroid of multiple vectors', () => {
      const v1 = [1, 0];
      const v2 = [0, 1];
      const centroid = computeCentroid([v1, v2]);

      expect(centroid).toBeDefined();
      expect(centroid![0]).toBeCloseTo(1 / Math.sqrt(2), 5);
      expect(centroid![1]).toBeCloseTo(1 / Math.sqrt(2), 5);
      expect(euclideanNorm(centroid!)).toBeCloseTo(1.0, 5);

      expect(computeCentroid([])).toBeNull();
    });
  });

  describe('VectorIndex CRUD & Top-K Retrieval', () => {
    interface TrackMeta {
      title: string;
      genre: string;
    }

    let index: VectorIndex<TrackMeta>;

    beforeEach(() => {
      index = new VectorIndex<TrackMeta>();
      // Insert mock acoustic vectors: [energy, danceability, acousticness]
      index.batchInsert([
        { id: 'track-dance', vector: [0.9, 0.9, 0.1], metadata: { title: 'Club Bang', genre: 'EDM' } },
        { id: 'track-party', vector: [0.85, 0.88, 0.15], metadata: { title: 'Neon Lights', genre: 'EDM' } },
        { id: 'track-acoustic', vector: [0.2, 0.3, 0.95], metadata: { title: 'Coffee Shop Acoustic', genre: 'Folk' } },
        { id: 'track-classical', vector: [0.15, 0.25, 0.98], metadata: { title: 'Piano Sonata', genre: 'Classical' } },
        { id: 'track-rock', vector: [0.95, 0.5, 0.05], metadata: { title: 'Guitar Anthem', genre: 'Rock' } }
      ]);
    });

    it('inserts and manages vector entities', () => {
      expect(index.size()).toBe(5);
      expect(index.has('track-dance')).toBe(true);
      expect(index.get('track-dance')?.metadata.title).toBe('Club Bang');

      index.remove('track-dance');
      expect(index.size()).toBe(4);
      expect(index.has('track-dance')).toBe(false);

      index.clear();
      expect(index.size()).toBe(0);
    });

    it('retrieves Top-K nearest acoustic neighbors sorted by cosine similarity', () => {
      // Query with high energy & danceability
      const query = [0.9, 0.9, 0.1];
      const results = index.findSimilar(query, 2);

      expect(results.length).toBe(2);
      expect(results[0].id).toBe('track-dance');
      expect(results[0].score).toBeCloseTo(1.0, 4);

      expect(results[1].id).toBe('track-party');
      expect(results[1].score).toBeGreaterThan(0.95);
    });

    it('filters out results below minSimilarity threshold', () => {
      const query = [0.9, 0.9, 0.1];
      // Requiring similarity >= 0.9995 will only include track-dance (score 1.0)
      const results = index.findSimilar(query, 5, 0.9995);
      expect(results.length).toBe(1);
      expect(results[0].id).toBe('track-dance');
    });

    it('finds similar tracks to an existing entity excluding the seed itself', () => {
      // Similar to track-acoustic -> should return track-classical first
      const results = index.findSimilarToEntity('track-acoustic', 2);

      expect(results.length).toBe(2);
      expect(results[0].id).toBe('track-classical');
      expect(results[0].score).toBeGreaterThan(0.95);
      // Seed entity is excluded
      expect(results.some((r) => r.id === 'track-acoustic')).toBe(false);
    });

    it('generates personalized recommendations from user taste centroid', () => {
      // User likes acoustic and classical tracks
      const recommendations = index.generatePersonalizedFeed(
        ['track-acoustic', 'track-classical'],
        2
      );

      expect(recommendations.length).toBeGreaterThan(0);
      // Liked tracks are excluded
      expect(recommendations.some((r) => r.id === 'track-acoustic')).toBe(false);
      expect(recommendations.some((r) => r.id === 'track-classical')).toBe(false);
    });
  });

  describe('Singleton trackVectorIndex Export', () => {
    it('exports trackVectorIndex singleton instance', () => {
      expect(trackVectorIndex).toBeDefined();
      expect(trackVectorIndex instanceof VectorIndex).toBe(true);
    });
  });
});
