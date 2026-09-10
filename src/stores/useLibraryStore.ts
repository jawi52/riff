import { create } from 'zustand';
import { Track, Playlist } from '../types';
import { db, DBTrack, DBPlaylist } from '../lib/db';
import { resolveMasterStream } from '../lib/masterAudioEngine';
import { recordLikeInteraction } from '../lib/affinityEngine';
import { toast } from 'sonner';

export interface DownloadProgress {
  playlistId: string | null;
  total: number;
  completed: number;
  isDownloading: boolean;
}

interface LibraryState {
  likedTracks: Track[];
  localTracks: Track[];
  offlineTracks: Track[];
  playlists: Playlist[];
  isLoading: boolean;
  downloadProgress: DownloadProgress;

  // Actions
  loadLibrary: () => Promise<void>;
  toggleLikeTrack: (track: Track) => Promise<boolean>;
  addLocalTrack: (track: DBTrack) => Promise<boolean>;
  removeLocalTrack: (id: string) => Promise<void>;
  createPlaylist: (title: string, description?: string) => Promise<Playlist>;
  addTrackToPlaylist: (playlistId: string, track: Track) => Promise<boolean>;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  deletePlaylist: (playlistId: string) => Promise<void>;
  cacheTrackForOffline: (track: Track) => Promise<boolean>;
  downloadPlaylist: (playlistId: string, tracks: Track[]) => Promise<void>;
  removePlaylistDownload: (playlistId: string, tracks: Track[]) => Promise<void>;
  deleteOfflineTrack: (trackId: string) => Promise<void>;
  isPlaylistDownloaded: (playlistId: string, tracks: Track[]) => boolean;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  likedTracks: [],
  localTracks: [],
  offlineTracks: [],
  playlists: [],
  isLoading: true,
  downloadProgress: {
    playlistId: null,
    total: 0,
    completed: 0,
    isDownloading: false,
  },

  loadLibrary: async () => {
    try {
      const allDbTracks = await db.tracks.toArray();
      const allDbPlaylists = await db.playlists.toArray();

      const liked = allDbTracks.filter((t) => t.isLiked);
      const local = allDbTracks.filter((t) => t.sourceType === 'local');
      const offline = allDbTracks.filter((t) => t.isOfflineCached && t.audioBlob);

      const mappedPlaylists: Playlist[] = allDbPlaylists.map((p) => {
        const playlistTracks = allDbTracks.filter((t) => p.trackIds?.includes(t.id));
        return {
          id: p.id,
          title: p.title,
          description: p.description,
          coverUrl: p.coverUrl || playlistTracks[0]?.coverUrl || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&q=80',
          creator: p.creator || 'You',
          trackCount: p.trackIds?.length || 0,
          tracks: playlistTracks,
          updatedAt: p.updatedAt
        };
      });

      set({
        likedTracks: liked,
        localTracks: local,
        offlineTracks: offline,
        playlists: mappedPlaylists,
        isLoading: false
      });
    } catch (err) {
      console.error('Failed to load library from IndexedDB:', err);
      set({ isLoading: false });
    }
  },

  toggleLikeTrack: async (track) => {
    const isLikedCurrently = track.isLiked || get().likedTracks.some((t) => t.id === track.id);
    const updatedLikeStatus = !isLikedCurrently;

    try {
      const existing = await db.tracks.get(track.id);
      if (existing) {
        await db.tracks.update(track.id, { isLiked: updatedLikeStatus });
      } else {
        await db.tracks.add({
          ...track,
          isLiked: updatedLikeStatus,
          addedAt: Date.now()
        });
      }

      // Record affinity telemetry
      recordLikeInteraction(track, updatedLikeStatus);

      await get().loadLibrary();
      return updatedLikeStatus;
    } catch (err) {
      console.error('Error toggling like:', err);
      return isLikedCurrently;
    }
  },

  addLocalTrack: async (track) => {
    try {
      const existing = await db.tracks.get(track.id);
      if (existing) {
        return false;
      }

      await db.tracks.add(track);
      await get().loadLibrary();
      return true;
    } catch (err) {
      console.error('Error adding local track:', err);
      return false;
    }
  },

  removeLocalTrack: async (id) => {
    await db.tracks.delete(id);
    await get().loadLibrary();
  },

  createPlaylist: async (title, description = '') => {
    const newId = `pl_${Date.now()}`;
    const newPlaylist: DBPlaylist = {
      id: newId,
      title,
      description,
      creator: 'You',
      coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
      trackIds: [],
      trackCount: 0,
      tracks: [],
      updatedAt: Date.now()
    };

    await db.playlists.add(newPlaylist);
    await get().loadLibrary();
    toast.success(`Created playlist "${title}"`);
    return newPlaylist;
  },

  addTrackToPlaylist: async (playlistId, track) => {
    try {
      const playlist = await db.playlists.get(playlistId);
      if (!playlist) return false;

      // Ensure track exists in db.tracks
      const existingTrack = await db.tracks.get(track.id);
      if (!existingTrack) {
        await db.tracks.add({ ...track, addedAt: Date.now() });
      }

      const currentTrackIds = playlist.trackIds || [];
      if (currentTrackIds.includes(track.id)) {
        toast.info(`"${track.title}" is already in ${playlist.title}`);
        return false; // Already in playlist
      }

      const updatedIds = [...currentTrackIds, track.id];
      await db.playlists.update(playlistId, {
        trackIds: updatedIds,
        trackCount: updatedIds.length,
        updatedAt: Date.now()
      });

      await get().loadLibrary();
      toast.success(`Added "${track.title}" to ${playlist.title}`);
      return true;
    } catch (err) {
      console.error('Failed to add track to playlist:', err);
      toast.error('Failed to add to playlist');
      return false;
    }
  },

