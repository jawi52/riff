import { create } from 'zustand';
import { Track, PlaybackState, RepeatMode, QualityTier, Album, Playlist, MainViewType } from '../types';
import { audioEngine } from '../lib/audioEngine';
import { getActiveLyricIndex } from '../lib/lyrics';
import { db } from '../lib/db';
import { getSmartAutoplayTracks, recordTrackInteraction, GLOBAL_CATALOG } from '../lib/algorithm';
import { resolveMasterStream, fetchSyncedLyrics, isPreviewUrl } from '../lib/masterAudioEngine';
import { getSaavnRecommendations } from '../lib/saavnClient';
import { recordPlayInteraction, recordCompletionInteraction, recordSkipInteraction } from '../lib/affinityEngine';
import { generateShuffleOrder, insertTrackIntoShuffleOrder, removeTrackFromShuffleOrder } from '../lib/shuffle';
import { playerStateMachine } from '../lib/playerStateMachine';
import { audioPrebufferManager, getNextTrackInQueue } from '../lib/audioPrebuffer';
import { crossfadeController } from '../lib/crossfade';
import { useSettingsStore } from './useSettingsStore';
import { getAudioUrlFromOPFS } from '../lib/opfs';

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
  shuffledIndices: number[];
  shufflePosition: number;
  repeatMode: RepeatMode;
  isFullscreenOpen: boolean;
  isLyricsOpen: boolean;
  isQueueOpen: boolean;
  isEqualizerOpen: boolean;
  isRightSidebarOpen: boolean;
  rightSidebarTab: 'nowplaying' | 'lyrics' | 'queue';
  activeLyricIndex: number;
  isLyricsLoading: boolean;
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

  crossfadeToNextTrack: (nextTrack: Track) => Promise<void>;
  initAudioListeners: () => void;
}

function getLastPlayedTrack(): Track | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('riff_last_played_track');
    if (raw) return JSON.parse(raw);
    return null;
  } catch {
    return null;
  }
}

