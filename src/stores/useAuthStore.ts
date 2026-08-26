import { create } from 'zustand';
import { UserProfile } from '../types';
import { db } from '../lib/db';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthState {
  user: UserProfile;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;

  // Actions
  initGuestSession: () => Promise<void>;
  login: (email: string, pass: string) => Promise<boolean>;
  register: (email: string, pass: string, name: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  migrateGuestDataToCloud: (userId: string) => Promise<void>;
}

const DEFAULT_GUEST_USER: UserProfile = {
  id: 'guest_' + Math.random().toString(36).substring(2, 9),
  displayName: 'Guest Explorer',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&q=80',
  isGuest: true
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: DEFAULT_GUEST_USER,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  authError: null,

  clearError: () => set({ authError: null }),

  initGuestSession: async () => {
    // 1. If Supabase is configured, check active cloud session
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const cloudUser: UserProfile = {
            id: session.user.id,
            email: session.user.email || '',
            displayName: session.user.user_metadata?.full_name || session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || 'Riff Voyager',
            avatarUrl: session.user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&q=80',
            isGuest: false
          };
          set({ user: cloudUser, token: session.access_token, isAuthenticated: true });
          return;
        }

        // Listen for live OAuth redirects / token refreshes
        supabase.auth.onAuthStateChange(async (_event, session) => {
          if (session?.user) {
            const cloudUser: UserProfile = {
              id: session.user.id,
              email: session.user.email || '',
              displayName: session.user.user_metadata?.full_name || session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || 'Riff Voyager',
              avatarUrl: session.user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&q=80',
              isGuest: false
            };
            set({ user: cloudUser, token: session.access_token, isAuthenticated: true });
            get().migrateGuestDataToCloud(session.user.id);
          }
        });
      } catch (err) {
        console.warn('Supabase session lookup error:', err);
      }
    }

    // 2. Check local persistence fallback
    const savedToken = localStorage.getItem('riff_token');
    const savedUser = localStorage.getItem('riff_user');

    if (savedToken && savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        set({ user: parsed, token: savedToken, isAuthenticated: !parsed.isGuest });
        return;
      } catch {}
    }

    // 3. Default to Guest Session
    localStorage.setItem('riff_user', JSON.stringify(DEFAULT_GUEST_USER));
    set({ user: DEFAULT_GUEST_USER, isAuthenticated: false });
  },

  login: async (email, pass) => {
    set({ isLoading: true, authError: null });

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: pass
        });

        if (error) {
          set({ authError: error.message, isLoading: false });
          return false;
        }

        if (data.session && data.user) {
          const cloudUser: UserProfile = {
            id: data.user.id,
            email: data.user.email || '',
            displayName: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Riff Voyager',
            avatarUrl: data.user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&q=80',
            isGuest: false
          };
          localStorage.setItem('riff_token', data.session.access_token);
          localStorage.setItem('riff_user', JSON.stringify(cloudUser));
          set({ user: cloudUser, token: data.session.access_token, isAuthenticated: true, isLoading: false });
          get().migrateGuestDataToCloud(data.user.id);
          return true;
        }
      } catch (err: any) {
        set({ authError: err?.message || 'Login failed', isLoading: false });
        return false;
      }
    }

    // Fallback Mock/Demo Login for offline development
    const demoUser: UserProfile = {
      id: 'usr_' + Date.now().toString(36),
      email,
      displayName: email.split('@')[0],
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&q=80',
      isGuest: false
    };

    localStorage.setItem('riff_token', 'demo_jwt_token');
    localStorage.setItem('riff_user', JSON.stringify(demoUser));
    set({ user: demoUser, token: 'demo_jwt_token', isAuthenticated: true, isLoading: false });
    return true;
  },

  register: async (email, pass, name) => {
    set({ isLoading: true, authError: null });

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: pass,
          options: {
            data: {
              full_name: name,
              display_name: name,
              avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&q=80'
            }
          }
        });

        if (error) {
          set({ authError: error.message, isLoading: false });
          return false;
        }

        if (data.user) {
          const cloudUser: UserProfile = {
            id: data.user.id,
            email: data.user.email || '',
            displayName: name || data.user.email?.split('@')[0] || 'Riff Creator',
            avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&q=80',
            isGuest: false
          };

          const token = data.session?.access_token || 'pending_email_verification';
          localStorage.setItem('riff_token', token);
          localStorage.setItem('riff_user', JSON.stringify(cloudUser));
          set({ user: cloudUser, token, isAuthenticated: true, isLoading: false });
          get().migrateGuestDataToCloud(data.user.id);
          return true;
        }
      } catch (err: any) {
        set({ authError: err?.message || 'Registration failed', isLoading: false });
        return false;
      }
    }

    // Fallback Mock/Demo Register
    const newUser: UserProfile = {
      id: 'usr_' + Date.now().toString(36),
      email,
      displayName: name || email.split('@')[0],
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&q=80',
      isGuest: false
    };

    localStorage.setItem('riff_token', 'demo_jwt_token');
    localStorage.setItem('riff_user', JSON.stringify(newUser));
    set({ user: newUser, token: 'demo_jwt_token', isAuthenticated: true, isLoading: false });
    return true;
  },

  loginWithGoogle: async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        set({ isLoading: true, authError: null });
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin
          }
        });
        if (error) set({ authError: error.message, isLoading: false });
      } catch (err: any) {
        set({ authError: err?.message || 'Google login failed', isLoading: false });
      }
    } else {
      alert('Google OAuth requires Supabase keys configured in .env (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)');
    }
  },

  logout: async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase signout error:', err);
      }
    }
    localStorage.removeItem('riff_token');
    localStorage.setItem('riff_user', JSON.stringify(DEFAULT_GUEST_USER));
    set({ user: DEFAULT_GUEST_USER, token: null, isAuthenticated: false });
  },

  migrateGuestDataToCloud: async (userId: string) => {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      // 1. Migrate Liked Songs
      const localLikes = await db.tracks.filter((t) => t.isLiked === true).toArray();
      if (localLikes.length > 0) {
        const likeRows = localLikes.map((t) => ({
          user_id: userId,
          track_id: t.id,
          track_data: t
        }));
        await supabase.from('user_likes').upsert(likeRows, { onConflict: 'user_id,track_id' });
      }

      // 2. Migrate Playlists
      const localPlaylists = await db.playlists.toArray();
      for (const pl of localPlaylists) {
        const { data: newPl } = await supabase
          .from('playlists')
          .insert({
            user_id: userId,
            title: pl.title,
            description: pl.description || '',
            cover_url: pl.coverUrl || '',
            is_public: false
          })
          .select()
          .single();

        if (newPl && pl.tracks && pl.tracks.length > 0) {
          const trackRows = pl.tracks.map((t, idx) => ({
            playlist_id: newPl.id,
            track_id: t.id,
            title: t.title,
            artist: t.artist,
            album: t.album || '',
            duration: t.duration || 0,
            cover_url: t.coverUrl || '',
            stream_url: t.streamUrl || '',
            position: idx
          }));
          await supabase.from('playlist_tracks').insert(trackRows);
        }
      }
    } catch (e) {
      console.warn('Local guest data migration non-fatal warning:', e);
    }
  }
}));
