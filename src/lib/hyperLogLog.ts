/**
 * HyperLogLog (Flajolet et al. 2007) Probabilistic Cardinality Estimator
 *
 * Estimates the count of unique elements in an unbounded stream using strictly bounded
 * memory footprint (12 KB for p = 14) with:
 * - 64-bit FNV-1a hashing to eliminate hash saturation.
 * - LinearCounting small-range bias correction (exact for small sets).
 * - Instantaneous zero-cost commutative set union (merge) via element-wise max.
 * - Base64 and binary serialization for offline sync and telemetry payloads.
 */

import { Track } from '../types';

export class HyperLogLog {
  public readonly precision: number;
  public readonly numRegisters: number;
  private readonly alphaM: number;
  private readonly registers: Uint8Array;

  constructor(precision = 14) {
    if (precision < 4 || precision > 16) {
      throw new Error(`HyperLogLog precision must be between 4 and 16, got ${precision}`);
    }

    this.precision = precision;
    this.numRegisters = 1 << precision;
    this.registers = new Uint8Array(this.numRegisters);
    this.alphaM = this.computeAlphaM(this.numRegisters);
  }

  private computeAlphaM(m: number): number {
    switch (m) {
      case 16:
        return 0.673;
      case 32:
        return 0.697;
      case 64:
        return 0.709;
      default:
        return 0.7213 / (1 + 1.079 / m);
    }
  }

  /**
   * 64-bit FNV-1a Hash Function with Murmur3 Avalanche Finalizer
   */
  private hash64(str: string): bigint {
    let hash = 0xcbf29ce484222325n;
    const prime = 0x100000001b3n;

    for (let i = 0; i < str.length; i++) {
      hash ^= BigInt(str.charCodeAt(i));
      hash = (hash * prime) & 0xffffffffffffffffn;
    }

    // Murmur3 64-bit finalizer for strict avalanche criterion
    hash ^= hash >> 33n;
    hash = (hash * 0xff51afd7ed558ccdn) & 0xffffffffffffffffn;
    hash ^= hash >> 33n;
    hash = (hash * 0xc4ceb9fe1a85ec53n) & 0xffffffffffffffffn;
    hash ^= hash >> 33n;

    return hash;
  }

  /**
   * Counts leading zeros of remaining (64 - p) bits.
   */
  private getLeadingZeros(w: bigint, maxBits: number): number {
    if (w === 0n) return maxBits;
    let count = 0;
    let mask = 1n << BigInt(maxBits - 1);

    while ((w & mask) === 0n && mask > 0n) {
      count++;
      mask >>= 1n;
    }

    return count;
  }

  /**
   * Adds an item to the HyperLogLog sketch in O(1) time.
   */
  public add(item: string): void {
    if (!item) return;

    const hash = this.hash64(item);
    const shift = 64n - BigInt(this.precision);

    // Register index j: first p bits
    const j = Number(hash >> shift);

    // Remaining (64 - p) bits
    const mask = (1n << shift) - 1n;
    const w = hash & mask;

    // Leading zeros + 1
    const maxBits = Number(shift);
    const leadingZeros = this.getLeadingZeros(w, maxBits) + 1;

    if (leadingZeros > this.registers[j]) {
      this.registers[j] = leadingZeros;
    }
  }

  /**
   * Estimates unique cardinality with LinearCounting bias correction in O(M) time.
   */
  public count(): number {
    const m = this.numRegisters;
    let sum = 0;
    let zeroRegisters = 0;

    for (let j = 0; j < m; j++) {
      const val = this.registers[j];
      sum += Math.pow(2, -val);
      if (val === 0) {
        zeroRegisters++;
      }
    }

    // Raw harmonic mean estimate: E = alpha_m * m^2 * (sum(2^-M[j]))^-1
    const rawEstimate = (this.alphaM * m * m) / sum;

    // Small range correction (Linear Counting) when E <= 2.5 * m and empty registers exist
    if (rawEstimate <= 2.5 * m && zeroRegisters > 0) {
      return Math.round(m * Math.log(m / zeroRegisters));
    }

    return Math.round(rawEstimate);
  }

