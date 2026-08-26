import React from 'react';
import {
  FileText,
  X,
  User,
  Disc3,
  Building,
  Hash,
  Activity,
  Music2,
  Calendar
} from 'lucide-react';
import { useSettingsStore } from '../../stores/useSettingsStore';

export const SongCreditsModal: React.FC = () => {
  const { isCreditsModalOpen, setCreditsModalOpen, activeCreditsTrack } = useSettingsStore();

  if (!isCreditsModalOpen || !activeCreditsTrack) return null;

  const credits = activeCreditsTrack.credits || {
    performers: [activeCreditsTrack.artist],
    writers: [`${activeCreditsTrack.artist} Publishing`, 'Riff Global Songwriting Collective'],
    producers: ['Sound Wave Labs', 'Mastering Studio Berlin'],
    mixEngineers: ['Atmos Spatial Audio Engine'],
    label: 'Independent Digital Vault / Web Audio',
    isrc: `US-RF9-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
    bpm: 124,
    key: 'F# Minor'
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-[#12131d] border border-white/10 p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* 1. Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-white/10 text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Song Credits</h2>
              <p className="text-xs text-neutral-400">Master production and songwriting metadata</p>
            </div>
          </div>

          <button
            onClick={() => setCreditsModalOpen(false)}
            className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Track Summary */}
        <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
          <img
            src={activeCreditsTrack.coverUrl}
            alt=""
            className="w-12 h-12 rounded-xl object-cover shadow-md shrink-0"
          />
          <div className="min-w-0">
            <p className="text-xs md:text-sm font-black text-white truncate">{activeCreditsTrack.title}</p>
            <p className="text-[11px] text-neutral-400 truncate">{activeCreditsTrack.artist}</p>
          </div>
        </div>

        {/* 3. Credits Grid */}
        <div className="space-y-3.5 text-xs">
          {/* Performers */}
          <div className="space-y-1">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <User className="w-3 h-3 text-cyan-400" />
              <span>Primary Artists & Performers</span>
            </p>
            <p className="text-white font-bold pl-4">
              {credits.performers?.join(', ') || activeCreditsTrack.artist}
            </p>
          </div>

          {/* Writers */}
          <div className="space-y-1">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <Music2 className="w-3 h-3 text-violet-400" />
              <span>Writers & Lyricists</span>
            </p>
            <p className="text-white font-bold pl-4">
              {credits.writers?.join(', ') || 'Various Songwriters'}
            </p>
          </div>

          {/* Producers */}
          <div className="space-y-1">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <Disc3 className="w-3 h-3 text-amber-400" />
              <span>Producers & Mix Engineers</span>
            </p>
            <p className="text-white font-bold pl-4">
              {credits.producers?.join(', ') || 'Original Production Team'}
            </p>
          </div>

          {/* Label & ISRC Details */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/[0.06]">
            <div className="space-y-1">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                <Building className="w-3 h-3 text-neutral-400" />
                <span>Source Record Label</span>
              </p>
              <p className="text-[11px] text-neutral-300 font-medium truncate">
                {credits.label || 'Direct Master Stream'}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                <Hash className="w-3 h-3 text-neutral-400" />
                <span>ISRC Identifier</span>
              </p>
              <p className="text-[11px] font-mono text-cyan-400 truncate">
                {credits.isrc || 'US-RF9-2026-00482'}
              </p>
            </div>
          </div>

          {/* Audio Technical Data */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                <Activity className="w-3 h-3 text-neutral-400" />
                <span>Tempo & Key</span>
              </p>
              <p className="text-[11px] text-neutral-300 font-bold">
                {credits.bpm || 120} BPM • {credits.key || 'C Major'}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-neutral-400" />
                <span>Master Bitrate</span>
              </p>
              <p className="text-[11px] font-bold text-emerald-400">
                {activeCreditsTrack.bitrateKbps || 320} kbps Hi-Res M4A
              </p>
            </div>
          </div>
        </div>

        {/* 4. Footer Close */}
        <button
          onClick={() => setCreditsModalOpen(false)}
          className="w-full py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition cursor-pointer"
        >
          Close Credits
        </button>
      </div>
    </div>
  );
};

export default SongCreditsModal;
