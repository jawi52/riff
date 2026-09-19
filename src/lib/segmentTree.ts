/**
 * Segment Tree with Lazy Propagation for Audio Waveforms
 *
 * Provides O(log N) range queries and non-destructive gain/volume modifications over
 * PCM audio buffers containing millions of samples:
 * - Range Min, Max, Peak Amplitude (|x|), and RMS Loudness (sqrt(sum(x^2) / K))
 * - Crest Factor (Peak / RMS) dynamic range metering
 * - Lazy Propagation: Defers volume automation and DC offsets to descendant blocks,
 *   achieving O(log N) range gain adjustments without mutating raw buffers.
 */

export interface AudioRangeMetrics {
  min: number;
  max: number;
  peak: number;
  rms: number;
  crestFactor: number;
  mean: number;
  count: number;
}

export class AudioSegmentTree {
  public readonly length: number;
  private readonly treeMin: Float32Array;
  private readonly treeMax: Float32Array;
  private readonly treeSum: Float64Array;
  private readonly treeSumSquares: Float64Array;
  private readonly lazyGain: Float32Array;
  private readonly lazyOffset: Float32Array;

  constructor(data: Float32Array | number[]) {
    this.length = data.length;
    const treeSize = Math.max(4, this.length * 4);

    this.treeMin = new Float32Array(treeSize);
    this.treeMax = new Float32Array(treeSize);
    this.treeSum = new Float64Array(treeSize);
    this.treeSumSquares = new Float64Array(treeSize);
    this.lazyGain = new Float32Array(treeSize);
    this.lazyOffset = new Float32Array(treeSize);

    // Initialize lazy gain multipliers to 1.0 (neutral)
    this.lazyGain.fill(1.0);
    this.lazyOffset.fill(0.0);

    if (this.length > 0) {
      this.build(1, 0, this.length - 1, data);
    }
  }

  /**
   * Builds the segment tree in O(N) time.
   */
  private build(
    node: number,
    start: number,
    end: number,
    data: Float32Array | number[]
  ): void {
    if (start === end) {
      const val = data[start];
      this.treeMin[node] = val;
      this.treeMax[node] = val;
      this.treeSum[node] = val;
      this.treeSumSquares[node] = val * val;
      return;
    }

    const mid = (start + end) >> 1;
    const left = node << 1;
    const right = left | 1;

    this.build(left, start, mid, data);
    this.build(right, mid + 1, end, data);

    this.pullUp(node, left, right);
  }

  /**
   * Pulls aggregate metrics from children into parent node in O(1).
   */
  private pullUp(node: number, left: number, right: number): void {
    this.treeMin[node] = Math.min(this.treeMin[left], this.treeMin[right]);
    this.treeMax[node] = Math.max(this.treeMax[left], this.treeMax[right]);
    this.treeSum[node] = this.treeSum[left] + this.treeSum[right];
    this.treeSumSquares[node] = this.treeSumSquares[left] + this.treeSumSquares[right];
  }

  /**
   * Applies a pending transformation x' = x * g + d to a specific node's cached aggregates.
   */
  private applyTransform(node: number, count: number, g: number, d: number): void {
    const oldMin = this.treeMin[node];
    const oldMax = this.treeMax[node];
    const oldSum = this.treeSum[node];
    const oldSumSq = this.treeSumSquares[node];

    // 1. Min and Max
    if (g >= 0) {
      this.treeMin[node] = oldMin * g + d;
      this.treeMax[node] = oldMax * g + d;
    } else {
      this.treeMin[node] = oldMax * g + d;
      this.treeMax[node] = oldMin * g + d;
    }

    // 2. Sum: sum(x * g + d) = g * sum(x) + d * count
    this.treeSum[node] = g * oldSum + d * count;

    // 3. Sum of Squares: sum((x * g + d)^2) = g^2 * sum(x^2) + 2 * g * d * sum(x) + d^2 * count
    this.treeSumSquares[node] =
      g * g * oldSumSq + 2 * g * d * oldSum + d * d * count;

    // Prevent negative float inaccuracies in sumSquares
    if (this.treeSumSquares[node] < 0) {
      this.treeSumSquares[node] = 0;
    }
  }

