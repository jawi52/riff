import { resolvePrecisionStream } from '../../../server/services/resolver/precisionYtResolver';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Range');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const payload = req.method === 'POST' ? req.body : req.query;
  const { title, artist, duration, rawUrl, trackId } = payload || {};

  if (!title || !artist) {
    return res.status(400).json({ error: 'Title and artist are required' });
  }

  try {
    const result = await resolvePrecisionStream({ title, artist, duration, rawUrl, trackId });

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

    return res.status(200).json({
      trackId,
      streamUrl: playableUrl,
      rawDirectUrl: result.streamUrl,
      resolvedProvider: result.provider,
      cached: result.cached
    });
  } catch (err: any) {
    console.error('Vercel stream resolve error:', err);
    return res.status(500).json({ error: 'Stream resolution failed', message: err.message });
  }
}
