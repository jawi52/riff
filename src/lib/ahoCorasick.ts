/**
 * Aho-Corasick Multi-Pattern String Matching Automaton
 *
 * Implements a deterministic finite state machine (Trie with BFS failure links)
 * to locate all occurrences of K dictionary keywords in text of length N
 * in optimal O(N + Z) time in a single linear pass.
 *
 * Used for:
 * - Real-time explicit lyric moderation and "Clean Version" masking.
 * - Sub-millisecond song metadata classification (isExplicit: true).
 * - Multi-word phrase matching with word-boundary awareness and leetspeak normalization.
 */

import { SyncedLyricLine } from '../types';

export interface MatchResult {
  pattern: string;
  startIndex: number;
  endIndex: number; // exclusive
}

export class AhoCorasickNode {
  public children = new Map<string, AhoCorasickNode>();
  public failureLink: AhoCorasickNode | null = null;
  public output: string[] = [];
  public depth = 0;
}

export interface SearchOptions {
  caseSensitive?: boolean;
  wordBoundary?: boolean;
}

export class AhoCorasick {
  private root: AhoCorasickNode = new AhoCorasickNode();
  private isCompiled = false;
  private patternCount = 0;

  constructor(patterns?: string[]) {
    if (patterns && patterns.length > 0) {
      for (const p of patterns) {
        this.addPattern(p);
      }
      this.buildFailureLinks();
    }
  }

  /**
   * Adds a keyword pattern to the trie.
   */
  public addPattern(pattern: string): void {
    const trimmed = pattern.trim().toLowerCase();
    if (!trimmed) return;

    let curr = this.root;
    for (let i = 0; i < trimmed.length; i++) {
      const ch = trimmed[i];
      let next = curr.children.get(ch);
      if (!next) {
        next = new AhoCorasickNode();
        next.depth = curr.depth + 1;
        curr.children.set(ch, next);
      }
      curr = next;
    }

    if (!curr.output.includes(trimmed)) {
      curr.output.push(trimmed);
      this.patternCount++;
    }
    this.isCompiled = false;
  }

  /**
   * Breadth-First Search (BFS) to compute failure links and dictionary output links.
   * Runs in O(sum of pattern lengths).
   */
  public buildFailureLinks(): void {
    const queue: AhoCorasickNode[] = [];

    // All depth-1 children of root have failure link pointing to root
    for (const [, child] of this.root.children) {
      child.failureLink = this.root;
      queue.push(child);
    }

    // BFS traversal
    while (queue.length > 0) {
      const curr = queue.shift()!;

      for (const [ch, child] of curr.children) {
        let f = curr.failureLink;

        // Trace failure links until a matching child transition is found or root is reached
        while (f !== null && !f.children.has(ch)) {
          f = f.failureLink;
        }

        if (f !== null && f.children.has(ch)) {
          child.failureLink = f.children.get(ch)!;
        } else {
          child.failureLink = this.root;
        }

        // Merge output patterns from failure link
        if (child.failureLink.output.length > 0) {
          child.output = Array.from(new Set([...child.output, ...child.failureLink.output]));
        }

        queue.push(child);
      }
    }

    this.isCompiled = true;
  }

  /**
   * Checks if a character at index in text is a word character.
   */
  private isWordChar(char: string | undefined): boolean {
    if (!char) return false;
    return /[\p{L}\p{N}_]/u.test(char);
  }

  /**
   * Scans text in a single O(N + Z) pass, returning all matches.
   */
  public search(text: string, options: SearchOptions = {}): MatchResult[] {
    if (!this.isCompiled) {
      this.buildFailureLinks();
    }

    if (!text || this.patternCount === 0) return [];

    const { caseSensitive = false, wordBoundary = false } = options;
    const searchTarget = caseSensitive ? text : text.toLowerCase();
    const results: MatchResult[] = [];

    let curr = this.root;

    for (let i = 0; i < searchTarget.length; i++) {
      const ch = searchTarget[i];

      while (curr !== this.root && !curr.children.has(ch)) {
        curr = curr.failureLink || this.root;
      }

      if (curr.children.has(ch)) {
        curr = curr.children.get(ch)!;
      }

      if (curr.output.length > 0) {
        for (const pattern of curr.output) {
          const startIndex = i - pattern.length + 1;
          const endIndex = i + 1;

          if (wordBoundary) {
            const charBefore = text[startIndex - 1];
            const charAfter = text[endIndex];

            if (this.isWordChar(charBefore) || this.isWordChar(charAfter)) {
              continue; // Skip substring match inside a larger word (e.g. 'ass' in 'bass')
            }
          }

          results.push({
            pattern,
            startIndex,
            endIndex,
          });
        }
      }
    }

    return results;
  }

