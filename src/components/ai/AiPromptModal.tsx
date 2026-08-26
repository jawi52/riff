import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Send,
  Wand2,
  Play,
  CheckCircle2
} from 'lucide-react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useLibraryStore } from '../../stores/useLibraryStore';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { GLOBAL_CATALOG } from '../../lib/algorithm';
import { Playlist } from '../../types';

const AI_PROMPT_PRESETS = [
  { label: 'Cyberpunk Tokyo 3AM Coding', icon: '⚡', vibe: 'electronic dark synthwave' },
  { label: 'Late Night Rainy Lo-Fi Study', icon: '🌧️', vibe: 'lofi chill chillout instrumental' },
  { label: 'High Energy Trap & Phonk Workout', icon: '🔥', vibe: 'trap phonk hiphop bass' },
  { label: 'Sunset Acoustic Coffee Shop', icon: '☕', vibe: 'acoustic indie folk singer' },
  { label: 'Deep Melodic House Roadtrip', icon: '🚗', vibe: 'deep house progressive dance' },
  { label: 'Anime OST & Hyperpop Euphoria', icon: '✨', vibe: 'hyperpop anime jpop electronic' }
];

export const AiPromptModal: React.FC = () => {
  const { isAiPromptModalOpen, setAiPromptModalOpen } = useSettingsStore();
  const { createPlaylist } = useLibraryStore();
  const { playTrack } = usePlayerStore();

  const [promptInput, setPromptInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlaylist, setGeneratedPlaylist] = useState<Playlist | null>(null);

  if (!isAiPromptModalOpen) return null;

  const handleGenerate = async (queryText?: string) => {
    const text = queryText || promptInput;
    if (!text.trim()) return;

    setIsGenerating(true);
    setGeneratedPlaylist(null);

    // Simulate intelligent LLM taste embedding & multi-source curation
    await new Promise((res) => setTimeout(res, 1200));

    const keywords = text.toLowerCase().split(' ');
    let matchedTracks = GLOBAL_CATALOG.filter((track) => {
      const match =
        keywords.some((k) => track.genre?.toLowerCase().includes(k)) ||
        keywords.some((k) => track.title.toLowerCase().includes(k)) ||
        keywords.some((k) => track.artist.toLowerCase().includes(k));
      return match;
    });

    if (matchedTracks.length < 15) {
      matchedTracks = [...matchedTracks, ...GLOBAL_CATALOG].slice(0, 25);
    }

    const titleWords = text
      .split(' ')
      .slice(0, 4)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    const newPl: Playlist = {
      id: `ai_mix_${Date.now()}`,
      title: `AI Mix: ${titleWords}`,
      description: `Algorithmic generative set crafted from prompt: "${text}"`,
      coverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80',
      creator: 'Riff AI DJ',
      trackCount: matchedTracks.length,
      tracks: matchedTracks,
      isCurated: true,
      updatedAt: Date.now()
    };

    createPlaylist(newPl.title);
    setGeneratedPlaylist(newPl);
    setIsGenerating(false);
  };

  const handlePlayGenerated = () => {
    if (generatedPlaylist && generatedPlaylist.tracks && generatedPlaylist.tracks.length > 0) {
      playTrack(generatedPlaylist.tracks[0], generatedPlaylist.tracks);
      setAiPromptModalOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-[#12131d] border border-cyan-500/30 p-6 space-y-5 shadow-[0_0_50px_rgba(6,182,212,0.15)] animate-in zoom-in-95 duration-200 relative overflow-hidden">
        {/* Neon Ambient Background Glow */}
        <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />

        {/* 1. Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-1.5">
                <span>Riff AI Prompt DJ</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Generative
                </span>
              </h2>
              <p className="text-xs text-neutral-400">Describe any mood, scene, or vibe to build a bespoke mix</p>
            </div>
          </div>

          <button
            onClick={() => setAiPromptModalOpen(false)}
            className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Prompt Input Box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleGenerate();
          }}
          className="space-y-3"
        >
          <div className="relative">
            <textarea
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="e.g. Melodic techno for late night highway cruising with heavy bass and zero vocals..."
              rows={3}
              className="w-full p-3.5 pr-12 rounded-2xl bg-white/[0.04] border border-white/10 text-white placeholder-neutral-500 text-xs font-semibold focus:outline-none focus:border-cyan-400/60 focus:bg-white/[0.07] transition resize-none custom-scrollbar"
            />
            <button
              type="submit"
              disabled={isGenerating || !promptInput.trim()}
              className="absolute right-3 bottom-3 p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:hover:bg-cyan-500 text-black font-black transition cursor-pointer shadow-lg active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* 3. Preset Quick Chips */}
        <div className="space-y-2">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
            <Wand2 className="w-3 h-3 text-cyan-400" />
            <span>Instant Vibe Inspirations</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {AI_PROMPT_PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  setPromptInput(preset.label);
                  handleGenerate(preset.vibe);
                }}
                className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.10] border border-white/[0.08] text-[11px] font-bold text-neutral-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>{preset.icon}</span>
                <span>{preset.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 4. Generation Progress / Output */}
        {isGenerating && (
          <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center gap-3 animate-pulse">
            <div className="w-6 h-6 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black text-cyan-300">Synthesizing Audio Vectors...</p>
              <p className="text-[10px] text-cyan-400/80">Matching harmonic cadence, BPM, and mood parameters</p>
            </div>
          </div>
        )}

        {generatedPlaylist && !isGenerating && (
          <div className="p-4 rounded-2xl bg-white/[0.04] border border-cyan-500/40 space-y-3 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={generatedPlaylist.coverUrl}
                  alt=""
                  className="w-12 h-12 rounded-xl object-cover shadow-md shrink-0 border border-cyan-500/40"
                />
                <div className="min-w-0">
                  <p className="text-xs font-black text-white truncate">{generatedPlaylist.title}</p>
                  <p className="text-[11px] text-neutral-400 truncate flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>{generatedPlaylist.trackCount} tracks synthesized</span>
                  </p>
                </div>
              </div>

              <button
                onClick={handlePlayGenerated}
                className="px-4 py-2 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs transition flex items-center gap-1.5 shadow-lg active:scale-95 cursor-pointer shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play Now</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiPromptModal;
