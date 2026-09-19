/**
 * Log-Structured Merge (LSM) MemTable & Bloom Filter Engine
 *
 * Implements:
 * 1. Space-Optimized Bloom Filter: Probabilistic set membership with zero false negatives
 *    using the Kirsch-Mitzenmacher double-hashing technique.
 * 2. Sorted MemTable: Memory-bounded sorted mutation buffer for high-throughput batching.
 * 3. LSM MemTable Manager: Coordinates active writes, immutable freeze segments,
 *    and bulk persistence flushes to eliminate flash storage write-amplification.
 */

// ==========================================
// 1. Probabilistic Bloom Filter
// ==========================================

export interface BloomFilterOptions {
  expectedItems?: number;       // Expected number of elements (N)
  falsePositiveRate?: number;   // Target false positive probability (P)
}

export class BloomFilter {
  private readonly bitCount: number; // m
  private readonly hashCount: number; // k
  private readonly bitArray: Uint8Array;
  private itemCount = 0;

  constructor(options: BloomFilterOptions = {}) {
    const n = Math.max(10, options.expectedItems ?? 1000);
    const p = Math.max(0.0001, Math.min(0.2, options.falsePositiveRate ?? 0.01));

    // m = - (n * ln(p)) / (ln(2)^2)
    this.bitCount = Math.ceil(-(n * Math.log(p)) / (Math.LN2 * Math.LN2));
    // k = (m / n) * ln(2)
    this.hashCount = Math.max(1, Math.round((this.bitCount / n) * Math.LN2));

    this.bitArray = new Uint8Array(Math.ceil(this.bitCount / 8));
  }

  /**
   * 32-bit FNV-1a Hash variant.
   */
  private hash1(str: string): number {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 16777619);
    }
    return h >>> 0;
  }

  /**
   * 32-bit Murmur-inspired rotational hash variant.
   */
  private hash2(str: string): number {
    let h = 0x9e3779b9;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ (str.charCodeAt(i) * 31), 2246822519);
      h = (h << 13) | (h >>> 19);
    }
    return h >>> 0;
  }

  /**
   * Adds an item to the Bloom Filter.
   */
  public add(key: string): void {
    if (!key) return;

    const h1 = this.hash1(key);
    const h2 = this.hash2(key);

    // Kirsch-Mitzenmacher double hashing: g_i(x) = (h1 + i * h2) % m
    for (let i = 0; i < this.hashCount; i++) {
      const bitIndex = ((h1 + (i * h2)) >>> 0) % this.bitCount;
      const byteIndex = bitIndex >> 3; // bitIndex / 8
      const bitOffset = bitIndex & 7;  // bitIndex % 8
      this.bitArray[byteIndex] |= 1 << bitOffset;
    }

    this.itemCount++;
  }

  /**
   * Tests for key membership.
   *
   * @returns false: GUARANTEED not present (Zero False Negatives)
   *          true:  PROBABLY present (subject to false positive rate)
   */
  public has(key: string): boolean {
    if (!key || this.itemCount === 0) return false;

    const h1 = this.hash1(key);
    const h2 = this.hash2(key);

    for (let i = 0; i < this.hashCount; i++) {
      const bitIndex = ((h1 + (i * h2)) >>> 0) % this.bitCount;
      const byteIndex = bitIndex >> 3;
      const bitOffset = bitIndex & 7;
      if ((this.bitArray[byteIndex] & (1 << bitOffset)) === 0) {
        return false; // Zero false negatives guarantee
      }
    }

    return true;
  }

  public getBitCount(): number {
    return this.bitCount;
  }

  public getHashCount(): number {
    return this.hashCount;
  }

  public getItemCount(): number {
    return this.itemCount;
  }

  public clear(): void {
    this.bitArray.fill(0);
    this.itemCount = 0;
  }
}

// ==========================================
// 2. Sorted MemTable
// ==========================================

export interface MemTableEntry<T> {
  key: string;
  value: T;
  timestamp: number;
  isDeleted?: boolean; // Tombstone marker
}

export class MemTable<T = any> {
  private entries: MemTableEntry<T>[] = [];

