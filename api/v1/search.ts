import axios from 'axios';
import crypto from 'crypto';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';

// Global Spotify Artist Follower & Popularity Weights
const ARTIST_SPOTIFY_FOLLOWERS: Record<string, number> = {
  'the weeknd': 112000000,
  'taylor swift': 110000000,
  'drake': 88000000,
  'ariana grande': 95000000,
  'billie eilish': 84000000,
  'ed sheeran': 114000000,
  'justin bieber': 75000000,
  'eminem': 79000000,
  'arijit singh': 45000000,
  'lisa': 28500000,
  'blackpink': 48000000,
  'bts': 72000000,
  'cardi b': 24000000,
  'pink floyd': 20500000,
  'diljit dosanjh': 21000000,
  'daft punk': 24000000,
  'pritam': 18000000,
  'sidhu moose wala': 16000000,
  'shubh': 8000000,
  'ap dhillon': 9500000,
  'karan aujla': 11000000,
  'talha anjum': 4800000,
  'young stunners': 3900000,
  'umair': 2800000,
  'kendrick lamar': 42000000,
  'travis scott': 32000000,
  'post malone': 43000000,
  'dua lipa': 45000000,
  'bruno mars': 55000000,
  'coldplay': 49000000,
  'queen': 36000000
};

function getArtistSpotifyFollowers(artistName: string): number {
  const clean = (artistName || '').toLowerCase().trim();
  for (const [key, followers] of Object.entries(ARTIST_SPOTIFY_FOLLOWERS)) {
    if (clean.includes(key)) {
      return followers;
    }
  }
  return 100000; // Baseline for indie / general artists
}

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
    .replace(/official\s*(music\s*)?(video|audio|lyrics?|performance|hd|4k|dance practice video|visualizer)/gi, '')
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