  /**
   * Propagates deferred lazy gain and offset to children in O(1).
   */
  private pushDown(node: number, start: number, end: number): void {
    const g = this.lazyGain[node];
    const d = this.lazyOffset[node];

    if (g === 1.0 && d === 0.0) {
      return;
    }

    const mid = (start + end) >> 1;
    const left = node << 1;
    const right = left | 1;

    const leftCount = mid - start + 1;
    const rightCount = end - mid;

    // Apply to left child
    this.applyTransform(left, leftCount, g, d);
    this.lazyGain[left] = this.lazyGain[left] * g;
    this.lazyOffset[left] = this.lazyOffset[left] * g + d;

    // Apply to right child
    this.applyTransform(right, rightCount, g, d);
    this.lazyGain[right] = this.lazyGain[right] * g;
    this.lazyOffset[right] = this.lazyOffset[right] * g + d;

    // Reset parent lazy tags
    this.lazyGain[node] = 1.0;
    this.lazyOffset[node] = 0.0;
  }

  /**
   * Applies multiplicative gain to range [queryL, queryR] in O(log N) time.
   */
  public applyGainRange(queryL: number, queryR: number, gainFactor: number): void {
    if (this.length === 0) return;
    const safeL = Math.max(0, Math.min(queryL, queryR));
    const safeR = Math.min(this.length - 1, Math.max(queryL, queryR));
    if (safeL > safeR) return;

    this.updateRangeHelper(1, 0, this.length - 1, safeL, safeR, gainFactor, 0.0);
  }

  /**
   * Applies additive DC offset to range [queryL, queryR] in O(log N) time.
   */
  public applyOffsetRange(queryL: number, queryR: number, offset: number): void {
    if (this.length === 0) return;
    const safeL = Math.max(0, Math.min(queryL, queryR));
    const safeR = Math.min(this.length - 1, Math.max(queryL, queryR));
    if (safeL > safeR) return;

    this.updateRangeHelper(1, 0, this.length - 1, safeL, safeR, 1.0, offset);
  }

  private updateRangeHelper(
    node: number,
    start: number,
    end: number,
    queryL: number,
    queryR: number,
    g: number,
    d: number
  ): void {
    if (queryL <= start && end <= queryR) {
      const count = end - start + 1;
      this.applyTransform(node, count, g, d);
      this.lazyGain[node] = this.lazyGain[node] * g;
      this.lazyOffset[node] = this.lazyOffset[node] * g + d;
      return;
    }

    this.pushDown(node, start, end);

    const mid = (start + end) >> 1;
    const left = node << 1;
    const right = left | 1;

    if (queryL <= mid) {
      this.updateRangeHelper(left, start, mid, queryL, queryR, g, d);
    }
    if (queryR > mid) {
      this.updateRangeHelper(right, mid + 1, end, queryL, queryR, g, d);
    }

    this.pullUp(node, left, right);
  }

  /**
   * Point update for an individual sample at index in O(log N) time.
   */
  public pointUpdate(index: number, value: number): void {
    if (index < 0 || index >= this.length) return;
    this.pointUpdateHelper(1, 0, this.length - 1, index, value);
  }

  private pointUpdateHelper(
    node: number,
    start: number,
    end: number,
    targetIdx: number,
    value: number
  ): void {
    if (start === end) {
      this.treeMin[node] = value;
      this.treeMax[node] = value;
      this.treeSum[node] = value;
      this.treeSumSquares[node] = value * value;
      this.lazyGain[node] = 1.0;
      this.lazyOffset[node] = 0.0;
      return;
    }

    this.pushDown(node, start, end);

    const mid = (start + end) >> 1;
    const left = node << 1;
    const right = left | 1;

    if (targetIdx <= mid) {
      this.pointUpdateHelper(left, start, mid, targetIdx, value);
    } else {
      this.pointUpdateHelper(right, mid + 1, end, targetIdx, value);
    }

    this.pullUp(node, left, right);
  }

