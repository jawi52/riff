import React from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { 
  Heart, 
  Download, 
  ShieldCheck, 
  Clock, 
  LogOut, 
  ExternalLink,
  Smartphone
} from 'lucide-react';

interface LibraryViewProps {
  onLogout: () => void;
  isStandaloneApp?: boolean;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  onLogout,
  isStandaloneApp = false,
}) => {
  const { user, lastActiveAt, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    onLogout();
  };

  const thirtyDaysRemaining = lastActiveAt 
    ? Math.max(0, Math.ceil((lastActiveAt + 30 * 86400000 - Date.now()) / (86400000)))
    : 30;

  return (
    <div className="space-y-6 pb-32">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Your Library
        </h1>
      </div>

      {/* User Info & 30-Day Session Card */}
      <div className="bg-[#181818] border border-white/10 rounded-2xl p-5 sm:p-6 space-y-4 shadow-lg">
        <div className="flex items-center gap-4">
          <img
            src={user?.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.email || 'riff'}`}
            alt="Avatar"
            className="w-14 h-14 rounded-full bg-[#282828] object-cover border-2 border-[#1ed760]"
          />
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-white truncate">
              {user?.displayName || 'Listener'}
            </h2>
            <p className="text-xs text-[#b3b3b3] truncate">
              {user?.email || 'Authenticated User'}
            </p>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#1ed760]" />
              <span className="text-[11px] text-[#1ed760] font-semibold">
                {isStandaloneApp ? 'Standalone App' : 'Web Player'}
              </span>
            </div>
          </div>
        </div>

        {/* 30-Day Auto-Renewal Badge */}
        <div className="p-3 rounded-xl bg-[#242424] border border-white/5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[#b3b3b3]">
            <ShieldCheck className="w-4 h-4 text-[#1ed760]" />
            <span>30-Day Inactivity Rule</span>
          </div>
          <div className="flex items-center gap-1 text-[#1ed760] font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>{thirtyDaysRemaining} days remaining</span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noreferrer"
            className="flex-1 py-2 px-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <span>Supabase Cloud</span>
            <ExternalLink className="w-3 h-3 text-[#7c7c7c]" />
          </a>

          <button
            onClick={handleLogout}
            className="py-2 px-4 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-xs font-bold text-red-400 flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* Quick Library Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Liked Songs Tile */}
        <div className="bg-[#181818] hover:bg-[#222222] p-4 rounded-xl border border-white/5 transition cursor-pointer flex items-center gap-4 group">
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-800 flex items-center justify-center text-white shrink-0 shadow-md group-hover:scale-105 transition">
            <Heart className="w-8 h-8 fill-white" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Liked Songs</h3>
            <p className="text-xs text-[#b3b3b3] mt-0.5">Your saved favorites</p>
          </div>
        </div>

        {/* Offline Cache Tile */}
        <div className="bg-[#181818] hover:bg-[#222222] p-4 rounded-xl border border-white/5 transition cursor-pointer flex items-center gap-4 group">
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-900 flex items-center justify-center text-white shrink-0 shadow-md group-hover:scale-105 transition">
            <Download className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Downloaded Audio</h3>
            <p className="text-xs text-[#b3b3b3] mt-0.5">OPFS offline storage ready</p>
          </div>
        </div>
      </div>

      {/* PWA Device Card */}
      <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3 text-xs text-[#b3b3b3]">
        <Smartphone className="w-5 h-5 text-[#1ed760] shrink-0" />
        <p>
          Riff is optimized for mobile screens. Install as a PWA to enjoy full offline caching, audio hardware acceleration, and lock-screen controls.
        </p>
      </div>
    </div>
  );
};
