import { describe, it, expect, beforeEach } from 'vitest';
import {
  AhoCorasick,
  ExplicitContentModerator,
  DEFAULT_EXPLICIT_TERMS,
} from '../../src/lib/ahoCorasick';
import { SyncedLyricLine } from '../../src/types';

describe('Aho-Corasick Multi-Pattern Automaton & Lyric Content Moderation', () => {
  describe('Classical Aho-Corasick Automaton Construction & Matching', () => {
    let ac: AhoCorasick;

    beforeEach(() => {
      // Textbook classic dictionary: ['he', 'she', 'his', 'hers']
      ac = new AhoCorasick(['he', 'she', 'his', 'hers']);
    });

    it('initializes and computes BFS failure links', () => {
      expect(ac.getPatternCount()).toBe(4);
    });

    it('finds all overlapping keyword patterns in a single linear pass on "ushers"', () => {
      // Text: "ushers"
      // Indices:
      // 0: u
      // 1: s
      // 2: h (she ends at 4: indices 1, 2, 3)
      // 3: e (he ends at 4: indices 2, 3)
      // 4: r
      // 5: s (hers ends at 6: indices 2, 3, 4, 5)
      const matches = ac.search('ushers');
      const patterns = matches.map((m) => m.pattern);

      expect(patterns).toContain('she');
      expect(patterns).toContain('he');
      expect(patterns).toContain('hers');

      const sheMatch = matches.find((m) => m.pattern === 'she');
      expect(sheMatch).toEqual({ pattern: 'she', startIndex: 1, endIndex: 4 });

      const heMatch = matches.find((m) => m.pattern === 'he');
      expect(heMatch).toEqual({ pattern: 'he', startIndex: 2, endIndex: 4 });

      const hersMatch = matches.find((m) => m.pattern === 'hers');
      expect(hersMatch).toEqual({ pattern: 'hers', startIndex: 2, endIndex: 6 });
    });

    it('containsAny returns true immediately on first pattern encounter', () => {
      expect(ac.containsAny('where is his coat')).toBe(true);
      expect(ac.containsAny('an entirely unrelated sentence')).toBe(false);
    });

    it('handles dynamic pattern addition and re-compilation', () => {
      ac.addPattern('coat');
      expect(ac.containsAny('where is his coat')).toBe(true);
      const matches = ac.search('where is his coat');
      expect(matches.map((m) => m.pattern)).toContain('coat');
    });
  });

  describe('Word-Boundary Discrimination & Anti-False-Positive Filtering', () => {
    let ac: AhoCorasick;

    beforeEach(() => {
      ac = new AhoCorasick(['ass', 'hell', 'crap']);
    });

    it('distinguishes standalone keywords from innocent substrings with wordBoundary: true', () => {
      // "bass guitar in a classic track" contains 'ass' inside 'bass' and 'classic'
      const musicalText = 'Playing heavy bass in a classic jazz room';
      const falsePositiveMatches = ac.search(musicalText, { wordBoundary: true });
      expect(falsePositiveMatches.length).toBe(0);

      // Standalone 'ass' should match
      const explicitText = 'Get your ass over here right now';
      const trueMatches = ac.search(explicitText, { wordBoundary: true });
      expect(trueMatches.length).toBe(1);
      expect(trueMatches[0].pattern).toBe('ass');
    });

    it('matches terms flanked by punctuation or quotes', () => {
      const text = 'What the (hell)? This is crap!';
      const matches = ac.search(text, { wordBoundary: true });
      expect(matches.map((m) => m.pattern)).toEqual(['hell', 'crap']);
    });
  });

  describe('In-Place Lyric Masking & Sanitization', () => {
    let ac: AhoCorasick;

    beforeEach(() => {
      ac = new AhoCorasick(['fuck', 'shit', 'damn', 'bitch']);
    });

    it('masks explicit words with asterisks while preserving text length and punctuation', () => {
      const lyric = 'Damn, this shit is crazy, fuck!';
      const masked = ac.maskExplicitText(lyric, '*', { wordBoundary: true });

      expect(masked).toBe('****, this **** is crazy, ****!');
      // Length must remain strictly invariant to preserve lyric subtitle rendering width
      expect(masked.length).toBe(lyric.length);
    });

    it('supports preserving the first letter for mild radio edit mode', () => {
      const lyric = 'Stop talking shit right now';
      const masked = ac.maskExplicitText(lyric, '*', {
        wordBoundary: true,
        preserveFirstLetter: true,
      });

      expect(masked).toBe('Stop talking s*** right now');
    });

    it('leaves clean lyrics completely untouched', () => {
      const cleanLyric = 'Here comes the sun, and I say it is all right';
      const masked = ac.maskExplicitText(cleanLyric, '*', { wordBoundary: true });
      expect(masked).toBe(cleanLyric);
    });
  });

  describe('Leetspeak & Obfuscation Normalization', () => {
    it('normalizes common leetspeak substitutions to standard Latin characters', () => {
      expect(AhoCorasick.normalizeLeetspeak('f0ck')).toBe('fock');
      expect(AhoCorasick.normalizeLeetspeak('$h!t')).toBe('shit');
      expect(AhoCorasick.normalizeLeetspeak('b!tch')).toBe('bitch');
      expect(AhoCorasick.normalizeLeetspeak('d!ck')).toBe('dick');
    });

    it('catches obfuscated explicit terms in song titles', () => {
      const moderator = new ExplicitContentModerator();
      const result = moderator.classifyTrack('Move B!tch', 'Ludacris');
      expect(result.isExplicit).toBe(true);
      expect(result.matchedTerms).toContain('bitch');
    });
  });

  describe('ExplicitContentModerator & Synced Lyric Pipeline', () => {
    let moderator: ExplicitContentModerator;

    beforeEach(() => {
      moderator = new ExplicitContentModerator(DEFAULT_EXPLICIT_TERMS);
    });

    const mockLyrics: SyncedLyricLine[] = [
      { timeMs: 0, text: 'Clean opening acoustic guitar intro' },
      { timeMs: 3500, text: 'This shit is hitting so hard right now' },
      { timeMs: 7000, text: 'Melodic chorus sings about peace' },
      { timeMs: 11000, text: 'What the fuck did you just say?' },
    ];

    it('filters synced lyrics when clean mode is enabled without altering timestamps', () => {
      const filtered = moderator.filterSyncedLyrics(mockLyrics, true);

      expect(filtered.length).toBe(4);
      expect(filtered[0].text).toBe('Clean opening acoustic guitar intro');
      expect(filtered[0].timeMs).toBe(0);

      expect(filtered[1].text).toBe('This **** is hitting so hard right now');
      expect(filtered[1].timeMs).toBe(3500);

      expect(filtered[2].text).toBe('Melodic chorus sings about peace');
      expect(filtered[2].timeMs).toBe(7000);

      expect(filtered[3].text).toBe('What the **** did you just say?');
      expect(filtered[3].timeMs).toBe(11000);
    });

    it('returns raw lyrics without modification when clean mode is disabled', () => {
      const unmasked = moderator.filterSyncedLyrics(mockLyrics, false);
      expect(unmasked).toEqual(mockLyrics);
    });

    it('classifies explicit tracks vs clean tracks', () => {
      const cleanTrack = moderator.classifyTrack(
        'Bohemian Rhapsody',
        'Queen',
        'Mama, just killed a man, put a gun against his head'
      );
      expect(cleanTrack.isExplicit).toBe(false);
      expect(cleanTrack.matchedTerms).toEqual([]);

      const explicitTrack = moderator.classifyTrack(
        'Rap God',
        'Eminem',
        'I am about to fuck this whole game up'
      );
      expect(explicitTrack.isExplicit).toBe(true);
      expect(explicitTrack.matchedTerms).toContain('fuck');
    });

    it('allows registering custom prohibited terms dynamically', () => {
      moderator.addTerms(['spoilers', 'custombanned']);
      const res = moderator.classifyTrack('Latest Movie', 'Director', 'Warning: heavy spoilers ahead');
      expect(res.isExplicit).toBe(true);
      expect(res.matchedTerms).toContain('spoilers');
    });
  });

  describe('Edge Cases & State Management', () => {
    it('handles empty text, empty search queries, and empty dictionary safely', () => {
      const ac = new AhoCorasick([]);
      expect(ac.search('')).toEqual([]);
      expect(ac.containsAny('')).toBe(false);
      expect(ac.maskExplicitText('')).toBe('');
    });

    it('clears state correctly', () => {
      const ac = new AhoCorasick(['test', 'word']);
      expect(ac.getPatternCount()).toBe(2);

      ac.clear();
      expect(ac.getPatternCount()).toBe(0);
      expect(ac.search('test')).toEqual([]);
    });
  });
});
