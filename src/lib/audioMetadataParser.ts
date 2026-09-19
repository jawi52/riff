/**
 * High-Performance Binary Audio & ID3v2 Metadata Parser
 *
 * Lightweight, zero-dependency parser for ID3v2 frames, APIC embedded album art,
 * intelligent filename heuristics, and SHA-256 fingerprinting.
 * Runs in Web Workers and the main thread.
 */

export interface ParsedAudioMetadata {
  id: string;
  title: string;
  artist: string;
  album: string;
  year?: number;
  genre?: string;
  duration: number;
  coverUrl: string;
  sourceType: 'local';
}

/**
 * Intelligent filename parser when ID3 tags are missing or corrupted.
 * Handles formats like:
 * - "01 - Artist Name - Track Title.mp3"
 * - "Artist - Title.flac"
 * - "Track Title.m4a"
 */
export function parseFilenameHeuristics(rawFilename: string): { title: string; artist: string } {
  // Strip file extension
  let clean = rawFilename.replace(/\.[a-zA-Z0-9]{2,5}$/, '').trim();

  // Strip track numbers at start (e.g. "01 - ", "01. ", "1. ")
  clean = clean.replace(/^(\d{1,3})[\s._-]+/, '').trim();

  if (clean.includes(' - ')) {
    const parts = clean.split(' - ');
    if (parts.length >= 2) {
      const artist = parts[0].trim();
      const title = parts.slice(1).join(' - ').trim();
      return {
        title: title || 'Untitled Track',
        artist: artist || 'Local Artist'
      };
    }
  }

  return {
    title: clean || 'Untitled Track',
    artist: 'Local Artist'
  };
}

/**
 * Computes a deterministic SHA-256 track ID from file metadata and header bytes.
 */
export async function computeFileFingerprint(
  filename: string,
  fileSize: number,
  bufferSample: ArrayBuffer
): Promise<string> {
  const sampleLength = Math.min(bufferSample.byteLength, 8192);
  const sampleBytes = new Uint8Array(bufferSample, 0, sampleLength);

  const metaString = `${filename}_${fileSize}_`;
  const metaBytes = new TextEncoder().encode(metaString);

  const combined = new Uint8Array(metaBytes.length + sampleBytes.length);
  combined.set(metaBytes, 0);
  combined.set(sampleBytes, metaBytes.length);

  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      return `local_${hex.slice(0, 16)}`;
    }
  } catch {
    // Fallback hash if subtle crypto is unavailable
  }

  // Simple Fowler-Noll-Vo hash fallback
  let hash = 2166136261;
  for (let i = 0; i < combined.length; i++) {
    hash ^= combined[i];
    hash = Math.imul(hash, 16777619);
  }
  return `local_${Math.abs(hash).toString(16).padStart(12, '0')}`;
}

/**
 * Decodes ID3 text frames with encoding prefix support.
 */
function decodeTextFrame(bytes: Uint8Array): string {
  if (bytes.length === 0) return '';
  const encoding = bytes[0];
  const content = bytes.subarray(1);

  if (encoding === 0) {
    // ISO-8859-1 / ASCII
    let str = '';
    for (let i = 0; i < content.length; i++) {
      if (content[i] === 0) break;
      str += String.fromCharCode(content[i]);
    }
    return str.trim();
  } else if (encoding === 3) {
    // UTF-8
    try {
      return new TextDecoder('utf-8').decode(content).replace(/\0.*$/, '').trim();
    } catch {
      return '';
    }
  } else {
    // UTF-16 with BOM or UTF-16BE
    try {
      return new TextDecoder('utf-16').decode(content).replace(/\0.*$/, '').trim();
    } catch {
      return '';
    }
  }
}

/**
 * Binary parser for ID3v2 tags (ID3v2.3 and ID3v2.4).
 */
