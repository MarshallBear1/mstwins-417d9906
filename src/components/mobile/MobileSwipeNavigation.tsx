import { useCallback, useRef, useState, useEffect } from 'react';
import { useHaptics } from '@/hooks/useHaptics';

interface MobileSwipeNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: { id: string; name: string }[];
  children: React.ReactNode;
}

const MobileSwipeNavigation = ({ 
  activeTab, 
  onTabChange, 
  tabs, 
  children 
}: MobileSwipeNavigationProps) => {
  const { selection } = useHaptics();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const startX = useRef<number>(0);
  const startY = useRef<number>(0);
  const isDragging = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const getCurrentTabIndex = useCallback(() => {
    return tabs.findIndex(tab => tab.id === activeTab);
  }, [activeTab, tabs]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isTransitioning) return;
    
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isDragging.current = false;
  }, [isTransitioning]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isTransitioning) return;
    
    const deltaX = Math.abs(e.touches[0].clientX - startX.current);
    const deltaY = Math.abs(e.touches[0].clientY - startY.current);
    
    // Only start dragging if horizontal movement is greater than vertical
    if (deltaX > deltaY && deltaX > 10) {
      isDragging.current = true;
      e.preventDefault(); // Prevent scrolling
    }
  }, [isTransitioning]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current || isTransitioning) return;
    
    const endX = e.changedTouches[0].clientX;
    const deltaX = endX - startX.current;
    const threshold = 100; // Minimum swipe distance
    
    const currentIndex = getCurrentTabIndex();
    
    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0 && currentIndex > 0) {
        // Swipe right - previous tab
        selection();
        setIsTransitioning(true);
        onTabChange(tabs[currentIndex - 1].id);
      } else if (deltaX < 0 && currentIndex < tabs.length - 1) {
        // Swipe left - next tab
        selection();
        setIsTransitioning(true);
        onTabChange(tabs[currentIndex + 1].id);
      }
    }
    
    isDragging.current = false;
  }, [getCurrentTabIndex, onTabChange, tabs, selection, isTransitioning]);

  useEffect(() => {
    if (isTransitioning) {
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isTransitioning]);

  return (
    <div 
      ref={containerRef}
      className="h-full w-full overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        className={`h-full w-full transition-transform duration-300 ease-out ${
          isTransitioning ? 'transform' : ''
        }`}
      >
        {children}
      </div>
    </div>
  );
};

export default MobileSwipeNavigation;