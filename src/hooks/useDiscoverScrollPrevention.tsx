import { useEffect } from 'react';

interface UseDiscoverScrollPreventionProps {
  isDiscoverTab: boolean;
  isCardFlipped: boolean;
}

export const useDiscoverScrollPrevention = ({ isDiscoverTab, isCardFlipped }: UseDiscoverScrollPreventionProps) => {
  useEffect(() => {
    console.log('🚫 Scroll prevention - isDiscoverTab:', isDiscoverTab, 'isCardFlipped:', isCardFlipped);
    
    // Only prevent scroll on discover tab when card is not flipped (front side)
    if (isDiscoverTab && !isCardFlipped) {
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      
      // Prevent touch move events that could cause scrolling
      const preventTouchMove = (e: TouchEvent) => {
        const target = e.target as HTMLElement;
        
        // Allow touch events on scrollable elements or elements marked with data-no-swipe
        if (target.closest('[data-scrollable]') || 
            target.closest('[data-no-swipe="true"]') || 
            target.closest('.touch-none') || 
            target.closest('[data-swipeable]')) {
          return;
        }
        
        // Prevent default scroll behavior
        e.preventDefault();
      };
      
      document.addEventListener('touchmove', preventTouchMove, { passive: false });
      
      return () => {
        // Restore scroll
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        document.removeEventListener('touchmove', preventTouchMove);
      };
    } else {
      // Restore scroll when card is flipped
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
  }, [isDiscoverTab, isCardFlipped]);
};