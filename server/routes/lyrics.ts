import { FastifyInstance } from 'fastify';
import { fetchLyrics } from '../services/providers/lrclib';
import { parseLRC } from '../../src/lib/lyrics';

export async function lyricsRoutes(fastify: FastifyInstance) {
  fastify.get('/lyrics', async (req, reply) => {
    const { title, artist, duration } = req.query as {
      title?: string;
      artist?: string;
      duration?: string;
    };

    if (!title || !artist) {
      return reply.code(400).send({ error: 'Title and artist are required' });
    }

    const durationNum = duration ? parseInt(duration, 10) : undefined;
    const lyricsData = await fetchLyrics(title, artist, durationNum);

    const parsedSynced = lyricsData.syncedLyrics ? parseLRC(lyricsData.syncedLyrics) : [];

    return {
      title,
      artist,
      isSynced: lyricsData.isSynced,
      plainLyrics: lyricsData.plainLyrics,
      syncedLyrics: parsedSynced
    };
  });
}
