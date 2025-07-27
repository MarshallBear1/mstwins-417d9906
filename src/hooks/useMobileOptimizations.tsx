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
      // Prevent elastic bounce but allow scrolling
      document.body.style.overscrollBehavior = 'none';
      
      // Allow scrolling in specific containers
      const scrollableElements = document.querySelectorAll('.mobile-scroll');
      scrollableElements.forEach(element => {
        element.addEventListener('touchstart', () => {}, { passive: true });
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