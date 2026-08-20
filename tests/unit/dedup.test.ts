import { describe, it, expect } from 'vitest';
import { normalizeString, generateCanonicalTrackId, deduplicateTracks } from '../../src/lib/dedup';
import { Track } from '../../src/types';

describe('Song Deduplication & Canonical Clustering Engine', () => {
  it('normalizes song titles by stripping video, audio and remix tags', () => {
    expect(normalizeString('Blinding Lights (Official Music Video)')).toBe('blinding lights');
    expect(normalizeString('Blinding Lights [HQ Audio]')).toBe('blinding lights');
    expect(normalizeString('Blinding Lights - 4K Remaster')).toBe('blinding lights');
    expect(normalizeString('Blinding Lights (feat. Someone)')).toBe('blinding lights');
  });

  it('generates identical canonical hash for tracks with ±3s duration variance', () => {
    const hash1 = generateCanonicalTrackId('The Weeknd', 'Blinding Lights (Official Video)', 200);
    const hash2 = generateCanonicalTrackId('The Weeknd', 'Blinding Lights [Audio]', 202); // Within 3-sec bucket

    expect(hash1).toBe(hash2);
  });

  it('clusters duplicate multi-provider songs into a single canonical entry', () => {
    const rawList: Track[] = [
      {
        id: '1',
        title: 'Blinding Lights (Official Video)',
        artist: 'The Weeknd',
        duration: 200,
        coverUrl: 'https://img.com/1.jpg',
        sourceType: 'audius'
      },
      {
        id: '2',
        title: 'The Weeknd - Blinding Lights [HQ]',
        artist: 'The Weeknd',
        duration: 201,
        coverUrl: 'https://img.com/2.jpg',
        sourceType: 'saavn'
      }
    ];

    const deduplicated = deduplicateTracks(rawList);
    expect(deduplicated).toHaveLength(1);
    expect(deduplicated[0].availableSources).toContain('audius');
    expect(deduplicated[0].availableSources).toContain('saavn');
  });
});
