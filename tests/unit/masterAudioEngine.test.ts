import { describe, it, expect } from 'vitest';
import {
  isOfficialStudioMaster,
  cleanQuery,
  calculateAuthorityScore,
  searchMasterCatalog,
  resolveMasterStream,
  decryptSaavnUrl
} from '../../src/lib/masterAudioEngine';
import { Track } from '../../src/types';

describe('Custom Riff Master Audio API Suite', () => {
  it('should filter out fake covers, karaoke, tribute bands, and sound edits', () => {
    // Should reject noise
    expect(isOfficialStudioMaster('Blinding Lights (Karaoke Version)', 'Unknown')).toBe(false);
    expect(isOfficialStudioMaster('Starboy (Slowed + Reverb)', 'The Weeknd')).toBe(false);
    expect(isOfficialStudioMaster('Amplifier', 'Tribute Band')).toBe(false);
    expect(isOfficialStudioMaster('12 Saal (Nightcore 8D)', 'Bilal Saeed')).toBe(false);
    expect(isOfficialStudioMaster('Money (Acoustic Cover)', 'LISA')).toBe(false);

    // Should accept verified studio masters
    expect(isOfficialStudioMaster('Blinding Lights', 'The Weeknd', 'After Hours')).toBe(true);
    expect(isOfficialStudioMaster('MONEY', 'LISA', 'LALISA - Single')).toBe(true);
    expect(isOfficialStudioMaster('Amplifier', 'Imran Khan', 'Unforgettable')).toBe(true);
    expect(isOfficialStudioMaster('12 Saal', 'Bilal Saeed', 'Twelve')).toBe(true);
  });

  it('should clean and tokenize search queries accurately', () => {
    const { normalized, tokens } = cleanQuery('  The Weeknd - Blinding Lights (Official!) ');
    expect(normalized).toBe('the weeknd blinding lights official');
    expect(tokens).toContain('weeknd');
    expect(tokens).toContain('blinding');
    expect(tokens).toContain('lights');
  });

  it('should compute higher authority score for official studio releases over compilations', () => {
    const queryTokens = ['money', 'lisa'];
    
    const officialMaster = {
      title: 'MONEY',
      artist: 'LISA',
      album: 'LALISA',
      playCount: 1200000
    };

    const noiseTrack = {
      title: 'Money (Slowed Reverb Cover)',
      artist: 'LISA Tribute',
      album: 'TikTok Remixes',
      playCount: 50
    };

    const scoreOfficial = calculateAuthorityScore(officialMaster, queryTokens);
    const scoreNoise = calculateAuthorityScore(noiseTrack, queryTokens);

    expect(scoreOfficial).toBeGreaterThan(scoreNoise);
    expect(scoreOfficial).toBeGreaterThanOrEqual(80);
  });

  it('should decrypt Saavn 320kbps CD audio media URLs', () => {
    const rawUrl = 'https://aac.saavncdn.com/123/song_96.mp4';
    const decrypted = decryptSaavnUrl(rawUrl);

    expect(decrypted).toBeDefined();
    expect(decrypted).toContain('_320.mp4');
  });

  it('should search master catalog and return empty on empty query', async () => {
    const emptyResult = await searchMasterCatalog('');
    expect(emptyResult.topResult).toBeNull();
    expect(emptyResult.tracks.length).toBe(0);
  });

  it('should resolve stream URL with in-memory caching', async () => {
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

  it('should convert Saavn 96p preview URL into full 320kbps CD master URL', async () => {
    const trackWithPreview: Track = {
      id: 'saavn_12saal',
      title: '12 Saal',
      artist: 'Bilal Saeed',
      duration: 236,
      coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4',
      sourceType: 'saavn',
      streamUrl: 'https://aac.saavncdn.com/123/12saal_96_p.mp4'
    };

    const fullStreamUrl = await resolveMasterStream(trackWithPreview);
    expect(fullStreamUrl).toContain('_320.mp4');
    expect(fullStreamUrl).not.toContain('_96_p.mp4');
  });
});
