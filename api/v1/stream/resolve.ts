import axios from 'axios';
import crypto from 'crypto';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';

function decryptSaavn(encryptedUrl: string): string | null {
  if (!encryptedUrl) return null;
  try {
    const key = Buffer.from('38346591', 'utf8');
    const cipher = crypto.createDecipheriv('des-ede3', Buffer.concat([key, key, key]), null);
    let dec = cipher.update(encryptedUrl, 'base64', 'utf8');
    dec += cipher.final('utf8');
    return dec.replace(/_96\.(mp4|m4a)/, '_320.mp4').replace(/_160\.(mp4|m4a)/, '_320.mp4');
  } catch {
    return null;
  }
}

async function searchSaavnDirect(artist: string, title: string): Promise<string | null> {
  const queries = [`${artist} ${title}`, title, `${artist}`];
  for (const q of queries) {
    if (!q.trim()) continue;
    try {
      const res = await axios.get('https://www.jiosaavn.com/api.php', {
        params: {
          __call: 'search.getResults',
          _format: 'json',
          _marker: '0',
          api_version: '4',
          ctx: 'web6dot0',
          n: '5',
          p: '1',
          q: q
        },
        headers: { 'User-Agent': USER_AGENT },
        timeout: 2500
      });

      const songs = res.data?.results || [];
      if (Array.isArray(songs) && songs.length > 0) {
        for (const s of songs) {
          const stream = decryptSaavn(s.more_info?.encrypted_media_url) || s.more_info?.vlink;
          if (stream && stream.startsWith('http')) return stream;
        }
      }
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

  // 1. Direct CDN stream if already attached (0ms)
  if (rawUrl && (rawUrl.includes('saavncdn.com') || rawUrl.includes('audius.co') || rawUrl.includes('jamendo.com'))) {
    return res.status(200).json({
      trackId,
      streamUrl: rawUrl,
      resolvedProvider: 'direct-cdn',
      cached: false
    });
  }

  try {
    // 2. Official JioSaavn 320kbps Direct Decryption (~120ms)
    const saavnUrl = await searchSaavnDirect(artist || '', title || '');
    if (saavnUrl) {
      return res.status(200).json({
        trackId,
        streamUrl: saavnUrl,
        resolvedProvider: 'saavn-320k',
        cached: false
      });
    }

    // 3. Fallback High-Fidelity Radio Stream
    return res.status(200).json({
      trackId,
      streamUrl: 'https://stream.zeno.fm/f3wvbbqmdg8uv',
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
