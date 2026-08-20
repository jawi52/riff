import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { env } from './config/env';
import { searchRoutes } from './routes/search';
import { streamRoutes } from './routes/stream';
import { lyricsRoutes } from './routes/lyrics';
import { healthRoutes } from './routes/health';
import { consoleRoutes } from './routes/console';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../dist');

const fastify = Fastify({
  logger: {
    level: env.NODE_ENV === 'production' ? 'info' : 'debug'
  }
});

const PORT = parseInt(process.env.PORT || '3080', 10);
const HOST = '0.0.0.0';

async function main() {
  await fastify.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Range'],
    exposedHeaders: ['Content-Range', 'Content-Length', 'Accept-Ranges']
  });

  // Register API modules under /api/v1
  await fastify.register(async (api) => {
    await api.register(healthRoutes);
    await api.register(searchRoutes);
    await api.register(streamRoutes);
    await api.register(lyricsRoutes);
  }, { prefix: '/api/v1' });

  // Register Backend Interactive Testing & Playback Console at /test and /console
  await fastify.register(consoleRoutes);

  // Serve static production frontend (dist/) if exists
  if (fs.existsSync(distPath)) {
    await fastify.register(fastifyStatic, {
      root: distPath,
      prefix: '/',
      wildcard: false
    });

    fastify.setNotFoundHandler((req, reply) => {
      if (req.raw.url && req.raw.url.startsWith('/api')) {
        return reply.code(404).send({ error: 'API route not found' });
      }
      return reply.sendFile('index.html');
    });
  }

  try {
    const address = await fastify.listen({ port: PORT, host: HOST });
    console.log(`⚡ Riff Full-Stack Server running at: ${address}`);
    console.log(`🎮 Interactive Backend Test Console: http://${HOST}:${PORT}/test`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

main();
