import { create } from 'zustand';
import { UserProfile } from '../types';

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
  logout: () => void;
  clearError: () => void;
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
  authError: null,

  clearError: () => set({ authError: null }),

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

    localStorage.setItem('riff_user', JSON.stringify(DEFAULT_GUEST_USER));
    set({ user: DEFAULT_GUEST_USER, isAuthenticated: false });
  },

  login: async (email: string, _pass: string) => {
    set({ isLoading: true, authError: null });

    // Frontend authentication simulation
    await new Promise((r) => setTimeout(r, 400));

    const user: UserProfile = {
      id: 'usr_' + Date.now().toString(36),
      email,
      displayName: email.split('@')[0],
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&q=80',
      isGuest: false
    };

    const token = 'riff_jwt_' + Math.random().toString(36).substring(2, 12);
    localStorage.setItem('riff_token', token);
    localStorage.setItem('riff_user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true, isLoading: false });
    return true;
  },

  register: async (email: string, _pass: string, name: string) => {
    set({ isLoading: true, authError: null });

    // Frontend registration simulation
    await new Promise((r) => setTimeout(r, 400));

    const user: UserProfile = {
      id: 'usr_' + Date.now().toString(36),
      email,
      displayName: name || email.split('@')[0],
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&q=80',
      isGuest: false
    };

    const token = 'riff_jwt_' + Math.random().toString(36).substring(2, 12);
    localStorage.setItem('riff_token', token);
    localStorage.setItem('riff_user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true, isLoading: false });
    return true;
  },

  loginWithGoogle: async () => {
    set({ isLoading: true, authError: null });
    await new Promise((r) => setTimeout(r, 500));

    const googleUser: UserProfile = {
      id: 'usr_g_' + Date.now().toString(36),
      email: 'user@gmail.com',
      displayName: 'Google Explorer',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&q=80',
      isGuest: false
    };

    const token = 'riff_google_token_' + Math.random().toString(36).substring(2, 12);
    localStorage.setItem('riff_token', token);
    localStorage.setItem('riff_user', JSON.stringify(googleUser));
    set({ user: googleUser, token, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    localStorage.removeItem('riff_token');
    localStorage.setItem('riff_user', JSON.stringify(DEFAULT_GUEST_USER));
    set({ user: DEFAULT_GUEST_USER, token: null, isAuthenticated: false });
  }
}));
