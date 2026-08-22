import axios from 'axios';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';

async function searchSaavnStream(artist: string, title: string): Promise<string | null> {
  const mirrors = ['https://saavn.dev/api', 'https://jiosaavn-api-privatecvc2.vercel.app'];
  for (const m of mirrors) {
    try {
      const res = await axios.get(`${m}/search/songs`, {
        params: { query: `${artist} ${title}`, limit: 10 },
        headers: { 'User-Agent': USER_AGENT },
        timeout: 3000
      });
      const songs = res.data?.data?.results || res.data?.results || [];
      if (songs.length === 0) continue;
      const dls = songs[0].downloadUrl || [];
      const stream = dls.find((u: any) => u.quality === '320kbps')?.url || dls[dls.length - 1]?.url || songs[0].media_url;
      if (stream) return stream;
    } catch {}
  }
  return null;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Range');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const payload = req.method === 'POST' ? req.body : req.query;
  const { title, artist, rawUrl, trackId } = payload || {};

  if (!title && !rawUrl) {
    return res.status(400).json({ error: 'Title or rawUrl is required' });
  }

  // 1. If direct stream already exists
  if (rawUrl && (rawUrl.includes('saavncdn.com') || rawUrl.includes('audius.co') || rawUrl.includes('jamendo.com'))) {
    return res.status(200).json({
      trackId,
      streamUrl: rawUrl,
      resolvedProvider: 'direct-cdn',
      cached: false
    });
  }

  try {
    // 2. High-Speed Saavn 320kbps resolution (~120ms)
    const saavnUrl = await searchSaavnStream(artist || '', title || '');
    if (saavnUrl) {
      return res.status(200).json({
        trackId,
        streamUrl: saavnUrl,
        resolvedProvider: 'saavn-320k',
        cached: false
      });
    }

    // 3. Fallback High-Fidelity Radio Stream
    const radioFallback = 'https://stream.zeno.fm/f3wvbbqmdg8uv';
    return res.status(200).json({
      trackId,
      streamUrl: radioFallback,
      resolvedProvider: 'radio-fallback',
      cached: false
    });
  } catch (err: any) {
    console.error('Stream resolve error:', err);
    return res.status(200).json({
      trackId,
      streamUrl: 'https://stream.zeno.fm/f3wvbbqmdg8uv',
      resolvedProvider: 'fallback',
      cached: false
    });
  }
}
