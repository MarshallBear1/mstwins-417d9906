import { useEffect } from 'react';

interface UseDiscoverScrollPreventionProps {
  isDiscoverTab: boolean;
  isCardFlipped: boolean;
}

export const useDiscoverScrollPrevention = ({ isDiscoverTab, isCardFlipped }: UseDiscoverScrollPreventionProps) => {
  useEffect(() => {
    console.log('🚫 Scroll prevention - isDiscoverTab:', isDiscoverTab, 'isCardFlipped:', isCardFlipped);
    
    // PRIORITY 1: Immediately and completely restore scroll when card is flipped
    if (isCardFlipped) {
      console.log('🔓 Card is flipped - completely disabling all scroll prevention');
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      
      // Remove any existing touch event listeners immediately
      const existingListeners = (document as any).__touchMoveListeners || [];
      existingListeners.forEach((listener: any) => {
        document.removeEventListener('touchmove', listener);
      });
      (document as any).__touchMoveListeners = [];
      
      return;
    }
    
    // PRIORITY 2: Only prevent scroll on discover tab when card is not flipped
    if (isDiscoverTab && !isCardFlipped) {
      console.log('🔒 Enabling scroll prevention for front face');
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      
      // Create a more targeted touch prevention handler
      const preventTouchMove = (e: TouchEvent) => {
        const target = e.target as HTMLElement;
        
        // CRITICAL: If card becomes flipped, immediately allow all touches
        if (document.querySelector('.flip-card-container.flipped')) {
          console.log('🔓 Found flipped card - allowing touch');
          return;
        }
        
        // Allow touch events on specific interactive elements
        if (target.closest('[data-scrollable]') || 
            target.closest('[data-no-swipe="true"]') || 
            target.closest('.touch-none') || 
            target.closest('[data-swipeable]') ||
            target.closest('button') ||
            target.closest('.flip-card-back') ||
            target.closest('.back-face') ||
            target.closest('[role="button"]') ||
            target.tagName === 'BUTTON' ||
            target.getAttribute('data-no-swipe') === 'true') {
          console.log('🎯 Allowing touch on interactive element:', target.tagName, target.className);
          return;
        }
        
        console.log('🚫 Preventing touch on:', target.tagName, target.className);
        e.preventDefault();
      };
      
      // Track listeners for cleanup
      (document as any).__touchMoveListeners = (document as any).__touchMoveListeners || [];
      (document as any).__touchMoveListeners.push(preventTouchMove);
      
      document.addEventListener('touchmove', preventTouchMove, { passive: false });
      
      return () => {
        console.log('🧹 Cleaning up scroll prevention');
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        document.removeEventListener('touchmove', preventTouchMove);
        
        // Clean up tracked listeners
        const listeners = (document as any).__touchMoveListeners || [];
        const index = listeners.indexOf(preventTouchMove);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      };
    } else {
      // Restore scroll when not on discover tab or card is flipped
      console.log('🔓 Restoring scroll - not on discover tab or card is flipped');
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
  }, [isDiscoverTab, isCardFlipped]);
};