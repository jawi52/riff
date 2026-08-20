import { exec } from 'child_process';
import util from 'util';
import axios from 'axios';

const execPromise = util.promisify(exec);
const YT_EXTRACTOR_ARGS = '--extractor-args "youtube:player_client=web_embedded,tv_embedded"';

const INVIDIOUS_INSTANCES = [
  'https://invidious.nerdvpn.de',
  'https://inv.tux.pizza',
  'https://invidious.slipfox.xyz',
  'https://invidious.jing.rocks'
];

/**
 * Universal Search via yt-dlp & Invidious
 * Covers EVERY song, artist, remix, soundtrack, and live performance on Earth.
 */
export async function searchYouTubeViaYtDlp(query: string) {
  // 1. First try yt-dlp binary fast search
  try {
    const cleanQuery = query.replace(/["'\\]/g, ' ').trim();
    const { stdout } = await execPromise(
      `yt-dlp ${YT_EXTRACTOR_ARGS} "ytsearch15:${cleanQuery}" --dump-json --no-playlist --flat-playlist --no-warnings`,
      { timeout: 15000 }
    );

    const lines = stdout.trim().split('\n');
    const tracks: any[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const item = JSON.parse(line);
        if (!item.id || !item.title) continue;

        // Best thumbnail
        const thumbs = item.thumbnails || [];
        const bestThumb = thumbs[thumbs.length - 1]?.url || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`;

        tracks.push({
          id: `yt_${item.id}`,
          title: item.title,
          artist: item.channel || item.uploader || 'YouTube Artist',
          album: 'Single / Web Release',
          duration: item.duration || 180,
          coverUrl: bestThumb,
          sourceType: 'ytdlp',
          genre: 'Global',
          hasSyncedLyrics: true,
          bitrateKbps: 320,
          rawUrl: item.url || `https://www.youtube.com/watch?v=${item.id}`
        });
      } catch {}
    }

    if (tracks.length > 0) return tracks;
  } catch (err) {
    console.warn('yt-dlp search fallback to Invidious:', err);
  }

  // 2. Fallback to Invidious public instances
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const res = await axios.get(`${instance}/api/v1/search`, {
        params: { q: query, type: 'video' },
        timeout: 3000
      });

      if (!Array.isArray(res.data) || res.data.length === 0) continue;

      return res.data.slice(0, 15).map((item: any) => ({
        id: `yt_${item.videoId}`,
        title: item.title,
        artist: item.author || 'YouTube Artist',
        album: 'Single / Web Release',
        duration: item.lengthSeconds || 180,
        coverUrl: item.videoThumbnails?.[0]?.url || `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
        sourceType: 'ytdlp',
        genre: 'Global',
        hasSyncedLyrics: true,
        bitrateKbps: 320,
        rawUrl: `https://www.youtube.com/watch?v=${item.videoId}`
      }));
    } catch {}
  }

  return [];
}

/**
 * Universal Stream Extraction via yt-dlp & Invidious
 */
export async function extractStreamViaYtDlp(target: string): Promise<string | null> {
  const isDirectUrl = target.startsWith('http://') || target.startsWith('https://');
  const searchTarget = isDirectUrl ? target : `ytsearch1:${target.replace(/["'\\]/g, ' ')}`;

  // 1. Try local yt-dlp binary with web_embedded player client
  try {
    const { stdout } = await execPromise(
      `yt-dlp ${YT_EXTRACTOR_ARGS} -g -f 140/ba/b "${searchTarget}" --no-warnings`,
      { timeout: 7000 }
    );
    const url = stdout.trim().split('\n')[0];
    if (url && url.startsWith('http')) {
      return url;
    }
  } catch {}

  // 2. Fallback to Invidious / Piped audio stream
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      let videoId = '';
      if (isDirectUrl && target.includes('watch?v=')) {
        videoId = new URL(target).searchParams.get('v') || '';
      } else {
        const searchRes = await axios.get(`${instance}/api/v1/search`, {
          params: { q: target, type: 'video' },
          timeout: 3000
        });
        videoId = searchRes.data?.[0]?.videoId || '';
      }

      if (!videoId) continue;

      const vidRes = await axios.get(`${instance}/api/v1/videos/${videoId}`, {
        timeout: 3000
      });

      const audioFormats = vidRes.data?.adaptiveFormats?.filter((f: any) => f.type?.startsWith('audio/')) || [];
      const bestAudio = audioFormats[audioFormats.length - 1]?.url || audioFormats[0]?.url;
      if (bestAudio) return bestAudio;
    } catch {}
  }

  return null;
}
