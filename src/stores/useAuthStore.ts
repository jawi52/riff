import { create } from 'zustand';
import { UserProfile } from '../types';

export type AuthViewMode = 'landing' | 'login' | 'register' | 'app';

interface StoredAccount {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  avatarUrl: string;
  createdAt: number;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  authView: AuthViewMode;
  sessionExpiresAt: number | null;

  // Actions
  setAuthView: (view: AuthViewMode) => void;
  checkSession: () => boolean;
  login: (email: string, pass: string, remember30Days?: boolean) => Promise<boolean>;
  register: (email: string, pass: string, name: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

const SESSION_30_DAYS_MS = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

function getStoredAccounts(): StoredAccount[] {
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

// Simple deterministic hash for local credential checking
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
  sessionExpiresAt: null,

  setAuthView: (view: AuthViewMode) => set({ authView: view, authError: null }),

  clearError: () => set({ authError: null }),

  checkSession: () => {
    const savedToken = localStorage.getItem('riff_token');
    const savedUser = localStorage.getItem('riff_user');
    const savedExpiry = localStorage.getItem('riff_session_expires_at');

    if (savedToken && savedUser && savedExpiry) {
      const expiresAt = parseInt(savedExpiry, 10);
      const now = Date.now();

      if (now < expiresAt) {
        try {
          const parsed = JSON.parse(savedUser);
          if (parsed && !parsed.isGuest) {
            // Auto-renew session for another 30 days on active usage
            const newExpiry = now + SESSION_30_DAYS_MS;
            localStorage.setItem('riff_session_expires_at', String(newExpiry));

            set({
              user: parsed,
              token: savedToken,
              isAuthenticated: true,
              authView: 'app',
              sessionExpiresAt: newExpiry,
              isLoading: false,
            });
            return true;
          }
        } catch {}
      } else {
        // Session expired (inactive for >30 days)
        localStorage.removeItem('riff_token');
        localStorage.removeItem('riff_user');
        localStorage.removeItem('riff_session_expires_at');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          authView: 'login',
          sessionExpiresAt: null,
          authError: 'Your 30-day session has expired. Please log in to continue.',
        });
        return false;
      }
    }

    set({ user: null, token: null, isAuthenticated: false, authView: 'landing', isLoading: false });
    return false;
  },

  login: async (email: string, pass: string, remember30Days = true) => {
    set({ isLoading: true, authError: null });
    await new Promise((r) => setTimeout(r, 450));

    const cleanEmail = email.trim().toLowerCase();
    const accounts = getStoredAccounts();
    const passHash = hashPassword(pass);

    const account = accounts.find((a) => a.email.toLowerCase() === cleanEmail);

    // If account exists in local registry, verify password
    if (account) {
      if (account.passwordHash !== passHash) {
        set({ isLoading: false, authError: 'Incorrect password. Please try again.' });
        return false;
      }

      const user: UserProfile = {
        id: account.id,
        email: account.email,
        displayName: account.displayName,
        avatarUrl: account.avatarUrl,
        isGuest: false,
      };

      const token = 'riff_jwt_' + Math.random().toString(36).substring(2, 12);
      const expiresAt = Date.now() + (remember30Days ? SESSION_30_DAYS_MS : 24 * 60 * 60 * 1000);

      localStorage.setItem('riff_token', token);
      localStorage.setItem('riff_user', JSON.stringify(user));
      localStorage.setItem('riff_session_expires_at', String(expiresAt));

      set({
        user,
        token,
        isAuthenticated: true,
        authView: 'app',
        sessionExpiresAt: expiresAt,
        isLoading: false,
      });
      return true;
    }

    // If no accounts exist yet in this browser, permit first user login as admin/registered
    if (accounts.length === 0) {
      const displayName = cleanEmail.split('@')[0];
      const newAcc: StoredAccount = {
        id: 'usr_' + Date.now().toString(36),
        email: cleanEmail,
        passwordHash: passHash,
        displayName: displayName.charAt(0).toUpperCase() + displayName.slice(1),
        avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(cleanEmail)}`,
        createdAt: Date.now(),
      };
      saveStoredAccounts([newAcc]);

      const user: UserProfile = {
        id: newAcc.id,
        email: newAcc.email,
        displayName: newAcc.displayName,
        avatarUrl: newAcc.avatarUrl,
        isGuest: false,
      };

      const token = 'riff_jwt_' + Math.random().toString(36).substring(2, 12);
      const expiresAt = Date.now() + SESSION_30_DAYS_MS;

      localStorage.setItem('riff_token', token);
      localStorage.setItem('riff_user', JSON.stringify(user));
      localStorage.setItem('riff_session_expires_at', String(expiresAt));

      set({
        user,
        token,
        isAuthenticated: true,
        authView: 'app',
        sessionExpiresAt: expiresAt,
        isLoading: false,
      });
      return true;
    }

    set({ isLoading: false, authError: 'No account found with this email. Please register first.' });
    return false;
  },

  register: async (email: string, pass: string, name: string) => {
    set({ isLoading: true, authError: null });
    await new Promise((r) => setTimeout(r, 500));

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
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
      id: 'usr_' + Date.now().toString(36),
      email: cleanEmail,
      passwordHash: hashPassword(pass),
      displayName: cleanName || cleanEmail.split('@')[0],
      avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(cleanEmail)}`,
      createdAt: Date.now(),
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
    const expiresAt = Date.now() + SESSION_30_DAYS_MS; // 30-day session

    localStorage.setItem('riff_token', token);
    localStorage.setItem('riff_user', JSON.stringify(user));
    localStorage.setItem('riff_session_expires_at', String(expiresAt));

    set({
      user,
      token,
      isAuthenticated: true,
      authView: 'app',
      sessionExpiresAt: expiresAt,
      isLoading: false,
    });
    return true;
  },

  logout: () => {
    localStorage.removeItem('riff_token');
    localStorage.removeItem('riff_user');
    localStorage.removeItem('riff_session_expires_at');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      authView: 'landing',
      sessionExpiresAt: null,
    });
  },
}));
