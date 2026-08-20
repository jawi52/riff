import { FastifyInstance } from 'fastify';
import { resolvePrecisionStream, DEFAULT_USER_AGENT } from '../services/resolver/precisionYtResolver';
import axios from 'axios';

export async function streamRoutes(fastify: FastifyInstance) {
  const handleResolution = async (params: {
    trackId?: string;
    title?: string;
    artist?: string;
    duration?: number;
    rawUrl?: string;
  }, reply: any) => {
    const { trackId = 'trk_resolved', title, artist, duration, rawUrl } = params;

    if (!title || !artist) {
      return reply.code(400).send({ error: 'Title and artist are required' });
    }

    try {
      const result = await resolvePrecisionStream({ title, artist, duration, rawUrl });
      
      // Wrap direct Google/YouTube CDN URLs in our CORS range proxy
      let playableUrl = result.streamUrl;
      if (
        playableUrl.includes('googlevideo.com') ||
        playableUrl.includes('youtube.com') ||
        playableUrl.includes('ytimg.com') ||
        result.provider === 'ytdlp' ||
        result.provider === 'ytdlp-android' ||
        result.provider === 'innertube-android' ||
        result.provider === 'yt-fast-mirror' ||
        result.provider === 'invidious'
      ) {
        playableUrl = `/api/v1/stream/proxy?url=${encodeURIComponent(result.streamUrl)}`;
      }

      return {
        trackId,
        streamUrl: playableUrl,
        rawDirectUrl: result.streamUrl,
        resolvedProvider: result.provider,
        cached: result.cached
      };
    } catch (err: any) {
      console.error('Stream resolution failed:', err.message);
      return reply.code(502).send({
        error: err.message || 'Failed to resolve stream across all waterfall tiers'
      });
    }
  };

  // Precision Audio Stream Resolution (POST)
  fastify.post('/stream/resolve', async (req, reply) => {
    return handleResolution((req.body as any) || {}, reply);
  });

  // High-Speed Audio Stream Resolution (GET)
  fastify.get('/stream', async (req, reply) => {
    return handleResolution((req.query as any) || {}, reply);
  });

  fastify.get('/stream/resolve', async (req, reply) => {
    return handleResolution((req.query as any) || {}, reply);
  });

  // High-Throughput HTTP 206 Range Stream Proxy with CORS & Web Audio Support
  fastify.get('/stream/proxy', async (req, reply) => {
    const { url } = req.query as { url?: string };
    if (!url) {
      return reply.code(400).send({ error: 'Target stream URL is required' });
    }

    try {
      // Default to bytes=0- if no range header is supplied (critical for Google Video CDN compatibility)
      const range = req.headers.range || 'bytes=0-';

      const headers: Record<string, string> = {
        'User-Agent': DEFAULT_USER_AGENT,
        'Accept': '*/*',
        'Accept-Encoding': 'identity;q=1, *;q=0',
        'Range': range,
        'Connection': 'keep-alive'
      };

      const response = await axios.get(url, {
        headers,
        responseType: 'stream',
        timeout: 15000,
        validateStatus: (status) => status >= 200 && status < 400
      });

      reply.code(response.status);
      reply.header('Content-Type', response.headers['content-type'] || 'audio/mp4');
      reply.header('Accept-Ranges', 'bytes');
      if (response.headers['content-range']) {
        reply.header('Content-Range', response.headers['content-range']);
      }
      if (response.headers['content-length']) {
        reply.header('Content-Length', response.headers['content-length']);
      }
      reply.header('Access-Control-Allow-Origin', '*');
      reply.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      reply.header('Access-Control-Allow-Headers', 'Range, Content-Type, Authorization');

      return reply.send(response.data);
    } catch (err: any) {
      console.error('Proxy stream error:', err.message);
      return reply.code(500).send({ error: 'Stream proxy error' });
    }
  });
}
