import axios from 'axios';

export async function fetchLyrics(trackName: string, artistName: string, durationSec?: number) {
  try {
    const res = await axios.get('https://lrclib.net/api/get', {
      params: {
        track_name: trackName,
        artist_name: artistName,
        duration: durationSec
      },
      timeout: 3000
    });

    if (res.data) {
      return {
        syncedLyrics: res.data.syncedLyrics || '',
        plainLyrics: res.data.plainLyrics || '',
        isSynced: !!res.data.syncedLyrics
      };
    }
  } catch {
    // Try fallback search
    try {
      const searchRes = await axios.get('https://lrclib.net/api/search', {
        params: { q: `${trackName} ${artistName}` },
        timeout: 3000
      });

      const firstMatch = searchRes.data?.[0];
      if (firstMatch) {
        return {
          syncedLyrics: firstMatch.syncedLyrics || '',
          plainLyrics: firstMatch.plainLyrics || '',
          isSynced: !!firstMatch.syncedLyrics
        };
      }
    } catch {}
  }

  return { syncedLyrics: '', plainLyrics: '', isSynced: false };
}
