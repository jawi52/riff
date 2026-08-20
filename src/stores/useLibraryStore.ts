import { create } from 'zustand';
import { Track, Playlist } from '../types';
import { db, DBTrack, DBPlaylist } from '../lib/db';

interface LibraryState {
  likedTracks: Track[];
  localTracks: Track[];
  offlineTracks: Track[];
  playlists: Playlist[];
  isLoading: boolean;

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
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  likedTracks: [],
  localTracks: [],
  offlineTracks: [],
  playlists: [],
  isLoading: true,

  loadLibrary: async () => {
    try {
      const allDbTracks = await db.tracks.toArray();
      const allDbPlaylists = await db.playlists.toArray();

      const liked = allDbTracks.filter((t) => t.isLiked);
      const local = allDbTracks.filter((t) => t.sourceType === 'local');
      const offline = allDbTracks.filter((t) => t.isOfflineCached);

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
        return false; // Skip duplicate
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

  createPlaylist: async (title, description) => {
    const newPlaylist: DBPlaylist = {
      id: 'pl_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      title,
      description: description || '',
      coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80',
      creator: 'You',
      trackCount: 0,
      trackIds: [],
      updatedAt: Date.now()
    };

    await db.playlists.add(newPlaylist);
    await get().loadLibrary();
    return newPlaylist;
  },

  addTrackToPlaylist: async (playlistId, track) => {
    const playlist = await db.playlists.get(playlistId);
    if (!playlist) return false;

    // Strict Deduplication Check: Prevent duplicate song in playlist
    if (playlist.trackIds.includes(track.id)) {
      return false;
    }

    // Ensure track exists in database
    const existing = await db.tracks.get(track.id);
    if (!existing) {
      await db.tracks.add({ ...track, addedAt: Date.now() });
    }

    const updatedTrackIds = [...playlist.trackIds, track.id];
    await db.playlists.update(playlistId, {
      trackIds: updatedTrackIds,
      trackCount: updatedTrackIds.length,
      updatedAt: Date.now()
    });

    await get().loadLibrary();
    return true;
  },

  removeTrackFromPlaylist: async (playlistId, trackId) => {
    const playlist = await db.playlists.get(playlistId);
    if (!playlist) return;

    const updated = playlist.trackIds.filter((id) => id !== trackId);
    await db.playlists.update(playlistId, {
      trackIds: updated,
      trackCount: updated.length,
      updatedAt: Date.now()
    });

    await get().loadLibrary();
  },

  deletePlaylist: async (playlistId) => {
    await db.playlists.delete(playlistId);
    await get().loadLibrary();
  },

  cacheTrackForOffline: async (track) => {
    try {
      // If already has audio blob, mark as offline
      const existing = await db.tracks.get(track.id);
      if (existing?.audioBlob) {
        await db.tracks.update(track.id, { isOfflineCached: true });
        await get().loadLibrary();
        return true;
      }

      // Fetch stream chunks and convert to blob
      let streamUrl = track.streamUrl;
      if (!streamUrl) {
        const res = await fetch('/api/v1/stream/resolve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trackId: track.id, title: track.title, artist: track.artist, qualityTier: 'standard' })
        });
        if (res.ok) {
          const data = await res.json();
          streamUrl = data.streamUrl;
        }
      }

      if (!streamUrl) return false;

      const audioRes = await fetch(streamUrl);
      const audioBlob = await audioRes.blob();

      if (existing) {
        await db.tracks.update(track.id, { audioBlob, isOfflineCached: true });
      } else {
        await db.tracks.add({ ...track, audioBlob, isOfflineCached: true, addedAt: Date.now() });
      }

      await get().loadLibrary();
      return true;
    } catch (err) {
      console.error('Failed to cache track for offline:', err);
      return false;
    }
  }
}));
