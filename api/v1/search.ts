import axios from 'axios';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';

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
      sourceType: 'ytdlp',
      genre: item.primaryGenreName || 'Pop',
      releaseYear: item.releaseDate ? new Date(item.releaseDate).getFullYear() : 2024,
      hasSyncedLyrics: true,
      bitrateKbps: 320
    }));
  } catch {
    return [];
  }
}

async function searchDeezer(q: string) {
  try {
    const res = await axios.get('https://api.deezer.com/search', {
      params: { q, limit: 25 },
      headers: { 'User-Agent': USER_AGENT },
      timeout: 3000
    });
    if (!res.data?.data) return [];
    return res.data.data.map((item: any) => ({
      id: `dz_${item.id}`,
      title: item.title,
      artist: item.artist?.name || 'Unknown Artist',
      album: item.album?.title || 'Single',
      duration: item.duration || 180,
      coverUrl: item.album?.cover_xl || item.album?.cover_big || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
      sourceType: 'ytdlp',
      genre: 'Pop',
      hasSyncedLyrics: true,
      bitrateKbps: 320
    }));
  } catch {
    return [];
  }
}

async function searchSaavn(q: string) {
  const mirrors = ['https://saavn.dev/api', 'https://jiosaavn-api-privatecvc2.vercel.app'];
  for (const m of mirrors) {
    try {
      const res = await axios.get(`${m}/search/songs`, {
        params: { query: q, limit: 20 },
        headers: { 'User-Agent': USER_AGENT },
        timeout: 2500
      });
      const songs = res.data?.data?.results || res.data?.results || [];
      if (songs.length === 0) continue;
      return songs.map((s: any) => {
        const dls = s.downloadUrl || [];
        const highQual = dls.find((u: any) => u.quality === '320kbps')?.url || dls[dls.length - 1]?.url || s.media_url;
        const imgs = s.image || [];
        const highCover = imgs.find((img: any) => img.quality === '500x500')?.url || imgs[imgs.length - 1]?.url || s.image;
        return {
          id: `saavn_${s.id}`,
          title: s.name || s.title,
          artist: s.artists?.primary?.map((a: any) => a.name).join(', ') || s.primaryArtists || 'Unknown Artist',
          album: s.album?.name || s.album || 'Single',
          duration: parseInt(s.duration, 10) || 200,
          coverUrl: highCover || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&q=80',
          sourceType: 'saavn',
          streamUrl: highQual || '',
          genre: s.language || 'Pop',
          releaseYear: parseInt(s.year, 10) || 2024,
          hasSyncedLyrics: s.hasLyrics === 'true' || !!s.lyrics,
          bitrateKbps: 320
        };
      });
    } catch {}
  }
  return [];
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
    const [appleRes, deezerRes, saavnRes] = await Promise.allSettled([
      searchApple(q),
      searchDeezer(q),
      searchSaavn(q)
    ]);

    const appleTracks = appleRes.status === 'fulfilled' ? appleRes.value : [];
    const deezerTracks = deezerRes.status === 'fulfilled' ? deezerRes.value : [];
    const saavnTracks = saavnRes.status === 'fulfilled' ? saavnRes.value : [];

    const all = [...saavnTracks, ...appleTracks, ...deezerTracks];

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