export function parseID3v2(buffer: ArrayBuffer): {
  title?: string;
  artist?: string;
  album?: string;
  genre?: string;
  year?: number;
  coverBlobUrl?: string;
} {
  const result: {
    title?: string;
    artist?: string;
    album?: string;
    genre?: string;
    year?: number;
    coverBlobUrl?: string;
  } = {};

  if (buffer.byteLength < 10) return result;

  const view = new DataView(buffer);
  // Check for 'ID3' magic bytes
  if (view.getUint8(0) !== 0x49 || view.getUint8(1) !== 0x44 || view.getUint8(2) !== 0x33) {
    return result;
  }

  const versionMajor = view.getUint8(3); // 3 for ID3v2.3, 4 for ID3v2.4
  // Synchsafe size of ID3 header
  const tagSize =
    ((view.getUint8(6) & 0x7f) << 21) |
    ((view.getUint8(7) & 0x7f) << 14) |
    ((view.getUint8(8) & 0x7f) << 7) |
    (view.getUint8(9) & 0x7f);

  const maxOffset = Math.min(buffer.byteLength, 10 + tagSize);
  let offset = 10;

  while (offset + 10 <= maxOffset) {
    // Read 4-character frame ID
    const frameIdChars = [
      String.fromCharCode(view.getUint8(offset)),
      String.fromCharCode(view.getUint8(offset + 1)),
      String.fromCharCode(view.getUint8(offset + 2)),
      String.fromCharCode(view.getUint8(offset + 3))
    ];
    const frameId = frameIdChars.join('');

    // Padding reached (null bytes)
    if (frameId.charCodeAt(0) === 0) break;

    // Read frame size
    let frameSize = 0;
    if (versionMajor === 4) {
      // ID3v2.4 uses synchsafe size
      frameSize =
        ((view.getUint8(offset + 4) & 0x7f) << 21) |
        ((view.getUint8(offset + 5) & 0x7f) << 14) |
        ((view.getUint8(offset + 6) & 0x7f) << 7) |
        (view.getUint8(offset + 7) & 0x7f);
    } else {
      // ID3v2.3 uses standard 32-bit big-endian
      frameSize = view.getUint32(offset + 4, false);
    }

    if (frameSize <= 0 || offset + 10 + frameSize > maxOffset) {
      break;
    }

    const frameBytes = new Uint8Array(buffer, offset + 10, frameSize);

    // Frame Matching
    if (frameId === 'TIT2') {
      result.title = decodeTextFrame(frameBytes);
    } else if (frameId === 'TPE1') {
      result.artist = decodeTextFrame(frameBytes);
    } else if (frameId === 'TALB') {
      result.album = decodeTextFrame(frameBytes);
    } else if (frameId === 'TCON') {
      const g = decodeTextFrame(frameBytes);
      result.genre = g.replace(/^\(\d+\)/, '').trim(); // strip genre number like "(13)"
    } else if (frameId === 'TYER' || frameId === 'TDRC') {
      const yStr = decodeTextFrame(frameBytes);
      const parsedYear = parseInt(yStr, 10);
      if (parsedYear > 1900 && parsedYear < 2100) {
        result.year = parsedYear;
      }
    } else if (frameId === 'APIC' && !result.coverBlobUrl) {
      // Attached Picture
      try {
        const encoding = frameBytes[0];
        let mimeEnd = 1;
        while (mimeEnd < frameBytes.length && frameBytes[mimeEnd] !== 0) {
          mimeEnd++;
        }
        let mimeType = '';
        for (let m = 1; m < mimeEnd; m++) {
          mimeType += String.fromCharCode(frameBytes[m]);
        }
        if (!mimeType) mimeType = 'image/jpeg';

        // Picture type is at mimeEnd + 1 (e.g. 3 for cover)
        // Description starts at mimeEnd + 2
        let descEnd = mimeEnd + 2;
        if (encoding === 0 || encoding === 3) {
          while (descEnd < frameBytes.length && frameBytes[descEnd] !== 0) descEnd++;
          descEnd++; // skip null
        } else {
          while (descEnd + 1 < frameBytes.length && (frameBytes[descEnd] !== 0 || frameBytes[descEnd + 1] !== 0)) {
            descEnd += 2;
          }
          descEnd += 2; // skip 2-byte null
        }

        const imageBytes = frameBytes.subarray(descEnd);
        if (imageBytes.length > 32 && typeof Blob !== 'undefined') {
          const blob = new Blob([imageBytes], { type: mimeType });
          if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
            result.coverBlobUrl = URL.createObjectURL(blob);
          }
        }
      } catch {
        // Picture frame extraction failure is non-fatal
      }
    }

    offset += 10 + frameSize;
  }

  return result;
}

/**
 * Main ingestion entry point: extracts complete audio metadata.
 */
export async function parseAudioFileMetadata(
  file: { name: string; size: number; type?: string },
  buffer: ArrayBuffer
): Promise<ParsedAudioMetadata> {
  const id3 = parseID3v2(buffer);
  const heuristics = parseFilenameHeuristics(file.name);

  const title = id3.title?.trim() || heuristics.title;
  const artist = id3.artist?.trim() || heuristics.artist;
  const album = id3.album?.trim() || 'Local Audio';
  const genre = id3.genre?.trim() || 'Local';
  const year = id3.year;

  const id = await computeFileFingerprint(file.name, file.size, buffer);

  // Default duration estimate based on file size and standard 256kbps bitrate
  const estimatedDuration = Math.max(30, Math.round(file.size / (32 * 1024)));

  const defaultCover =
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80';

  return {
    id,
    title,
    artist,
    album,
    year,
    genre,
    duration: estimatedDuration,
    coverUrl: id3.coverBlobUrl || defaultCover,
    sourceType: 'local'
  };
}
