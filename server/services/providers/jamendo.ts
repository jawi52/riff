import axios from 'axios';

const JAMENDO_CLIENT_ID = '56d30c95';
const JAMENDO_HOST = 'https://api.jamendo.com/v3.0';

export async function searchJamendo(query: string) {
  try {
    const res = await axios.get(`${JAMENDO_HOST}/tracks/`, {
      params: {
        client_id: JAMENDO_CLIENT_ID,
        format: 'json',
        limit: 20,
        namesearch: query,
        include: 'musicinfo',
        audioformat: 'mp32'
      },
      timeout: 3500
    });

    if (!res.data?.results) return [];

    return res.data.results.map((item: any) => ({
      id: `jamendo_${item.id}`,
      title: item.name,
      artist: item.artist_name,
      album: item.album_name || 'Jamendo Release',
      duration: item.duration || 180,
      coverUrl: item.image || item.album_image || 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&q=80',
      sourceType: 'jamendo',
      streamUrl: item.audio,
      genre: item.musicinfo?.tags?.genres?.[0] || 'Indie',
      hasSyncedLyrics: false,
      bitrateKbps: 160
    }));
  } catch (err) {
    console.warn('Jamendo search error:', err);
    return [];
  }
}
