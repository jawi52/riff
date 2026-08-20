import axios from 'axios';

const INVIDIOUS_INSTANCES = [
  'https://invidious.nerdvpn.de',
  'https://inv.tux.pizza',
  'https://invidious.slipfox.xyz',
  'https://invidious.jing.rocks'
];

export async function searchYouTubeMusic(query: string) {
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const res = await axios.get(`${instance}/api/v1/search`, {
        params: { q: `${query} official audio`, type: 'video' },
        timeout: 3500
      });

      if (!Array.isArray(res.data) || res.data.length === 0) continue;

      return res.data.slice(0, 15).map((item: any) => ({
        id: `yt_${item.videoId}`,
        title: item.title,
        artist: item.author || 'YouTube Music',
        album: 'YouTube Release',
        duration: item.lengthSeconds || 180,
        coverUrl: item.videoThumbnails?.[0]?.url || `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
        sourceType: 'ytdlp',
        genre: 'Music',
        hasSyncedLyrics: true,
        bitrateKbps: 160
      }));
    } catch {
      // Try next instance
    }
  }
  return [];
}
