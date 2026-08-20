import { describe, it, expect } from 'vitest';
import { calculateTrackSimilarity, getSmartAutoplayTracks, generateDailyMixes, GLOBAL_CATALOG } from '../../src/lib/algorithm';

describe('Algorithmic Recommendation Engine', () => {
  it('calculates track similarity with artist and genre matching', () => {
    const t1 = GLOBAL_CATALOG[0]; // The Weeknd - Blinding Lights (Synthwave)
    const t2 = GLOBAL_CATALOG[1]; // The Weeknd - Save Your Tears (Synthwave)
    const t3 = GLOBAL_CATALOG[3]; // Daft Punk - Get Lucky (Disco)

    const sameArtistScore = calculateTrackSimilarity(t1, t2);
    const diffArtistScore = calculateTrackSimilarity(t1, t3);

    expect(sameArtistScore).toBeGreaterThan(diffArtistScore);
    expect(calculateTrackSimilarity(t1, t1)).toBe(0); // Self match is 0
  });

  it('generates smart autoplay tracks when queue ends', () => {
    const seed = GLOBAL_CATALOG[0];
    const existingQueueIds = new Set([seed.id]);

    const suggestions = getSmartAutoplayTracks(seed, existingQueueIds, 3);
    expect(suggestions.length).toBe(3);
    expect(suggestions.some((t) => t.id === seed.id)).toBe(false);
  });

  it('generates personalized daily mixes', () => {
    const mixes = generateDailyMixes([GLOBAL_CATALOG[0]]);
    expect(mixes.length).toBe(4);
    expect(mixes[0].title).toBe('Daily Mix 1');
    expect(mixes[0].tracks.length).toBeGreaterThan(0);
  });
});
