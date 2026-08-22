import axios from 'axios';
import crypto from 'crypto';
import { Track } from '../../../src/types';

export const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';

export function decryptSaavnMediaUrl(encryptedUrl: string): string | null {
  if (!encryptedUrl) return null;
  try {
    const key = Buffer.from('38346591', 'utf8');
    const cipher = crypto.createDecipheriv('des-ede3', Buffer.concat([key, key, key]), null);
    let dec = cipher.update(encryptedUrl, 'base64', 'utf8');
    dec += cipher.final('utf8');
    return dec.replace(/_96\.(mp4|m4a)/, '_320.mp4').replace(/_160\.(mp4|m4a)/, '_320.mp4');
  } catch {
    return null;
  }
}

export async function searchSaavn(query: string): Promise<Track[]> {
  try {
    const res = await axios.get('https://www.jiosaavn.com/api.php', {
      params: {
        __call: 'search.getResults',
        _format: 'json',
        _marker: '0',
        api_version: '4',
        ctx: 'web6dot0',
        n: '20',
        p: '1',
        q: query
      },
      headers: {
        'User-Agent': USER_AGENT
      },
      timeout: 3000
    });

    const songs = res.data?.results || [];
    if (!Array.isArray(songs) || songs.length === 0) return [];

    return songs.map((s: any) => {
      const moreInfo = s.more_info || {};
      const directStream = decryptSaavnMediaUrl(moreInfo.encrypted_media_url) || moreInfo.vlink || '';
      
      const rawImg = s.image || '';
      const hdCover = rawImg
        ? rawImg.replace(/150x150/g, '500x500').replace(/50x50/g, '500x500')
        : 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80';

      const artists =
        moreInfo.artistMap?.primary_artists?.map((a: any) => a.name).join(', ') ||
        moreInfo.music ||
        s.subtitle ||
        'Unknown Artist';

      return {
        id: `saavn_${s.id}`,
        title: s.title ? s.title.replace(/&quot;/g, '"').replace(/&amp;/g, '&') : 'Unknown Title',
        artist: artists.replace(/&quot;/g, '"').replace(/&amp;/g, '&'),
        album: moreInfo.album ? moreInfo.album.replace(/&quot;/g, '"').replace(/&amp;/g, '&') : 'Single',
        duration: parseInt(moreInfo.duration || '200', 10) || 200,
        coverUrl: hdCover,
        sourceType: 'saavn',
        streamUrl: directStream,
        genre: s.language || 'Pop',
        releaseYear: parseInt(s.year || '2024', 10) || 2024,
        hasSyncedLyrics: moreInfo.has_lyrics === 'true',
        bitrateKbps: 320
      };
    });
  } catch {
    return [];
  }
}
