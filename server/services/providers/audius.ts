import axios from 'axios';

const APP_NAME = 'RIFF_MUSIC_APP';
const AUDIUS_HOST = 'https://discoveryprovider.audius.co/v1';

export async function searchAudius(query: string) {
  try {
    const res = await axios.get(`${AUDIUS_HOST}/tracks/search`, {
      params: { query, app_name: APP_NAME },
      timeout: 3000
    });

    if (!res.data || !res.data.data) return [];

    return res.data.data.map((item: any) => ({
      id: `audius_${item.id}`,
      title: item.title,
      artist: item.user?.name || 'Unknown Artist',
      album: item.mood || 'Audius Single',
      duration: item.duration || 180,
      coverUrl: item.artwork?.['480x480'] || item.artwork?.['150x150'] || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80',
      sourceType: 'audius',
      streamUrl: `${AUDIUS_HOST}/tracks/${item.id}/stream?app_name=${APP_NAME}`,
      genre: item.genre || 'Electronic',
      playCount: item.play_count || 0,
      hasSyncedLyrics: false,
      bitrateKbps: 320
    }));
  } catch (err) {
    console.warn('Audius search error:', err);
    return [];
  }
}

export async function getAudiusTrending() {
  try {
    const res = await axios.get(`${AUDIUS_HOST}/tracks/trending`, {
      params: { app_name: APP_NAME, limit: 30 },
      timeout: 3500
    });

    if (!res.data || !res.data.data) return [];

    return res.data.data.map((item: any) => ({
      id: `audius_${item.id}`,
      title: item.title,
      artist: item.user?.name || 'Unknown Artist',
      album: item.mood || 'Trending',
      duration: item.duration || 180,
      coverUrl: item.artwork?.['480x480'] || item.artwork?.['150x150'] || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&q=80',
      sourceType: 'audius',
      streamUrl: `${AUDIUS_HOST}/tracks/${item.id}/stream?app_name=${APP_NAME}`,
      genre: item.genre || 'Electronic',
      playCount: item.play_count || 0,
      hasSyncedLyrics: false,
      bitrateKbps: 320
    }));
  } catch (err) {
    console.warn('Audius trending error:', err);
    return [];
  }
}