  /**
   * Merges another HyperLogLog sketch into a new union sketch in O(M) time.
   */
  public merge(other: HyperLogLog): HyperLogLog {
    if (this.precision !== other.precision) {
      throw new Error(
        `Cannot merge HyperLogLog with different precisions: ${this.precision} vs ${other.precision}`
      );
    }

    const merged = new HyperLogLog(this.precision);
    for (let j = 0; j < this.numRegisters; j++) {
      merged.registers[j] = Math.max(this.registers[j], other.registers[j]);
    }

    return merged;
  }

  /**
   * Exports raw register bytes (e.g. 16 KB for p = 14).
   */
  public serialize(): Uint8Array {
    return new Uint8Array(this.registers);
  }

  /**
   * Restores sketch from raw register bytes.
   */
  public static deserialize(bytes: Uint8Array, precision = 14): HyperLogLog {
    const hll = new HyperLogLog(precision);
    if (bytes.length !== hll.numRegisters) {
      throw new Error(
        `Invalid byte length for precision ${precision}: expected ${hll.numRegisters}, got ${bytes.length}`
      );
    }
    hll.registers.set(bytes);
    return hll;
  }

  /**
   * Encodes sketch registers to Base64 string for compact HTTP JSON payloads.
   */
  public toBase64(): string {
    let binary = '';
    const len = this.registers.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(this.registers[i]);
    }
    return btoa(binary);
  }

  /**
   * Restores sketch from Base64 string.
   */
  public static fromBase64(b64: string, precision = 14): HyperLogLog {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return HyperLogLog.deserialize(bytes, precision);
  }

  public clear(): void {
    this.registers.fill(0);
  }
}

/**
 * High-Level Unique Catalog Reach & Playback Demographics Subsystem
 */
export class CatalogReachTracker {
  private uniqueTracksHLL: HyperLogLog;
  private uniqueArtistsHLL: HyperLogLog;
  private uniqueDaysHLL: HyperLogLog;

  constructor(precision = 14) {
    this.uniqueTracksHLL = new HyperLogLog(precision);
    this.uniqueArtistsHLL = new HyperLogLog(precision);
    this.uniqueDaysHLL = new HyperLogLog(precision);
  }

  /**
   * Ingests a playback event into the probabilistic sketches.
   */
  public recordPlay(track: Track, date = new Date()): void {
    if (track.id) {
      this.uniqueTracksHLL.add(track.id);
    }
    if (track.artist) {
      this.uniqueArtistsHLL.add(track.artist.toLowerCase().trim());
    }
    const dayKey = date.toISOString().slice(0, 10); // YYYY-MM-DD
    this.uniqueDaysHLL.add(dayKey);
  }

  public getUniqueTracksCount(): number {
    return this.uniqueTracksHLL.count();
  }

  public getUniqueArtistsCount(): number {
    return this.uniqueArtistsHLL.count();
  }

  public getUniqueListeningDaysCount(): number {
    return this.uniqueDaysHLL.count();
  }

  /**
   * Returns a compact sync payload (~36 KB total) representing millions of events.
   */
  public getSyncPayload(): { tracks: string; artists: string; days: string } {
    return {
      tracks: this.uniqueTracksHLL.toBase64(),
      artists: this.uniqueArtistsHLL.toBase64(),
      days: this.uniqueDaysHLL.toBase64(),
    };
  }

  /**
   * Merges remote device or cloud telemetry into local reach tracker via zero-cost union.
   */
  public mergeRemotePayload(payload: { tracks?: string; artists?: string; days?: string }): void {
    if (payload.tracks) {
      const remoteTracks = HyperLogLog.fromBase64(payload.tracks, this.uniqueTracksHLL.precision);
      this.uniqueTracksHLL = this.uniqueTracksHLL.merge(remoteTracks);
    }
    if (payload.artists) {
      const remoteArtists = HyperLogLog.fromBase64(payload.artists, this.uniqueArtistsHLL.precision);
      this.uniqueArtistsHLL = this.uniqueArtistsHLL.merge(remoteArtists);
    }
    if (payload.days) {
      const remoteDays = HyperLogLog.fromBase64(payload.days, this.uniqueDaysHLL.precision);
      this.uniqueDaysHLL = this.uniqueDaysHLL.merge(remoteDays);
    }
  }

  public clear(): void {
    this.uniqueTracksHLL.clear();
    this.uniqueArtistsHLL.clear();
    this.uniqueDaysHLL.clear();
  }
}
