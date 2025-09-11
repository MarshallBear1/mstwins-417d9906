import { Heart, Users, MessageCircle, User, Grid3X3 } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';
import { cn } from '@/lib/utils';

interface MobilePersistentNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  safeAreaBottom: number;
}

const MobilePersistentNav = ({ activeTab, onTabChange, safeAreaBottom }: MobilePersistentNavProps) => {
  const { buttonPress } = useHaptics();

  const navItems = [
    { id: 'discover', label: 'Discover', icon: Heart },
    { id: 'likes', label: 'Matches', icon: Users },
    { id: 'messages', label: 'Messages', icon: MessageCircle },
    { id: 'forum', label: 'Forum', icon: Grid3X3 },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const handleTabClick = (tabId: string) => {
    if (tabId !== activeTab) {
      buttonPress();
      onTabChange(tabId);
    }
  };

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-[60] bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-[0_-2px_20px_rgba(0,0,0,0.1)] supports-[backdrop-filter]:bg-white/80"
      style={{ 
        paddingBottom: Math.max(safeAreaBottom, 8),
        position: 'fixed',
        zIndex: 60
      }}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 min-w-0 flex-1",
                isActive 
                  ? "bg-primary/10 text-primary scale-105" 
                  : "text-gray-600 hover:text-primary hover:bg-primary/5 active:scale-95"
              )}
            >
              <Icon className={cn(
                "transition-all duration-200",
                isActive ? "w-6 h-6" : "w-5 h-5"
              )} />
              <span className={cn(
                "text-xs font-medium mt-1 transition-all duration-200",
                isActive ? "opacity-100" : "opacity-70"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobilePersistentNav;