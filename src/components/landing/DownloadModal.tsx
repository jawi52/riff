import React, { useState, useEffect } from "react";
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
  Zap,
  HardDrive
} from "lucide-react";
import { RiffLogo } from "../common/RiffLogo";
import { detectDevice, DeviceInfo } from "../../lib/detectDevice";

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
  const [device, setDevice] = useState<DeviceInfo>({
    os: "windows",
    name: "Windows PC",
    isMobile: false,
    browser: "Browser",
    supportsNativePrompt: true,
  });

  const [activeTab, setActiveTab] = useState<"desktop" | "ios" | "android">("desktop");
  const [installing, setInstalling] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [manualGuideVisible, setManualGuideVisible] = useState(false);

  // Auto-detect client device whenever modal opens
  useEffect(() => {
    if (isOpen) {
      const detected = detectDevice();
      setDevice(detected);

      // Pre-select tab corresponding to detected device
      if (detected.os === "ios") {
        setActiveTab("ios");
      } else if (detected.os === "android") {
        setActiveTab("android");
      } else {
        setActiveTab("desktop");
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDirectInstall = async () => {
    if (deferredPrompt) {
      try {
        setInstalling(true);
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === "accepted") {
          setInstalled(true);
          if (onInstallSuccess) onInstallSuccess();
          setTimeout(() => {
            onClose();
          }, 2000);
        }
      } catch (err) {
        console.error("Direct PWA install error:", err);
        setManualGuideVisible(true);
      } finally {
        setInstalling(false);
      }
    } else {
      // Browser didn't provide beforeinstallprompt event (e.g. iOS or already installed or unsupported browser)
      setManualGuideVisible(true);
    }
  };

  const getDeviceIcon = () => {
    if (device.os === "ios" || device.os === "mac") {
      return <Apple className="w-5 h-5 text-[#1ed760]" />;
    }
    if (device.os === "android") {
      return <Smartphone className="w-5 h-5 text-[#1ed760]" />;
    }
    return <Monitor className="w-5 h-5 text-[#1ed760]" />;
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg rounded-2xl bg-[#181818] border border-white/10 p-6 sm:p-8 shadow-2xl shadow-black/90 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#b3b3b3] hover:text-white hover:bg-white/10 transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand & Detected Device Header */}
        <div className="flex items-center gap-3 mb-6">
          <RiffLogo size="sm" />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-[#b3b3b3]">
            {getDeviceIcon()}
            <span className="text-white font-semibold">{device.name}</span>
            <span className="text-[#7c7c7c]">detected</span>
          </div>
        </div>

        {/* Primary Prompt Question */}
        <div className="mb-6">
          <h3 className="text-xl sm:text-2xl font-black text-white leading-snug">
            Do you want to install Riff on this {device.name}?
          </h3>
          <p className="text-xs sm:text-sm text-[#b3b3b3] mt-2 leading-relaxed">
            Installs as a fast, borderless app with instant startup, zero background bloat, and full offline playback capability.
          </p>
        </div>

        {/* Success Alert */}
        {installed && (
          <div className="mb-6 p-4 rounded-xl bg-[#1ed760]/15 border border-[#1ed760]/40 flex items-center gap-3 text-[#1ed760] animate-in fade-in">
            <CheckCircle2 className="w-6 h-6 shrink-0" />
            <div>
              <p className="text-sm font-bold text-white">Riff Installed Successfully!</p>
              <p className="text-xs text-[#b3b3b3] mt-0.5">
                Check your home screen or apps menu for your new desktop/mobile app.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons: Yes, Install Directly vs Cancel */}
        {!installed && (
          <div className="mb-6 space-y-3">
            <button
              onClick={handleDirectInstall}
              disabled={installing}
              className="w-full h-12 rounded-full bg-[#1ed760] hover:bg-[#1fdf64] active:scale-98 text-black font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition shadow-lg shadow-[#1ed760]/20 hover:shadow-[#1ed760]/35 cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>{installing ? "Installing Riff..." : "Yes, Install Now"}</span>
            </button>

            <button
              onClick={onClose}
              className="w-full h-11 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 text-[#b3b3b3] hover:text-white font-bold text-xs sm:text-sm flex items-center justify-center transition cursor-pointer whitespace-nowrap"
            >
              Not now, keep browsing
            </button>
          </div>
        )}

        {/* App Highlights Specs */}
        <div className="mb-6 p-3.5 rounded-xl bg-[#1f1f1f] border border-white/5 grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#b3b3b3]">
            <WifiOff className="w-4 h-4 text-[#1ed760] shrink-0" />
            <span>True Offline Storage</span>
          </div>
          <div className="flex items-center gap-2 text-[#b3b3b3]">
            <Zap className="w-4 h-4 text-[#1ed760] shrink-0" />
            <span>&lt;100ms Instant Launch</span>
          </div>
          <div className="flex items-center gap-2 text-[#b3b3b3]">
            <HardDrive className="w-4 h-4 text-[#1ed760] shrink-0" />
            <span>Zero Storage Bloat</span>
          </div>
          <div className="flex items-center gap-2 text-[#b3b3b3]">
            <Sparkles className="w-4 h-4 text-[#1ed760] shrink-0" />
            <span>0 Commercial Audio Ads</span>
          </div>
        </div>

        {/* Device-Specific Step-by-Step Guide (shown if native prompt is not directly available or user wants details) */}
        {(manualGuideVisible || device.os === "ios" || !deferredPrompt) && (
          <div className="pt-4 border-t border-white/10">
            {/* Device Tabs */}
            <div className="flex border-b border-white/10 mb-4 text-xs font-bold overflow-x-auto">
              <button
                onClick={() => setActiveTab("desktop")}
                className={`flex items-center gap-1.5 pb-2 px-3 border-b-2 transition whitespace-nowrap cursor-pointer ${
                  activeTab === "desktop"
                    ? "border-[#1ed760] text-white"
                    : "border-transparent text-[#7c7c7c] hover:text-white"
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                Windows / Mac
              </button>
              <button
                onClick={() => setActiveTab("android")}
                className={`flex items-center gap-1.5 pb-2 px-3 border-b-2 transition whitespace-nowrap cursor-pointer ${
                  activeTab === "android"
                    ? "border-[#1ed760] text-white"
                    : "border-transparent text-[#7c7c7c] hover:text-white"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                Android
              </button>
              <button
                onClick={() => setActiveTab("ios")}
                className={`flex items-center gap-1.5 pb-2 px-3 border-b-2 transition whitespace-nowrap cursor-pointer ${
                  activeTab === "ios"
                    ? "border-[#1ed760] text-white"
                    : "border-transparent text-[#7c7c7c] hover:text-white"
                }`}
              >
                <Apple className="w-3.5 h-3.5" />
                iPhone / iPad
              </button>
            </div>

            {/* Tab Instructions */}
            <div className="space-y-2.5 text-xs text-[#b3b3b3]">
              {activeTab === "desktop" && (
                <>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#1f1f1f]">
                    <span className="w-4 h-4 rounded-full bg-[#282828] text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                      1
                    </span>
                    <p>In Chrome, Edge, or Brave on Windows or Mac, look at the right side of the address bar.</p>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#1f1f1f]">
                    <span className="w-4 h-4 rounded-full bg-[#282828] text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                      2
                    </span>
                    <p>Click the <strong className="text-white">Install App</strong> icon (or tap menu <strong className="text-white">⋮</strong> &gt; <em>Install Riff</em>).</p>
                  </div>
                </>
              )}

              {activeTab === "android" && (
                <>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#1f1f1f]">
                    <span className="w-4 h-4 rounded-full bg-[#282828] text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                      1
                    </span>
                    <p>Tap the three dots <strong className="text-white">⋮</strong> in Chrome on Android.</p>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#1f1f1f]">
                    <span className="w-4 h-4 rounded-full bg-[#282828] text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                      2
                    </span>
                    <p>Select <strong className="text-[#1ed760]">Install app</strong> or <strong className="text-white">Add to Home screen</strong>.</p>
                  </div>
                </>
              )}

              {activeTab === "ios" && (
                <>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#1f1f1f]">
                    <span className="w-4 h-4 rounded-full bg-[#282828] text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                      1
                    </span>
                    <p className="flex items-center gap-1.5 flex-wrap">
                      In Safari, tap the <Share2 className="w-3.5 h-3.5 text-[#1ed760] inline" /> <strong className="text-white">Share</strong> icon at the bottom of the screen.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#1f1f1f]">
                    <span className="w-4 h-4 rounded-full bg-[#282828] text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                      2
                    </span>
                    <p>Scroll down and tap <strong className="text-[#1ed760]">Add to Home Screen</strong>, then tap <strong className="text-white">Add</strong>.</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
