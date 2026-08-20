import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

/**
 * SoundCloud Search & Stream Resolver via yt-dlp
 * Covers millions of electronic tracks, remixes, bootlegs, and DJ mixes.
 */
export async function searchSoundCloud(query: string) {
  try {
    const cleanQuery = query.replace(/["'\\]/g, ' ').trim();
    const { stdout } = await execPromise(
      `yt-dlp "scsearch10:${cleanQuery}" --dump-json --no-playlist --flat-playlist --no-warnings`,
      { timeout: 5000 }
    );

    const lines = stdout.trim().split('\n');
    const tracks: any[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const item = JSON.parse(line);
        if (!item.id || !item.title) continue;

        const thumbs = item.thumbnails || [];
        const bestThumb = thumbs[thumbs.length - 1]?.url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80';

        tracks.push({
          id: `sc_${item.id}`,
          title: item.title,
          artist: item.uploader || item.channel || 'SoundCloud Artist',
          album: 'SoundCloud Release',
          duration: Math.round(item.duration || 180),
          coverUrl: bestThumb,
          sourceType: 'ytdlp',
          genre: 'Electronic / Indie',
          hasSyncedLyrics: false,
          bitrateKbps: 160,
          rawUrl: item.url
        });
      } catch {}
    }

    return tracks;
  } catch {
    return [];
  }
}
