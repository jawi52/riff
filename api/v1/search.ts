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

function cleanStr(s: string): string {
  return (s || '')
    .toLowerCase()
    .replace(/\(.*?\)|\[.*?\]/g, '')
    .replace(/official\s*(music\s*)?(video|audio|lyrics?|performance|hd|4k)/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

async function searchApple(q: string) {
  try {
    const res = await axios.get('https://itunes.apple.com/search', {
      params: { term: q, media: 'music', entity: 'song', limit: 25 },
      headers: { 'User-Agent': USER_AGENT },
      timeout: 3000
    });
    if (!res.data?.results) return [];
    return res.data.results.map((item: any) => ({
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
  } catch {
    return [];
  }
}

async function searchSaavnOfficial(q: string) {
  try {
    const res = await axios.get('https://www.jiosaavn.com/api.php', {
      params: {
        __call: 'search.getResults',
        _format: 'json',
        _marker: '0',
        api_version: '4',
        ctx: 'web6dot0',
        n: '20',
        p: '1',
        q: q
      },
      headers: { 'User-Agent': USER_AGENT },
      timeout: 3000
    });

    const songs = res.data?.results || [];
    if (!Array.isArray(songs) || songs.length === 0) return [];

    return songs.map((s: any) => {
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
  } catch {
    return [];
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const q = ((req.query?.q as string) || '').trim();
  if (!q) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  try {
    const [saavnTracks, appleTracks] = await Promise.all([
      searchSaavnOfficial(q),
      searchApple(q)
    ]);

    const all = [...saavnTracks, ...appleTracks];

    if (all.length === 0) {
      return res.status(200).json({
        query: q,
        topResult: null,
        sameArtistTracks: [],
        similarVibeTracks: [],
        tracks: [],
        artists: [],
        albums: []
      });
    }

    const cleanQ = cleanStr(q);
    const topResult = all.find(t => cleanStr(t.title) === cleanQ || cleanStr(`${t.artist} ${t.title}`).includes(cleanQ)) || all[0];
    const primaryArtist = topResult.artist.split(/,|ft\.|feat\.|&/i)[0].trim();

    const seen = new Set<string>();
    seen.add(cleanStr(topResult.title));

    const sameArtistTracks = all.filter(t => {
      const c = cleanStr(t.title);
      if (seen.has(c)) return false;
      seen.add(c);
      return t.artist.toLowerCase().includes(primaryArtist.toLowerCase());
    }).slice(0, 6);

    const similarVibeTracks = all.filter(t => {
      const c = cleanStr(t.title);
      if (seen.has(c)) return false;
      seen.add(c);
      return true;
    }).slice(0, 13);

    const curatedTracks = [topResult, ...sameArtistTracks, ...similarVibeTracks];

    return res.status(200).json({
      query: q,
      topResult,
      sameArtistTracks,
      similarVibeTracks,
      tracks: curatedTracks,
      artists: [
        {
          id: `art_${primaryArtist.toLowerCase().replace(/\s+/g, '_')}`,
          name: primaryArtist,
          avatarUrl: topResult.coverUrl,
          monthlyListeners: 35000000
        }
      ],
      albums: [
        {
          id: `alb_${topResult.album?.toLowerCase().replace(/\s+/g, '_') || 'alb_1'}`,
          title: topResult.album || 'Single',
          artist: primaryArtist,
          coverUrl: topResult.coverUrl
        }
      ]
    });
  } catch (err: any) {
    console.error('Vercel search error:', err);
    return res.status(500).json({ error: 'Search error', message: err?.message || 'Unknown error' });
  }
}
