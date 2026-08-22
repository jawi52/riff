import axios from 'axios';
import { Track } from '../../../src/types';

export const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';

const SAAVN_MIRRORS = [
  'https://saavn.dev/api',
  'https://jiosaavn-api-privatecvc2.vercel.app'
];

export async function searchSaavn(query: string): Promise<Track[]> {
  for (const mirror of SAAVN_MIRRORS) {
    try {
      const res = await axios.get(`${mirror}/search/songs`, {
        params: { query, limit: 20 },
        headers: {
          'User-Agent': USER_AGENT
        },
        timeout: 2500
      });

      const songs = res.data?.data?.results || res.data?.results || [];
      if (songs.length === 0) continue;

      return songs.map((song: any) => {
        const downloadUrls = song.downloadUrl || [];
        const highQual = downloadUrls.find((u: any) => u.quality === '320kbps')?.url || downloadUrls[downloadUrls.length - 1]?.url || song.media_url;
        const coverImages = song.image || [];
        const highCover = coverImages.find((img: any) => img.quality === '500x500')?.url || coverImages[coverImages.length - 1]?.url || song.image;

        return {
          id: `saavn_${song.id}`,
          title: song.name || song.title,
          artist: song.artists?.primary?.map((a: any) => a.name).join(', ') || song.primaryArtists || 'Unknown Artist',
          album: song.album?.name || song.album || 'Single',
          duration: parseInt(song.duration, 10) || 200,
          coverUrl: highCover || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&q=80',
          sourceType: 'saavn',
          streamUrl: highQual || '',
          genre: song.language || 'Pop',
          releaseYear: parseInt(song.year, 10) || 2024,
          hasSyncedLyrics: song.hasLyrics === 'true' || !!song.lyrics,
          bitrateKbps: 320
        };
      });
    } catch {
      // Try next mirror
    }
  }
  return [];
}
