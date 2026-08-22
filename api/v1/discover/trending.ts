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

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const [saavnRes, appleRes] = await Promise.allSettled([
      axios.get('https://www.jiosaavn.com/api.php', {
        params: {
          __call: 'search.getResults',
          _format: 'json',
          _marker: '0',
          api_version: '4',
          ctx: 'web6dot0',
          n: '30',
          p: '1',
          q: 'Trending Global Hits'
        },
        headers: { 'User-Agent': USER_AGENT },
        timeout: 3000
      }),
      axios.get('https://itunes.apple.com/search', {
        params: { term: 'Top Hits 2026', media: 'music', entity: 'song', limit: 25 },
        headers: { 'User-Agent': USER_AGENT },
        timeout: 3000
      })
    ]);

    const saavnSongs = (saavnRes.status === 'fulfilled' ? saavnRes.value.data?.results : []) || [];
    const appleSongs = (appleRes.status === 'fulfilled' ? appleRes.value.data?.results : []) || [];

    const formattedSaavn = saavnSongs.map((s: any) => {
      const moreInfo = s.more_info || {};
      const directStream = decryptSaavn(moreInfo.encrypted_media_url) || moreInfo.vlink || '';
      const rawImg = s.image || '';
      const hdCover = rawImg ? rawImg.replace(/150x150/g, '500x500') : 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80';
      const artists = moreInfo.artistMap?.primary_artists?.map((a: any) => a.name).join(', ') || moreInfo.music || s.subtitle || 'Unknown Artist';

      return {
        id: `saavn_${s.id}`,
        title: s.title ? s.title.replace(/&quot;/g, '"').replace(/&amp;/g, '&') : 'Unknown Title',
        artist: artists.replace(/&quot;/g, '"').replace(/&amp;/g, '&'),
        album: moreInfo.album ? moreInfo.album.replace(/&quot;/g, '"').replace(/&amp;/g, '&') : 'Single',
        duration: parseInt(moreInfo.duration || '200', 10) || 200,
        coverUrl: hdCover,
        sourceType: 'saavn',
        streamUrl: directStream,
        genre: s.language || 'Pop',
        releaseYear: parseInt(s.year || '2024', 10) || 2024,
        hasSyncedLyrics: moreInfo.has_lyrics === 'true',
        bitrateKbps: 320
      };
    });

    const formattedApple = appleSongs.map((item: any) => ({
      id: `ap_${item.trackId}`,
      title: item.trackName,
      artist: item.artistName,
      album: item.collectionName || 'Single',
      duration: Math.round((item.trackTimeMillis || 180000) / 1000),
      coverUrl: (item.artworkUrl100 || '').replace('100x100bb', '1000x1000bb') || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80',
      sourceType: 'saavn',
      genre: item.primaryGenreName || 'Pop',
      releaseYear: item.releaseDate ? new Date(item.releaseDate).getFullYear() : 2024,
      hasSyncedLyrics: true,
      bitrateKbps: 320
    }));

    const combined = [...formattedSaavn, ...formattedApple];
    return res.status(200).json(combined.slice(0, 30));
  } catch (err: any) {
    console.error('Trending fetch error:', err);
    return res.status(500).json({ error: 'Trending fetch failed' });
  }
}
