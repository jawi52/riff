import { searchSpotifyStyle } from '../../server/services/metadata/spotifyRankingEngine';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const q = (req.query.q as string) || '';
  if (!q.trim()) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  try {
    const result = await searchSpotifyStyle(q.trim());
    return res.status(200).json(result);
  } catch (err: any) {
    console.error('Vercel search error:', err);
    return res.status(500).json({ error: 'Search error', message: err.message });
  }
}
