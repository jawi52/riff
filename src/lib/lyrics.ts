import { SyncedLyricLine } from '../types';

/**
 * Parses raw LRC format lyrics into a sorted array of timestamped lines.
 * Supported time formats: [mm:ss.xx], [mm:ss.xxx], [mm:ss]
 */
export function parseLRC(rawLrc: string): SyncedLyricLine[] {
  if (!rawLrc) return [];

  const lines = rawLrc.split(/\r?\n/);
  const result: SyncedLyricLine[] = [];
  const timeRegex = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Extract all timestamps from line (handles multi-timestamp lines like [00:12.00][00:15.00]Lyric)
    const matches = Array.from(trimmed.matchAll(timeRegex));
    if (matches.length === 0) continue;

    const text = trimmed.replace(timeRegex, '').trim();
    if (!text) continue;

    for (const match of matches) {
      const min = parseInt(match[1], 10);
      const sec = parseInt(match[2], 10);
      let ms = 0;
      if (match[3]) {
        ms = match[3].length === 2 ? parseInt(match[3], 10) * 10 : parseInt(match[3], 10);
      }

      const totalMs = min * 60 * 1000 + sec * 1000 + ms;
      result.push({
        timeMs: totalMs,
        text
      });
    }
  }

  // Sort strictly in chronological order
  return result.sort((a, b) => a.timeMs - b.timeMs);
}

/**
 * Binary search to find the active lyric line index for a given playback time in milliseconds.
 */
export function getActiveLyricIndex(lyrics: SyncedLyricLine[], currentTimeMs: number): number {
  if (!lyrics || lyrics.length === 0) return -1;
  if (currentTimeMs < lyrics[0].timeMs) return 0;

  let low = 0;
  let high = lyrics.length - 1;
  let activeIndex = 0;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (lyrics[mid].timeMs <= currentTimeMs) {
      activeIndex = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return activeIndex;
}
