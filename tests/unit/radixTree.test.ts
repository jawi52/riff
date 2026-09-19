import { describe, it, expect, beforeEach } from 'vitest';
import { RadixTree, metadataRadixIndex } from '../../src/lib/radixTree';

describe('Compressed Radix Tree (Patricia Trie) with Inverted Index', () => {
  let tree: RadixTree<string>;

  beforeEach(() => {
    tree = new RadixTree<string>();
  });

  describe('Edge Compression & Node Bounded Invariant', () => {
    it('compresses non-branching edges into multi-character labels', () => {
      // Inserting single long word requires only 2 nodes (root + word node)
      tree.insert('contemporary', 'track-1');
      expect(tree.getKeyCount()).toBe(1);
      expect(tree.getNodeCount()).toBe(2);

      const res = tree.search('contemporary');
      expect(res).toBeDefined();
      expect(res?.has('track-1')).toBe(true);
    });

    it('splits edges dynamically on common prefix divergence', () => {
      tree.insert('romane', 't1');
      tree.insert('romanus', 't2');
      tree.insert('romulus', 't3');

      expect(tree.getKeyCount()).toBe(3);
      // Bound invariant: internal nodes <= 2K - 1
      expect(tree.getNodeCount()).toBeLessThanOrEqual(2 * 3);

      expect(tree.search('romane')?.has('t1')).toBe(true);
      expect(tree.search('romanus')?.has('t2')).toBe(true);
      expect(tree.search('romulus')?.has('t3')).toBe(true);
      expect(tree.search('roman')).toBeNull(); // prefix, not terminal key
    });
  });

  describe('Inverted Index Multi-Value Association', () => {
    it('associates multiple entity IDs with a single search key', () => {
      tree.insert('electronic', 'track-101');
      tree.insert('electronic', 'track-102');
      tree.insert('electronic', 'track-103');

      expect(tree.getKeyCount()).toBe(1);
      const values = tree.search('electronic');
      expect(values?.size).toBe(3);
      expect(Array.from(values || [])).toEqual(['track-101', 'track-102', 'track-103']);
    });
  });

  describe('Subtree Prefix Queries (searchPrefix & findKeysWithPrefix)', () => {
    beforeEach(() => {
      tree.insert('rock', 'id-rock');
      tree.insert('rock classic', 'id-rock-classic');
      tree.insert('rock alternate', 'id-rock-alt');
      tree.insert('r&b', 'id-rnb');
      tree.insert('rap', 'id-rap');
    });

    it('aggregates all descendant inverted index values for a prefix', () => {
      const rockValues = tree.searchPrefix('rock');
      expect(rockValues.size).toBe(3);
      expect(rockValues.has('id-rock')).toBe(true);
      expect(rockValues.has('id-rock-classic')).toBe(true);
      expect(rockValues.has('id-rock-alt')).toBe(true);
      expect(rockValues.has('id-rap')).toBe(false);
    });

    it('handles prefixes that end midway through an edge label', () => {
      // 'ro' matches 'rock' prefix
      const roValues = tree.searchPrefix('ro');
      expect(roValues.size).toBe(3);
    });

    it('returns empty set when prefix does not match any branch', () => {
      const empty = tree.searchPrefix('jazz');
      expect(empty.size).toBe(0);
    });

    it('finds full keys matching the given prefix up to limit', () => {
      const keys = tree.findKeysWithPrefix('rock');
      expect(keys.length).toBe(3);
      expect(keys).toContain('rock');
      expect(keys).toContain('rock classic');
      expect(keys).toContain('rock alternate');
    });
  });

  describe('Branch Compaction on Key Deletion', () => {
    it('removes keys and re-compacts single-child intermediate branches', () => {
      tree.insert('test', '1');
      tree.insert('testing', '2');
      tree.insert('tester', '3');

      const initialNodes = tree.getNodeCount();
      expect(tree.getKeyCount()).toBe(3);

      // Delete 'testing'
      const deleted = tree.delete('testing');
      expect(deleted).toBe(true);
      expect(tree.getKeyCount()).toBe(2);
      expect(tree.search('testing')).toBeNull();
      expect(tree.search('tester')?.has('3')).toBe(true);
      expect(tree.search('test')?.has('1')).toBe(true);

      // Node count should have decreased or merged
      expect(tree.getNodeCount()).toBeLessThanOrEqual(initialNodes);
    });

    it('supports deleting specific values from an inverted index key', () => {
      tree.insert('pop', 't1');
      tree.insert('pop', 't2');

      expect(tree.search('pop')?.size).toBe(2);

      tree.delete('pop', 't1');
      const updated = tree.search('pop');
      expect(updated?.size).toBe(1);
      expect(updated?.has('t2')).toBe(true);
      expect(updated?.has('t1')).toBe(false);
    });
  });

  describe('Normalization & Edge Cases', () => {
    it('normalizes casing and trims whitespace', () => {
      tree.insert('  Arijit Singh  ', 'artist-1');
      expect(tree.search('arijit singh')?.has('artist-1')).toBe(true);
      expect(tree.search('ARIJIT SINGH')?.has('artist-1')).toBe(true);
    });

    it('clears all state on clear()', () => {
      tree.insert('song1', 's1');
      tree.insert('song2', 's2');
      expect(tree.getKeyCount()).toBe(2);

      tree.clear();
      expect(tree.getKeyCount()).toBe(0);
      expect(tree.getNodeCount()).toBe(1);
      expect(tree.search('song1')).toBeNull();
    });
  });

  describe('Singleton Export', () => {
    it('exports metadataRadixIndex singleton instance', () => {
      expect(metadataRadixIndex).toBeDefined();
      expect(metadataRadixIndex instanceof RadixTree).toBe(true);
    });
  });
});
