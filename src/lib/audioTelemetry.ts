/**
 * Audio Playback Telemetry & Quality of Experience (QoE) Engine
 *
 * Implements:
 * 1. Reservoir Sampling (Algorithm R): Unbiased, uniform random sampling of fixed size K
 *    from an unbounded stream of real-time audio chunk download and buffer metrics in O(1) space.
 * 2. Exponential Moving Average (EMA): O(1) memory time-decay smoothing for streaming
 *    throughput (kbps) and chunk download latencies.
 * 3. Playback Quality-of-Experience (QoE) Profiler: Real-time tracking of Time-to-First-Audio (TTFA),
 *    buffer stall count, starvation ratio, and latency percentiles (P50, P90, P99).
 */

// ==========================================
// 1. Reservoir Sampling (Algorithm R)
// ==========================================

export class ReservoirSampler<T> {
  private readonly capacity: number;
  private reservoir: T[] = [];
  private streamLength = 0;

  /**
   * @param capacity Maximum fixed sample size (K)
   */
  constructor(capacity = 100) {
    this.capacity = Math.max(1, capacity);
  }

  /**
   * Ingests a new item into the reservoir stream with uniform replacement probability:
   * P(item kept in reservoir) = capacity / streamLength
   */
  public add(item: T): void {
    this.streamLength++;

    if (this.reservoir.length < this.capacity) {
      this.reservoir.push(item);
    } else {
      // Pick random index between 0 and streamLength - 1
      const randomIndex = Math.floor(Math.random() * this.streamLength);
      if (randomIndex < this.capacity) {
        this.reservoir[randomIndex] = item;
      }
    }
  }

  /**
   * Ingests multiple items from a stream.
   */
  public addBatch(items: T[]): void {
    for (const item of items) {
      this.add(item);
    }
  }

  /**
   * Returns a snapshot of the current sampled reservoir elements.
   */
  public getSample(): T[] {
    return [...this.reservoir];
  }

  /**
   * Returns the fixed reservoir capacity (K).
   */
  public getCapacity(): number {
    return this.capacity;
  }

  /**
   * Returns total count of stream items observed so far (N).
   */
  public getStreamLength(): number {
    return this.streamLength;
  }

  /**
   * Computes statistical percentiles (e.g. 50, 90, 99) over numerical values in the reservoir.
   *
   * @param valueExtractor Function mapping sampled item to a numerical value
   * @param percentiles Array of percentiles between 0 and 100 (e.g. [50, 90, 99])
   */
  public getPercentiles(
    valueExtractor: (item: T) => number,
    percentiles: number[] = [50, 90, 99]
  ): Record<number, number> {
    const results: Record<number, number> = {};
    if (this.reservoir.length === 0) {
      for (const p of percentiles) {
        results[p] = 0;
      }
      return results;
    }

    const values = this.reservoir.map(valueExtractor).sort((a, b) => a - b);
    const n = values.length;

    for (const p of percentiles) {
      const clampedP = Math.max(0, Math.min(100, p));
      if (clampedP === 0) {
        results[p] = values[0];
        continue;
      }
      if (clampedP === 100) {
        results[p] = values[n - 1];
        continue;
      }

      // Linear interpolation between ranks
      const rank = (clampedP / 100) * (n - 1);
      const lowIndex = Math.floor(rank);
      const highIndex = Math.ceil(rank);
      const weight = rank - lowIndex;

      if (lowIndex === highIndex) {
        results[p] = values[lowIndex];
      } else {
        results[p] = values[lowIndex] * (1 - weight) + values[highIndex] * weight;
      }
    }

    return results;
  }

  /**
   * Clears all samples and resets stream counter.
   */
  public clear(): void {
    this.reservoir = [];
    this.streamLength = 0;
  }
}

// ==========================================
// 2. Exponential Moving Average (EMA)
// ==========================================

export class ExponentialMovingAverage {
  private readonly alpha: number; // Weight factor in (0, 1]
  private value: number | null = null;

  /**
   * @param alpha Smoothing factor: higher alpha (e.g. 0.5) adapts rapidly to change,
   *              lower alpha (e.g. 0.1) smooths out high frequency noise.
   * @param initialValue Optional initial starting value
   */
  constructor(alpha = 0.2, initialValue?: number) {
    this.alpha = Math.max(0.001, Math.min(1.0, alpha));
    if (typeof initialValue === 'number' && !isNaN(initialValue)) {
      this.value = initialValue;
    }
  }

  /**
   * Ingests a new observation and updates the moving average:
   * S_t = alpha * Y_t + (1 - alpha) * S_{t-1}
   */
  public update(observation: number): number {
    if (this.value === null) {
      // First observation establishes baseline without artificial zero-bias
      this.value = observation;
    } else {
      this.value = this.alpha * observation + (1 - this.alpha) * this.value;
    }
    return this.value;
  }

  /**
   * Returns current smoothed average value (or 0 if no samples).
   */
  public getValue(): number {
    return this.value ?? 0;
  }

  /**
   * Returns the alpha smoothing factor.
   */
  public getAlpha(): number {
    return this.alpha;
  }

  /**
   * Resets the moving average.
   */
  public reset(initialValue?: number): void {
    if (typeof initialValue === 'number' && !isNaN(initialValue)) {
      this.value = initialValue;
    } else {
      this.value = null;
    }
  }
}

// ==========================================
// 3. Playback Quality-of-Experience (QoE) Telemetry
// ==========================================

export interface ChunkDownloadMetric {
  url: string;
  bytes: number;
  durationMs: number;
  bitrateKbps: number;
  timestamp: number;
}

export interface BufferHealthMetric {
  bufferedSeconds: number;
  playbackPosition: number;
  timestamp: number;
}

