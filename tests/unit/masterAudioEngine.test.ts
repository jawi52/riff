import { describe, it, expect } from 'vitest';
import {
  resolveMasterStream,
  isPreviewUrl,
  fetchSyncedLyrics
} from '../../src/lib/masterAudioEngine';
import { Track } from '../../src/types';

describe('Riff Audio Engine Unit Tests', () => {
  it('should detect 30-second preview URLs correctly', () => {
    expect(isPreviewUrl('https://audio-ssl.itunes.apple.com/preview/song.m4a')).toBe(true);
    expect(isPreviewUrl('https://preview.saavncdn.com/123.p.m4a')).toBe(true);
    expect(isPreviewUrl('https://aac.saavncdn.com/195/song_320.mp4')).toBe(false);
    expect(isPreviewUrl('https://cf-media.sndcdn.com/stream.mp3')).toBe(false);
  });

  it('should resolve full stream URL with in-memory caching', async () => {
    const mockTrack: Track = {
      id: 'test_trk_starboy',
      title: 'Starboy',
      artist: 'The Weeknd',
      duration: 230,
      coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4',
      sourceType: 'saavn',
      streamUrl: 'https://actions.google.com/sounds/v1/music/ambient_piano_melody.ogg'
    };

    const streamUrl1 = await resolveMasterStream(mockTrack);
    expect(streamUrl1).toBe(mockTrack.streamUrl);

    // Second call should hit the in-memory cache in 0ms
    const streamUrl2 = await resolveMasterStream(mockTrack);
    expect(streamUrl2).toBe(streamUrl1);
  });

  it('should fetch synced lyrics or return empty array gracefully', async () => {
    const res = await fetchSyncedLyrics('The Weeknd', 'Blinding Lights');
    expect(res).toBeDefined();
    expect(Array.isArray(res.synced)).toBe(true);
  });
});
