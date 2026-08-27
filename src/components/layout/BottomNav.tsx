import React from 'react';
import { Home, Search, Library, BarChart3 } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenUpload: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'library', label: 'Library', icon: Library },
    { id: 'stats', label: 'Stats', icon: BarChart3 }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0a0c14]/90 backdrop-blur-3xl border-t border-white/[0.08] px-4 py-2 flex items-center justify-around select-none safe-area-pb shadow-[0_-8px_30px_rgba(0,0,0,0.6)]">
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
            className={`flex flex-col items-center gap-1 py-1 px-4 rounded-2xl transition-all cursor-pointer ${
              isActive
                ? 'text-cyan-400 font-black scale-105'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-cyan-500/15 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.4)]' : ''}`}>
              <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'text-neutral-400'}`} />
            </div>
            <span className="text-[10px] font-bold tracking-tight">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
