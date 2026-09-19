import { describe, it, expect } from 'vitest';
import { PrefixTrie } from '../../src/lib/trie';

describe('High-Performance Prefix Trie (Prefix Tree)', () => {
  it('should insert and search by prefix in O(K)', () => {
    const trie = new PrefixTrie<string>();

    trie.insert('Arijit Singh', 'arijit_singh');
    trie.insert('Atif Aslam', 'atif_aslam');
    trie.insert('Ali Sethi', 'ali_sethi');
    trie.insert('AP Dhillon', 'ap_dhillon');

    // Searching 'a' should return all artists starting with 'a'
    const aResults = trie.searchPrefix('a');
    expect(aResults).toHaveLength(4);

    // Searching 'ari' should specifically return 'arijit_singh'
    const ariResults = trie.searchPrefix('ari');
    expect(ariResults).toEqual(['arijit_singh']);

    // Searching 'at' should specifically return 'atif_aslam'
    const atResults = trie.searchPrefix('at');
    expect(atResults).toEqual(['atif_aslam']);

    // Non-existent prefix returns empty array
    expect(trie.searchPrefix('xyz')).toEqual([]);
  });

  it('should support multi-word token indexing (find by first or last name)', () => {
    const trie = new PrefixTrie<{ id: string; name: string }>();

    const guru = { id: '1', name: 'Guru Randhawa' };
    const arijit = { id: '2', name: 'Arijit Singh' };
    const talha = { id: '3', name: 'Talha Anjum' };

    trie.insertTokens(guru.name, guru);
    trie.insertTokens(arijit.name, arijit);
    trie.insertTokens(talha.name, talha);

    // Search by first name
    expect(trie.searchPrefix('guru')).toEqual([guru]);
    expect(trie.searchPrefix('tal')).toEqual([talha]);

    // Search by second/last name token!
    expect(trie.searchPrefix('randhawa')).toEqual([guru]);
    expect(trie.searchPrefix('singh')).toEqual([arijit]);
    expect(trie.searchPrefix('anjum')).toEqual([talha]);
  });

  it('should normalize casing, extra spaces, and trim queries', () => {
    const trie = new PrefixTrie<string>();
    trie.insert('   Diljit  Dosanjh  ', 'diljit');

    expect(trie.searchPrefix('DILJIT')).toEqual(['diljit']);
    expect(trie.searchPrefix('  dil  ')).toEqual(['diljit']);
  });

  it('should respect the limit parameter', () => {
    const trie = new PrefixTrie<number>();
    for (let i = 1; i <= 20; i++) {
      trie.insert(`track_${i}`, i);
    }

    const limited = trie.searchPrefix('track', 5);
    expect(limited).toHaveLength(5);
  });

  it('should correctly report hasPrefix', () => {
    const trie = new PrefixTrie<string>();
    trie.insert('Coke Studio', 'coke');

    expect(trie.hasPrefix('coke')).toBe(true);
    expect(trie.hasPrefix('co')).toBe(true);
    expect(trie.hasPrefix('cok')).toBe(true);
    expect(trie.hasPrefix('pepsi')).toBe(false);
  });

  it('should clear all nodes on clear()', () => {
    const trie = new PrefixTrie<string>();
    trie.insert('song', '1');

    expect(trie.size).toBe(1);
    trie.clear();
    expect(trie.size).toBe(0);
    expect(trie.searchPrefix('so')).toEqual([]);
  });
});
