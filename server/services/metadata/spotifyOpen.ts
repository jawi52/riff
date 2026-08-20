import axios from 'axios';
import { Track } from '../../../src/types';

/**
 * JioSaavn / Regional Open Engine
 * Fast direct access to Asian, Bollywood, Punjabi, and Global Billboard tracks.
 */
export async function searchSaavnMetadata(query: string): Promise<Track[]> {
  const mirrors = [
    'https://saavn.dev/api/search/songs',
    'https://saavn-api.vercel.app/api/search/songs'
  ];

  for (const mirror of mirrors) {
    try {
      const res = await axios.get(mirror, {
        params: { query, limit: 25 },
        timeout: 3000
      });

      const data = res.data?.data?.results || res.data?.results || [];
      if (!Array.isArray(data) || data.length === 0) continue;

      return data.map((item: any) => {
        const covers = item.image || [];
        const bestCover = Array.isArray(covers)
          ? covers[covers.length - 1]?.url || covers[0]?.url
          : item.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80';

        const downloadUrls = item.downloadUrl || [];
        const bestStream = Array.isArray(downloadUrls)
          ? downloadUrls[downloadUrls.length - 1]?.url || downloadUrls[0]?.url
          : undefined;

        return {
          id: `sa_${item.id}`,
          title: (item.name || item.title || '').replace(/&quot;/g, '"').replace(/&#039;/g, "'"),
          artist: item.primaryArtists || item.artists?.primary?.[0]?.name || 'Unknown Artist',
          album: item.album?.name || 'Single',
          duration: parseInt(item.duration, 10) || 180,
          coverUrl: bestCover,
          sourceType: 'saavn',
          streamUrl: bestStream,
          genre: item.language || 'Pop',
          hasSyncedLyrics: true,
          bitrateKbps: 320,
          availableSources: ['saavn', 'ytdlp']
        };
      });
    } catch {}
  }

  return [];
}
