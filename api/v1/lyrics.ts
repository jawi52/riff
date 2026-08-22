import { fetchSyncedLyrics } from '../../server/services/providers/lrclib';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { title, artist, duration } = req.query || {};
  if (!title || !artist) {
    return res.status(400).json({ error: 'Title and artist are required' });
  }

  try {
    const result = await fetchSyncedLyrics(
      title as string,
      artist as string,
      duration ? parseInt(duration as string, 10) : undefined
    );

    return res.status(200).json({
      title,
      artist,
      syncedLyrics: result?.syncedLyrics || null,
      plainLyrics: result?.plainLyrics || null,
      source: result ? 'lrclib' : 'none'
    });
  } catch (err: any) {
    console.error('Vercel lyrics error:', err);
    return res.status(500).json({ error: 'Lyrics fetch error' });
  }
}
