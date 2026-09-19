import { describe, it, expect } from 'vitest';
import {
  parseFilenameHeuristics,
  computeFileFingerprint,
  parseID3v2,
  parseAudioFileMetadata
} from '../../src/lib/audioMetadataParser';
import { audioWorkerPool } from '../../src/lib/workerPool';

// Helper to construct a synthetic ID3v2.3 binary buffer
function createSyntheticID3v2Buffer(tags: {
  title?: string;
  artist?: string;
  album?: string;
  genre?: string;
  year?: string;
}): ArrayBuffer {
  const frames: Uint8Array[] = [];

  const addTextFrame = (id: string, text: string) => {
    const textBytes = new TextEncoder().encode(text);
    const frameSize = 1 + textBytes.length; // 1 byte encoding (ISO-8859-1 = 0) + text
    const frame = new Uint8Array(10 + frameSize);
    // Frame ID (4 bytes)
    for (let i = 0; i < 4; i++) frame[i] = id.charCodeAt(i);
    // Frame Size (32-bit big endian)
    new DataView(frame.buffer).setUint32(4, frameSize, false);
    // Flags (2 bytes: 0)
    frame[8] = 0;
    frame[9] = 0;
    // Encoding (0 = ISO-8859-1)
    frame[10] = 0;
    frame.set(textBytes, 11);
    frames.push(frame);
  };

  if (tags.title) addTextFrame('TIT2', tags.title);
  if (tags.artist) addTextFrame('TPE1', tags.artist);
  if (tags.album) addTextFrame('TALB', tags.album);
  if (tags.genre) addTextFrame('TCON', tags.genre);
  if (tags.year) addTextFrame('TYER', tags.year);

  const totalFramesSize = frames.reduce((acc, f) => acc + f.byteLength, 0);
  const totalBufferSize = 10 + totalFramesSize;
  const buffer = new Uint8Array(totalBufferSize);

  // ID3 Header
  buffer[0] = 0x49; // 'I'
  buffer[1] = 0x44; // 'D'
  buffer[2] = 0x33; // '3'
  buffer[3] = 3;    // ID3v2.3
  buffer[4] = 0;    // Revision
  buffer[5] = 0;    // Flags

  // Synchsafe size of frames
  buffer[6] = (totalFramesSize >> 21) & 0x7f;
  buffer[7] = (totalFramesSize >> 14) & 0x7f;
  buffer[8] = (totalFramesSize >> 7) & 0x7f;
  buffer[9] = totalFramesSize & 0x7f;

  let offset = 10;
  for (const frame of frames) {
    buffer.set(frame, offset);
    offset += frame.byteLength;
  }

  return buffer.buffer;
}

describe('Audio Filename Heuristic Parser', () => {
  it('should parse standard Artist - Title formats', () => {
    const res = parseFilenameHeuristics('Atif Aslam - Dil Diyan Gallan.mp3');
    expect(res.artist).toBe('Atif Aslam');
    expect(res.title).toBe('Dil Diyan Gallan');
  });

  it('should strip leading track number prefixes', () => {
    const res1 = parseFilenameHeuristics('01. Arijit Singh - Kesariya.flac');
    expect(res1.artist).toBe('Arijit Singh');
    expect(res1.title).toBe('Kesariya');

    const res2 = parseFilenameHeuristics('12 - Talwiinder - Gallan 4.m4a');
    expect(res2.artist).toBe('Talwiinder');
    expect(res2.title).toBe('Gallan 4');
  });

  it('should fallback cleanly when no separator is present', () => {
    const res = parseFilenameHeuristics('MidnightMelody.wav');
    expect(res.artist).toBe('Local Artist');
    expect(res.title).toBe('MidnightMelody');
  });
});