  removeTrackFromPlaylist: async (playlistId, trackId) => {
    const playlist = await db.playlists.get(playlistId);
    if (!playlist) return;

    const updatedIds = (playlist.trackIds || []).filter((id) => id !== trackId);
    await db.playlists.update(playlistId, {
      trackIds: updatedIds,
      trackCount: updatedIds.length,
      updatedAt: Date.now()
    });

    await get().loadLibrary();
    toast.info(`Removed from ${playlist.title}`);
  },

  deletePlaylist: async (playlistId) => {
    await db.playlists.delete(playlistId);
    await get().loadLibrary();
    toast.info('Playlist deleted');
  },

  cacheTrackForOffline: async (track) => {
    const toastId = toast.loading(`Downloading "${track.title}"...`);
    try {
      // 1. If already has audio blob, mark as offline
      const existing = await db.tracks.get(track.id);
      if (existing?.audioBlob) {
        await db.tracks.update(track.id, { isOfflineCached: true });
        await get().loadLibrary();
        toast.success(`"${track.title}" is ready for offline play`, { id: toastId });
        return true;
      }

      // 2. Resolve Master Stream (ensure never an azure 30s preview)
      let streamUrl = track.streamUrl;
      if (!streamUrl || streamUrl.includes('undefined') || streamUrl.includes('azurewebsites.net')) {
        streamUrl = await resolveMasterStream(track);
      }

      if (!streamUrl) {
        toast.error(`Could not download "${track.title}" - audio stream unavailable`, { id: toastId });
        return false;
      }

      // 3. Fetch binary audio stream and store in IndexedDB
      const audioRes = await fetch(streamUrl);
      if (!audioRes.ok) {
        toast.error(`Download failed: Network error (${audioRes.status})`, { id: toastId });
        return false;
      }
      const audioBlob = await audioRes.blob();

      if (existing) {
        await db.tracks.update(track.id, { audioBlob, isOfflineCached: true, streamUrl });
      } else {
        await db.tracks.add({ ...track, streamUrl, audioBlob, isOfflineCached: true, addedAt: Date.now() });
      }

      await get().loadLibrary();
      toast.success(`Downloaded "${track.title}" for offline play!`, { id: toastId });
      return true;
    } catch (err) {
      console.error('Failed to cache track for offline:', err);
      toast.error(`Failed to download "${track.title}"`, { id: toastId });
      return false;
    }
  },

  downloadPlaylist: async (playlistId, tracks) => {
    if (!tracks || tracks.length === 0) return;

    toast.info(`Starting download of ${tracks.length} songs...`);
    set({
      downloadProgress: {
        playlistId,
        total: tracks.length,
        completed: 0,
        isDownloading: true,
      }
    });

    let completed = 0;

    for (const track of tracks) {
      try {
        const existing = await db.tracks.get(track.id);
        if (existing?.audioBlob) {
          completed++;
          set((s) => ({
            downloadProgress: { ...s.downloadProgress, completed }
          }));
          continue;
        }

        let streamUrl = track.streamUrl;
        if (!streamUrl || streamUrl.includes('undefined') || streamUrl.includes('azurewebsites.net')) {
          streamUrl = await resolveMasterStream(track);
        }

        if (streamUrl) {
          const audioRes = await fetch(streamUrl);
          if (audioRes.ok) {
            const audioBlob = await audioRes.blob();
            if (existing) {
              await db.tracks.update(track.id, { audioBlob, isOfflineCached: true, streamUrl });
            } else {
              await db.tracks.add({ ...track, streamUrl, audioBlob, isOfflineCached: true, addedAt: Date.now() });
            }
          }
        }
      } catch (e) {
        console.warn('Failed to download track in playlist:', track.title, e);
      } finally {
        completed++;
        set((s) => ({
          downloadProgress: { ...s.downloadProgress, completed }
        }));
      }
    }

    await get().loadLibrary();
    set({
      downloadProgress: {
        playlistId: null,
        total: 0,
        completed: 0,
        isDownloading: false,
      }
    });
    toast.success(`Downloaded all ${tracks.length} songs for offline listening!`);
  },

  removePlaylistDownload: async (_playlistId, tracks) => {
    try {
      for (const track of tracks) {
        const existing = await db.tracks.get(track.id);
        if (existing?.audioBlob) {
          await db.tracks.update(track.id, { audioBlob: undefined, isOfflineCached: false });
        }
      }
      await get().loadLibrary();
      toast.info('Removed playlist download');
    } catch (err) {
      console.error('Error removing playlist download:', err);
    }
  },

  deleteOfflineTrack: async (trackId) => {
    try {
      const existing = await db.tracks.get(trackId);
      if (existing) {
        await db.tracks.update(trackId, { audioBlob: undefined, isOfflineCached: false });
        await get().loadLibrary();
        toast.info('Removed from offline downloads');
      }
    } catch (err) {
      console.error('Error deleting offline track:', err);
    }
  },

  isPlaylistDownloaded: (_playlistId, tracks) => {
    if (!tracks || tracks.length === 0) return false;
    const offlineSet = new Set(get().offlineTracks.map((t) => t.id));
    return tracks.every((t) => offlineSet.has(t.id));
  }
}));
