import React from 'react';
import { X, Bell, Sparkles, Wifi, Radio } from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const notifications = [
    {
      id: 1,
      title: 'Studio Web Audio DSP Active',
      desc: '5-Band BiquadFilter Equalizer, Dynamic Range Compressor, and 60 FPS spectrum ready.',
      time: 'Just now',
      icon: Sparkles,
      color: 'text-[#1ed760] bg-[#1ed760]/15 border-[#1ed760]/30',
    },
    {
      id: 2,
      title: '30,000+ Live Radio Stations',
      desc: 'Global Radio Browser integration live. Search any genre, country, or frequency in Search & Radio.',
      time: '10m ago',
      icon: Radio,
      color: 'text-[#06b6d4] bg-[#06b6d4]/15 border-[#06b6d4]/30',
    },
    {
      id: 3,
      title: 'Offline Origin Private File System (OPFS)',
      desc: 'Drag and drop local MP3/FLAC/WAV files to store them offline in persistent local sandbox.',
      time: '1h ago',
      icon: Wifi,
      color: 'text-amber-400 bg-amber-400/15 border-amber-400/30',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-md glass-editorial border border-white/10 rounded-3xl p-6 space-y-5 shadow-2xl relative animate-in zoom-in-95 duration-200 text-white">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#111218] border border-white/10 flex items-center justify-center text-[#1ed760] shadow-md">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black font-mono tracking-tight uppercase">NOTIFICATIONS</h3>
            <p className="text-xs font-mono text-neutral-400">Audio engine alerts & mesh updates</p>
          </div>
        </div>

        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {notifications.map((n) => {
            const Icon = n.icon;
            return (
              <div
                key={n.id}
                className="p-3.5 rounded-2xl bg-[#12131b]/80 border border-white/[0.07] hover:border-white/20 transition-all flex items-start gap-3.5"
              >
                <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${n.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold font-mono text-white truncate">{n.title}</h4>
                    <span className="text-[10px] font-mono text-neutral-500">{n.time}</span>
                  </div>
                  <p className="text-[11px] font-mono text-neutral-400 leading-relaxed">{n.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-mono font-bold uppercase transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default NotificationsModal;