  /**
   * Fast-path check: returns true immediately when any dictionary pattern is detected.
   */
  public containsAny(text: string, options: SearchOptions = {}): boolean {
    if (!this.isCompiled) {
      this.buildFailureLinks();
    }

    if (!text || this.patternCount === 0) return false;

    const { caseSensitive = false, wordBoundary = false } = options;
    const searchTarget = caseSensitive ? text : text.toLowerCase();
    let curr = this.root;

    for (let i = 0; i < searchTarget.length; i++) {
      const ch = searchTarget[i];

      while (curr !== this.root && !curr.children.has(ch)) {
        curr = curr.failureLink || this.root;
      }

      if (curr.children.has(ch)) {
        curr = curr.children.get(ch)!;
      }

      if (curr.output.length > 0) {
        if (!wordBoundary) return true;

        for (const pattern of curr.output) {
          const startIndex = i - pattern.length + 1;
          const endIndex = i + 1;
          const charBefore = text[startIndex - 1];
          const charAfter = text[endIndex];

          if (!this.isWordChar(charBefore) && !this.isWordChar(charAfter)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Masks matched explicit terms with a specified character (default '*') while preserving length and punctuation.
   */
  public maskExplicitText(
    text: string,
    maskChar = '*',
    options: SearchOptions & { preserveFirstLetter?: boolean } = { wordBoundary: true }
  ): string {
    const matches = this.search(text, options);
    if (matches.length === 0) return text;

    // Merge overlapping match intervals
    const intervals: [number, number][] = matches.map((m) => [m.startIndex, m.endIndex]);
    intervals.sort((a, b) => a[0] - b[0]);

    const merged: [number, number][] = [];
    for (const [start, end] of intervals) {
      if (merged.length === 0) {
        merged.push([start, end]);
      } else {
        const last = merged[merged.length - 1];
        if (start <= last[1]) {
          last[1] = Math.max(last[1], end);
        } else {
          merged.push([start, end]);
        }
      }
    }

    // Apply masks
    const chars = Array.from(text);
    for (const [start, end] of merged) {
      const maskStart = options.preserveFirstLetter && end - start > 2 ? start + 1 : start;
      for (let i = maskStart; i < end; i++) {
        // Keep whitespace intact if phrase spans spaces
        if (chars[i] !== ' ') {
          chars[i] = maskChar;
        }
      }
    }

    return chars.join('');
  }

  /**
   * Replaces common leetspeak substitutions with standard Latin characters.
   */
  public static normalizeLeetspeak(text: string): string {
    return text
      .replace(/@/g, 'a')
      .replace(/\$/g, 's')
      .replace(/0/g, 'o')
      .replace(/1/g, 'i')
      .replace(/!/g, 'i')
      .replace(/3/g, 'e')
      .replace(/4/g, 'a')
      .replace(/5/g, 's')
      .replace(/7/g, 't')
      .replace(/8/g, 'b');
  }

  public getPatternCount(): number {
    return this.patternCount;
  }

  public clear(): void {
    this.root = new AhoCorasickNode();
    this.isCompiled = false;
    this.patternCount = 0;
  }
}

/**
 * Default explicit terms dictionary across standard profanity and sensitive keywords.
 */
export const DEFAULT_EXPLICIT_TERMS: string[] = [
  'fuck',
  'fucking',
  'fucker',
  'shit',
  'shitty',
  'bitch',
  'bitches',
  'ass',
  'asshole',
  'bastard',
  'crap',
  'damn',
  'cunt',
  'dick',
  'cock',
  'pussy',
  'slut',
  'whore',
  'nigger',
  'nigga',
  'motherfucker',
  'goddamn',
  'bullshit',
];

/**
 * High-Level Explicit Content Moderator Engine
 */
export class ExplicitContentModerator {
  private automaton: AhoCorasick;

  constructor(customTerms: string[] = DEFAULT_EXPLICIT_TERMS) {
    this.automaton = new AhoCorasick(customTerms);
  }

  /**
   * Adds custom prohibited terms to the moderator dictionary.
   */
  public addTerms(terms: string[]): void {
    for (const t of terms) {
      this.automaton.addPattern(t);
    }
    this.automaton.buildFailureLinks();
  }

  /**
   * Sanitizes a single lyric line if clean mode is enabled.
   */
  public sanitizeLine(line: string, enableCleanMode: boolean): string {
    if (!enableCleanMode || !line) return line;
    return this.automaton.maskExplicitText(line, '*', { wordBoundary: true });
  }

  /**
   * Sanitizes a list of synced lyric lines while preserving timestamps and structure.
   */
  public filterSyncedLyrics(
    lyrics: SyncedLyricLine[],
    enableCleanMode: boolean
  ): SyncedLyricLine[] {
    if (!enableCleanMode || !lyrics || lyrics.length === 0) {
      return lyrics;
    }

    return lyrics.map((line) => ({
      ...line,
      text: this.sanitizeLine(line.text, true),
    }));
  }

  /**
   * Classifies a song track as explicit based on metadata and lyric text.
   */
  public classifyTrack(
    title: string,
    artist: string,
    lyrics?: string
  ): { isExplicit: boolean; matchedTerms: string[] } {
    const combined = `${title} ${artist} ${lyrics || ''}`;
    const normalized = AhoCorasick.normalizeLeetspeak(combined);

    const matches = this.automaton.search(normalized, { wordBoundary: true });
    const uniqueTerms = Array.from(new Set(matches.map((m) => m.pattern)));

    return {
      isExplicit: uniqueTerms.length > 0,
      matchedTerms: uniqueTerms,
    };
  }

  public getAutomaton(): AhoCorasick {
    return this.automaton;
  }
}

export const explicitModerator = new ExplicitContentModerator();
