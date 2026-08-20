import { create } from 'zustand';
import { UserProfile } from '../types';
import { db } from '../lib/db';

interface AuthState {
  user: UserProfile;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  initGuestSession: () => Promise<void>;
  login: (email: string, pass: string) => Promise<boolean>;
  register: (email: string, pass: string, name: string) => Promise<boolean>;
  logout: () => void;
}

const DEFAULT_GUEST_USER: UserProfile = {
  id: 'guest_' + Math.random().toString(36).substring(2, 9),
  displayName: 'Guest Explorer',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&q=80',
  isGuest: true
};

export const useAuthStore = create<AuthState>((set) => ({
  user: DEFAULT_GUEST_USER,
  token: null,
  isAuthenticated: false,
  isLoading: false,

  initGuestSession: async () => {
    const savedToken = localStorage.getItem('riff_token');
    const savedUser = localStorage.getItem('riff_user');

    if (savedToken && savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        set({ user: parsed, token: savedToken, isAuthenticated: !parsed.isGuest });
        return;
      } catch {}
    }

    // Default to auto guest session
    localStorage.setItem('riff_user', JSON.stringify(DEFAULT_GUEST_USER));
    set({ user: DEFAULT_GUEST_USER, isAuthenticated: false });
  },

  login: async (email, pass) => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('riff_token', data.token);
        localStorage.setItem('riff_user', JSON.stringify(data.user));
        set({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false });
        return true;
      }
    } catch (e) {
      console.warn('Backend login fallback for offline/demo:', e);
    }

    // Fallback demo login for direct testing
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
    set({ isLoading: true });
    try {
      // Gather local playlists & liked songs for 1-click migration
      const localPlaylists = await db.playlists.toArray();
      const liked = await db.tracks.filter((t) => t.isLiked === true).toArray();

      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password: pass,
          displayName: name,
          migration: { localPlaylists, likedIds: liked.map((l) => l.id) }
        })
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('riff_token', data.token);
        localStorage.setItem('riff_user', JSON.stringify(data.user));
        set({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false });
        return true;
      }
    } catch (e) {
      console.warn('Backend register fallback for offline/demo:', e);
    }

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

  logout: () => {
    localStorage.removeItem('riff_token');
    localStorage.setItem('riff_user', JSON.stringify(DEFAULT_GUEST_USER));
    set({ user: DEFAULT_GUEST_USER, token: null, isAuthenticated: false });
  }
}));
