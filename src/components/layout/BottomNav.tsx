import React from 'react';
import { Home, Compass, Library, Upload } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenUpload: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, onOpenUpload }) => {
  const tabs = [
    { id: 'home', label: 'Explore', icon: Home },
    { id: 'search', label: 'Search', icon: Compass },
    { id: 'library', label: 'Library', icon: Library }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#08080a]/95 backdrop-blur-2xl border-t border-white/[0.08] px-3 py-2 flex items-center justify-around select-none">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all ${
              isActive ? 'text-[#1db954] font-bold' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'text-[#1db954] scale-105' : 'text-neutral-400'} transition-transform`} />
            <span className="text-[10px] font-mono tracking-wider uppercase">{tab.label}</span>
          </button>
        );
      })}

      <button
        onClick={onOpenUpload}
        className="flex flex-col items-center gap-1 py-1 px-4 text-neutral-400 hover:text-white"
      >
        <Upload className="w-5 h-5" />
        <span className="text-[10px] font-mono tracking-wider uppercase">Upload</span>
      </button>
    </nav>
  );
};
