import { describe, it, expect } from 'vitest';
import { searchSpotifyStyle } from '../../server/services/metadata/spotifyRankingEngine';
import { resolvePrecisionStream } from '../../server/services/resolver/precisionYtResolver';

describe('Backend Spotify-Style Ranking & Recommendation Engine', () => {
  it('should return a Top Result and 20 curated tracks for a specific song query', async () => {
    const result = await searchSpotifyStyle('money by lisa');

    expect(result).toBeDefined();
    expect(result.topResult).not.toBeNull();
    expect(result.topResult?.title.toLowerCase()).toContain('money');
    expect(result.tracks.length).toBeGreaterThan(0);
    expect(result.tracks.length).toBeLessThanOrEqual(20);

    // Verify Top Result is at position 0
    expect(result.tracks[0].id).toBe(result.topResult?.id);

    // Verify 0 duplicate songs exist in the 20-track package
    const titles = result.tracks.map(t => `${t.title.toLowerCase()}__${t.artist.toLowerCase()}`);
    const uniqueTitles = new Set(titles);
    expect(uniqueTitles.size).toBe(titles.length);
  }, 20000);

  it('should resolve high-fidelity M4A/AAC stream for top result', async () => {
    const stream = await resolvePrecisionStream({
      title: 'MONEY',
      artist: 'LISA',
      duration: 171,
      rawUrl: 'https://www.youtube.com/watch?v=dNCWe_6HAM8'
    });

    expect(stream.streamUrl).toBeDefined();
    expect(stream.streamUrl.startsWith('http')).toBe(true);
    expect(stream.provider).toBe('ytdlp');
  }, 25000);
});
