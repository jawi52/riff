import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  BloomFilter,
  MemTable,
  LSMMemTableManager,
  auditLogLSM
} from '../../src/lib/lsmTree';

describe('LSM-Tree MemTable & Bloom Filter Engine', () => {
  describe('Probabilistic Bloom Filter', () => {
    let bloom: BloomFilter;

    beforeEach(() => {
      bloom = new BloomFilter({ expectedItems: 100, falsePositiveRate: 0.01 });
    });

    it('calculates optimal bit size (m) and hash functions (k)', () => {
      expect(bloom.getBitCount()).toBeGreaterThan(500);
      expect(bloom.getHashCount()).toBeGreaterThanOrEqual(5);
      expect(bloom.getItemCount()).toBe(0);
    });

    it('guarantees ZERO false negatives: added keys must always return true', () => {
      const keys = ['song-alpha', 'song-beta', 'song-gamma', 'user-action-123'];
      for (const k of keys) {
        bloom.add(k);
      }

      for (const k of keys) {
        expect(bloom.has(k)).toBe(true);
      }
    });

    it('exhibits low false positive rate on un-inserted keys', () => {
      for (let i = 0; i < 80; i++) {
        bloom.add(`registered-${i}`);
      }

      let falsePositives = 0;
      const testQueries = 100;
      for (let i = 0; i < testQueries; i++) {
        if (bloom.has(`unseen-key-${i}`)) {
          falsePositives++;
        }
      }

      // Expected false positive rate is ~1%, allowing small margin under test sample
      expect(falsePositives / testQueries).toBeLessThanOrEqual(0.05);
    });

    it('clears state and resets bit array', () => {
      bloom.add('track-1');
      expect(bloom.has('track-1')).toBe(true);

      bloom.clear();
      expect(bloom.getItemCount()).toBe(0);
      expect(bloom.has('track-1')).toBe(false);
    });
  });

  describe('Sorted MemTable', () => {
    let memTable: MemTable<string>;

    beforeEach(() => {
      memTable = new MemTable<string>();
    });

    it('maintains entries in lexicographical sorted order', () => {
      memTable.put('zebra', 'z');
      memTable.put('apple', 'a');
      memTable.put('mango', 'm');

      const all = memTable.getAll();
      expect(all.map((e) => e.key)).toEqual(['apple', 'mango', 'zebra']);
    });

    it('retrieves entries in O(log M) time and updates existing keys', () => {
      memTable.put('key1', 'val1');
      expect(memTable.get('key1')).toBe('val1');

      memTable.put('key1', 'val2');
      expect(memTable.get('key1')).toBe('val2');
      expect(memTable.size()).toBe(1);
    });

    it('supports tombstone deletions without removing entry immediately', () => {
      memTable.put('target', 'alive');
      expect(memTable.get('target')).toBe('alive');

      memTable.delete('target');
      expect(memTable.get('target')).toBeNull();

      const all = memTable.getAll();
      expect(all.length).toBe(1);
      expect(all[0].isDeleted).toBe(true);
    });

    it('executes ordered range scans [startKey, endKey]', () => {
      memTable.put('a', '1');
      memTable.put('c', '3');
      memTable.put('e', '5');
      memTable.put('g', '7');

      const inRange = memTable.range('b', 'f');
      expect(inRange.map((e) => e.key)).toEqual(['c', 'e']);
    });
  });

  describe('LSMMemTableManager & Batch Flushing', () => {
    let manager: LSMMemTableManager<{ val: number }>;

    beforeEach(() => {
      manager = new LSMMemTableManager<{ val: number }>({ maxMemTableSize: 5 });
    });

    it('coordinates put, Bloom filter registration, and fast retrieval', () => {
      manager.put('event-1', { val: 100 });
      manager.put('event-2', { val: 200 });

      expect(manager.getBloomFilter().has('event-1')).toBe(true);
      expect(manager.get('event-1')).toEqual({ val: 100 });
      expect(manager.get('event-2')).toEqual({ val: 200 });

      // Non-existent key is rejected by Bloom filter
      expect(manager.get('never-seen')).toBeNull();
    });

    it('merges active and flushing MemTables during range queries with active overriding', () => {
      manager.put('a', { val: 1 });
      manager.put('b', { val: 2 });

      // Freeze into flushing buffer
      manager.freeze();

      // Put newer version of 'b' and new 'c' in active buffer
      manager.put('b', { val: 99 });
      manager.put('c', { val: 3 });

      const results = manager.range('a', 'z');
      expect(results).toEqual([{ val: 1 }, { val: 99 }, { val: 3 }]);
    });

    it('atomically flushes active buffer to persistence commit function', async () => {
      const commitFn = vi.fn(async (_records: any[]) => {});

      manager.put('audit-1', { val: 10 });
      manager.put('audit-2', { val: 20 });
      manager.put('audit-3', { val: 30 });

      expect(manager.getActiveSize()).toBe(3);

      const flushedCount = await manager.flush(commitFn);
      expect(flushedCount).toBe(3);
      expect(commitFn).toHaveBeenCalledTimes(1);
      expect(commitFn.mock.calls[0][0].length).toBe(3);

      // Active and flushing buffers are cleared post-flush
      expect(manager.getActiveSize()).toBe(0);
      expect(manager.getFlushingSize()).toBe(0);
    });

    it('exports singleton auditLogLSM', () => {
      expect(auditLogLSM).toBeDefined();
      expect(auditLogLSM instanceof LSMMemTableManager).toBe(true);
    });
  });
});