const initialTrack = getLastPlayedTrack();
let sleepTimerTimeout: NodeJS.Timeout | null = null;

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: initialTrack,
  queue: initialTrack ? [initialTrack] : [],
  queueIndex: initialTrack ? 0 : -1,
  playbackState: 'paused',
  currentTime: 0,
  duration: initialTrack?.duration || 0,
  volume: 0.85,
  isMuted: false,
  isShuffled: false,
  shuffledIndices: initialTrack ? [0] : [],
  shufflePosition: 0,
  repeatMode: 'off',
  isFullscreenOpen: false,
  isLyricsOpen: false,
  isQueueOpen: false,
  isEqualizerOpen: false,
  isRightSidebarOpen: true,
  rightSidebarTab: 'nowplaying',
  activeLyricIndex: 0,
  isLyricsLoading: false,
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

    // Manage shuffle permutation synchronization
    let nextShuffled = state.shuffledIndices;
    let nextShufflePos = state.shufflePosition;

    if (state.isShuffled) {
      if (newQueue || state.shuffledIndices.length !== updatedQueue.length) {
        nextShuffled = generateShuffleOrder(updatedQueue.length, newIndex);
        nextShufflePos = 0;
      } else {
        const foundPos = state.shuffledIndices.indexOf(newIndex);
        if (foundPos !== -1) {
          nextShufflePos = foundPos;
        } else {
          nextShuffled = generateShuffleOrder(updatedQueue.length, newIndex);
          nextShufflePos = 0;
        }
      }
    }

    // Record last played track for instant resumption
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('riff_last_played_track', JSON.stringify(track));
      } catch {}
    }

    // Start FSM session for this track request (aborts any in-flight previous resolves)
    const session = playerStateMachine.startSession(track.id);

    set({
      currentTrack: track,
      queue: updatedQueue,
      queueIndex: newIndex,
      shuffledIndices: nextShuffled,
      shufflePosition: nextShufflePos,
      playbackState: 'resolving',
      currentTime: 0,
      duration: track.duration || 0,
      activeLyricIndex: 0
    });

    try {
      let streamUrl = '';

      // 0. Instant 0-second hand-off from predictive prebuffer cache
      const prebuffered = audioPrebufferManager.consume(track.id);
      if (prebuffered && prebuffered.streamUrl) {
        streamUrl = prebuffered.streamUrl;
        if (prebuffered.syncedLyrics && prebuffered.syncedLyrics.length > 0) {
          set((prev) => ({
            isLyricsLoading: false,
            currentTrack:
              prev.currentTrack?.id === track.id
                ? {
                    ...prev.currentTrack,
                    syncedLyrics: prebuffered.syncedLyrics,
                    plainLyrics: prebuffered.plainLyrics || prev.currentTrack.plainLyrics,
                    hasSyncedLyrics: true
                  }
                : prev.currentTrack
          }));
        }
      }

      // 1. If audio exists in OPFS Vault or IndexedDB, stream instantly with zero network!
      if (!streamUrl) {
        const opfsUrl = await getAudioUrlFromOPFS(track.id);
        if (!session.isCurrent()) return;
        if (opfsUrl) {
          streamUrl = opfsUrl;
        } else {
          const cachedTrack = await db.tracks.get(track.id);
          if (!session.isCurrent()) return;
          if (cachedTrack?.audioBlob) {
            streamUrl = URL.createObjectURL(cachedTrack.audioBlob);
          }
        }
      }

      // 2. Resolve Master Stream (instant direct CDN playback)
      if (!streamUrl || isPreviewUrl(streamUrl) || streamUrl.includes('azurewebsites.net')) {
        streamUrl = await resolveMasterStream(track);
      }

      if (!session.isCurrent()) return;

      if (!streamUrl) {
        if (playerStateMachine.transition('error', session)) {
          set({ playbackState: 'error' });
        }
        setTimeout(() => {
          if (session.isCurrent() && get().playbackState === 'error') get().nextTrack();
        }, 1500);
        return;
      }

      // Sync OS MediaSession (Lockscreen, Android Notification Shade, Bluetooth)
      audioEngine.syncMediaSession(
        track,
        () => get().nextTrack(),
        () => get().previousTrack(),
        () => {
          if (session.isCurrent() && playerStateMachine.transition('playing', session)) {
            set({ playbackState: 'playing' });
          }
        },
        () => {
          if (session.isCurrent() && playerStateMachine.transition('paused', session)) {
            set({ playbackState: 'paused' });
          }
        }
      );

      // Fetch lyrics in background if not already provided by track or pre-buffer cache
      const alreadyHasLyrics = get().currentTrack?.syncedLyrics && get().currentTrack!.syncedLyrics!.length > 0;
      if (!track.syncedLyrics || track.syncedLyrics.length === 0) {
        if (!alreadyHasLyrics) {
          set({ isLyricsLoading: true });
          fetchSyncedLyrics(track.artist, track.title, track.id)
            .then(({ synced, plain }) => {
              if (!session.isCurrent()) return;
              set((prev) => ({
                isLyricsLoading: false,
                currentTrack:
                  prev.currentTrack?.id === track.id
                    ? { 
                        ...prev.currentTrack, 
                        syncedLyrics: synced,
                        plainLyrics: plain || prev.currentTrack.plainLyrics,
                        hasSyncedLyrics: synced.length > 0 
                      }
                    : prev.currentTrack
              }));
            })
            .catch(() => {
              if (session.isCurrent()) set({ isLyricsLoading: false });
            });
        } else {
          set({ isLyricsLoading: false });
        }
      } else {
        set({ isLyricsLoading: false });
      }

      if (playerStateMachine.transition('buffering', session)) {
        set({ playbackState: 'buffering' });
      }

      try {
        await audioEngine.playTrack(streamUrl);
      } catch (err) {
        if (!session.isCurrent()) return;
        console.warn('Primary audio stream failed, retrying direct fallback...', err);
        const fallbackUrl = await resolveMasterStream(track);
        if (!session.isCurrent()) return;
        if (fallbackUrl && fallbackUrl !== streamUrl) {
          await audioEngine.playTrack(fallbackUrl);
        } else {
          throw err;
        }
      }

      if (!session.isCurrent()) return;

      if (playerStateMachine.transition('playing', session)) {
        set({ playbackState: 'playing' });
      }

      // Record affinity telemetry & listening history
      recordPlayInteraction(track);
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
      if (!session.isCurrent()) return;
      console.error('Audio playback error:', err);
      if (playerStateMachine.transition('error', session)) {
        set({ playbackState: 'error' });
      }
      // Graceful auto-skip on failure so music keeps playing
      setTimeout(() => {
        if (session.isCurrent() && get().playbackState === 'error') {
          get().nextTrack();
        }
      }, 1500);
    }
  },

  togglePlayPause: () => {
    const { playbackState, currentTrack, queue } = get();
    if (!currentTrack) return;

    if (playbackState === 'playing') {
      audioEngine.pause();
      if (playerStateMachine.transition('paused')) {
        set({ playbackState: 'paused' });
      }
    } else if (playbackState === 'paused') {
      audioEngine
        .resume()
        .then(() => {
          if (playerStateMachine.transition('playing')) {
            set({ playbackState: 'playing' });
          }
        })
        .catch(() => {
          get().playTrack(currentTrack, queue);
        });
    } else if (playbackState === 'resolving' || playbackState === 'buffering') {
      playerStateMachine.reset();
      audioEngine.pause();
      set({ playbackState: 'paused' });
    } else {
      get().playTrack(currentTrack, queue);
    }
  },

  seek: (seconds) => {
    audioEngine.seek(seconds);
    set({ currentTime: seconds });
  },

  nextTrack: () => {
    const { queue, queueIndex, isShuffled, shuffledIndices, shufflePosition, currentTrack, currentTime } = get();
    if (queue.length === 0) return;

    if (currentTime < 15 && currentTrack) {
      recordTrackInteraction(currentTrack, 'skip');
      recordSkipInteraction(currentTrack);
    }

    let nextIndex = queueIndex + 1;
    let nextShufflePos = shufflePosition + 1;

    if (isShuffled && shuffledIndices.length > 0) {
      if (nextShufflePos < shuffledIndices.length) {
        nextIndex = shuffledIndices[nextShufflePos];
        set({ shufflePosition: nextShufflePos });
      } else {
        if (get().repeatMode === 'all') {
          const freshOrder = generateShuffleOrder(queue.length, -1);
          set({ shuffledIndices: freshOrder, shufflePosition: 0 });
          nextIndex = freshOrder[0];
        } else {
          nextIndex = queue.length; // triggers infinite autoplay or queue end
        }
      }
    }

    if (nextIndex >= queue.length) {
      if (get().repeatMode === 'all' && !isShuffled) {
        nextIndex = 0;
      } else if (currentTrack) {
        // Smart Infinite Autoplay Algorithm: Auto-generate matching tracks!
        const existingIds = new Set(queue.map((t) => t.id));
        getSaavnRecommendations(currentTrack.id).then((recs) => {
          const fresh = recs.filter((r) => !existingIds.has(r.id));
          if (fresh.length > 0) {
            const updated = [...get().queue, ...fresh];
            let nextShuff = get().shuffledIndices;
            if (get().isShuffled) {
              const freshIndices = fresh.map((_, i) => get().queue.length + i);
              nextShuff = [...nextShuff, ...freshIndices];
            }
            set({ queue: updated, queueIndex: get().queue.length, shuffledIndices: nextShuff, shufflePosition: nextShufflePos });
            get().playTrack(fresh[0], updated);
          } else {
            const autoTracks = getSmartAutoplayTracks(currentTrack, existingIds, 4);
            if (autoTracks.length > 0) {
              const updatedQueue = [...get().queue, ...autoTracks];
              let nextShuff = get().shuffledIndices;
              if (get().isShuffled) {
                const freshIndices = autoTracks.map((_, i) => get().queue.length + i);
                nextShuff = [...nextShuff, ...freshIndices];
              }
              set({ queue: updatedQueue, queueIndex: get().queue.length, shuffledIndices: nextShuff, shufflePosition: nextShufflePos });
              get().playTrack(autoTracks[0], updatedQueue);
            }
          }
        }).catch(() => {
          const autoTracks = getSmartAutoplayTracks(currentTrack, existingIds, 4);
          if (autoTracks.length > 0) {
            const updatedQueue = [...get().queue, ...autoTracks];
            let nextShuff = get().shuffledIndices;
            if (get().isShuffled) {
              const freshIndices = autoTracks.map((_, i) => get().queue.length + i);
              nextShuff = [...nextShuff, ...freshIndices];
            }
            set({ queue: updatedQueue, queueIndex: get().queue.length, shuffledIndices: nextShuff, shufflePosition: nextShufflePos });
            get().playTrack(autoTracks[0], updatedQueue);
          }
        });
        return;
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
    const { queue, queueIndex, isShuffled, shuffledIndices, shufflePosition, currentTime } = get();
    if (currentTime > 3) {
      get().seek(0);
      return;
    }

    if (isShuffled && shuffledIndices.length > 0) {
      if (shufflePosition > 0) {
        const prevPos = shufflePosition - 1;
        const prevIndex = shuffledIndices[prevPos];
        set({ shufflePosition: prevPos });
        const prevSong = queue[prevIndex];
        if (prevSong) get().playTrack(prevSong);
      } else {
        get().seek(0);
      }
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

  toggleShuffle: () => {
    const { isShuffled, queue, queueIndex } = get();
    const nextIsShuffled = !isShuffled;
    if (nextIsShuffled) {
      const order = generateShuffleOrder(queue.length, queueIndex);
      set({ isShuffled: true, shuffledIndices: order, shufflePosition: 0 });
    } else {
      set({ isShuffled: false, shuffledIndices: [], shufflePosition: 0 });
    }
  },

  cycleRepeatMode: () => {
    const modes: RepeatMode[] = ['off', 'all', 'one'];
    const current = get().repeatMode;
    const next = modes[(modes.indexOf(current) + 1) % modes.length];
    set({ repeatMode: next });
  },

  addToQueue: (track) => {
    const state = get();
    const newQueue = [...state.queue, track];
    const newTrackIndex = newQueue.length - 1;
    let updatedShuffled = state.shuffledIndices;
    if (state.isShuffled) {
      updatedShuffled = insertTrackIntoShuffleOrder(state.shuffledIndices, state.shufflePosition, newTrackIndex);
    }
    set({ queue: newQueue, shuffledIndices: updatedShuffled });
  },

  removeFromQueue: (index) => {
    const { queue, queueIndex, isShuffled, shuffledIndices, shufflePosition } = get();
    const updated = queue.filter((_, i) => i !== index);
    let newIndex = queueIndex;
    if (index < queueIndex) newIndex--;
    else if (index === queueIndex) newIndex = Math.min(newIndex, updated.length - 1);

    let updatedShuffled = shuffledIndices;
    let newShufflePos = shufflePosition;
    if (isShuffled) {
      const res = removeTrackFromShuffleOrder(shuffledIndices, shufflePosition, index);
      updatedShuffled = res.updatedIndices;
      newShufflePos = res.newShufflePos;
    }

    set({ queue: updated, queueIndex: newIndex, shuffledIndices: updatedShuffled, shufflePosition: newShufflePos });
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
    try {
      const recs = await getSaavnRecommendations(seedTrack.id);
      if (recs.length > 0) {
        const radioQueue = [seedTrack, ...recs.filter((t) => t.id !== seedTrack.id)];
        await get().playTrack(seedTrack, radioQueue);
        return;
      }
    } catch {}
    const similarTracks = getSmartAutoplayTracks(seedTrack, 25);
    const radioQueue = [seedTrack, ...similarTracks.filter((t) => t.id !== seedTrack.id)];
    await get().playTrack(seedTrack, radioQueue);
  },

  clearQueue: () => {
    audioPrebufferManager.clear();
    set({ queue: [], queueIndex: -1 });
  },
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

  crossfadeToNextTrack: async (nextTrack: Track) => {
    const { queue, queueIndex, isShuffled, shuffledIndices, shufflePosition, repeatMode, currentTrack } = get();
    const { crossfadeSeconds } = useSettingsStore.getState();

    // Telemetry: record completion on outgoing track
    if (currentTrack) {
      recordTrackInteraction(currentTrack, 'complete');
      recordCompletionInteraction(currentTrack);
    }

    // Determine next index and shuffle pos
    let nextIndex = queueIndex + 1;
    let nextShufflePos = shufflePosition + 1;

    if (isShuffled && shuffledIndices.length > 0) {
      if (nextShufflePos < shuffledIndices.length) {
        nextIndex = shuffledIndices[nextShufflePos];
        set({ shufflePosition: nextShufflePos });
      } else if (repeatMode === 'all') {
        const freshOrder = generateShuffleOrder(queue.length, -1);
        set({ shuffledIndices: freshOrder, shufflePosition: 0 });
        nextIndex = freshOrder[0];
      }
    } else if (nextIndex >= queue.length && repeatMode === 'all') {
      nextIndex = 0;
    }

    const session = playerStateMachine.startSession(nextTrack.id);

    set({
      currentTrack: nextTrack,
      queueIndex: nextIndex,
      playbackState: 'playing',
      currentTime: 0,
      duration: nextTrack.duration || 0,
      activeLyricIndex: 0
    });

    try {
      let streamUrl = '';

      // Check pre-buffer cache for instant 0s hand-off
      const prebuffered = audioPrebufferManager.consume(nextTrack.id);
      if (prebuffered && prebuffered.streamUrl) {
        streamUrl = prebuffered.streamUrl;
        if (prebuffered.syncedLyrics && prebuffered.syncedLyrics.length > 0) {
          set((prev) => ({
            isLyricsLoading: false,
            currentTrack:
              prev.currentTrack?.id === nextTrack.id
                ? {
                    ...prev.currentTrack,
                    syncedLyrics: prebuffered.syncedLyrics,
                    plainLyrics: prebuffered.plainLyrics || prev.currentTrack.plainLyrics,
                    hasSyncedLyrics: true
                  }
                : prev.currentTrack
          }));
        }
      }

      if (!streamUrl) {
        const opfsUrl = await getAudioUrlFromOPFS(nextTrack.id);
        if (!session.isCurrent()) return;
        if (opfsUrl) {
          streamUrl = opfsUrl;
        } else {
          const cachedTrack = await db.tracks.get(nextTrack.id);
          if (!session.isCurrent()) return;
          if (cachedTrack?.audioBlob) {
            streamUrl = URL.createObjectURL(cachedTrack.audioBlob);
          }
        }
      }

      if (!streamUrl || isPreviewUrl(streamUrl) || streamUrl.includes('azurewebsites.net')) {
        streamUrl = await resolveMasterStream(nextTrack);
      }

      if (!session.isCurrent() || !streamUrl) {
        return;
      }

      audioEngine.syncMediaSession(
        nextTrack,
        () => get().nextTrack(),
        () => get().previousTrack(),
        () => {
          if (session.isCurrent() && playerStateMachine.transition('playing', session)) {
            set({ playbackState: 'playing' });
          }
        },
        () => {
          if (session.isCurrent() && playerStateMachine.transition('paused', session)) {
            set({ playbackState: 'paused' });
          }
        }
      );

      // Trigger equal-power crossfade between decks
      await audioEngine.crossfadeTo(streamUrl, crossfadeSeconds);

      recordPlayInteraction(nextTrack);
      await db.history.add({
        trackId: nextTrack.id,
        title: nextTrack.title,
        artist: nextTrack.artist,
        coverUrl: nextTrack.coverUrl,
        listenedAt: Date.now(),
        durationSec: nextTrack.duration,
        completed: false
      });
    } catch (err) {
      console.warn('Crossfade transition error, falling back to direct playTrack:', err);
      if (session.isCurrent()) {
        get().playTrack(nextTrack);
      }
    }
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

      // Lookahead Stream Pre-buffering (75% progress or <= 20s remaining)
      const progressRatio = totalDur > 0 ? curr / totalDur : 0;
      const remainingSec = totalDur > 0 ? totalDur - curr : Infinity;
      if (
        (progressRatio >= 0.75 || remainingSec <= 20) &&
        totalDur > 10 &&
        currentTrack &&
        prewarmedTrackId !== currentTrack.id
      ) {
        prewarmedTrackId = currentTrack.id;
        const { isShuffled, shuffledIndices, shufflePosition, repeatMode } = get();
        const nextSong = getNextTrackInQueue(queue, queueIndex, isShuffled, shuffledIndices, shufflePosition, repeatMode);
        if (nextSong && nextSong.id !== currentTrack.id) {
          audioPrebufferManager.prewarm(nextSong).catch(() => {});
        }
      }

      // Dual-Deck Equal-Power Crossfade Trigger
      const { crossfadeSeconds } = useSettingsStore.getState();
      crossfadeController.setDuration(crossfadeSeconds);

      if (
        crossfadeController.shouldTriggerCrossfade(curr, totalDur) &&
        !audioEngine.isCrossfadeActive() &&
        get().repeatMode !== 'one'
      ) {
        const { isShuffled, shuffledIndices, shufflePosition, repeatMode } = get();
        const nextSong = getNextTrackInQueue(queue, queueIndex, isShuffled, shuffledIndices, shufflePosition, repeatMode);
        if (nextSong && nextSong.id !== currentTrack?.id) {
          crossfadeController.setIsCrossfading(true);
          get().crossfadeToNextTrack(nextSong);
        }
      }

      audioEngine.updatePositionState();

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
        recordCompletionInteraction(currentTrack);
      }

      // Check if End-of-Track Sleep Timer is active
      if (sleepTimerMode === 'end_of_track') {
        audioEngine.pause();
        audioEngine.setMediaPlaybackState('paused');
        set({ playbackState: 'paused', sleepTimerMode: null, sleepTimerMinutes: null, sleepTimerEndTimestamp: null });
        return;
      }

      if (repeatMode === 'one') {
        get().seek(0);
        audioEngine.resume();
        audioEngine.setMediaPlaybackState('playing');
      } else {
        get().nextTrack();
      }
    };

    audio.onwaiting = () => set({ playbackState: 'buffering' });
    audio.onplaying = () => {
      set({ playbackState: 'playing' });
      audioEngine.setMediaPlaybackState('playing');
    };
    audio.onpause = () => {
      set({ playbackState: 'paused' });
      audioEngine.setMediaPlaybackState('paused');
    };
    audio.onerror = () => {
      console.warn('HTML5 Audio error encountered, auto-advancing to next track...');
      set({ playbackState: 'error' });
      audioEngine.setMediaPlaybackState('none');
      setTimeout(() => {
        if (get().playbackState === 'error') {
          get().nextTrack();
        }
      }, 1500);
    };
  }
}));

// Automatically hook audio listeners immediately on client startup
if (typeof window !== 'undefined') {
  usePlayerStore.getState().initAudioListeners();
}

