import React, { useState } from "react";
import { 
  X, 
  Download, 
  Monitor, 
  Smartphone, 
  Apple, 
  CheckCircle2, 
  Share2, 
  Sparkles,
  WifiOff,
  Zap
} from "lucide-react";
import { RiffLogo } from "../common/RiffLogo";

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  onInstallSuccess?: () => void;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onInstallSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<"desktop" | "ios" | "android">("desktop");
  const [installing, setInstalling] = useState(false);
  const [installed, setInstalled] = useState(false);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    if (!deferredPrompt) return;
    try {
      setInstalling(true);
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setInstalled(true);
        if (onInstallSuccess) onInstallSuccess();
      }
    } catch (err) {
      console.error("PWA install error:", err);
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg rounded-2xl bg-[#11131a] border border-white/10 p-6 md:p-8 shadow-2xl shadow-black/80 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <RiffLogo size="md" showText={false} />
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              Install Riff Standalone
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                PWA
              </span>
            </h3>
            <p className="text-xs text-neutral-400">
              Zero storage bloat • Instant launch • Offline playback ready
            </p>
          </div>
        </div>

        {/* Native Install Prompt Button (if browser supports it) */}
        {deferredPrompt && !installed && (
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 to-teal-950/40 border border-emerald-500/30 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-emerald-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                One-Click Installation Ready
              </p>
              <p className="text-xs text-neutral-300 mt-0.5">
                Install as a native desktop / mobile app on this device.
              </p>
            </div>
            <button
              onClick={handleNativeInstall}
              disabled={installing}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition disabled:opacity-50 shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              {installing ? "Installing..." : "Install Now"}
            </button>
          </div>
        )}

        {installed && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center gap-3 text-emerald-400">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">
              Riff was installed successfully! Check your apps or desktop shortcut.
            </span>
          </div>
        )}

        {/* Platform Tabs */}
        <div className="flex border-b border-white/10 mb-5 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("desktop")}
            className={`flex items-center gap-2 pb-2.5 px-3 border-b-2 transition cursor-pointer ${
              activeTab === "desktop"
                ? "border-emerald-400 text-white font-bold"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Monitor className="w-4 h-4" />
            Windows / Mac
          </button>
          <button
            onClick={() => setActiveTab("ios")}
            className={`flex items-center gap-2 pb-2.5 px-3 border-b-2 transition cursor-pointer ${
              activeTab === "ios"
                ? "border-emerald-400 text-white font-bold"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Apple className="w-4 h-4" />
            iPhone / iPad
          </button>
          <button
            onClick={() => setActiveTab("android")}
            className={`flex items-center gap-2 pb-2.5 px-3 border-b-2 transition cursor-pointer ${
              activeTab === "android"
                ? "border-emerald-400 text-white font-bold"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Smartphone className="w-4 h-4" />
            Android
          </button>
        </div>

        {/* Tab Content Instructions */}
        <div className="min-h-[160px] text-sm text-neutral-300">
          {activeTab === "desktop" && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                <span className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-300 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">
                  1
                </span>
                <p className="text-xs leading-relaxed">
                  In Chrome, Edge, or Brave on Windows or macOS, look at the right side of the address bar.
                </p>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                <span className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-300 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">
                  2
                </span>
                <p className="text-xs leading-relaxed">
                  Click the <strong className="text-white">Install App</strong> icon (or tap <strong>⋮</strong> &gt; <em>Save & Share</em> &gt; <em>Install Riff</em>).
                </p>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-black text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">
                  ✓
                </span>
                <p className="text-xs leading-relaxed text-neutral-200">
                  Riff will launch in its own native, borderless desktop window with keyboard media control!
                </p>
              </div>
            </div>
          )}

          {activeTab === "ios" && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                <span className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-300 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">
                  1
                </span>
                <p className="text-xs leading-relaxed">
                  Open this website in <strong className="text-white">Safari</strong> on your iPhone or iPad.
                </p>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                <span className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-300 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">
                  2
                </span>
                <p className="text-xs leading-relaxed flex items-center gap-1.5 flex-wrap">
                  Tap the <Share2 className="w-3.5 h-3.5 text-cyan-400 inline" /> <strong className="text-white">Share</strong> button at the bottom of the screen.
                </p>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                <span className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-300 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">
                  3
                </span>
                <p className="text-xs leading-relaxed">
                  Scroll down and tap <strong className="text-emerald-400">Add to Home Screen</strong>, then tap <strong className="text-white">Add</strong>.
                </p>
              </div>
            </div>
          )}

          {activeTab === "android" && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                <span className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-300 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">
                  1
                </span>
                <p className="text-xs leading-relaxed">
                  Open Riff in <strong className="text-white">Chrome</strong> on Android.
                </p>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                <span className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-300 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">
                  2
                </span>
                <p className="text-xs leading-relaxed">
                  Tap the three-dots menu <strong className="text-white">⋮</strong> in the top right corner.
                </p>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                <span className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-300 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">
                  3
                </span>
                <p className="text-xs leading-relaxed">
                  Select <strong className="text-emerald-400">Install App</strong> or <strong className="text-white">Add to Home screen</strong>.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2 text-neutral-300">
            <WifiOff className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Full Offline Listening</span>
          </div>
          <div className="flex items-center gap-2 text-neutral-300">
            <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Instant &lt;100ms Startup</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs transition cursor-pointer"
          >
            Got it, continue browsing
          </button>
        </div>
      </div>
    </div>
  );
};
