import { describe, it, expect } from 'vitest';
import { levenshteinDistance, similarityRatio, BKTree } from '../../src/lib/fuzzySearch';

describe('Typo-Tolerant Metric Space Search (Levenshtein & BK-Tree)', () => {
  describe('Levenshtein Distance', () => {
    it('should compute exact distance for basic string mutations', () => {
      expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
      expect(levenshteinDistance('Arijit', 'Arijit')).toBe(0);
      expect(levenshteinDistance('arijt', 'arijit')).toBe(1); // 1 deletion/insertion
      expect(levenshteinDistance('diljeet', 'diljit')).toBe(2);
      expect(levenshteinDistance('weeknd', 'the weeknd')).toBe(4);
    });

    it('should handle empty strings and whitespace normalization', () => {
      expect(levenshteinDistance('', 'hello')).toBe(5);
      expect(levenshteinDistance('hello', '')).toBe(5);
      expect(levenshteinDistance('   Atif   ', 'atif')).toBe(0);
    });

    it('should calculate accurate similarity ratios between 0.0 and 1.0', () => {
      expect(similarityRatio('test', 'test')).toBe(1.0);
      expect(similarityRatio('abc', 'xyz')).toBe(0.0);
      expect(similarityRatio('arijt', 'arijit')).toBeCloseTo(5 / 6, 2);
    });
  });

  describe('BK-Tree (Burkhard-Keller Metric Tree)', () => {
    it('should insert terms and retrieve nearest neighbors within edit distance', () => {
      const bktree = new BKTree<string>();
      const terms = ['book', 'books', 'cake', 'boo', 'boon', 'cook', 'cart'];
      terms.forEach((t) => bktree.insert(t, t));

      expect(bktree.size).toBe(terms.length);

      // Search with maxDistance = 1 from 'book'
      const results1 = bktree.search('book', 1);
      const matchedTerms = results1.map((r) => r.term);
      expect(matchedTerms).toContain('book');
      expect(matchedTerms).toContain('books');
      expect(matchedTerms).toContain('boo');
      expect(matchedTerms).toContain('boon');
      expect(matchedTerms).toContain('cook');
      expect(matchedTerms).not.toContain('cake');
    });

    it('should correctly auto-correct music artist typos via multi-token indexing', () => {
      const tree = new BKTree<{ id: string; name: string }>();

      const artists = [
        { id: '1', name: 'Arijit Singh' },
        { id: '2', name: 'Diljit Dosanjh' },
        { id: '3', name: 'Atif Aslam' },
        { id: '4', name: 'Talha Anjum' },
        { id: '5', name: 'The Weeknd' },
        { id: '6', name: 'Guru Randhawa' },
      ];

      artists.forEach((a) => tree.insertTokens(a.name, a));

      // 1. "arijt" (1 typo away from "arijit") -> Arijit Singh
      const matchArijit = tree.search('arijt', 1);
      expect(matchArijit.length).toBeGreaterThan(0);
      expect(matchArijit[0].payload.name).toBe('Arijit Singh');

      // 2. "diljeet" (2 typos away from "diljit") -> Diljit Dosanjh
      const matchDiljit = tree.search('diljeet', 2);
      expect(matchDiljit.length).toBeGreaterThan(0);
      expect(matchDiljit[0].payload.name).toBe('Diljit Dosanjh');

      // 3. "atif aslm" (1 typo away from "atif aslam") -> Atif Aslam
      const matchAtif = tree.search('atif aslm', 2);
      expect(matchAtif.length).toBeGreaterThan(0);
      expect(matchAtif[0].payload.name).toBe('Atif Aslam');

      // 4. "anjm" (1 typo away from "anjum") -> Talha Anjum
      const matchTalha = tree.search('anjm', 1);
      expect(matchTalha.length).toBeGreaterThan(0);
      expect(matchTalha[0].payload.name).toBe('Talha Anjum');
    });

    it('should rank closer matches ahead of further matches', () => {
      const tree = new BKTree<string>();
      tree.insert('sound', 'sound');
      tree.insert('bound', 'bound');
      tree.insert('ground', 'ground');

      const res = tree.search('hound', 2);
      expect(res.length).toBeGreaterThanOrEqual(2);
      // 'bound' and 'sound' have distance 1, 'ground' has distance 2
      expect(res[0].distance).toBe(1);
    });

    it('should respect the limit parameter', () => {
      const tree = new BKTree<number>();
      for (let i = 0; i < 20; i++) {
        tree.insert(`track_${i}`, i);
      }

      const res = tree.search('track_1', 2, 3);
      expect(res.length).toBeLessThanOrEqual(3);
    });
  });
});
