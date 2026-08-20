// ==========================================
// Riff Domain Types & Interfaces
// ==========================================

export type AudioSourceType = 'local' | 'audius' | 'saavn' | 'jamendo' | 'radio' | 'archive' | 'ytdlp' | 'piped' | 'itunes' | 'deezer';

export type QualityTier = 'auto' | 'high' | 'standard' | 'saver';

export interface SyncedLyricLine {
  timeMs: number;
  text: string;
}

export interface Track {
  id: string;                         // Canonical ID: SHA-256(norm_artist + norm_title + duration)
  title: string;
  artist: string;
  album?: string;
  duration: number;                   // In seconds
  coverUrl: string;
  sourceType: AudioSourceType;
  streamUrl?: string;
  rawUrl?: string;                    // Source URL for yt-dlp / SoundCloud direct stream extraction
  hasSyncedLyrics?: boolean;
  syncedLyrics?: SyncedLyricLine[];
  plainLyrics?: string;
  genre?: string;
  releaseYear?: number;
  isOfflineCached?: boolean;
  bitrateKbps?: number;
  isLiked?: boolean;
  playCount?: number;
  localBlobKey?: string;              // For local/OPFS audio tracks
  availableSources?: AudioSourceType[];
}

export interface Artist {
  id: string;
  name: string;
  avatarUrl: string;
  genres: string[];
  monthlyListeners?: number;
  bio?: string;
  topTracks?: Track[];
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  releaseYear?: number;
  coverUrl: string;
  trackCount: number;
  tracks?: Track[];
}

export interface Playlist {
  id: string;
  title: string;
  description?: string;
  coverUrl: string;
  creator: string;
  isPublic?: boolean;
  isCurated?: boolean;
  trackCount: number;
  tracks?: Track[];
  updatedAt?: number;
}

export interface RadioStation {
  id: string;
  name: string;
  url: string;
  favicon: string;
  country: string;
  language: string;
  tags: string[];
  bitrate: number;
  votes: number;
}

export interface SearchResults {
  query: string;
  selectedCategory: 'all' | 'tracks' | 'artists' | 'playlists' | 'albums' | 'radio' | 'local';
  topResult?: {
    type: 'track' | 'artist' | 'album' | 'playlist';
    data: Track | Artist | Album | Playlist;
  };
  tracks: Track[];
  artists: Artist[];
  playlists: Playlist[];
  albums: Album[];
  radioStations: RadioStation[];
}

export interface UserProfile {
  id: string;
  email?: string;
  displayName: string;
  avatarUrl?: string;
  isGuest: boolean;
}

export interface AppSettings {
  theme: 'deep-obsidian' | 'oled-pure' | 'cyber-neon' | 'ambient-glass';
  streamingQuality: QualityTier;
  cellularQuality: 'standard' | 'saver';
  wifiQuality: 'high';
  allowCellularDownloads: boolean;
  dataSaverEnabled: boolean;
  equalizerPreset: 'flat' | 'bass_boost' | 'vocal' | 'electronic' | 'rock' | 'acoustic';
  eqBands: number[]; // 5 band values (-12 to +12 dB)
  pushEnabled: boolean;
}

export type PlaybackState = 'idle' | 'resolving' | 'buffering' | 'playing' | 'paused' | 'error';

export type RepeatMode = 'off' | 'all' | 'one';
