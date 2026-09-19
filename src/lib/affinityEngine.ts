import { Track } from '../types';
import { findTopK } from './priorityQueue';

export interface AffinityProfile {
  artists: Record<string, number>; // artistName -> score
  genres: Record<string, number>;  // genreName -> score
  totalPlays: number;
  totalCompletions: number;
  totalSkips: number;
  lastUpdated: number;
}

const STORAGE_KEY = 'riff_user_affinity';

function getInitialProfile(): AffinityProfile {
  if (typeof window === 'undefined') {
    return { artists: {}, genres: {}, totalPlays: 0, totalCompletions: 0, totalSkips: 0, lastUpdated: Date.now() };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { artists: {}, genres: {}, totalPlays: 0, totalCompletions: 0, totalSkips: 0, lastUpdated: Date.now() };
}

let profile: AffinityProfile = getInitialProfile();

function saveProfile() {
  if (typeof window === 'undefined') return;
  try {
    profile.lastUpdated = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    window.dispatchEvent(new CustomEvent('riff_affinity_updated'));
  } catch {}
}

/**
 * 1. Record track play interaction (+2 to artist & genre)
 */
export function recordPlayInteraction(track: Track) {
  if (!track || !track.artist) return;
  const artist = track.artist.trim();
  const genre = track.genre || 'Pop';

  profile.artists[artist] = (profile.artists[artist] || 0) + 2;
  profile.genres[genre] = (profile.genres[genre] || 0) + 2;
  profile.totalPlays++;
  saveProfile();
}

/**
 * 2. Record full or 80%+ completion (+5 to artist & genre)
 */
export function recordCompletionInteraction(track: Track) {
  if (!track || !track.artist) return;
  const artist = track.artist.trim();
  const genre = track.genre || 'Pop';

  profile.artists[artist] = (profile.artists[artist] || 0) + 5;
  profile.genres[genre] = (profile.genres[genre] || 0) + 5;
  profile.totalCompletions++;
  saveProfile();
}

/**
 * 3. Record rapid skip (<15s) (-3 penalty)
 */
export function recordSkipInteraction(track: Track) {
  if (!track || !track.artist) return;
  const artist = track.artist.trim();

  profile.artists[artist] = Math.max(0, (profile.artists[artist] || 0) - 3);
  profile.totalSkips++;
  saveProfile();
}

/**
 * 4. Record Like / Favorite (+10 points to artist & genre)
 */
export function recordLikeInteraction(track: Track, isLiked: boolean) {
  if (!track || !track.artist) return;
  const artist = track.artist.trim();
  const genre = track.genre || 'Pop';

  const delta = isLiked ? 10 : -10;
  profile.artists[artist] = Math.max(0, (profile.artists[artist] || 0) + delta);
  profile.genres[genre] = Math.max(0, (profile.genres[genre] || 0) + delta);
  saveProfile();
}

/**
 * 5. Record Search query select (+3 to artist)
 */
export function recordSearchInteraction(artistName: string) {
  if (!artistName) return;
  const clean = artistName.trim();
  profile.artists[clean] = (profile.artists[clean] || 0) + 3;
  saveProfile();
}

/**
 * Retrieves the user's top affinity artist in O(N) single-pass time.
 */
export function getTopAffinityArtist(): { name: string; score: number } | null {
  const entries = Object.entries(profile.artists);
  if (entries.length === 0) return null;
  let topName = entries[0][0];
  let topScore = entries[0][1];
  for (let i = 1; i < entries.length; i++) {
    if (entries[i][1] > topScore) {
      topName = entries[i][0];
      topScore = entries[i][1];
    }
  }
  return { name: topName, score: topScore };
}

/**
 * Retrieves the user's top multiple affinity artists using Min-Heap Top-K in O(N log K).
 */
export function getTopAffinityArtists(limit = 5): { name: string; score: number }[] {
  const entries = Object.entries(profile.artists);
  if (entries.length === 0) return [];
  const top = findTopK(entries, limit, (a, b) => a[1] - b[1]);
  return top.map(([name, score]) => ({ name, score }));
}

/**
 * Retrieves the user's top genres ordered by score using Min-Heap Top-K in O(N log K).
 */
export function getTopAffinityGenres(limit = 3): string[] {
  const entries = Object.entries(profile.genres);
  if (entries.length === 0) return ['Pakistani Pop', 'Punjabi Wave', 'Bollywood Romance'];
  const top = findTopK(entries, limit, (a, b) => a[1] - b[1]);
  return top.map(([genre]) => genre);
}

/**
 * Retrieves full telemetry profile
 */
export function getUserAffinityProfile(): AffinityProfile {
  return profile;
}
