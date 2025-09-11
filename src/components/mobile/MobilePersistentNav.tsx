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
      className="mobile-nav-fixed !fixed !bottom-0 !left-0 !right-0 !z-[99999] bg-white/95 backdrop-blur-xl border-t border-border/20 shadow-[0_-4px_32px_rgba(0,0,0,0.12)] supports-[backdrop-filter]:bg-white/90 dark:bg-gray-950/95 dark:border-gray-800/30"
      style={{ 
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 999999,
        paddingBottom: Math.max(safeAreaBottom, 16),
        width: '100vw',
        transform: 'translateZ(0)',
        willChange: 'transform',
        WebkitTransform: 'translateZ(0)',
        contain: 'layout style paint'
      }}
    >
      <div className="flex items-center justify-around px-3 py-3 md:px-6 md:py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={cn(
                "flex flex-col items-center justify-center p-3 md:p-4 rounded-xl transition-all duration-300 min-w-0 flex-1 group",
                "hover:scale-105 active:scale-95",
                isActive 
                  ? "bg-primary/15 text-primary shadow-sm" 
                  : "text-muted-foreground hover:text-primary hover:bg-primary/8"
              )}
            >
              <Icon className={cn(
                "transition-all duration-300",
                "w-6 h-6 md:w-8 md:h-8",
                isActive ? "scale-110" : "group-hover:scale-105"
              )} />
              <span className={cn(
                "font-medium mt-1.5 transition-all duration-300 leading-none",
                "text-xs md:text-sm",
                isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"
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