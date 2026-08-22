import axios from 'axios';
import { Track } from '../../../src/types';

export const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';

export async function searchDeezerMetadata(query: string): Promise<Track[]> {
  try {
    const res = await axios.get('https://api.deezer.com/search', {
      params: { q: query, limit: 30 },
      headers: {
        'User-Agent': USER_AGENT
      },
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
        availableSources: ['ytdlp']
      };
    });
  } catch (err) {
    return [];
  }
}
