/**
 * Offline Vector Embedding Search & Acoustic Recommendation Engine
 *
 * Implements a high-dimensional vector space model using Cosine Similarity
 * and O(N log K) Min-Heap nearest-neighbor retrieval for offline music recommendations.
 *
 * Features:
 * - L2 Euclidean vector normalization and fast dot product evaluation.
 * - Cosine similarity scoring bounded in [-1.0, 1.0].
 * - O(N log K) Top-K nearest neighbor search via Min-Heap Priority Queue.
 * - Dynamic Taste Centroid Vector aggregation across liked/cached tracks.
 * - 100% offline with zero external network dependencies.
 */

import { findTopK } from './priorityQueue';

export interface VectorEntity<T> {
  id: string;
  vector: number[];
  metadata: T;
}

export interface VectorSearchResult<T> {
  id: string;
  score: number; // Cosine similarity in [-1.0, 1.0]
  metadata: T;
}

// ==========================================
// Vector Mathematics Utilities
// ==========================================

/**
 * Computes the Euclidean (L2) norm of a vector: ||v|| = sqrt(sum(v_i^2))
 */
export function euclideanNorm(v: number[]): number {
  let sum = 0;
  for (let i = 0; i < v.length; i++) {
    sum += v[i] * v[i];
  }
  return Math.sqrt(sum);
}

/**
 * Normalizes a vector to unit length (||v|| = 1).
 * Returns a zero vector if norm is zero.
 */
export function normalize(v: number[]): number[] {
  const norm = euclideanNorm(v);
  if (norm === 0 || !isFinite(norm)) {
    return new Array(v.length).fill(0);
  }
  return v.map((x) => x / norm);
}

/**
 * Computes the dot product between two vectors: sum(a_i * b_i)
 */
export function dotProduct(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  let dot = 0;
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
  }
  return dot;
}

/**
 * Computes the Cosine Similarity between two arbitrary vectors:
 * sim(a, b) = (a . b) / (||a|| * ||b||)
 * Clamped strictly to [-1.0, 1.0].
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  const normA = euclideanNorm(a);
  const normB = euclideanNorm(b);

  if (normA === 0 || normB === 0 || !isFinite(normA) || !isFinite(normB)) {
    return 0;
  }

  const dot = dotProduct(a, b);
  const sim = dot / (normA * normB);
  return Math.max(-1.0, Math.min(1.0, sim));
}

/**
 * Computes the unit-normalized centroid vector across a collection of vectors:
 * C = normalize( (1 / N) * sum(v_i) )
 */
export function computeCentroid(vectors: number[][]): number[] | null {
  if (vectors.length === 0) return null;

  const dim = vectors[0].length;
  const centroid = new Array(dim).fill(0);

  for (const v of vectors) {
    const len = Math.min(dim, v.length);
    for (let i = 0; i < len; i++) {
      centroid[i] += v[i];
    }
  }

  for (let i = 0; i < dim; i++) {
    centroid[i] /= vectors.length;
  }

  return normalize(centroid);
}

// ==========================================
// High-Dimensional Vector Search Index
// ==========================================

export class VectorIndex<T = any> {
  private entities = new Map<string, VectorEntity<T>>();

  /**
   * Inserts an entity and its feature vector into the index.
   * Automatically normalizes the vector to unit length for O(D) dot-product queries.
   */
  public insert(id: string, vector: number[], metadata: T): void {
    const normalized = normalize(vector);
    this.entities.set(id, {
      id,
      vector: normalized,
      metadata
    });
  }

  /**
   * Batch inserts multiple entities.
   */
  public batchInsert(items: Array<{ id: string; vector: number[]; metadata: T }>): void {
    for (const item of items) {
      this.insert(item.id, item.vector, item.metadata);
    }
  }

  public get(id: string): VectorEntity<T> | undefined {
    return this.entities.get(id);
  }

  public has(id: string): boolean {
    return this.entities.has(id);
  }

  public remove(id: string): boolean {
    return this.entities.delete(id);
  }

  public clear(): void {
    this.entities.clear();
  }

  public size(): number {
    return this.entities.size;
  }

  /**
   * Finds the Top-K most acoustically similar entities using Cosine Similarity.
   * Employs an auxiliary Min-Heap (findTopK) to execute in O(N log K) time.
   *
   * @param queryVector Target embedding vector
   * @param k Maximum number of nearest neighbors to return
   * @param minSimilarity Minimum similarity cutoff threshold in [-1.0, 1.0]
   * @param excludeIds Set of IDs to ignore (e.g. current track or seed tracks)
   */
  public findSimilar(
    queryVector: number[],
    k = 5,
    minSimilarity = -1.0,
    excludeIds: Set<string> = new Set()
  ): VectorSearchResult<T>[] {
    if (this.entities.size === 0 || k <= 0) return [];

    const normQuery = normalize(queryVector);

    // Generator yielding candidates that exceed minSimilarity and are not excluded
    const candidateIterator = (function* (entities: Map<string, VectorEntity<T>>) {
      for (const [id, entity] of entities) {
        if (excludeIds.has(id)) continue;

        // Since both vectors are unit normalized, dotProduct == cosineSimilarity
        const score = dotProduct(normQuery, entity.vector);

        if (score >= minSimilarity) {
          yield {
            id,
            score,
            metadata: entity.metadata
          };
        }
      }
    })(this.entities);

    // Min-Heap comparator: smaller scores at root
    const topCandidates = findTopK<VectorSearchResult<T>>(
      candidateIterator,
      k,
      (a, b) => a.score - b.score
    );

    return topCandidates;
  }

  /**
   * Finds the Top-K nearest neighbors to an existing indexed entity.
   */
  public findSimilarToEntity(
    id: string,
    k = 5,
    minSimilarity = -1.0
  ): VectorSearchResult<T>[] {
    const entity = this.entities.get(id);
    if (!entity) return [];

    const exclude = new Set<string>([id]);
    return this.findSimilar(entity.vector, k, minSimilarity, exclude);
  }

  /**
   * Generates a personalized recommendation feed by computing the Taste Centroid
   * across seed track IDs and retrieving unvisited nearest neighbors.
   */
  public generatePersonalizedFeed(
    seedIds: string[],
    k = 10,
    minSimilarity = 0.0
  ): VectorSearchResult<T>[] {
    const seedVectors: number[][] = [];
    const excludeSet = new Set<string>(seedIds);

    for (const id of seedIds) {
      const entity = this.entities.get(id);
      if (entity) {
        seedVectors.push(entity.vector);
      }
    }

    const centroid = computeCentroid(seedVectors);
    if (!centroid) return [];

    return this.findSimilar(centroid, k, minSimilarity, excludeSet);
  }
}

// Global Singleton Offline Acoustic Vector Search Index
export const trackVectorIndex = new VectorIndex<{
  title: string;
  artist: string;
  genre: string;
  tempo?: number;
}>();
