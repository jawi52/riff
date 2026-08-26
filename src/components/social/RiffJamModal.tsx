import React, { useState } from 'react';
import {
  X,
  Users,
  Copy,
  Check,
  Volume2
} from 'lucide-react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { usePlayerStore } from '../../stores/usePlayerStore';

export const RiffJamModal: React.FC = () => {
  const { isJamModalOpen, setJamModalOpen } = useSettingsStore();
  const { currentTrack } = usePlayerStore();

  const [jamCode] = useState(() => Math.floor(1000 + Math.random() * 9000).toString());
  const [copied, setCopied] = useState(false);

  if (!isJamModalOpen) return null;

  const handleCopyLink = () => {
    const url = `${window.location.origin}/#jam/${jamCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-[#12131d] border border-cyan-500/40 p-6 space-y-5 shadow-[0_0_50px_rgba(6,182,212,0.15)] animate-in zoom-in-95 duration-200 relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />

        {/* 1. Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-1.5">
                <span>Riff Jam Room</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
                  Live Sync
                </span>
              </h2>
              <p className="text-xs text-neutral-400">Synchronized group listening & shared live queue</p>
            </div>
          </div>

          <button
            onClick={() => setJamModalOpen(false)}
            className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Room Code Card */}
        <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-center space-y-2">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">Room PIN Code</p>
          <div className="text-3xl font-black font-mono tracking-widest text-cyan-400">
            {jamCode}
          </div>
          <p className="text-[11px] text-neutral-400">
            Friends in the same room or on Discord can tune in live
          </p>
        </div>

        {/* 3. Currently Syncing Track */}
        {currentTrack && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">Broadcasting Now</p>
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30">
              <img src={currentTrack.coverUrl} alt="" className="w-11 h-11 rounded-xl object-cover shadow-sm" />
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm font-black text-white truncate">{currentTrack.title}</p>
                <p className="text-[11px] text-neutral-300 truncate">{currentTrack.artist}</p>
              </div>
              <Volume2 className="w-4 h-4 text-cyan-400 animate-pulse shrink-0" />
            </div>
          </div>
        )}

        {/* 4. Connected Listeners */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-neutral-300">Connected Listeners</span>
            <span className="font-mono text-cyan-400 font-extrabold">3 in Session</span>
          </div>

          <div className="flex items-center gap-2">
            {[
              { name: 'You (Host)', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80' },
              { name: 'Elena', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&q=80' },
              { name: 'Kaito', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80' }
            ].map((p, idx) => (
              <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.08]">
                <img src={p.avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                <span className="text-[11px] font-bold text-white">{p.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Actions */}
        <div className="grid grid-cols-2 gap-2.5 pt-2">
          <button
            onClick={handleCopyLink}
            className="py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Link Copied' : 'Copy Jam Link'}</span>
          </button>

          <button
            onClick={() => setJamModalOpen(false)}
            className="py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
          >
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RiffJamModal;
