import axios from 'axios';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { title, artist, duration } = req.query || {};
  if (!title && !artist) {
    return res.status(400).json({ error: 'Title and artist are required' });
  }

  const cleanTitle = (title as string || '').replace(/\(.*?\)|\[.*?\]/g, '').trim();
  const cleanArtist = (artist as string || '').split(/,|ft\.|feat\.|&/i)[0].trim();

  try {
    const resLrc = await axios.get('https://lrclib.net/api/get', {
      params: {
        track_name: cleanTitle,
        artist_name: cleanArtist,
        duration: duration ? parseInt(duration as string, 10) : undefined
      },
      headers: { 'User-Agent': USER_AGENT },
      timeout: 3500
    });

    if (resLrc.data) {
      return res.status(200).json({
        title,
        artist,
        syncedLyrics: resLrc.data.syncedLyrics || null,
        plainLyrics: resLrc.data.plainLyrics || null,
        source: 'lrclib'
      });
    }
  } catch {}

  // Try loose search if exact match returned 404
  try {
    const resSearch = await axios.get('https://lrclib.net/api/search', {
      params: { q: `${cleanArtist} ${cleanTitle}` },
      headers: { 'User-Agent': USER_AGENT },
      timeout: 3000
    });

    const items = resSearch.data || [];
    if (Array.isArray(items) && items.length > 0) {
      const top = items.find((i: any) => i.syncedLyrics) || items[0];
      return res.status(200).json({
        title,
        artist,
        syncedLyrics: top.syncedLyrics || null,
        plainLyrics: top.plainLyrics || null,
        source: 'lrclib-search'
      });
    }
  } catch {}

  return res.status(200).json({
    title,
    artist,
    syncedLyrics: null,
    plainLyrics: null,
    source: 'none'
  });
}
