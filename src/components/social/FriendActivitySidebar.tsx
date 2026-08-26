import React from 'react';
import {
  Users,
  X,
  Play,
  UserPlus
} from 'lucide-react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { FriendActivityItem } from '../../types';

const MOCK_FRIENDS_ACTIVITY: FriendActivityItem[] = [
  {
    id: 'friend_1',
    user: 'Alex Rivers',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
    track: {
      id: 'mock_tr_1',
      title: 'Starboy',
      artist: 'The Weeknd, Daft Punk',
      album: 'Starboy',
      coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=150&q=80',
      duration: 230,
      sourceType: 'saavn'
    },
    timestamp: 'Listening now',
    isLive: true
  },
  {
    id: 'friend_2',
    user: 'Elena Rostova',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&q=80',
    track: {
      id: 'mock_tr_2',
      title: 'Midnight City',
      artist: 'M83',
      album: 'Hurry Up, We\'re Dreaming',
      coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=150&q=80',
      duration: 243,
      sourceType: 'saavn'
    },
    timestamp: 'Listening now',
    isLive: true
  },
  {
    id: 'friend_3',
    user: 'Kaito Tanaka',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
    track: {
      id: 'mock_tr_3',
      title: 'Resonance',
      artist: 'HOME',
      album: 'Odyssey',
      coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=150&q=80',
      duration: 212,
      sourceType: 'saavn'
    },
    timestamp: '24m ago',
    isLive: false
  },
  {
    id: 'friend_4',
    user: 'Maya Patel',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80',
    track: {
      id: 'mock_tr_4',
      title: 'Levitating',
      artist: 'Dua Lipa',
      album: 'Future Nostalgia',
      coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150&q=80',
      duration: 203,
      sourceType: 'saavn'
    },
    timestamp: '2h ago',
    isLive: false
  }
];

export const FriendActivitySidebar: React.FC = () => {
  const { friendActivityEnabled, setFriendActivityEnabled, setJamModalOpen } = useSettingsStore();
  const { playTrack } = usePlayerStore();

  if (!friendActivityEnabled) return null;

  return (
    <aside className="w-64 lg:w-72 rounded-2xl bg-[#12131a]/90 backdrop-blur-2xl border border-white/[0.07] flex flex-col justify-between hidden xl:flex select-none h-full overflow-hidden shadow-2xl shrink-0 p-4 space-y-4">
      {/* 1. Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-black uppercase tracking-wider text-white">Friend Activity</h3>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setJamModalOpen(true)}
            className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[9px] font-extrabold uppercase tracking-wider hover:bg-cyan-500 hover:text-black transition cursor-pointer"
            title="Start Riff Jam Group Session"
          >
            Jam
          </button>
          <button
            onClick={() => setFriendActivityEnabled(false)}
            className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Hide Friend Activity"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Friends Activity List */}
      <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1 min-h-0">
        {MOCK_FRIENDS_ACTIVITY.map((item) => (
          <div
            key={item.id}
            className="group p-2.5 rounded-xl hover:bg-white/[0.06] transition flex items-start gap-3 cursor-pointer"
            onClick={() => playTrack(item.track)}
          >
            {/* Avatar with Live Pulse */}
            <div className="relative shrink-0">
              <img
                src={item.avatarUrl}
                alt={item.user}
                className="w-10 h-10 rounded-full object-cover border border-white/20"
              />
              {item.isLive && (
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#12131a] absolute bottom-0 right-0 animate-pulse" />
              )}
            </div>

            {/* Friend & Song Info */}
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-white truncate group-hover:text-cyan-400 transition">
                  {item.user}
                </p>
                <span className="text-[9px] font-mono text-neutral-500 shrink-0">{item.timestamp}</span>
              </div>

              <p className="text-[11px] text-neutral-300 truncate font-semibold">
                {item.track.title}
              </p>
              <p className="text-[10px] text-neutral-400 truncate flex items-center gap-1">
                <span>{item.track.artist}</span>
              </p>

              {/* Listen Along Action */}
              <div className="pt-1 opacity-0 group-hover:opacity-100 transition flex items-center gap-1 text-[10px] text-cyan-400 font-extrabold">
                <Play className="w-2.5 h-2.5 fill-current" />
                <span>Listen Along</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Footer Invite Action */}
      <div className="pt-3 border-t border-white/[0.06] space-y-2 shrink-0">
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: 'Join me on Riff Music',
                text: 'Listen along with high-fidelity streaming on Riff',
                url: window.location.origin
              }).catch(() => {});
            } else {
              navigator.clipboard.writeText(window.location.origin);
              alert('Riff invitation link copied to clipboard!');
            }
          }}
          className="w-full py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.10] border border-white/[0.08] text-neutral-300 hover:text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5 text-cyan-400" />
          <span>Find Friends</span>
        </button>
      </div>
    </aside>
  );
};

export default FriendActivitySidebar;
