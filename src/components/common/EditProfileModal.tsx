import React, { useState, useRef } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { X, Camera, Upload, Check, Sparkles, User } from 'lucide-react';
import { toast } from 'sonner';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVATAR_PRESETS = [
  {
    id: 'studio-neon',
    name: 'Neon Studio',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=faces',
  },
  {
    id: 'producer-cyber',
    name: 'Cyberpunk DJ',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=faces',
  },
  {
    id: 'lofi-chill',
    name: 'Lo-Fi Chill',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop&crop=faces',
  },
  {
    id: 'vinyl-soul',
    name: 'Vinyl Soul',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=faces',
  },
  {
    id: 'sound-artist',
    name: 'Acoustic Wave',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=300&fit=crop&crop=faces',
  },
  {
    id: 'synth-vintage',
    name: 'Retro Synth',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&h=300&fit=crop&crop=faces',
  },
  {
    id: 'dicebear-identicon',
    name: 'Geometric Bot',
    url: 'https://api.dicebear.com/7.x/identicon/svg?seed=riff-sound-master',
  },
  {
    id: 'dicebear-lorelei',
    name: 'Anime Avatar',
    url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=riff-listener',
  }
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile } = useAuthStore();
  
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || AVATAR_PRESETS[0].url);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when opened
  React.useEffect(() => {
    if (isOpen && user) {
      setDisplayName(user.displayName || '');
      setAvatarUrl(user.avatarUrl || AVATAR_PRESETS[0].url);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Limit to 3MB
    if (file.size > 3 * 1024 * 1024) {
      toast.error('Image size must be less than 3MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
        toast.success('Photo loaded successfully');
      }
    };
    reader.onerror = () => {
      toast.error('Failed to read image file');
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCustomUrl = () => {
    const trimmed = customUrlInput.trim();
    if (!trimmed) return;
    try {
      new URL(trimmed);
      setAvatarUrl(trimmed);
      setCustomUrlInput('');
      toast.success('Custom avatar URL applied');
    } catch {
      toast.error('Please enter a valid URL (https://...)');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = displayName.trim();
    if (!cleanName) {
      toast.error('Please enter a display name');
      return;
    }

    setIsSaving(true);
    try {
      const success = await updateProfile({
        displayName: cleanName,
        avatarUrl: avatarUrl.trim(),
      });

      if (success) {
        toast.success('Profile updated successfully!');
        onClose();
      } else {
        toast.error('Failed to update profile. Please try again.');
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-[#181818] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#1ed760]" />
            <h2 className="text-lg font-bold text-white">Profile Details</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#b3b3b3] hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Avatar Preview & Quick Uploader */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-[#121212] border border-white/5">
            <div className="relative group shrink-0">
              <img
                src={avatarUrl}
                alt="Profile Preview"
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-2 border-[#1ed760] shadow-xl bg-[#242424]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = AVATAR_PRESETS[0].url;
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition cursor-pointer"
                title="Upload Photo"
              >
                <Camera className="w-6 h-6 text-[#1ed760] mb-1" />
                <span className="text-[10px] font-bold">Change</span>
              </button>
            </div>

            <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
              <h3 className="text-sm font-bold text-white truncate">
                {displayName.trim() || 'Your Name'}
              </h3>
              <p className="text-xs text-[#b3b3b3] leading-relaxed">
                Choose an iconic avatar preset below, enter an image link, or upload directly from your device.
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-[#1ed760]" />
                  <span>Upload Device Photo</span>
                </button>
              </div>
            </div>
          </div>

          {/* Display Name Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-white uppercase tracking-wider">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={30}
              placeholder="e.g. Hammadh"
              required
              className="w-full h-11 px-4 rounded-xl bg-[#242424] border border-white/10 text-white placeholder-[#727272] text-sm focus:outline-none focus:border-[#1ed760] transition"
            />
            <p className="text-[11px] text-[#727272]">
              This is the name visible on your listening home and shared playlists. Max 30 characters.
            </p>
          </div>

          {/* Curated Avatar Presets Grid */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#1ed760]" />
                <span>Curated Avatar Presets</span>
              </label>
            </div>
            
            <div className="grid grid-cols-4 gap-3">
              {AVATAR_PRESETS.map((preset) => {
                const isSelected = avatarUrl === preset.url;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setAvatarUrl(preset.url)}
                    className={`relative group rounded-xl p-1.5 border transition cursor-pointer flex flex-col items-center gap-1 ${
                      isSelected
                        ? 'border-[#1ed760] bg-[#1ed760]/10'
                        : 'border-white/5 hover:border-white/20 bg-[#121212]'
                    }`}
                  >
                    <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 bg-[#282828]">
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-[#1ed760]/30 flex items-center justify-center">
                          <Check className="w-5 h-5 text-white stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <span className={`text-[10px] truncate max-w-full font-medium ${isSelected ? 'text-[#1ed760]' : 'text-[#b3b3b3]'}`}>
                      {preset.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom URL Input Fallback */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-xs font-bold text-[#b3b3b3]">
              Or paste custom image web link
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={customUrlInput}
                onChange={(e) => setCustomUrlInput(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="flex-1 h-10 px-3.5 rounded-xl bg-[#242424] border border-white/10 text-white placeholder-[#727272] text-xs focus:outline-none focus:border-[#1ed760] transition"
              />
              <button
                type="button"
                onClick={handleApplyCustomUrl}
                disabled={!customUrlInput.trim()}
                className="px-4 h-10 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40 text-xs font-bold text-white transition cursor-pointer"
              >
                Apply
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full text-xs font-bold text-[#b3b3b3] hover:text-white hover:bg-white/5 transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-full bg-[#1ed760] hover:bg-[#1fdf64] active:scale-95 text-black font-bold text-xs flex items-center gap-2 shadow-lg shadow-[#1ed760]/20 transition cursor-pointer disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
