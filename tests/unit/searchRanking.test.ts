import { describe, it, expect } from 'vitest';
import { rankTrackRelevance, rankCatalog, levenshtein, soundex, cleanTitle } from '../../src/lib/searchRanking';
import { Track } from '../../src/types';

describe('Hybrid Fuzzy Search Ranking Algorithm', () => {
  const sampleTracks: Track[] = [
    {
      id: 'trk_1',
      title: 'Blinding Lights',
      artist: 'The Weeknd',
      album: 'After Hours',
      duration: 200,
      coverUrl: 'https://example.com/cover.jpg',
      sourceType: 'saavn',
      genre: 'Synthwave',
      hasSyncedLyrics: true,
      bitrateKbps: 320
    },
    {
      id: 'trk_2',
      title: 'Save Your Tears',
      artist: 'The Weeknd',
      album: 'After Hours',
      duration: 215,
      coverUrl: 'https://example.com/cover.jpg',
      sourceType: 'saavn',
      genre: 'Synthwave',
      hasSyncedLyrics: true,
      bitrateKbps: 320
    },
    {
      id: 'trk_3',
      title: 'Downers at Dusk',
      artist: 'Talha Anjum, Umair',
      album: 'Open Letter',
      duration: 245,
      coverUrl: 'https://example.com/cover.jpg',
      sourceType: 'saavn',
      genre: 'Urdu Hip-Hop',
      hasSyncedLyrics: true,
      bitrateKbps: 320
    }
  ];

  it('correctly calculates Levenshtein distance and Soundex phonetic codes', () => {
    expect(levenshtein('weeknd', 'weekend')).toBe(1);
    expect(levenshtein('talha', 'talha')).toBe(0);
    expect(levenshtein('lights', 'ligts')).toBe(1);
    expect(soundex('Weeknd')).toBe('W253');
  });

  it('cleans noisy title metadata', () => {
    expect(cleanTitle('Downers at Dusk (Official Music Video) [HD]')).toBe('downers at dusk');
    expect(cleanTitle('Blinding Lights feat. Someone (Audio)')).toBe('blinding lights');
  });

  it('ranks exact and typo matches with high relevance', () => {
    // Exact match
    const exact = rankTrackRelevance('Blinding Lights', sampleTracks[0]);
    expect(exact.relevanceScore).toBeGreaterThan(120);
    expect(exact.matchType).toBe('exact');

    // Typo query "blnding ligts"
    const typoRank = rankTrackRelevance('blnding ligts', sampleTracks[0]);
    expect(typoRank.relevanceScore).toBeGreaterThan(40);

    // Artist search "Talha Anjum"
    const artistRank = rankTrackRelevance('Talha Anjum', sampleTracks[2]);
    expect(artistRank.relevanceScore).toBeGreaterThan(100);
  });

  it('ranks catalog with top result first', () => {
    const ranked = rankCatalog('Downers', sampleTracks);
    expect(ranked.length).toBeGreaterThan(0);
    expect(ranked[0].track.title).toBe('Downers at Dusk');
  });
});
