import { Heart, Users, MessageCircle, MessagesSquare, HandHeart } from 'lucide-react';
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
    { id: 'likes', label: 'Connections', icon: HandHeart },
    { id: 'messages', label: 'Messages', icon: MessageCircle },
    { id: 'forum', label: 'Forum', icon: MessagesSquare },
  ];

  const handleTabClick = (tabId: string) => {
    if (tabId !== activeTab) {
      buttonPress();
      onTabChange(tabId);
    }
  };

  return (
    <div 
      className="mobile-nav-fixed !fixed !bottom-0 !left-0 !right-0 !z-[99999] bg-white/98 backdrop-blur-xl border-t border-gray-200 shadow-[0_-2px_20px_rgba(0,0,0,0.15)] supports-[backdrop-filter]:bg-white/95"
      style={{ 
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 999999,
        paddingBottom: Math.max(safeAreaBottom, 12),
        width: '100vw',
        transform: 'translateZ(0)',
        willChange: 'transform',
        WebkitTransform: 'translateZ(0)',
        contain: 'layout style paint'
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
                "flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 min-w-0 flex-1",
                isActive 
                  ? "bg-primary/10 text-primary scale-105" 
                  : "text-gray-600 hover:text-primary hover:bg-primary/5 active:scale-95"
              )}
            >
              <Icon className={cn(
                "transition-all duration-200",
                isActive ? "w-7 h-7" : "w-6 h-6"
              )} />
              <span className={cn(
                "text-sm font-medium mt-1 transition-all duration-200",
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