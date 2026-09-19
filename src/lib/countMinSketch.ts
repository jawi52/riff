/**
 * Count-Min Sketch Probabilistic Frequency Estimator & Heavy Hitters Engine
 *
 * Implements Cormode & Muthukrishnan's sublinear Count-Min Sketch algorithm
 * for real-time tracking of song play counts, trending detection, and heavy hitters
 * in strictly fixed O(W * D) memory regardless of stream volume.
 *
 * Mathematical Invariants:
 * - Depth: D = ceil(ln(1 / delta)) independent hash functions
 * - Width: W = ceil(e / epsilon) counter buckets
 * - Theoretical Bound: f_x <= estimate(x) <= f_x + (epsilon * N) with probability >= 1 - delta
 */

import { findTopK } from './priorityQueue';

export interface CountMinSketchOptions {
  epsilon?: number; // Error factor (default: 0.005 -> 0.5% of total events)
  delta?: number;   // Error probability (default: 0.01 -> 99% confidence)
}

// 8 distinct 32-bit prime seeds for hash functions
const HASH_SEEDS: number[] = [
  0x811c9dc5,
  0x9e3779b9,
  0x85ebca6b,
  0xc2b2ae35,
  0x27d4eb2f,
  0x165667b1,
  0xd6e8feb8,
  0x632be5ab
];

export class CountMinSketch {
  private readonly width: number;
  private readonly depth: number;
  private readonly table: Uint32Array[];
  private totalCount = 0;

  constructor(options: CountMinSketchOptions = {}) {
    const epsilon = Math.max(0.0001, Math.min(0.1, options.epsilon ?? 0.005));
    const delta = Math.max(0.0001, Math.min(0.2, options.delta ?? 0.01));

    // W = ceil(e / epsilon)
    this.width = Math.ceil(Math.E / epsilon);
    // D = ceil(ln(1 / delta))
    this.depth = Math.min(HASH_SEEDS.length, Math.ceil(Math.log(1 / delta)));

    this.table = new Array(this.depth);
    for (let i = 0; i < this.depth; i++) {
      this.table[i] = new Uint32Array(this.width);
    }
  }

  /**
   * Fast 32-bit FNV-1a hash function with seed parameterization.
   */
  private hash(str: string, seed: number): number {
    let h = seed >>> 0;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 16777619);
    }
    return (h >>> 0) % this.width;
  }

  /**
   * Ingests an item occurrence into the sketch.
   * Runs in O(D) time where D is depth (typically 4-5).
   */
  public add(item: string, count = 1): void {
    if (!item || count <= 0) return;

    for (let i = 0; i < this.depth; i++) {
      const bucket = this.hash(item, HASH_SEEDS[i]);
      this.table[i][bucket] += count;
    }
    this.totalCount += count;
  }

  /**
   * Estimates frequency of an item: min_{i=0..D-1} Table[i][h_i(item)]
   * Runs in O(D) time.
   */
  public estimate(item: string): number {
    if (!item || this.totalCount === 0) return 0;

    let minEst = Infinity;
    for (let i = 0; i < this.depth; i++) {
      const bucket = this.hash(item, HASH_SEEDS[i]);
      const count = this.table[i][bucket];
      if (count < minEst) {
        minEst = count;
      }
    }
    return minEst === Infinity ? 0 : minEst;
  }

  /**
   * Returns total number of stream events observed.
   */
  public getTotalCount(): number {
    return this.totalCount;
  }

  /**
   * Returns matrix dimensions and exact memory footprint in bytes.
   */
  public getDimensions(): {
    width: number;
    depth: number;
    totalCells: number;
    byteSize: number;
  } {
    const totalCells = this.width * this.depth;
    const byteSize = totalCells * 4; // 4 bytes per Uint32
    return {
      width: this.width,
      depth: this.depth,
      totalCells,
      byteSize
    };
  }

  /**
   * Clears the sketch.
   */
  public clear(): void {
    for (let i = 0; i < this.depth; i++) {
      this.table[i].fill(0);
    }
    this.totalCount = 0;
  }
}

// ==========================================
// Heavy Hitters & Real-Time Trending Tracker
// ==========================================

export interface HeavyHitterResult<T = any> {
  item: string;
  estimatedFrequency: number;
  relativeShare: number; // percentage of total events: est / N
  metadata?: T;
}

export class HeavyHittersTracker<T = any> {
  private sketch: CountMinSketch;
  private candidateMap = new Map<string, { item: string; metadata?: T }>();
  private maxCandidates: number;

  constructor(
    sketchOptions: CountMinSketchOptions = {},
    maxCandidates = 200
  ) {
    this.sketch = new CountMinSketch(sketchOptions);
    this.maxCandidates = Math.max(20, maxCandidates);
  }

  /**
   * Ingests a playback or search event, updating both the sublinear sketch
   * and the real-time heavy hitters candidate pool.
   */
  public recordEvent(item: string, count = 1, metadata?: T): void {
    if (!item || count <= 0) return;

    this.sketch.add(item, count);
    this.candidateMap.set(item, { item, metadata });

    // Prune candidate pool when it exceeds 2 * maxCandidates
    if (this.candidateMap.size > this.maxCandidates * 2) {
      this.pruneCandidates();
    }
  }

  /**
   * Prunes low-frequency items from the candidate pool using Min-Heap Top-K.
   */
  private pruneCandidates(): void {
    const items = Array.from(this.candidateMap.values());
    const scored = items.map((c) => ({
      item: c.item,
      metadata: c.metadata,
      frequency: this.sketch.estimate(c.item)
    }));

    const topK = findTopK(scored, this.maxCandidates, (a, b) => a.frequency - b.frequency);
    this.candidateMap.clear();
    for (const c of topK) {
      this.candidateMap.set(c.item, { item: c.item, metadata: c.metadata });
    }
  }

  /**
   * Retrieves the Top-N trending heavy hitters sorted by estimated play frequency.
   */
  public getTrending(topN = 10): HeavyHitterResult<T>[] {
    const total = this.sketch.getTotalCount();
    if (total === 0 || this.candidateMap.size === 0) return [];

    const candidates = Array.from(this.candidateMap.values()).map((c) => {
      const est = this.sketch.estimate(c.item);
      return {
        item: c.item,
        estimatedFrequency: est,
        relativeShare: est / total,
        metadata: c.metadata
      };
    });

    return findTopK(
      candidates,
      topN,
      (a, b) => a.estimatedFrequency - b.estimatedFrequency
    );
  }

  /**
   * Calculates the minimum stream count required to be considered trending
   * at a given traffic fraction (e.g. 0.05 for 5% of total streams).
   */
  public getTrendingThreshold(fraction: number): number {
    const total = this.sketch.getTotalCount();
    return Math.ceil(total * Math.max(0, Math.min(1.0, fraction)));
  }

  public getSketch(): CountMinSketch {
    return this.sketch;
  }

  public clear(): void {
    this.sketch.clear();
    this.candidateMap.clear();
  }
}

// Global Singleton Trending Playback Tracker
export const playbackTrendingTracker = new HeavyHittersTracker<{
  title: string;
  artist: string;
}>();