async function searchDeezer(q: string) {
  try {
    const res = await axios.get('https://api.deezer.com/search', {
      params: { q, limit: 25 },
      headers: { 'User-Agent': USER_AGENT },
      timeout: 3000
    });
    if (!res.data?.data) return [];
    return res.data.data.map((item: any) => {
      const hdCover = item.album?.cover_xl || item.album?.cover_big || item.album?.cover_medium || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80';
      return {
        id: `dz_${item.id}`,
        title: item.title,
        artist: item.artist?.name || 'Unknown Artist',
        album: item.album?.title || 'Single',
        duration: item.duration || 180,
        coverUrl: hdCover,
        sourceType: 'ytdlp',
        genre: 'Pop',
        hasSyncedLyrics: true,
        bitrateKbps: 320,
        rank: item.rank || 500000
      };
    });
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
        n: '25',
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

async function searchInnertube(q: string) {
  try {
    const res = await axios.post(
      'https://music.youtube.com/youtubei/v1/search',
      {
        context: { client: { clientName: 'WEB_REMIX', clientVersion: '1.20240401.01.00', hl: 'en', gl: 'US' } },
        query: q,
        params: 'Eg-KAQwIABAAGAAgACgAMABqChAMEAAYABgAKAAw'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': USER_AGENT,
          'X-YouTube-Client-Name': '67',
          'X-YouTube-Client-Version': '1.20240401.01.00',
          'Origin': 'https://music.youtube.com'
        },
        timeout: 3000
      }
    );

    const tracks: any[] = [];
    const contents = res.data?.contents?.tabbedSearchResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];
    for (const sec of contents) {
      const items = sec?.musicShelfRenderer?.contents || sec?.musicCardShelfRenderer?.contents || [];
      for (const item of items) {
        const flex = item?.musicResponsiveListItemRenderer;
        if (flex) {
          const videoId = flex.playlistItemData?.videoId || flex.videoId;
          let rawTitle = flex.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text || '';
          const artistRuns = flex.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
          let artist = artistRuns.map((r: any) => r.text).join('').replace(/•.*$/g, '').trim();
          const thumbnails = flex.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
          const coverUrl = thumbnails[thumbnails.length - 1]?.url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80';

          if (rawTitle && videoId) {
            let title = rawTitle.replace(/&quot;/g, '"').replace(/&#39;/g, "'");
            if (title.includes(' - ')) {
              const parts = title.split(' - ');
              artist = parts[0].trim();
              title = parts.slice(1).join(' - ').trim();
            }

            title = title
              .replace(/\(.*?\)|\[.*?\]/g, '')
              .replace(/official\s*(music\s*)?(video|audio|lyrics?|performance|hd|4k|dance practice video)/gi, '')
              .replace(/^['"]|['"]$/g, '')
              .trim();

            tracks.push({
              id: `yt_${videoId}`,
              title: title || rawTitle,
              artist: artist || 'Artist',
              album: 'Single',
              duration: 210,
              coverUrl,
              sourceType: 'ytdlp',
              genre: 'Pop',
              releaseYear: 2024,
              hasSyncedLyrics: true,
              bitrateKbps: 256
            });
          }
        }
      }
    }
    return tracks;
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

  const rawQ = ((req.query?.q as string) || '').trim();
  if (!rawQ) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  try {
    const searchPromises = [
      searchSaavnOfficial(rawQ),
      searchApple(rawQ),
      searchDeezer(rawQ),
      searchInnertube(rawQ)
    ];

    // If query has "by" or " - ", search structured title + artist combinations
    if (rawQ.toLowerCase().includes(' by ') || rawQ.includes(' - ')) {
      const parts = rawQ.toLowerCase().includes(' by ') ? rawQ.split(/ by /i) : rawQ.split(' - ');
      const titlePart = parts[0].trim();
      const artistPart = parts[1]?.trim() || '';
      if (titlePart && artistPart) {
        searchPromises.push(searchApple(`${artistPart} ${titlePart}`));
        searchPromises.push(searchDeezer(`${artistPart} ${titlePart}`));
        searchPromises.push(searchInnertube(`${artistPart} ${titlePart}`));
        searchPromises.push(searchSaavnOfficial(`${artistPart} ${titlePart}`));
      }
    }

    const results = await Promise.all(searchPromises);
    const all = results.flat();

    if (all.length === 0) {
      return res.status(200).json({
        query: rawQ,
        topResult: null,
        sameArtistTracks: [],
        similarVibeTracks: [],
        tracks: [],
        artists: [],
        albums: []
      });
    }

    // Token-based fuzzy & Spotify Follower ranking
    const cleanQ = cleanStr(rawQ);
    const qTokens = cleanQ.split(' ').filter(Boolean);

    let targetTitle = '';
    let targetArtist = '';
    if (rawQ.toLowerCase().includes(' by ')) {
      const p = rawQ.split(/ by /i);
      targetTitle = cleanStr(p[0]);
      targetArtist = cleanStr(p[1]);
    }

    const scored = all.map(track => {
      const cTitle = cleanStr(track.title);
      const cArtist = cleanStr(track.artist);
      const combined = `${cArtist} ${cTitle}`;

      let score = 0;

      // 1. Specific "Title by Artist" bonus
      if (targetTitle && targetArtist) {
        if (cTitle.includes(targetTitle) && cArtist.includes(targetArtist)) {
          score += 300; // Exact match for "money by lisa"
        }
      }

      // 2. Exact Title Match
      if (cTitle === cleanQ) {
        score += 150;
      } else if (cTitle.startsWith(cleanQ)) {
        score += 90;
      } else if (cTitle.includes(cleanQ)) {
        score += 60;
      }

      // 3. Artist or Combined Exact Match
      if (combined === cleanQ || cArtist === cleanQ) {
        score += 120;
      } else if (combined.includes(cleanQ)) {
        score += 50;
      }

      // 4. Token matches
      let matchedTokens = 0;
      for (const token of qTokens) {
        if (cTitle.includes(token)) { score += 30; matchedTokens++; }
        if (cArtist.includes(token)) { score += 25; matchedTokens++; }
      }
      if (matchedTokens === qTokens.length) score += 40;

      // 5. SPOTIFY ARTIST FOLLOWER & POPULARITY BOOST (High-follower artists rank higher when songs have same name!)
      const spotifyFollowers = getArtistSpotifyFollowers(track.artist);
      // Normalized follower score up to 80 points
      const followerBoost = Math.min(80, Math.log10(spotifyFollowers + 1) * 10);
      score += followerBoost;

      // Saavn direct 320k bonus
      if (track.sourceType === 'saavn' && track.streamUrl) score += 5;

      return { track, score, followers: spotifyFollowers };
    });

    // Sort by score descending (highest followed artist first when song names match)
    scored.sort((a, b) => b.score - a.score);

    // Deduplicate while preserving same title by DIFFERENT artists
    const seen = new Set<string>();
    const uniqueTracks: any[] = [];

    for (const item of scored) {
      const key = `${cleanStr(item.track.title)}___${cleanStr(item.track.artist)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      uniqueTracks.push(item.track);
    }

    const topResult = uniqueTracks[0] || null;
    const primaryArtist = topResult?.artist?.split(/,|ft\.|feat\.|&/i)[0].trim() || 'Artist';

    const sameArtistTracks = uniqueTracks.filter(t => 
      t.id !== topResult?.id && t.artist.toLowerCase().includes(primaryArtist.toLowerCase())
    ).slice(0, 6);

    const similarVibeTracks = uniqueTracks.filter(t => 
      t.id !== topResult?.id && !t.artist.toLowerCase().includes(primaryArtist.toLowerCase())
    );

    return res.status(200).json({
      query: rawQ,
      topResult,
      sameArtistTracks,
      similarVibeTracks,
      tracks: uniqueTracks.slice(0, 30),
      artists: [
        {
          id: `art_${primaryArtist.toLowerCase().replace(/\s+/g, '_')}`,
          name: primaryArtist,
          avatarUrl: topResult?.coverUrl,
          monthlyListeners: getArtistSpotifyFollowers(primaryArtist)
        }
      ],
      albums: [
        {
          id: `alb_${topResult?.album?.toLowerCase().replace(/\s+/g, '_') || 'alb_1'}`,
          title: topResult?.album || 'Single',
          artist: primaryArtist,
          coverUrl: topResult?.coverUrl
        }
      ]
    });
  } catch (err: any) {
    console.error('Unified search error:', err);
    return res.status(500).json({ error: 'Search error', message: err?.message || 'Unknown error' });
  }
}
