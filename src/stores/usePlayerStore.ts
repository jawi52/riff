import { create } from 'zustand';
import { Track, PlaybackState, RepeatMode, QualityTier, Album, Playlist, MainViewType } from '../types';
import { audioEngine } from '../lib/audioEngine';
import { getActiveLyricIndex } from '../lib/lyrics';
import { db } from '../lib/db';
import { getSmartAutoplayTracks, recordTrackInteraction, GLOBAL_CATALOG } from '../lib/algorithm';
import { addRecentTrack } from '../lib/recentSearches';
import { resolveMasterStream, fetchSyncedLyrics } from '../lib/masterAudioEngine';

interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  queueIndex: number;
  playbackState: PlaybackState;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffled: boolean;
  repeatMode: RepeatMode;
  isFullscreenOpen: boolean;
  isLyricsOpen: boolean;
  isQueueOpen: boolean;
  isEqualizerOpen: boolean;
  isRightSidebarOpen: boolean;
  rightSidebarTab: 'nowplaying' | 'lyrics' | 'queue';
  activeLyricIndex: number;
  qualityTier: QualityTier;
  networkMode: 'wifi' | 'cellular';
  sleepTimerMinutes: number | null;
  sleepTimerEndTimestamp: number | null;
  sleepTimerMode: 'minutes' | 'end_of_track' | null;
  smartShuffle: boolean;

  // View Navigation States
  activeMainView: MainViewType;
  previousMainView: MainViewType;
  selectedArtistName: string | null;
  selectedPlaylist: Playlist | null;
  selectedAlbum: Album | null;

  // Actions
  playTrack: (track: Track, newQueue?: Track[]) => Promise<void>;
  togglePlayPause: () => void;
  seek: (seconds: number) => void;
  nextTrack: () => void;
  previousTrack: () => void;
  setVolume: (val: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  toggleSmartShuffle: () => void;
  cycleRepeatMode: () => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (startIndex: number, endIndex: number) => void;
  clearQueue: () => void;
  generateSongRadio: (seedTrack: Track) => Promise<void>;
  setFullscreenOpen: (open: boolean) => void;
  setLyricsOpen: (open: boolean) => void;
  setQueueOpen: (open: boolean) => void;
  setEqualizerOpen: (open: boolean) => void;
  setRightSidebarOpen: (open: boolean) => void;
  setRightSidebarTab: (tab: 'nowplaying' | 'lyrics' | 'queue') => void;
  toggleRightSidebar: () => void;
  setQualityTier: (tier: QualityTier) => void;
  setNetworkMode: (mode: 'wifi' | 'cellular') => void;
  setSleepTimer: (minutes: number | null, mode?: 'minutes' | 'end_of_track') => void;
  
  // Navigation Actions
  setActiveMainView: (view: MainViewType) => void;
  navigateToArtist: (artistName: string) => void;
  navigateToPlaylist: (playlist: Playlist) => void;
  navigateToAlbum: (album: Album) => void;
  navigateToStats: () => void;

  initAudioListeners: () => void;
}

