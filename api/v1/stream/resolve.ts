import axios from 'axios';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';

const ANDROID_MUSIC_CONTEXT = {
  client: {
    clientName: 'ANDROID_MUSIC',
    clientVersion: '6.42.52',
    androidSdkVersion: 34,
    hl: 'en',
    gl: 'US'
  }
};

const WEB_REMIX_CONTEXT = {
  client: {
    clientName: 'WEB_REMIX',
    clientVersion: '1.20240401.01.00',
    hl: 'en',
    gl: 'US'
  }
};

async function searchSaavnStream(artist: string, title: string): Promise<string | null> {
  const mirrors = ['https://saavn.dev/api', 'https://jiosaavn-api-privatecvc2.vercel.app'];
  const queries = [`${artist} ${title}`, title, `${artist}`];
  for (const m of mirrors) {
    for (const q of queries) {
      if (!q.trim()) continue;
      try {
        const res = await axios.get(`${m}/search/songs`, {
          params: { query: q, limit: 5 },
          headers: { 'User-Agent': USER_AGENT },
          timeout: 2500
        });
        const songs = res.data?.data?.results || res.data?.results || [];
        if (songs.length === 0) continue;
        const dls = songs[0].downloadUrl || [];
        const stream = dls.find((u: any) => u.quality === '320kbps')?.url || dls[dls.length - 1]?.url || songs[0].media_url;
        if (stream && stream.startsWith('http')) return stream;
      } catch {}
    }
  }
  return null;
}

async function getInnertubeStream(artist: string, title: string): Promise<string | null> {
  try {
    // 1. Search Innertube Web Remix for Video ID
    const searchRes = await axios.post(
      'https://music.youtube.com/youtubei/v1/search',
      {
        context: WEB_REMIX_CONTEXT,
        query: `${artist} ${title} audio`,
        params: 'Eg-KAQwIABAAGAAgACgAMABqChAMEAAYABgAKAAw'
      },
      {
        timeout: 3000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': USER_AGENT,
          'X-YouTube-Client-Name': '67',
          'X-YouTube-Client-Version': '1.20240401.01.00',
          'Origin': 'https://music.youtube.com'
        }
      }
    );

    let videoId: string | null = null;
    const contents = searchRes.data?.contents?.tabbedSearchResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];
    for (const sec of contents) {
      const items = sec?.musicShelfRenderer?.contents || sec?.musicCardShelfRenderer?.contents || [];
      for (const item of items) {
        const r = item?.musicResponsiveListItemRenderer;
        if (r?.playlistItemData?.videoId || r?.videoId) {
          videoId = r.playlistItemData?.videoId || r.videoId;
          break;
        }
      }
      if (videoId) break;
    }

    if (!videoId) return null;

    // 2. Resolve direct unthrottled audio stream via Android Music Player
    const playerRes = await axios.post(
      'https://www.youtube.com/youtubei/v1/player',
      {
        context: ANDROID_MUSIC_CONTEXT,
        videoId: videoId,
        playbackContext: {
          contentPlaybackContext: {
            html5Preference: 'HTML5_PREF_WANTS'
          }
        }
      },
      {
        timeout: 3000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'com.google.android.apps.youtube.music/6.42.52 (Linux; U; Android 14; Pixel 8 Pro) gzip',
          'X-YouTube-Client-Name': '21',
          'X-YouTube-Client-Version': '6.42.52'
        }
      }
    );

    const adaptiveFormats = playerRes.data?.streamingData?.adaptiveFormats || [];
    const audioFormats = adaptiveFormats.filter((f: any) => f.mimeType && f.mimeType.startsWith('audio/'));
    
    // Pick best audio stream (m4a itag 140 / webm itag 251)
    const bestAudio = audioFormats.find((f: any) => f.itag === 140 && f.url) || audioFormats.find((f: any) => f.url);
    if (bestAudio?.url) {
      return bestAudio.url;
    }
  } catch {}
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

  // 1. Direct CDN stream if already attached
  if (rawUrl && (rawUrl.includes('saavncdn.com') || rawUrl.includes('audius.co') || rawUrl.includes('jamendo.com'))) {
    return res.status(200).json({
      trackId,
      streamUrl: rawUrl,
      resolvedProvider: 'direct-cdn',
      cached: false
    });
  }

  try {
    // 2. High-Speed JioSaavn 320kbps Search (~120ms)
    const saavnUrl = await searchSaavnStream(artist || '', title || '');
    if (saavnUrl) {
      return res.status(200).json({
        trackId,
        streamUrl: saavnUrl,
        resolvedProvider: 'saavn-320k',
        cached: false
      });
    }

    // 3. YouTube Music Innertube Android Client Stream (~180ms)
    const ytUrl = await getInnertubeStream(artist || '', title || '');
    if (ytUrl) {
      return res.status(200).json({
        trackId,
        streamUrl: ytUrl,
        resolvedProvider: 'innertube-android',
        cached: false
      });
    }

    // 4. High-Fidelity Radio Stream Fallback
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
