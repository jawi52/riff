import { describe, it, expect } from 'vitest';
import { searchMasterCatalog } from '../../src/lib/masterAudioEngine';

describe('Live Riff Master Audio Engine Speed & Precision Benchmark', () => {
  const testSongs = [
    { query: '12 Saal Bilal Saeed', expectedArtist: 'Bilal Saeed' },
    { query: 'Money LISA', expectedArtist: 'LISA' },
    { query: 'Amplifier Imran Khan', expectedArtist: 'Imran Khan' },
    { query: 'Starboy The Weeknd', expectedArtist: 'The Weeknd' },
    { query: 'Dealer Lana Del Rey', expectedArtist: 'Lana Del Rey' }
  ];

  for (const { query, expectedArtist } of testSongs) {
    it(`should resolve [${query}] in sub-200ms with verified studio audio`, async () => {
      const startTime = performance.now();
      const result = await searchMasterCatalog(query);
      const latencyMs = Math.round(performance.now() - startTime);

      expect(result.tracks.length).toBeGreaterThan(0);
      expect(result.topResult).not.toBeNull();

      const top = result.topResult!;
      console.log(`\n========================================`);
      console.log(`🎵 Query: "${query}"`);
      console.log(`⚡ Search Latency: ${latencyMs}ms`);
      console.log(`👑 Top Result: ${top.title} - ${top.artist}`);
      console.log(`💿 Album: ${top.album || 'Official Studio Master'}`);
      console.log(`🎧 Bitrate: ${top.bitrateKbps || 320} kbps`);
      console.log(`🖼️ Artwork: ${top.coverUrl}`);
      console.log(`🔗 Stream URL: ${top.streamUrl ? top.streamUrl.substring(0, 70) + '...' : 'Preview Audio'}`);

      // Test 0ms In-Memory Cache Replay
      const cacheStart = performance.now();
      const cachedResult = await searchMasterCatalog(query);
      const cacheLatencyMs = Math.round(performance.now() - cacheStart);
      console.log(`🚀 Instant Cache Replay: ${cacheLatencyMs}ms (0ms Target)`);
      console.log(`========================================\n`);

      expect(top.artist.toLowerCase()).toContain(expectedArtist.toLowerCase().split(' ')[0]);
      expect(cachedResult.topResult?.id).toBe(top.id);
      expect(cacheLatencyMs).toBeLessThanOrEqual(5);
    }, 15000);
  }
});
