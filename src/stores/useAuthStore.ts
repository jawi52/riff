import { create } from 'zustand';
import { UserProfile } from '../types';
import { supabase, isSupabaseConfigured, signInWithGoogle } from '../lib/supabase';

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  authSuccessMessage: string | null;
  lastActiveAt: number | null;
  isConfigured: boolean;

  // Actions
  checkSession: () => Promise<boolean>;
  login: (email: string, pass: string) => Promise<boolean>;
  register: (email: string, pass: string, name: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  loginAsGuest: () => boolean;
  updateProfile: (updates: { displayName?: string; avatarUrl?: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
  initSupabaseAuthListener: () => void;
}

export const INACTIVITY_LIMIT_30_DAYS_MS = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

function formatUserProfile(u: any): UserProfile {
  let customOverrides: { displayName?: string; avatarUrl?: string } = {};
  try {
    const raw = localStorage.getItem('riff_user_profile_custom');
    if (raw) customOverrides = JSON.parse(raw);
  } catch {}

  return {
    id: u.id,
    email: u.email,
    displayName: customOverrides.displayName || u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || 'Listener',
    avatarUrl: customOverrides.avatarUrl || u.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(u.email || u.id)}`,
    isGuest: false,
  };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  authError: null,
  authSuccessMessage: null,
  lastActiveAt: null,
  isConfigured: isSupabaseConfigured,

  clearError: () => set({ authError: null, authSuccessMessage: null }),

  /**
   * Checks real Supabase session and enforces the 30-day inactivity rule.
   * If inactive for >30 days, signs out from Supabase and requires re-login.
   */
  checkSession: async () => {
    const savedLastActive = localStorage.getItem('riff_last_active_at');
    const now = Date.now();
    const isLocalActive = savedLastActive && (now - parseInt(savedLastActive, 10)) < INACTIVITY_LIMIT_30_DAYS_MS;

    if (!isSupabaseConfigured || !supabase) {
      if (isLocalActive) {
        let customOverrides: any = {};
        try {
          const raw = localStorage.getItem('riff_user_profile_custom');
          if (raw) customOverrides = JSON.parse(raw);
        } catch {}

        const localUser: UserProfile = {
          id: 'local_listener',
          email: 'listener@riff.app',
          displayName: customOverrides.displayName || 'Music Lover',
          avatarUrl: customOverrides.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces',
          isGuest: false,
        };
        set({ 
          isConfigured: false, 
          isAuthenticated: true, 
          user: localUser, 
          token: 'local_token',
          lastActiveAt: now,
          isLoading: false 
        });
        return true;
      }

      set({ 
        isConfigured: false, 
        isAuthenticated: false, 
        user: null, 
        isLoading: false 
      });
      return false;
    }

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session?.user) {
        set({ isAuthenticated: false, user: null, token: null, isLoading: false });
        return false;
      }

      // Check 30-day inactivity against local activity marker
      const savedLastActive = localStorage.getItem('riff_last_active_at');
      const now = Date.now();

      if (savedLastActive) {
        const elapsed = now - parseInt(savedLastActive, 10);
        if (elapsed > INACTIVITY_LIMIT_30_DAYS_MS) {
          // Inactive for more than 30 days -> Force real sign out
          console.warn('Riff session expired: 30 days of inactivity reached.');
          await supabase.auth.signOut();
          localStorage.removeItem('riff_last_active_at');

          set({
            user: null,
            token: null,
            isAuthenticated: false,
            lastActiveAt: null,
            authError: 'Your session expired after 30 days of inactivity. Please log in again.',
            isLoading: false,
          });
          return false;
        }
      }

      // Renew 30-day active window
      localStorage.setItem('riff_last_active_at', String(now));
      const profile = formatUserProfile(session.user);

      set({
        user: profile,
        token: session.access_token,
        isAuthenticated: true,
        lastActiveAt: now,
        isLoading: false,
        authError: null,
      });
      return true;
    } catch (err: any) {
      console.error('Session check error:', err);
      set({ isAuthenticated: false, user: null, isLoading: false });
      return false;
    }
  },

  /**
   * Real Supabase Email & Password Login
   */
  login: async (email: string, pass: string) => {
    if (!isSupabaseConfigured || !supabase) {
      set({ 
        authError: 'Supabase is not configured yet. Please add your Supabase URL and anon key to start using real authentication.',
        isLoading: false 
      });
      return false;
    }

    set({ isLoading: true, authError: null, authSuccessMessage: null });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pass,
      });

      if (error) {
        set({ authError: error.message, isLoading: false });
        return false;
      }

      if (data.session?.user) {
        const now = Date.now();
        localStorage.setItem('riff_last_active_at', String(now));
        const profile = formatUserProfile(data.session.user);

        set({
          user: profile,
          token: data.session.access_token,
          isAuthenticated: true,
          lastActiveAt: now,
          isLoading: false,
          authError: null,
        });
        return true;
      }

      set({ isLoading: false });
      return false;
    } catch (err: any) {
      set({ authError: err?.message || 'Login failed. Please try again.', isLoading: false });
      return false;
    }
  },

  /**
   * Real Supabase Email & Password Sign Up
   */
  register: async (email: string, pass: string, name: string) => {
    if (!isSupabaseConfigured || !supabase) {
      set({ 
        authError: 'Supabase is not configured yet. Please add your Supabase URL and anon key to start using real authentication.',
        isLoading: false 
      });
      return false;
    }

    set({ isLoading: true, authError: null, authSuccessMessage: null });

    try {
      const cleanEmail = email.trim();
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: pass,
        options: {
          data: {
            full_name: name.trim() || cleanEmail.split('@')[0],
          },
        },
      });

      if (error) {
        set({ authError: error.message, isLoading: false });
        return false;
      }

      // If Supabase has email confirmation enabled, session will be null initially
      if (data.user && !data.session) {
        set({
          isLoading: false,
          authSuccessMessage: 'Account created! Please check your email inbox to verify your address, then log in.',
        });
        return true;
      }

      // If auto-confirm is enabled, session is active immediately
      if (data.session?.user) {
        const now = Date.now();
        localStorage.setItem('riff_last_active_at', String(now));
        const profile = formatUserProfile(data.session.user);

        set({
          user: profile,
          token: data.session.access_token,
          isAuthenticated: true,
          lastActiveAt: now,
          isLoading: false,
          authError: null,
        });
        return true;
      }

      set({ isLoading: false });
      return true;
    } catch (err: any) {
      set({ authError: err?.message || 'Registration failed. Please try again.', isLoading: false });
      return false;
    }
  },

  /**
   * Real Supabase Google OAuth
   */
  loginWithGoogle: async () => {
    if (!isSupabaseConfigured || !supabase) {
      set({ 
        authError: 'Supabase is not configured yet. Please configure your Supabase URL and enable Google provider to use Google Sign-In.',
        isLoading: false 
      });
      return false;
    }

    set({ isLoading: true, authError: null, authSuccessMessage: null });

    try {
      const { error } = await signInWithGoogle();
      if (error) {
        set({ authError: error.message, isLoading: false });
        return false;
      }
      return true;
    } catch (err: any) {
      set({ authError: err?.message || 'Google sign-in failed. Please check your provider settings.', isLoading: false });
      return false;
    }
  },

  /**
   * Real Supabase Auth State Change Listener
   */
  initSupabaseAuthListener: () => {
    if (!isSupabaseConfigured || !supabase) return;

    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const now = Date.now();
        localStorage.setItem('riff_last_active_at', String(now));
        const profile = formatUserProfile(session.user);

        set({
          user: profile,
          token: session.access_token,
          isAuthenticated: true,
          lastActiveAt: now,
          isLoading: false,
          authError: null,
        });
      } else {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    });
  },

  /**
   * Real Supabase Sign Out
   */
  logout: async () => {
    localStorage.removeItem('riff_last_active_at');
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut().catch(console.error);
    }
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      lastActiveAt: null,
    });
  },

  /**
   * One-click guest access: allows full listening without setup
   */
  loginAsGuest: () => {
    const now = Date.now();
    localStorage.setItem('riff_last_active_at', String(now));
    let customOverrides: any = {};
    try {
      const raw = localStorage.getItem('riff_user_profile_custom');
      if (raw) customOverrides = JSON.parse(raw);
    } catch {}

    const guestUser: UserProfile = {
      id: 'guest_' + Math.random().toString(36).substring(2, 9),
      email: 'guest@riff.app',
      displayName: customOverrides.displayName || 'Music Lover',
      avatarUrl: customOverrides.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces',
      isGuest: true,
    };

    set({
      user: guestUser,
      token: 'guest_token',
      isAuthenticated: true,
      lastActiveAt: now,
      isLoading: false,
      authError: null,
    });
    return true;
  },

  /**
   * Update Profile: Display Name & Avatar
   * Instantly synchronizes locally and upstream to Supabase user metadata
   */
  updateProfile: async (updates: { displayName?: string; avatarUrl?: string }) => {
    try {
      const current = get().user;
      const cleanName = updates.displayName?.trim();
      const cleanAvatar = updates.avatarUrl?.trim();

      const updatedUser: UserProfile = current
        ? {
            ...current,
            displayName: cleanName || current.displayName,
            avatarUrl: cleanAvatar || current.avatarUrl,
          }
        : {
            id: 'user_' + Date.now(),
            email: 'listener@riff.app',
            displayName: cleanName || 'Listener',
            avatarUrl:
              cleanAvatar ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces',
            isGuest: false,
          };

      // 1. Save custom profile overrides in localStorage
      localStorage.setItem(
        'riff_user_profile_custom',
        JSON.stringify({
          displayName: updatedUser.displayName,
          avatarUrl: updatedUser.avatarUrl,
        })
      );

      // 2. If Supabase is configured and session is active, persist to remote metadata
      if (isSupabaseConfigured && supabase && !updatedUser.isGuest) {
        await supabase.auth
          .updateUser({
            data: {
              full_name: updatedUser.displayName,
              avatar_url: updatedUser.avatarUrl,
            },
          })
          .catch((err) => console.warn('Supabase remote profile update skipped:', err));
      }

      set({ user: updatedUser });
      return true;
    } catch (err) {
      console.error('Failed to update profile:', err);
      return false;
    }
  },
}));
