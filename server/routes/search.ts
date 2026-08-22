import { FastifyInstance } from 'fastify';
import { searchSpotifyStyle } from '../services/metadata/spotifyRankingEngine';
import { searchAppleMusicMetadata } from '../services/metadata/itunes';
import { searchSaavn } from '../services/providers/saavn';
import { deduplicateTracks } from '../../src/lib/dedup';
import { GLOBAL_CATALOG } from '../../src/lib/algorithm';

// In-memory query cache (TTL: 15 minutes)
const searchCache = new Map<string, { data: any; expiresAt: number }>();
const SEARCH_CACHE_TTL = 15 * 60 * 1000;

export async function searchRoutes(fastify: FastifyInstance) {
  // Spotify-Style Universal Multi-Provider Search & Vibe Recommendation
  fastify.get('/search', async (req, reply) => {
    const { q } = req.query as { q?: string };
    if (!q || !q.trim()) {
      return reply.code(400).send({ error: 'Search query is required' });
    }

    const cacheKey = q.toLowerCase().trim();
    const cached = searchCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    try {
      const response = await searchSpotifyStyle(q.trim());
      searchCache.set(cacheKey, { data: response, expiresAt: Date.now() + SEARCH_CACHE_TTL });
      return response;
    } catch (err) {
      console.error('Search error:', err);
      return reply.code(500).send({ error: 'Failed to search catalog' });
    }
  });

  // Trending Global Discovery Feed (JioSaavn 320k + Apple Music + Baseline Catalog)
  fastify.get('/discover/trending', async () => {
    const [saavnTrending, appleHits] = await Promise.all([
      searchSaavn('Top Hits Global').catch(() => []),
      searchAppleMusicMetadata('Top Hits').catch(() => [])
    ]);

    const combined = [...saavnTrending, ...appleHits, ...GLOBAL_CATALOG];
    const deduplicated = deduplicateTracks(combined);
    return deduplicated.slice(0, 30);
  });
}
