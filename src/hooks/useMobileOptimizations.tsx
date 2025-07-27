import { useEffect, useState } from 'react';
import { useIsMobile } from './use-mobile';

interface MobileOptimizations {
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  safeAreaInsets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  keyboard: {
    isVisible: boolean;
    height: number;
  };
}

interface MobileTouchOptions {
  disableContextMenu?: boolean;
  disableCallout?: boolean;
  disableUserSelect?: boolean;
}

// Touch optimizations hook
export const useMobileTouchOptimizations = (options: MobileTouchOptions = {}) => {
  const isMobile = useIsMobile();
  const {
    disableContextMenu = false,
    disableCallout = true,
    disableUserSelect = false,
  } = options;

  useEffect(() => {
    if (!isMobile) return;

    // Disable context menu on mobile to prevent accidental image saves
    const handleContextMenu = (e: Event) => {
      if (disableContextMenu) {
        e.preventDefault();
      }
    };

    // Apply touch optimizations
    if (disableCallout) {
      (document.body.style as any).webkitTouchCallout = 'none';
    }

    if (disableUserSelect) {
      (document.body.style as any).webkitUserSelect = 'none';
      document.body.style.userSelect = 'none';
    }

    // Enable hardware acceleration for smooth animations
    (document.body.style as any).webkitTransform = 'translateZ(0)';
    document.body.style.transform = 'translateZ(0)';

    // Optimized touch-action for better scrolling
    document.body.style.touchAction = 'pan-y pinch-zoom';
    
    // Remove tap highlight
    (document.body.style as any).webkitTapHighlightColor = 'transparent';
    
    // Ensure mobile viewport is stable
    document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);

    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      
      // Cleanup styles
      (document.body.style as any).webkitTouchCallout = '';
      (document.body.style as any).webkitUserSelect = '';
      document.body.style.userSelect = '';
      (document.body.style as any).webkitTransform = '';
      document.body.style.transform = '';
      document.body.style.touchAction = '';
      (document.body.style as any).webkitTapHighlightColor = '';
    };
  }, [isMobile, disableContextMenu, disableCallout, disableUserSelect]);
};

export const useMobileOptimizations = (): MobileOptimizations => {
  const isMobile = useIsMobile();
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [safeAreaInsets, setSafeAreaInsets] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });
  const [keyboard, setKeyboard] = useState({
    isVisible: false,
    height: 0,
  });

  useEffect(() => {
    // Detect platform
    const userAgent = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(userAgent));
    setIsAndroid(/Android/.test(userAgent));

    // Get safe area insets
    const updateSafeAreaInsets = () => {
      const getCSSSafeAreaInsetValue = (property: string): number => {
        const value = getComputedStyle(document.documentElement)
          .getPropertyValue(property)
          .replace('px', '');
        return parseFloat(value) || 0;
      };

      setSafeAreaInsets({
        top: getCSSSafeAreaInsetValue('--safe-area-inset-top'),
        bottom: getCSSSafeAreaInsetValue('--safe-area-inset-bottom'),
        left: getCSSSafeAreaInsetValue('--safe-area-inset-left'),
        right: getCSSSafeAreaInsetValue('--safe-area-inset-right'),
      });
    };

    updateSafeAreaInsets();
    window.addEventListener('resize', updateSafeAreaInsets);

    // Virtual keyboard detection
    let initialViewportHeight = window.innerHeight;
    
    const handleResize = () => {
      const currentHeight = window.innerHeight;
      const heightDifference = initialViewportHeight - currentHeight;
      
      // Update viewport height variable for stable layouts
      document.documentElement.style.setProperty('--vh', `${currentHeight * 0.01}px`);
      
      // Threshold for keyboard detection (adjust as needed)
      const keyboardThreshold = 150;
      
      if (heightDifference > keyboardThreshold) {
        setKeyboard({
          isVisible: true,
          height: heightDifference,
        });
      } else {
        setKeyboard({
          isVisible: false,
          height: 0,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    // iOS specific optimizations
    if (isIOS) {
      // Prevent elastic bounce but allow normal scrolling
      document.body.style.overscrollBehavior = 'none';
      
      // Enable smooth scrolling for profile cards
      const profileCards = document.querySelectorAll('.profile-content-scroll');
      profileCards.forEach(element => {
        ((element as HTMLElement).style as any).webkitOverflowScrolling = 'touch';
        (element as HTMLElement).style.overscrollBehavior = 'contain';
      });
      
      // Allow scrolling in all mobile-scroll containers
      const scrollableElements = document.querySelectorAll('.mobile-scroll, .profile-content-scroll');
      scrollableElements.forEach(element => {
        element.addEventListener('touchstart', () => {}, { passive: true });
        element.addEventListener('touchmove', () => {}, { passive: true });
      });
    }

    return () => {
      window.removeEventListener('resize', updateSafeAreaInsets);
      window.removeEventListener('resize', handleResize);
      
      if (isIOS) {
        document.body.style.overscrollBehavior = '';
      }
    };
  }, [isIOS]);

  return {
    isMobile,
    isIOS,
    isAndroid,
    safeAreaInsets,
    keyboard,
  };
};