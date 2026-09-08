import React from 'react';
import { Home, Search, Library, User } from 'lucide-react';

export type DashboardTab = 'home' | 'search' | 'library' | 'profile';

interface MobileBottomNavProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
}) => {
  const tabs = [
    { id: 'home' as DashboardTab, label: 'Home', icon: Home },
    { id: 'search' as DashboardTab, label: 'Search', icon: Search },
    { id: 'library' as DashboardTab, label: 'Your Library', icon: Library },
    { id: 'profile' as DashboardTab, label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-[60px] bg-[#121212]/95 backdrop-blur-xl border-t border-white/10 md:hidden flex items-center justify-around px-2 select-none safe-area-pb">
      {tabs.map(({ id, label, icon: Icon }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex-1 h-full flex flex-col items-center justify-center gap-1 transition-all duration-150 cursor-pointer ${
              isActive ? 'text-white' : 'text-[#7c7c7c] hover:text-[#b3b3b3]'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
              {isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#1ed760] rounded-full" />
              )}
            </div>
            <span className={`text-[10px] tracking-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
