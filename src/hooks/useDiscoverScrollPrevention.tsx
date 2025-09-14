import { useEffect } from 'react';

interface UseDiscoverScrollPreventionProps {
  isDiscoverTab: boolean;
  isCardFlipped: boolean;
}

export const useDiscoverScrollPrevention = ({ isDiscoverTab, isCardFlipped }: UseDiscoverScrollPreventionProps) => {
  useEffect(() => {
    console.log('🚫 Scroll prevention - isDiscoverTab:', isDiscoverTab, 'isCardFlipped:', isCardFlipped);
    
    let preventTouchMove: ((e: TouchEvent) => void) | null = null;
    
    // Immediately restore scroll when card is flipped
    if (isCardFlipped) {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      return;
    }
    
    // Only prevent scroll on discover tab when card is not flipped (front side)
    if (isDiscoverTab && !isCardFlipped) {
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      
      // Prevent touch move events that could cause scrolling
      preventTouchMove = (e: TouchEvent) => {
        const target = e.target as HTMLElement;
        
        // Allow touch events on scrollable elements, buttons, or back face content
        if (target.closest('[data-scrollable]') || 
            target.closest('[data-no-swipe="true"]') || 
            target.closest('.touch-none') || 
            target.closest('[data-swipeable]') ||
            target.closest('button') ||
            target.closest('.flip-card-back') ||
            target.closest('.back-face') ||
            target.closest('[role="button"]') ||
            target.tagName === 'BUTTON' ||
            target.getAttribute('data-no-swipe') === 'true' ||
            // Check if any parent has the back face or flipped class
            target.closest('.flip-card-face.flip-card-back') ||
            // Additional safety for any element inside flipped card
            document.querySelector('.flip-card-container.flipped')?.contains(target)) {
          return;
        }
        
        // Prevent default scroll behavior
        e.preventDefault();
      };
      
      document.addEventListener('touchmove', preventTouchMove, { passive: false });
      
      return () => {
        // Restore scroll and clean up event listener
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        if (preventTouchMove) {
          document.removeEventListener('touchmove', preventTouchMove);
        }
      };
    } else {
      // Restore scroll when not on discover tab
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
  }, [isDiscoverTab, isCardFlipped]);
};