export interface PlaybackSessionReport {
  trackId: string;
  sessionDurationMs: number;
  timeToFirstAudioMs: number | null;
  stallCount: number;
  totalStallDurationMs: number;
  starvationRatio: number; // stallDuration / sessionDuration
  smoothedBitrateKbps: number;
  smoothedLatencyMs: number;
  latencyPercentiles: Record<number, number>; // P50, P90, P99
  samplesCollected: number;
}

export class AudioPlaybackTelemetry {
  private currentTrackId: string | null = null;
  private sessionStartTime: number = Date.now();
  private requestStartTime: number | null = null;
  private firstAudioTimestamp: number | null = null;

  private isStalling = false;
  private stallStartTime: number | null = null;
  private stallCount = 0;
  private totalStallDurationMs = 0;

  // EMA Smoothers
  private bitrateEMA = new ExponentialMovingAverage(0.2); // ~5 sample memory
  private latencyEMA = new ExponentialMovingAverage(0.25);

  // Fixed Memory Reservoir Samplers (Capacity: 150 items each)
  private chunkSampler = new ReservoirSampler<ChunkDownloadMetric>(150);
  private bufferHealthSampler = new ReservoirSampler<BufferHealthMetric>(150);

  /**
   * Initiates a new playback telemetry session when a track starts loading.
   */
  public startSession(trackId: string): void {
    this.currentTrackId = trackId;
    this.sessionStartTime = Date.now();
    this.requestStartTime = Date.now();
    this.firstAudioTimestamp = null;
    this.isStalling = false;
    this.stallStartTime = null;
    this.stallCount = 0;
    this.totalStallDurationMs = 0;
    this.chunkSampler.clear();
    this.bufferHealthSampler.clear();
  }

  /**
   * Records first audio frame decoded and playable (calculates TTFA).
   */
  public recordFirstAudio(): number {
    if (this.firstAudioTimestamp === null) {
      this.firstAudioTimestamp = Date.now();
      const ttfa = this.requestStartTime ? this.firstAudioTimestamp - this.requestStartTime : 0;
      return ttfa;
    }
    return this.firstAudioTimestamp - (this.requestStartTime ?? this.firstAudioTimestamp);
  }

  /**
   * Invoked when playback halts due to buffer starvation ('waiting' or 'stalled').
   */
  public onStallStart(): void {
    if (!this.isStalling) {
      this.isStalling = true;
      this.stallStartTime = Date.now();
      this.stallCount++;
    }
  }

  /**
   * Invoked when audio playback resumes after a stall ('playing' or 'canplay').
   */
  public onStallEnd(): number {
    if (this.isStalling && this.stallStartTime !== null) {
      const stallDuration = Date.now() - this.stallStartTime;
      this.totalStallDurationMs += Math.max(0, stallDuration);
      this.isStalling = false;
      this.stallStartTime = null;
      return stallDuration;
    }
    return 0;
  }

  /**
   * Ingests chunk network download telemetry.
   */
  public recordChunkDownload(bytes: number, durationMs: number, url = ''): void {
    const validDuration = Math.max(1, durationMs);
    const bitrateKbps = (bytes * 8) / validDuration; // (bytes * 8 bits) / (ms) = kbps

    this.bitrateEMA.update(bitrateKbps);
    this.latencyEMA.update(validDuration);

    this.chunkSampler.add({
      url,
      bytes,
      durationMs: validDuration,
      bitrateKbps,
      timestamp: Date.now()
    });
  }

  /**
   * Ingests buffer forward depth snapshot.
   */
  public recordBufferHealth(bufferedSeconds: number, playbackPosition: number): void {
    this.bufferHealthSampler.add({
      bufferedSeconds: Math.max(0, bufferedSeconds),
      playbackPosition: Math.max(0, playbackPosition),
      timestamp: Date.now()
    });
  }

  /**
   * Generates a comprehensive Quality of Experience (QoE) report for the active session.
   */
  public getSessionReport(): PlaybackSessionReport {
    const now = Date.now();
    let currentStall = this.totalStallDurationMs;
    if (this.isStalling && this.stallStartTime !== null) {
      currentStall += now - this.stallStartTime;
    }

    const sessionDurationMs = Math.max(1, now - this.sessionStartTime);
    const starvationRatio = Math.min(1.0, currentStall / sessionDurationMs);

    const ttfa = this.firstAudioTimestamp && this.requestStartTime
      ? this.firstAudioTimestamp - this.requestStartTime
      : null;

    const latencyPercentiles = this.chunkSampler.getPercentiles(
      (c) => c.durationMs,
      [50, 90, 99]
    );

    return {
      trackId: this.currentTrackId || 'unknown',
      sessionDurationMs,
      timeToFirstAudioMs: ttfa,
      stallCount: this.stallCount,
      totalStallDurationMs: currentStall,
      starvationRatio,
      smoothedBitrateKbps: Math.round(this.bitrateEMA.getValue()),
      smoothedLatencyMs: Math.round(this.latencyEMA.getValue()),
      latencyPercentiles,
      samplesCollected: this.chunkSampler.getStreamLength()
    };
  }

  public getBitrateEMA(): ExponentialMovingAverage {
    return this.bitrateEMA;
  }

  public getLatencyEMA(): ExponentialMovingAverage {
    return this.latencyEMA;
  }

  public getChunkSampler(): ReservoirSampler<ChunkDownloadMetric> {
    return this.chunkSampler;
  }

  public getBufferHealthSampler(): ReservoirSampler<BufferHealthMetric> {
    return this.bufferHealthSampler;
  }
}

// Global Singleton Telemetry Service
export const audioTelemetry = new AudioPlaybackTelemetry();
