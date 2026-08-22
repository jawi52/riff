import React from 'react';
import { Home, Search, Library } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenUpload: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'library', label: 'Your Library', icon: Library }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#08090d]/95 backdrop-blur-2xl border-t border-white/[0.08] px-4 py-2 flex items-center justify-around select-none safe-area-pb">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(10);
              setActiveTab(tab.id);
            }}
            className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all cursor-pointer ${
              isActive ? 'text-emerald-400 font-black scale-105' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : 'text-neutral-400'}`} />
            <span className="text-[10px] font-bold tracking-tight">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
