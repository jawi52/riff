import { create } from 'zustand';
import { UserProfile } from '../types';
import { supabase, isSupabaseConfigured, signInWithGoogle } from '../lib/supabase';

export type AuthViewMode = 'landing' | 'login' | 'register' | 'app';

export interface StoredAccount {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  avatarUrl: string;
  provider: 'email' | 'google';
  createdAt: number;
  lastLoginAt: number;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  authView: AuthViewMode;
  lastActiveAt: number | null;

  // Actions
  setAuthView: (view: AuthViewMode) => void;
  checkSession: () => boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  register: (email: string, pass: string, name: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  getAccountsList: () => StoredAccount[];
  initSupabaseAuthListener: () => void;
}

export const INACTIVITY_LIMIT_30_DAYS_MS = 30 * 24 * 60 * 60 * 1000; // 30 days in ms

export function getStoredAccounts(): StoredAccount[] {
  try {
    const raw = localStorage.getItem('riff_accounts_db');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredAccounts(accounts: StoredAccount[]) {
  localStorage.setItem('riff_accounts_db', JSON.stringify(accounts));
}

function hashPassword(pass: string): string {
  let hash = 0;
  for (let i = 0; i < pass.length; i++) {
    const char = pass.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'h_' + Math.abs(hash).toString(36) + '_' + pass.length;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  authError: null,
  authView: 'landing',
  lastActiveAt: null,

  setAuthView: (view: AuthViewMode) => set({ authView: view, authError: null }),

  clearError: () => set({ authError: null }),

  getAccountsList: () => getStoredAccounts(),

  /**
   * Evaluates active session against the strict 30-day inactivity rule.
   * If user hasn't visited in >30 days, invalidates session and logs out.
   * If within 30 days, renews the lastActiveAt timestamp to now.
   */
  checkSession: () => {
    const savedToken = localStorage.getItem('riff_token');
    const savedUser = localStorage.getItem('riff_user');
    const savedLastActive = localStorage.getItem('riff_last_active_at');

    if (savedToken && savedUser && savedLastActive) {
      const lastActive = parseInt(savedLastActive, 10);
      const now = Date.now();
      const elapsed = now - lastActive;

      // 30 Days Inactivity Check
      if (elapsed <= INACTIVITY_LIMIT_30_DAYS_MS) {
        try {
          const parsed: UserProfile = JSON.parse(savedUser);
          if (parsed && !parsed.isGuest) {
            // Renew last active timestamp for another 30 days of inactivity protection
            localStorage.setItem('riff_last_active_at', String(now));

            set({
              user: parsed,
              token: savedToken,
              isAuthenticated: true,
              lastActiveAt: now,
              isLoading: false,
            });
            return true;
          }
        } catch {
          // JSON parse failed
        }
      } else {
        // Exceeded 30 days of inactivity -> Force logout
        console.warn('Riff session expired: Inactive for more than 30 days.');
        localStorage.removeItem('riff_token');
        localStorage.removeItem('riff_user');
        localStorage.removeItem('riff_last_active_at');
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          lastActiveAt: null,
          authError: 'Your session expired after 30 days of inactivity. Please sign in to continue.',
        });
        return false;
      }
    }

    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    return false;
  },

  /**
   * Log in with Email & Password
   */
  login: async (email: string, pass: string) => {
    set({ isLoading: true, authError: null });
    await new Promise((r) => setTimeout(r, 400));

    const cleanEmail = email.trim().toLowerCase();
    const accounts = getStoredAccounts();
    const passHash = hashPassword(pass);

    const accountIndex = accounts.findIndex((a) => a.email.toLowerCase() === cleanEmail);

    if (accountIndex !== -1) {
      const account = accounts[accountIndex];
      if (account.passwordHash !== passHash) {
        set({ isLoading: false, authError: 'Incorrect password. Please try again.' });
        return false;
      }

      // Update lastLoginAt
      account.lastLoginAt = Date.now();
      accounts[accountIndex] = account;
      saveStoredAccounts(accounts);

      const user: UserProfile = {
        id: account.id,
        email: account.email,
        displayName: account.displayName,
        avatarUrl: account.avatarUrl,
        isGuest: false,
      };

      const token = 'riff_jwt_' + Math.random().toString(36).substring(2, 12);
      const now = Date.now();

      localStorage.setItem('riff_token', token);
      localStorage.setItem('riff_user', JSON.stringify(user));
      localStorage.setItem('riff_last_active_at', String(now));

      set({
        user,
        token,
        isAuthenticated: true,
        lastActiveAt: now,
        isLoading: false,
      });
      return true;
    }

    set({ 
      isLoading: false, 
      authError: 'No account found with this email. Please check your spelling or sign up.' 
    });
    return false;
  },

  /**
   * Sign up with Name, Email & Password
   */
  register: async (email: string, pass: string, name: string) => {
    set({ isLoading: true, authError: null });
    await new Promise((r) => setTimeout(r, 450));

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      set({ isLoading: false, authError: 'Please enter a valid email address.' });
      return false;
    }

    if (pass.length < 6) {
      set({ isLoading: false, authError: 'Password must be at least 6 characters long.' });
      return false;
    }

    const accounts = getStoredAccounts();
    const existing = accounts.find((a) => a.email.toLowerCase() === cleanEmail);

    if (existing) {
      set({ isLoading: false, authError: 'An account with this email already exists. Please log in.' });
      return false;
    }

    const newAcc: StoredAccount = {
      id: 'usr_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
      email: cleanEmail,
      passwordHash: hashPassword(pass),
      displayName: cleanName || cleanEmail.split('@')[0],
      avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(cleanEmail)}`,
      provider: 'email',
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
    };

    accounts.push(newAcc);
    saveStoredAccounts(accounts);

    const user: UserProfile = {
      id: newAcc.id,
      email: newAcc.email,
      displayName: newAcc.displayName,
      avatarUrl: newAcc.avatarUrl,
      isGuest: false,
    };

    const token = 'riff_jwt_' + Math.random().toString(36).substring(2, 12);
    const now = Date.now();

    localStorage.setItem('riff_token', token);
    localStorage.setItem('riff_user', JSON.stringify(user));
    localStorage.setItem('riff_last_active_at', String(now));

    set({
      user,
      token,
      isAuthenticated: true,
      lastActiveAt: now,
      isLoading: false,
    });
    return true;
  },

  /**
   * Continue with Google
   * Uses real Supabase OAuth if keys configured, or seamless instant Google login simulation
   */
  loginWithGoogle: async () => {
    set({ isLoading: true, authError: null });

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await signInWithGoogle();
        if (error) throw error;
        return true;
      } catch (err: any) {
        console.error('Supabase Google OAuth error:', err);
        set({ isLoading: false, authError: err?.message || 'Google sign-in failed' });
        return false;
      }
    }

    // Graceful Instant Mock Google Authentication for development/testing
    await new Promise((r) => setTimeout(r, 600));

    const googleEmail = 'user.google@gmail.com';
    const accounts = getStoredAccounts();
    let account = accounts.find((a) => a.email === googleEmail);

    if (!account) {
      account = {
        id: 'usr_g_' + Date.now().toString(36),
        email: googleEmail,
        passwordHash: 'oauth_google_secured',
        displayName: 'Google Listener',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        provider: 'google',
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
      };
      accounts.push(account);
      saveStoredAccounts(accounts);
    } else {
      account.lastLoginAt = Date.now();
      saveStoredAccounts(accounts);
    }

    const user: UserProfile = {
      id: account.id,
      email: account.email,
      displayName: account.displayName,
      avatarUrl: account.avatarUrl,
      isGuest: false,
    };

    const token = 'riff_google_oauth_' + Math.random().toString(36).substring(2, 12);
    const now = Date.now();

    localStorage.setItem('riff_token', token);
    localStorage.setItem('riff_user', JSON.stringify(user));
    localStorage.setItem('riff_last_active_at', String(now));

    set({
      user,
      token,
      isAuthenticated: true,
      lastActiveAt: now,
      isLoading: false,
    });
    return true;
  },

  /**
   * Initializes Supabase session listener if Supabase is connected
   */
  initSupabaseAuthListener: () => {
    if (!isSupabaseConfigured || !supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const u = session.user;
        const profile: UserProfile = {
          id: u.id,
          email: u.email,
          displayName: u.user_metadata?.full_name || u.email?.split('@')[0] || 'Riff User',
          avatarUrl: u.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(u.email || u.id)}`,
          isGuest: false,
        };

        const now = Date.now();
        localStorage.setItem('riff_token', session.access_token);
        localStorage.setItem('riff_user', JSON.stringify(profile));
        localStorage.setItem('riff_last_active_at', String(now));

        set({
          user: profile,
          token: session.access_token,
          isAuthenticated: true,
          lastActiveAt: now,
        });
      }
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const u = session.user;
        const profile: UserProfile = {
          id: u.id,
          email: u.email,
          displayName: u.user_metadata?.full_name || u.email?.split('@')[0] || 'Riff User',
          avatarUrl: u.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(u.email || u.id)}`,
          isGuest: false,
        };

        const now = Date.now();
        localStorage.setItem('riff_token', session.access_token);
        localStorage.setItem('riff_user', JSON.stringify(profile));
        localStorage.setItem('riff_last_active_at', String(now));

        set({
          user: profile,
          token: session.access_token,
          isAuthenticated: true,
          lastActiveAt: now,
        });
      }
    });
  },

  /**
   * Log out and wipe stored credentials
   */
  logout: () => {
    localStorage.removeItem('riff_token');
    localStorage.removeItem('riff_user');
    localStorage.removeItem('riff_last_active_at');

    if (isSupabaseConfigured && supabase) {
      supabase.auth.signOut().catch(console.error);
    }

    set({
      user: null,
      token: null,
      isAuthenticated: false,
      lastActiveAt: null,
      authView: 'landing',
    });
  },
}));
