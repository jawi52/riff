import axios from 'axios';
import { Track } from '../../../src/types';

export const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';

export async function searchAppleMusicMetadata(query: string): Promise<Track[]> {
  try {
    const res = await axios.get('https://itunes.apple.com/search', {
      params: {
        term: query,
        media: 'music',
        entity: 'song',
        limit: 30
      },
      headers: {
        'User-Agent': USER_AGENT
      },
      timeout: 3000
    });

    if (!res.data?.results) return [];

    return res.data.results.map((item: any) => {
      const rawArt = item.artworkUrl100 || '';
      const hdCover = rawArt
        ? rawArt.replace('100x100bb', '1000x1000bb')
        : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80';

      return {
        id: `ap_${item.trackId}`,
        title: item.trackName,
        artist: item.artistName,
        album: item.collectionName || 'Single',
        duration: Math.round((item.trackTimeMillis || 180000) / 1000),
        coverUrl: hdCover,
        sourceType: 'ytdlp',
        genre: item.primaryGenreName || 'Pop',
        releaseYear: item.releaseDate ? new Date(item.releaseDate).getFullYear() : 2024,
        hasSyncedLyrics: true,
        bitrateKbps: 320,
        availableSources: ['ytdlp']
      };
    });
  } catch (err) {
    return [];
  }
}
