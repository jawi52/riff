import { describe, it, expect } from 'vitest';
import { parseLRC, getActiveLyricIndex } from '../../src/lib/lyrics';

describe('Synchronized LRC Lyrics Parser & Indexer', () => {
  const sampleLRC = `
    [00:14.20]Yeah
    [00:20.50]I've been on my own for long enough
    [00:16.80]I've been tryna call
  `;

  it('parses timestamps into milliseconds and sorts lines chronologically', () => {
    const parsed = parseLRC(sampleLRC);
    expect(parsed).toHaveLength(3);
    expect(parsed[0]).toEqual({ timeMs: 14200, text: 'Yeah' });
    expect(parsed[1]).toEqual({ timeMs: 16800, text: "I've been tryna call" });
    expect(parsed[2]).toEqual({ timeMs: 20500, text: "I've been on my own for long enough" });
  });

  it('correctly calculates active lyric line using binary search', () => {
    const parsed = parseLRC(sampleLRC);
    expect(getActiveLyricIndex(parsed, 15000)).toBe(0); // 15s -> "Yeah" (14.2s)
    expect(getActiveLyricIndex(parsed, 18000)).toBe(1); // 18s -> "I've been tryna call" (16.8s)
    expect(getActiveLyricIndex(parsed, 25000)).toBe(2); // 25s -> "I've been on my own..." (20.5s)
  });
});
