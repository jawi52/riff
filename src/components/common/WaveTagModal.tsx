import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check
} from 'lucide-react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { RiffIcon } from './Logo';

export const WaveTagModal: React.FC = () => {
  const { isWaveTagModalOpen, setWaveTagModalOpen, activeWaveTagData } = useSettingsStore();
  const [copied, setCopied] = useState(false);

  if (!isWaveTagModalOpen || !activeWaveTagData) return null;

  // Deterministic aesthetic soundwave bars based on item ID hash
  const bars = Array.from({ length: 28 }, (_, i) => {
    const charCode = activeWaveTagData.id.charCodeAt(i % activeWaveTagData.id.length) || 65;
    const height = 20 + ((charCode * (i + 3)) % 75);
    return height;
  });

  const handleCopyLink = () => {
    const url = `${window.location.origin}/#${activeWaveTagData.type}/${activeWaveTagData.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-[#12131d] border border-cyan-500/30 p-6 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />

        {/* 1. Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RiffIcon size={18} glow={false} />
            <h2 className="text-sm font-black text-white">Riff WaveTag</h2>
          </div>

          <button
            onClick={() => setWaveTagModalOpen(false)}
            className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Aesthetic Shareable Soundwave Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-b from-[#181a29] to-[#0d0e17] border border-white/10 space-y-4 shadow-xl text-center">
          <div className="w-40 h-40 mx-auto rounded-2xl overflow-hidden shadow-2xl border border-white/20">
            <img src={activeWaveTagData.coverUrl} alt="" className="w-full h-full object-cover" />
          </div>

          <div className="space-y-0.5">
            <h3 className="text-sm font-black text-white truncate">{activeWaveTagData.title}</h3>
            <p className="text-xs text-neutral-400 truncate">{activeWaveTagData.subtitle}</p>
          </div>

          {/* Soundwave Barcode Graphic */}
          <div className="p-3 rounded-xl bg-black/40 border border-white/[0.08] flex items-center justify-center gap-1 h-16">
            <div className="mr-1.5">
              <RiffIcon size={16} glow={false} />
            </div>
            {bars.map((h, idx) => (
              <div
                key={idx}
                style={{ height: `${h}%` }}
                className="w-1 rounded-full bg-cyan-400 opacity-90 transition-all duration-300"
              />
            ))}
          </div>

          <p className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase">
            SCAN WITH RIFF APP • TAP TO TUNE
          </p>
        </div>

        {/* 3. Actions */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={handleCopyLink}
            className="py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Link Copied' : 'Copy Link'}</span>
          </button>

          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: activeWaveTagData.title,
                  text: `Listen to ${activeWaveTagData.title} on Riff`,
                  url: window.location.href
                }).catch(() => {});
              } else {
                handleCopyLink();
              }
            }}
            className="py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share WaveTag</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WaveTagModal;