let sleepTimerTimeout: NodeJS.Timeout | null = null;

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  queue: [],
  queueIndex: -1,
  playbackState: 'idle',
  currentTime: 0,
  duration: 0,
  volume: 0.85,
  isMuted: false,
  isShuffled: false,
  repeatMode: 'off',
  isFullscreenOpen: false,
  isLyricsOpen: false,
  isQueueOpen: false,
  isEqualizerOpen: false,
  isRightSidebarOpen: true,
  rightSidebarTab: 'nowplaying',
  activeLyricIndex: 0,
  qualityTier: 'auto',
  networkMode: 'wifi',
  sleepTimerMinutes: null,
  sleepTimerEndTimestamp: null,
  sleepTimerMode: null,
  smartShuffle: false,

  activeMainView: 'home',
  previousMainView: 'home',
  selectedArtistName: null,
  selectedPlaylist: null,
  selectedAlbum: null,

  playTrack: async (track, newQueue) => {
    const state = get();
    let updatedQueue = state.queue;
    let newIndex = state.queueIndex;

    if (newQueue) {
      updatedQueue = newQueue;
      newIndex = newQueue.findIndex((t) => t.id === track.id);
      if (newIndex === -1) {
        updatedQueue = [track, ...newQueue];
        newIndex = 0;
      }
    } else if (!state.queue.some((t) => t.id === track.id)) {
      updatedQueue = [...state.queue, track];
      newIndex = updatedQueue.length - 1;
    } else {
      newIndex = state.queue.findIndex((t) => t.id === track.id);
    }

    // Automatically record to recent searches
    addRecentTrack(track);

    set({
      currentTrack: track,
      queue: updatedQueue,
      queueIndex: newIndex,
      playbackState: 'resolving',
      currentTime: 0,
      duration: track.duration || 0,
      activeLyricIndex: 0
    });

    try {
      let streamUrl = track.streamUrl;

      // If local blob key exists, stream from IndexedDB / OPFS
      if (track.sourceType === 'local' && track.localBlobKey) {
        const localTrack = await db.tracks.get(track.id);
        if (localTrack?.audioBlob) {
          streamUrl = URL.createObjectURL(localTrack.audioBlob);
        }
      }

      // Resolve Master Stream (320kbps Studio Master)
      if (!streamUrl) {
        streamUrl = await resolveMasterStream(track);
      }

      if (!streamUrl) {
        set({ playbackState: 'error' });
        return;
      }

      // Sync OS MediaSession
      audioEngine.syncMediaSession(
        track,
        () => get().nextTrack(),
        () => get().previousTrack()
      );

      // Fetch lyrics in background
      if (track.hasSyncedLyrics && !track.syncedLyrics) {
        fetchSyncedLyrics(track.artist, track.title)
          .then((syncedLyrics) => {
            if (syncedLyrics && syncedLyrics.length > 0) {
              set((prev) => ({
                currentTrack:
                  prev.currentTrack?.id === track.id
                    ? { ...prev.currentTrack, syncedLyrics }
                    : prev.currentTrack
              }));
            }
          })
          .catch(() => {});
      }

      set({ playbackState: 'buffering' });
      await audioEngine.playTrack(streamUrl);
      set({ playbackState: 'playing' });

      // Log listening history
      await db.history.add({
        trackId: track.id,
        title: track.title,
        artist: track.artist,
        coverUrl: track.coverUrl,
        listenedAt: Date.now(),
        durationSec: track.duration,
        completed: false
      });
    } catch (err) {
      console.error('Audio playback error:', err);
      set({ playbackState: 'error' });
    }
  },

  togglePlayPause: () => {
    const { playbackState, currentTrack, queue } = get();
    if (!currentTrack) return;

    if (playbackState === 'playing') {
      audioEngine.pause();
      set({ playbackState: 'paused' });
    } else if (playbackState === 'paused') {
      audioEngine
        .resume()
        .then(() => set({ playbackState: 'playing' }))
        .catch(() => {
          get().playTrack(currentTrack, queue);
        });
    } else {
      get().playTrack(currentTrack, queue);
    }
  },

  seek: (seconds) => {
    audioEngine.seek(seconds);
    set({ currentTime: seconds });
  },

  nextTrack: () => {
    const { queue, queueIndex, isShuffled, currentTrack, currentTime } = get();
    if (queue.length === 0) return;

    if (currentTime < 15 && currentTrack) {
      recordTrackInteraction(currentTrack, 'skip');
    }

    let nextIndex = queueIndex + 1;
    if (isShuffled) {
      nextIndex = Math.floor(Math.random() * queue.length);
    }

    if (nextIndex >= queue.length) {
      if (get().repeatMode === 'all') {
        nextIndex = 0;
      } else if (currentTrack) {
        // Smart Infinite Autoplay Algorithm: Auto-generate matching tracks!
        const existingIds = new Set(queue.map((t) => t.id));
        const autoTracks = getSmartAutoplayTracks(currentTrack, existingIds, 4);
        if (autoTracks.length > 0) {
          const updatedQueue = [...queue, ...autoTracks];
          set({ queue: updatedQueue, queueIndex: queue.length });
          get().playTrack(autoTracks[0], updatedQueue);
          return;
        }
        return; // End of queue fallback
      } else {
        return;
      }
    }

    const nextSong = queue[nextIndex];
    if (nextSong) {
      get().playTrack(nextSong);
    }
  },

  previousTrack: () => {
    const { queue, queueIndex, currentTime } = get();
    if (currentTime > 3) {
      get().seek(0);
      return;
    }

    if (queueIndex > 0) {
      const prevSong = queue[queueIndex - 1];
      if (prevSong) get().playTrack(prevSong);
    } else {
      get().seek(0);
    }
  },

  setVolume: (val) => {
    audioEngine.setVolume(val);
    set({ volume: val, isMuted: val === 0 });
  },

  toggleMute: () => {
    const { isMuted, volume } = get();
    if (isMuted) {
      audioEngine.setVolume(volume || 0.85);
      set({ isMuted: false });
    } else {
      audioEngine.setVolume(0);
      set({ isMuted: true });
    }
  },

  toggleShuffle: () => set((s) => ({ isShuffled: !s.isShuffled })),

  cycleRepeatMode: () => {
    const modes: RepeatMode[] = ['off', 'all', 'one'];
    const current = get().repeatMode;
    const next = modes[(modes.indexOf(current) + 1) % modes.length];
    set({ repeatMode: next });
  },

  addToQueue: (track) => set((s) => ({ queue: [...s.queue, track] })),

  removeFromQueue: (index) => {
    const { queue, queueIndex } = get();
    const updated = queue.filter((_, i) => i !== index);
    let newIndex = queueIndex;
    if (index < queueIndex) newIndex--;
    else if (index === queueIndex) newIndex = Math.min(newIndex, updated.length - 1);
    set({ queue: updated, queueIndex: newIndex });
  },

  reorderQueue: (startIndex, endIndex) => {
    const { queue, queueIndex } = get();
    const result = Array.from(queue);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    let newIndex = queueIndex;
    if (queueIndex === startIndex) {
      newIndex = endIndex;
    } else if (startIndex < queueIndex && endIndex >= queueIndex) {
      newIndex--;
    } else if (startIndex > queueIndex && endIndex <= queueIndex) {
      newIndex++;
    }

    set({ queue: result, queueIndex: newIndex });
  },

  toggleSmartShuffle: () => {
    const isSmart = !get().smartShuffle;
    set({ smartShuffle: isSmart });
    if (isSmart) {
      const current = get().currentTrack;
      const recs = current ? getSmartAutoplayTracks(current, 5) : GLOBAL_CATALOG.slice(0, 5);
      const queue = [...get().queue];
      const qIdx = get().queueIndex;
      // Interleave recommendations into upcoming queue
      recs.forEach((rec: Track, i: number) => {
        if (!queue.some((q) => q.id === rec.id)) {
          queue.splice(qIdx + 1 + i * 2, 0, rec);
        }
      });
      set({ queue });
    }
  },

  generateSongRadio: async (seedTrack: Track) => {
    const similarTracks = getSmartAutoplayTracks(seedTrack, 25);
    const radioQueue = [seedTrack, ...similarTracks.filter((t) => t.id !== seedTrack.id)];
    await get().playTrack(seedTrack, radioQueue);
  },

  clearQueue: () => set({ queue: [], queueIndex: -1 }),
  setFullscreenOpen: (open) => set({ isFullscreenOpen: open }),
  setLyricsOpen: (open) => set({ isLyricsOpen: open }),
  setQueueOpen: (open) => set({ isQueueOpen: open }),
  setEqualizerOpen: (open) => set({ isEqualizerOpen: open }),
  setRightSidebarOpen: (open) => set({ isRightSidebarOpen: open }),
  setRightSidebarTab: (tab) => set({ rightSidebarTab: tab, isRightSidebarOpen: true }),
  toggleRightSidebar: () => set((s) => ({ isRightSidebarOpen: !s.isRightSidebarOpen })),
  setQualityTier: (tier) => set({ qualityTier: tier }),
  setNetworkMode: (mode) => set({ networkMode: mode }),

  setSleepTimer: (minutes, mode = 'minutes') => {
    if (sleepTimerTimeout) {
      clearTimeout(sleepTimerTimeout);
      sleepTimerTimeout = null;
    }

    if (mode === 'end_of_track') {
      set({ sleepTimerMode: 'end_of_track', sleepTimerMinutes: null, sleepTimerEndTimestamp: null });
      return;
    }

    if (!minutes) {
      set({ sleepTimerMinutes: null, sleepTimerEndTimestamp: null, sleepTimerMode: null });
      return;
    }

    const endTimestamp = Date.now() + minutes * 60 * 1000;
    set({ sleepTimerMinutes: minutes, sleepTimerEndTimestamp: endTimestamp, sleepTimerMode: 'minutes' });

    sleepTimerTimeout = setTimeout(() => {
      audioEngine.pause();
      set({ playbackState: 'paused', sleepTimerMinutes: null, sleepTimerEndTimestamp: null, sleepTimerMode: null });
    }, minutes * 60 * 1000);
  },

  setActiveMainView: (view) => set({ activeMainView: view }),
  navigateToArtist: (artistName) => {
    const current = get().activeMainView;
    const prev = current === 'artist' || current === 'playlist' ? get().previousMainView : (current as any);
    set({ selectedArtistName: artistName, activeMainView: 'artist', previousMainView: prev || 'home' });
  },
  navigateToPlaylist: (playlist) => {
    const current = get().activeMainView;
    const prev = current === 'artist' || current === 'playlist' ? get().previousMainView : (current as any);
    set({ selectedPlaylist: playlist, selectedAlbum: null, activeMainView: 'playlist', previousMainView: prev || 'home' });
  },
  navigateToAlbum: (album) => {
    const current = get().activeMainView;
    const prev = current === 'artist' || current === 'playlist' ? get().previousMainView : (current as any);
    set({ selectedAlbum: album, selectedPlaylist: null, activeMainView: 'playlist', previousMainView: prev || 'home' });
  },
  navigateToStats: () => {
    const current = get().activeMainView;
    const prev = current === 'artist' || current === 'playlist' ? get().previousMainView : (current as any);
    set({ activeMainView: 'stats', previousMainView: prev || 'home' });
  },

  initAudioListeners: () => {
    const audio = audioEngine.getAudioElement();
    let prewarmedTrackId: string | null = null;

    audio.ontimeupdate = () => {
      const curr = audio.currentTime;
      const { currentTrack, queue, queueIndex } = get();
      let activeLyric = 0;

      if (currentTrack?.syncedLyrics && currentTrack.syncedLyrics.length > 0) {
        activeLyric = getActiveLyricIndex(currentTrack.syncedLyrics, curr * 1000);
      }

      const totalDur = audio.duration || currentTrack?.duration || 0;

      // Lookahead Stream Pre-buffering when reaching 60% of track
      if (
        totalDur > 0 &&
        curr / totalDur > 0.60 &&
        currentTrack &&
        prewarmedTrackId !== currentTrack.id
      ) {
        prewarmedTrackId = currentTrack.id;
        const nextSong = queue[queueIndex + 1];
        if (nextSong) {
          fetch(`/api/v1/stream?title=${encodeURIComponent(nextSong.title)}&artist=${encodeURIComponent(nextSong.artist)}`).catch(() => {});
        }
      }

      set({
        currentTime: curr,
        duration: totalDur,
        activeLyricIndex: activeLyric
      });
    };

    audio.onended = () => {
      const { repeatMode, currentTrack, sleepTimerMode } = get();
      if (currentTrack) {
        recordTrackInteraction(currentTrack, 'complete');
      }

      // Check if End-of-Track Sleep Timer is active
      if (sleepTimerMode === 'end_of_track') {
        audioEngine.pause();
        set({ playbackState: 'paused', sleepTimerMode: null, sleepTimerMinutes: null, sleepTimerEndTimestamp: null });
        return;
      }

      if (repeatMode === 'one') {
        get().seek(0);
        audioEngine.resume();
      } else {
        get().nextTrack();
      }
    };

    audio.onwaiting = () => set({ playbackState: 'buffering' });
    audio.onplaying = () => set({ playbackState: 'playing' });
    audio.onpause = () => set({ playbackState: 'paused' });
    audio.onerror = () => set({ playbackState: 'error' });
  }
}));
