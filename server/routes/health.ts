import { FastifyInstance } from 'fastify';

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async () => {
    return {
      status: 'healthy',
      service: 'riff-bff-gateway',
      uptimeSec: Math.floor(process.uptime()),
      memoryUsageMB: (process.memoryUsage().heapUsed / (1024 * 1024)).toFixed(1),
      timestamp: new Date().toISOString()
    };
  });

  fastify.get('/health/ready', async () => {
    return {
      status: 'ready',
      checks: {
        gateway: 'ok',
        cache: 'in-memory active',
        providers: ['audius', 'saavn', 'jamendo', 'radio', 'lrclib', 'ytdlp']
      }
    };
  });
}