  /**
   * Binary search helper to find entry index or insertion position.
   */
  private findIndex(key: string): { index: number; found: boolean } {
    let low = 0;
    let high = this.entries.length - 1;

    while (low <= high) {
      const mid = (low + high) >> 1;
      const cmp = this.entries[mid].key.localeCompare(key);

      if (cmp === 0) {
        return { index: mid, found: true };
      } else if (cmp < 0) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    return { index: low, found: false };
  }

  /**
   * Inserts or updates an entry in sorted order: O(M) write, O(log M) search.
   */
  public put(key: string, value: T): void {
    const { index, found } = this.findIndex(key);
    const entry: MemTableEntry<T> = {
      key,
      value,
      timestamp: Date.now()
    };

    if (found) {
      this.entries[index] = entry;
    } else {
      this.entries.splice(index, 0, entry);
    }
  }

  /**
   * Inserts a tombstone marker for deletion.
   */
  public delete(key: string): void {
    const { index, found } = this.findIndex(key);
    const tombstone: MemTableEntry<T> = {
      key,
      value: null as any,
      timestamp: Date.now(),
      isDeleted: true
    };

    if (found) {
      this.entries[index] = tombstone;
    } else {
      this.entries.splice(index, 0, tombstone);
    }
  }

  /**
   * Retrieves an entry via binary search in O(log M) time.
   */
  public get(key: string): T | null {
    const { index, found } = this.findIndex(key);
    if (!found) return null;

    const entry = this.entries[index];
    return entry.isDeleted ? null : entry.value;
  }

  /**
   * Performs an ordered range scan: [startKey, endKey] in O(log M + K) time.
   */
  public range(startKey: string, endKey: string): MemTableEntry<T>[] {
    const { index: startIdx } = this.findIndex(startKey);
    const results: MemTableEntry<T>[] = [];

    for (let i = startIdx; i < this.entries.length; i++) {
      const entry = this.entries[i];
      if (entry.key.localeCompare(endKey) > 0) break;
      if (!entry.isDeleted) {
        results.push(entry);
      }
    }

    return results;
  }

  public size(): number {
    return this.entries.length;
  }

  public getAll(): MemTableEntry<T>[] {
    return [...this.entries];
  }

  public clear(): void {
    this.entries = [];
  }
}

// ==========================================
// 3. LSM MemTable Manager
// ==========================================

export interface LSMMemTableOptions {
  maxMemTableSize?: number; // Threshold to trigger immutable freeze and flush (default: 200)
  expectedItems?: number;
  falsePositiveRate?: number;
}

export class LSMMemTableManager<T = any> {
  private activeMemTable: MemTable<T>;
  private flushingMemTable: MemTable<T> | null = null;
  private bloomFilter: BloomFilter;
  private readonly maxMemTableSize: number;
  private isFlushing = false;

  constructor(options: LSMMemTableOptions = {}) {
    this.maxMemTableSize = Math.max(10, options.maxMemTableSize ?? 200);
    this.activeMemTable = new MemTable<T>();
    this.bloomFilter = new BloomFilter({
      expectedItems: options.expectedItems ?? 2000,
      falsePositiveRate: options.falsePositiveRate ?? 0.01
    });
  }

  /**
   * Puts a key-value record into the active MemTable.
   * Updates the Bloom filter for rapid early-exit queries.
   */
  public put(key: string, value: T): void {
    this.bloomFilter.add(key);
    this.activeMemTable.put(key, value);
    if (!this.flushingMemTable && this.activeMemTable.size() >= this.maxMemTableSize) {
      this.freeze();
    }
  }

  /**
   * Deletes a key by placing a tombstone in the active MemTable.
   */
  public delete(key: string): void {
    this.activeMemTable.delete(key);
  }

  /**
   * Queries for a key using Bloom filter early-exit guard,
   * checking active MemTable first, then flushing buffer.
   */
  public get(key: string): T | null {
    // 1. Bloom Filter Early-Exit Guard (Zero False Negatives)
    if (!this.bloomFilter.has(key)) {
      return null;
    }

    // 2. Active MemTable Query
    const activeVal = this.activeMemTable.get(key);
    if (activeVal !== null) {
      return activeVal;
    }

    // 3. Flushing Buffer Query
    if (this.flushingMemTable) {
      return this.flushingMemTable.get(key);
    }

    return null;
  }

  /**
   * Scans a sorted key range across both active and flushing buffers.
   */
  public range(startKey: string, endKey: string): T[] {
    const activeEntries = this.activeMemTable.range(startKey, endKey);
    const map = new Map<string, MemTableEntry<T>>();

    if (this.flushingMemTable) {
      const flushingEntries = this.flushingMemTable.range(startKey, endKey);
      for (const entry of flushingEntries) {
        map.set(entry.key, entry);
      }
    }

    // Active entries overwrite older flushing entries
    for (const entry of activeEntries) {
      map.set(entry.key, entry);
    }

    const merged = Array.from(map.values())
      .filter((e) => !e.isDeleted)
      .sort((a, b) => a.key.localeCompare(b.key));

    return merged.map((e) => e.value);
  }

  /**
   * Freezes the current active MemTable into the immutable flushing buffer.
   */
  public freeze(): void {
    if (this.activeMemTable.size() > 0) {
      this.flushingMemTable = this.activeMemTable;
      this.activeMemTable = new MemTable<T>();
    }
  }

  /**
   * Commits the flushing buffer (or freezes active buffer if none) to disk/storage.
   */
  public async flush(
    commitBatchFn?: (records: MemTableEntry<T>[]) => Promise<void>
  ): Promise<number> {
    if (this.isFlushing) {
      return 0;
    }

    if (!this.flushingMemTable && this.activeMemTable.size() === 0) {
      return 0;
    }

    this.isFlushing = true;
    if (!this.flushingMemTable) {
      this.freeze();
    }

    const itemsToCommit = this.flushingMemTable ? this.flushingMemTable.getAll() : [];
    const count = itemsToCommit.length;

    try {
      if (commitBatchFn) {
        await commitBatchFn(itemsToCommit);
      }
      this.flushingMemTable = null;
    } finally {
      this.isFlushing = false;
    }

    return count;
  }

  public getActiveSize(): number {
    return this.activeMemTable.size();
  }

  public getFlushingSize(): number {
    return this.flushingMemTable ? this.flushingMemTable.size() : 0;
  }

  public getBloomFilter(): BloomFilter {
    return this.bloomFilter;
  }

  public clear(): void {
    this.activeMemTable.clear();
    this.flushingMemTable = null;
    this.bloomFilter.clear();
  }
}

// Global Singleton Activity & Playback Audit LSM MemTable
export const auditLogLSM = new LSMMemTableManager<{
  action: string;
  details: any;
  timestamp: number;
}>({ maxMemTableSize: 100 });
