import axios from 'axios';
import { DEFAULT_USER_AGENT } from '../../../server/services/resolver/precisionYtResolver';

export default async function handler(req: any, res: any) {
  const url = req.query.url as string;
  if (!url) {
    return res.status(400).json({ error: 'Target stream URL is required' });
  }

  try {
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

    res.status(response.status);
    res.setHeader('Content-Type', response.headers['content-type'] || 'audio/mp4');
    res.setHeader('Accept-Ranges', 'bytes');
    if (response.headers['content-range']) {
      res.setHeader('Content-Range', response.headers['content-range']);
    }
    if (response.headers['content-length']) {
      res.setHeader('Content-Length', response.headers['content-length']);
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, Authorization');

    return response.data.pipe(res);
  } catch (err: any) {
    console.error('Vercel proxy stream error:', err.message);
    return res.status(500).json({ error: 'Stream proxy error' });
  }
}
