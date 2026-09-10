import { describe, it, expect } from 'vitest';
import { searchCatalog } from '../../src/lib/api';

describe('Live Catalog Search Speed Benchmark', () => {
  it('should search catalog with real live tracks', async () => {
    const startTime = performance.now();
    const result = await searchCatalog('Arijit Singh', 5);
    const latencyMs = Math.round(performance.now() - startTime);

    expect(result).toBeDefined();
    expect(result.tracks.length).toBeGreaterThan(0);
    expect(latencyMs).toBeLessThan(10000);
  }, 15000);
});