describe('Audio File Cryptographic Fingerprinting', () => {
  it('should generate deterministic local_ prefixed SHA-256 IDs', async () => {
    const dummyBuffer = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]).buffer;
    const id1 = await computeFileFingerprint('song.mp3', 1024, dummyBuffer);
    const id2 = await computeFileFingerprint('song.mp3', 1024, dummyBuffer);

    expect(id1.startsWith('local_')).toBe(true);
    expect(id1).toBe(id2);
  });

  it('should produce distinct fingerprints for distinct files or sizes', async () => {
    const bufA = new Uint8Array([1, 2, 3]).buffer;
    const bufB = new Uint8Array([4, 5, 6]).buffer;

    const idA = await computeFileFingerprint('songA.mp3', 100, bufA);
    const idB = await computeFileFingerprint('songB.mp3', 200, bufB);

    expect(idA).not.toBe(idB);
  });
});

describe('Binary ID3v2 Tag Parsing', () => {
  it('should parse synthetic ID3v2.3 tags accurately', () => {
    const buffer = createSyntheticID3v2Buffer({
      title: 'Tum Hi Ho',
      artist: 'Arijit Singh',
      album: 'Aashiqui 2',
      genre: 'Bollywood Romantic',
      year: '2013'
    });

    const parsed = parseID3v2(buffer);
    expect(parsed.title).toBe('Tum Hi Ho');
    expect(parsed.artist).toBe('Arijit Singh');
    expect(parsed.album).toBe('Aashiqui 2');
    expect(parsed.genre).toBe('Bollywood Romantic');
    expect(parsed.year).toBe(2013);
  });

  it('should return empty object safely for buffers without ID3 headers', () => {
    const rawPcm = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]).buffer;
    const parsed = parseID3v2(rawPcm);
    expect(parsed).toEqual({});
  });

  it('should integrate ID3 tags and fallback heuristics in parseAudioFileMetadata', async () => {
    const buffer = createSyntheticID3v2Buffer({
      title: 'Tera Hone Laga Hoon',
      artist: 'Atif Aslam'
    });

    const metadata = await parseAudioFileMetadata(
      { name: 'track01.mp3', size: 5 * 1024 * 1024, type: 'audio/mpeg' },
      buffer
    );

    expect(metadata.title).toBe('Tera Hone Laga Hoon');
    expect(metadata.artist).toBe('Atif Aslam');
    expect(metadata.sourceType).toBe('local');
    expect(metadata.duration).toBeGreaterThan(0);
    expect(metadata.id.startsWith('local_')).toBe(true);
  });
});

describe('Audio Worker Pool & Ingestion Manager', () => {
  it('should ingest a local audio file and return structured Track and Blob', async () => {
    const buffer = createSyntheticID3v2Buffer({
      title: 'Pasoori',
      artist: 'Ali Sethi'
    });

    const mockFile = new File([buffer], 'Ali Sethi - Pasoori.mp3', { type: 'audio/mpeg' });
    const result = await audioWorkerPool.ingestFile(mockFile);

    expect(result.track).toBeDefined();
    expect(result.track.title).toBe('Pasoori');
    expect(result.track.artist).toBe('Ali Sethi');
    expect(result.track.sourceType).toBe('local');
    expect(result.audioBlob).toBeDefined();
    expect(result.audioBlob.size).toBe(mockFile.size);
  });

  it('should batch ingest multiple files with progress tracking', async () => {
    const buf1 = createSyntheticID3v2Buffer({ title: 'Song 1', artist: 'Artist 1' });
    const buf2 = createSyntheticID3v2Buffer({ title: 'Song 2', artist: 'Artist 2' });

    const file1 = new File([buf1], 'Song1.mp3', { type: 'audio/mpeg' });
    const file2 = new File([buf2], 'Song2.mp3', { type: 'audio/mpeg' });

    let progressCalls = 0;
    const results = await audioWorkerPool.ingestBatch([file1, file2], 2, (_completed, _total) => {
      progressCalls++;
    });

    expect(results.length).toBe(2);
    expect(results[0].track.title).toBe('Song 1');
    expect(results[1].track.title).toBe('Song 2');
    expect(progressCalls).toBe(2);
  });
});
