import React, { useState } from 'react';
import { RiffLogo } from '../common/RiffLogo';
import { useAuthStore } from '../../stores/useAuthStore';
import { isSupabaseConfigured } from '../../lib/supabase';
import { 
  LogOut, 
  Users, 
  ShieldCheck, 
  Clock, 
  Sparkles, 
  Play, 
  Pause, 
  CheckCircle2, 
  ExternalLink,
  Info,
  Calendar,
  Layers
} from 'lucide-react';

interface DashboardPageProps {
  onLogout: () => void;
  isStandaloneApp?: boolean;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onLogout,
  isStandaloneApp = false,
}) => {
  const { user, lastActiveAt, getAccountsList, logout } = useAuthStore();
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  const accounts = getAccountsList();

  const handleLogoutClick = () => {
    logout();
    onLogout();
  };

  // Format date helper
  const formatDate = (ms?: number | null) => {
    if (!ms) return 'Just now';
    return new Date(ms).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Calculate 30-day expiry
  const thirtyDaysRemaining = lastActiveAt 
    ? Math.max(0, Math.ceil((lastActiveAt + 30 * 86400000 - Date.now()) / (86400000)))
    : 30;

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col selection:bg-[#1ed760] selection:text-black">
      {/* 1. Spotify-themed Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#121212]/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <RiffLogo size="md" />
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#181818] border border-white/10 text-[11px] text-[#1ed760] font-bold">
              <Sparkles className="w-3 h-3" />
              Main Dashboard
            </span>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* View Users Directory Button */}
            <button
              onClick={() => setShowUsersModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Users className="w-3.5 h-3.5 text-[#1ed760]" />
              <span className="hidden xs:inline">Registered Users</span>
              <span className="xs:hidden">Users</span>
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-[#1ed760]/20 text-[#1ed760] text-[10px]">
                {accounts.length}
              </span>
            </button>

            {/* User Profile Pill */}
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <img
                src={user?.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.email || 'riff'}`}
                alt="Avatar"
                className="w-8 h-8 rounded-full bg-[#282828] object-cover border border-white/20"
              />
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-white leading-none truncate max-w-[120px]">
                  {user?.displayName || 'Listener'}
                </p>
                <p className="text-[10px] text-[#b3b3b3] leading-none mt-1 truncate max-w-[120px]">
                  {user?.email || 'Authenticated'}
                </p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogoutClick}
              title="Log Out"
              className="p-2 rounded-full bg-white/5 hover:bg-red-500/20 text-[#b3b3b3] hover:text-red-400 border border-white/5 hover:border-red-500/30 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#181818] via-[#1f1f1f] to-[#181818] border border-white/10 p-6 sm:p-8 mb-8">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1ed760]/10 border border-[#1ed760]/30 text-xs text-[#1ed760] font-bold mb-3">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Session Authenticated ({isStandaloneApp ? 'Standalone App' : 'Web Player'})</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white mb-2">
              Welcome back, {user?.displayName || 'Listener'} 👋
            </h1>
            <p className="text-[#b3b3b3] text-sm sm:text-base max-w-xl leading-relaxed">
              You are signed in to Riff with CD-quality lossless streaming, 0 commercial ads, and 30-day persistent session caching.
            </p>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: 30-Day Auto-Renewal Session Card */}
          <div className="bg-[#181818] border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#1ed760]/10 border border-[#1ed760]/20 flex items-center justify-center text-[#1ed760] mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-white mb-1">30-Day Inactivity Rule</h2>
              <p className="text-xs text-[#b3b3b3] leading-relaxed mb-4">
                Your session remains active as long as you open Riff at least once every 30 days. Visiting renews your 30-day window automatically.
              </p>
            </div>

            <div className="space-y-2 pt-3 border-t border-white/10 text-xs">
              <div className="flex items-center justify-between text-[#b3b3b3]">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#1ed760]" />
                  Status
                </span>
                <span className="font-bold text-[#1ed760]">Active ({thirtyDaysRemaining} days left)</span>
              </div>
              <div className="flex items-center justify-between text-[#b3b3b3]">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Last Seen
                </span>
                <span className="text-white">{formatDate(lastActiveAt)}</span>
              </div>
            </div>
          </div>

          {/* Card 2: User Account & Cloud Status */}
          <div className="bg-[#181818] border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-white mb-1">User Management</h2>
              <p className="text-xs text-[#b3b3b3] leading-relaxed mb-4">
                {isSupabaseConfigured
                  ? 'Connected to Supabase Cloud Authentication. All registered users sync in real time.'
                  : 'Operating with built-in instant local authentication. Add Supabase keys in .env to sync with Supabase Cloud.'}
              </p>
            </div>

            <button
              onClick={() => setShowUsersModal(true)}
              className="w-full py-2.5 px-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/20 text-white font-bold text-xs flex items-center justify-center gap-2 transition hover:scale-[1.02] cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-[#1ed760]" />
              <span>View All Registered Users ({accounts.length})</span>
            </button>
          </div>

          {/* Card 3: Audio Stream Fidelity Engine */}
          <div className="bg-[#181818] border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#1ed760]/10 border border-[#1ed760]/20 flex items-center justify-center text-[#1ed760] mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-white mb-1">Studio Edge Engine</h2>
              <p className="text-xs text-[#b3b3b3] leading-relaxed mb-4">
                Unthrottled audio pipeline delivering authentic 320kbps CD master sound directly to your browser or installed standalone app.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#242424] border border-white/5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">Dior — Shubh</p>
                <p className="text-[10px] text-[#1ed760]">320 KBPS • Verified Master</p>
              </div>
              <button
                onClick={() => setIsPlayingPreview(!isPlayingPreview)}
                className="w-8 h-8 rounded-full bg-[#1ed760] text-black flex items-center justify-center hover:scale-105 transition cursor-pointer"
              >
                {isPlayingPreview ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* 3. Registered Users Directory Modal */}
      {showUsersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#181818] border border-white/10 rounded-2xl w-full max-w-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#1ed760]" />
                <h3 className="text-lg font-bold text-white">Registered Users Directory</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#1ed760]/10 text-[#1ed760] font-bold">
                  {accounts.length} total
                </span>
              </div>
              <button
                onClick={() => setShowUsersModal(false)}
                className="text-[#7c7c7c] hover:text-white transition cursor-pointer text-sm font-bold"
              >
                ✕ Close
              </button>
            </div>

            <p className="text-xs text-[#b3b3b3] mb-4 leading-relaxed">
              Below are all accounts registered on this instance. If Supabase is connected, users are also viewable in real-time in your{' '}
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="text-[#1ed760] hover:underline inline-flex items-center gap-1"
              >
                Supabase Dashboard &gt; Authentication &gt; Users <ExternalLink className="w-3 h-3" />
              </a>.
            </p>

            {/* Users Table */}
            <div className="max-h-[320px] overflow-y-auto border border-white/10 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#242424] text-[#b3b3b3] uppercase tracking-wider font-bold">
                  <tr>
                    <th className="p-3">User</th>
                    <th className="p-3">Provider</th>
                    <th className="p-3">Created</th>
                    <th className="p-3">Last Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {accounts.map((acc) => (
                    <tr key={acc.id} className="hover:bg-white/5 transition">
                      <td className="p-3 flex items-center gap-2.5">
                        <img
                          src={acc.avatarUrl}
                          alt=""
                          className="w-7 h-7 rounded-full bg-[#333] object-cover"
                        />
                        <div>
                          <p className="font-bold text-white">{acc.displayName}</p>
                          <p className="text-[10px] text-[#7c7c7c]">{acc.email}</p>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          acc.provider === 'google' 
                            ? 'bg-blue-500/20 text-blue-300' 
                            : 'bg-white/10 text-[#b3b3b3]'
                        }`}>
                          {acc.provider || 'email'}
                        </span>
                      </td>
                      <td className="p-3 text-[#b3b3b3]">{formatDate(acc.createdAt)}</td>
                      <td className="p-3 text-[#1ed760] font-medium">{formatDate(acc.lastLoginAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-[#7c7c7c]">
              <span className="flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-[#1ed760]" />
                Password hashes are securely stored.
              </span>
              <button
                onClick={() => setShowUsersModal(false)}
                className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