  /**
   * Queries audio range statistics in O(log N) time.
   */
  public queryRange(queryL: number, queryR: number): AudioRangeMetrics {
    if (this.length === 0) {
      return { min: 0, max: 0, peak: 0, rms: 0, crestFactor: 0, mean: 0, count: 0 };
    }

    const safeL = Math.max(0, Math.min(queryL, queryR));
    const safeR = Math.min(this.length - 1, Math.max(queryL, queryR));

    if (safeL > safeR) {
      return { min: 0, max: 0, peak: 0, rms: 0, crestFactor: 0, mean: 0, count: 0 };
    }

    const acc = {
      min: Infinity,
      max: -Infinity,
      sum: 0,
      sumSquares: 0,
      count: 0,
    };

    this.queryRangeHelper(1, 0, this.length - 1, safeL, safeR, acc);

    const peak = Math.max(Math.abs(acc.min), Math.abs(acc.max));
    const rms = acc.count > 0 ? Math.sqrt(acc.sumSquares / acc.count) : 0;
    const mean = acc.count > 0 ? acc.sum / acc.count : 0;
    const crestFactor = rms > 0 ? peak / rms : 0;

    return {
      min: acc.min,
      max: acc.max,
      peak,
      rms,
      crestFactor,
      mean,
      count: acc.count,
    };
  }

  private queryRangeHelper(
    node: number,
    start: number,
    end: number,
    queryL: number,
    queryR: number,
    acc: { min: number; max: number; sum: number; sumSquares: number; count: number }
  ): void {
    if (queryL <= start && end <= queryR) {
      acc.min = Math.min(acc.min, this.treeMin[node]);
      acc.max = Math.max(acc.max, this.treeMax[node]);
      acc.sum += this.treeSum[node];
      acc.sumSquares += this.treeSumSquares[node];
      acc.count += end - start + 1;
      return;
    }

    this.pushDown(node, start, end);

    const mid = (start + end) >> 1;
    const left = node << 1;
    const right = left | 1;

    if (queryL <= mid) {
      this.queryRangeHelper(left, start, mid, queryL, queryR, acc);
    }
    if (queryR > mid) {
      this.queryRangeHelper(right, mid + 1, end, queryL, queryR, acc);
    }
  }

  /**
   * Flushes all pending lazy operations and exports the modified waveform.
   */
  public toArray(): Float32Array {
    const result = new Float32Array(this.length);
    if (this.length > 0) {
      this.flattenHelper(1, 0, this.length - 1, result);
    }
    return result;
  }

  private flattenHelper(node: number, start: number, end: number, output: Float32Array): void {
    if (start === end) {
      output[start] = this.treeSum[node];
      return;
    }

    this.pushDown(node, start, end);

    const mid = (start + end) >> 1;
    const left = node << 1;
    const right = left | 1;

    this.flattenHelper(left, start, mid, output);
    this.flattenHelper(right, mid + 1, end, output);
  }

  public size(): number {
    return this.length;
  }
}

/**
 * High-Performance Waveform Overview & Loudness Visualizer Engine
 */
export class WaveformAnalyzer {
  /**
   * Generates a multi-bucket downsampled waveform overview in O(Buckets * log N) time
   * for responsive 60 FPS viewport rendering.
   */
  public static createOverview(
    tree: AudioSegmentTree,
    targetBuckets = 100
  ): AudioRangeMetrics[] {
    const totalSamples = tree.length;
    if (totalSamples === 0) return [];

    const buckets = Math.min(targetBuckets, totalSamples);
    const bucketSize = totalSamples / buckets;
    const overview: AudioRangeMetrics[] = [];

    for (let b = 0; b < buckets; b++) {
      const start = Math.floor(b * bucketSize);
      const end = Math.min(totalSamples - 1, Math.floor((b + 1) * bucketSize) - 1);
      overview.push(tree.queryRange(start, Math.max(start, end)));
    }

    return overview;
  }
}
