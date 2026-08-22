import React, { useState, useEffect } from 'react';
import { X, Smartphone, ArrowDownToLine, Check, Share, PlusSquare, Sparkles, QrCode } from 'lucide-react';
import { Logo } from './Logo';

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  onInstalled?: () => void;
}

export const PwaInstallModal: React.FC<PwaInstallModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onInstalled,
}) => {
  const [activePlatform, setActivePlatform] = useState<'android' | 'ios' | 'desktop'>('android');
  const [isInstalling, setIsInstalling] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
      setActivePlatform('ios');
    } else if (/android/i.test(userAgent)) {
      setActivePlatform('android');
    } else {
      setActivePlatform('desktop');
    }
  }, []);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      setIsInstalling(true);
      try {
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setIsSuccess(true);
          if (onInstalled) onInstalled();
          setTimeout(() => {
            onClose();
          }, 1500);
        }
      } catch (err) {
        console.error('Install prompt error:', err);
      } finally {
        setIsInstalling(false);
      }
    }
  };

  // Local/Network IP for mobile scanning
  const currentUrl = window.location.href;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(currentUrl)}&bgcolor=08-08-0a&color=1ed760`;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-lg glass-editorial border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative animate-in zoom-in-95 duration-200 text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center pb-1">
            <Logo size={42} />
          </div>
          <h2 className="text-2xl font-black font-mono tracking-tight uppercase">
            INSTALL RIFF AS PWA
          </h2>
          <p className="text-xs font-mono text-neutral-400 max-w-sm mx-auto">
            Zero-bloat, offline playback, lockscreen controls, and 60 FPS studio DSP audio on your mobile device.
          </p>
        </div>

        {/* Direct Native Install Action if available */}
        {deferredPrompt && !isSuccess && (
          <button
            onClick={handleNativeInstall}
            disabled={isInstalling}
            className="w-full py-3.5 px-4 rounded-2xl btn-spotify-emerald font-mono font-bold text-sm tracking-wide flex items-center justify-center gap-2.5 shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <ArrowDownToLine className="w-5 h-5" />
            <span>{isInstalling ? 'INSTALLING RIFF...' : 'INSTALL RIFF ON THIS DEVICE'}</span>
          </button>
        )}

        {isSuccess && (
          <div className="p-4 rounded-2xl bg-[#1ed760]/20 border border-[#1ed760]/40 flex items-center justify-center gap-2 text-[#1ed760] font-mono font-bold text-sm">
            <Check className="w-5 h-5" />
            <span>RIFF SUCCESSFULLY INSTALLED!</span>
          </div>
        )}

        {/* Mobile QR & Step-by-Step Tabs */}
        <div className="space-y-4 pt-2">
          {/* Tab buttons */}
          <div className="flex items-center p-1 rounded-xl bg-neutral-900/90 border border-white/[0.08] text-xs font-mono font-bold uppercase">
            <button
              onClick={() => setActivePlatform('android')}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activePlatform === 'android' ? 'bg-white text-black shadow-md' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Android</span>
            </button>
            <button
              onClick={() => setActivePlatform('ios')}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activePlatform === 'ios' ? 'bg-white text-black shadow-md' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Share className="w-3.5 h-3.5" />
              <span>iOS / iPhone</span>
            </button>
            <button
              onClick={() => setActivePlatform('desktop')}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activePlatform === 'desktop' ? 'bg-white text-black shadow-md' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Mobile QR</span>
            </button>
          </div>

          {/* Platform specific instructions */}
          <div className="p-4 rounded-2xl bg-neutral-900/60 border border-white/[0.07] space-y-3 font-mono text-xs text-neutral-300">
            {activePlatform === 'android' && (
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#1ed760]/20 text-[#1ed760] flex items-center justify-center font-bold text-[11px] shrink-0">1</span>
                  <p>Open <span className="text-white font-bold">Chrome / Brave</span> on your Android phone and visit Riff.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#1ed760]/20 text-[#1ed760] flex items-center justify-center font-bold text-[11px] shrink-0">2</span>
                  <p>Tap the top-right <span className="text-white font-bold">Menu (⋮)</span> and select <span className="text-[#1ed760] font-bold">"Install App"</span> or <span className="text-white font-bold">"Add to Home screen"</span>.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#1ed760]/20 text-[#1ed760] flex items-center justify-center font-bold text-[11px] shrink-0">3</span>
                  <p>Riff will install directly to your app launcher with standalone full-screen audio playback!</p>
                </div>
              </div>
            )}

            {activePlatform === 'ios' && (
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#1ed760]/20 text-[#1ed760] flex items-center justify-center font-bold text-[11px] shrink-0">1</span>
                  <p>Open <span className="text-white font-bold">Safari</span> on your iPhone or iPad.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#1ed760]/20 text-[#1ed760] flex items-center justify-center font-bold text-[11px] shrink-0">2</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span>Tap the</span>
                    <span className="px-2 py-0.5 rounded bg-white/10 text-white font-bold flex items-center gap-1">
                      <Share className="w-3.5 h-3.5" /> Share
                    </span>
                    <span>button in the Safari toolbar.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#1ed760]/20 text-[#1ed760] flex items-center justify-center font-bold text-[11px] shrink-0">3</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span>Scroll down and tap</span>
                    <span className="px-2 py-0.5 rounded bg-white/10 text-[#1ed760] font-bold flex items-center gap-1">
                      <PlusSquare className="w-3.5 h-3.5" /> Add to Home Screen
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activePlatform === 'desktop' && (
              <div className="flex flex-col items-center justify-center text-center space-y-3 py-2">
                <div className="p-3 bg-[#08080a] rounded-2xl border border-white/10 shadow-inner">
                  <img
                    src={qrCodeUrl}
                    alt="Riff QR Code"
                    className="w-40 h-40 rounded-xl"
                  />
                </div>
                <p className="text-[11px] text-neutral-400">
                  Scan this QR code with your mobile camera to open and install Riff instantly on your phone.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer info badge */}
        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 pt-1 border-t border-white/[0.08]">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#1ed760]" />
            <span>PROGRESSIVE WEB APP v2026.1</span>
          </div>
          <span>OFFLINE READY</span>
        </div>
      </div>
    </div>
  );
};

export default PwaInstallModal;
