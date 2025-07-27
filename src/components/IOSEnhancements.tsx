import { useEffect } from 'react';
import { useMobileOptimizations } from '@/hooks/useMobileOptimizations';

const IOSEnhancements = () => {
  const { isMobile, isIOS } = useMobileOptimizations();

  useEffect(() => {
    if (!isMobile || !isIOS) return;

    // iOS specific viewport and touch optimizations
    const applyIOSOptimizations = () => {
      // Prevent rubber band scrolling on body
      document.body.style.overscrollBehavior = 'none';
      
      // Disable touch delay for better responsiveness
      document.body.style.touchAction = 'manipulation';
      
      // Prevent zoom on double tap
      let lastTouchEnd = 0;
      document.addEventListener('touchend', (event) => {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
          event.preventDefault();
        }
        lastTouchEnd = now;
      }, false);

      // Handle iOS keyboard appearance
      const handleViewportChange = () => {
        const viewportHeight = window.visualViewport?.height || window.innerHeight;
        const fullHeight = window.screen.height;
        const keyboardHeight = fullHeight - viewportHeight;
        
        // Update CSS variable for keyboard-aware layouts
        document.documentElement.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
        document.documentElement.style.setProperty('--viewport-height', `${viewportHeight}px`);
      };

      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', handleViewportChange);
        handleViewportChange();
      }

      // Smooth scrolling for iOS
      document.documentElement.style.scrollBehavior = 'smooth';
      
      // Optimize touch scrolling
      const scrollElements = document.querySelectorAll('[data-scroll]');
      scrollElements.forEach(element => {
        const htmlElement = element as HTMLElement;
        // @ts-ignore - webkitOverflowScrolling is a valid iOS CSS property
        htmlElement.style.webkitOverflowScrolling = 'touch';
        htmlElement.style.overscrollBehavior = 'contain';
      });

      // iOS status bar color adjustment
      const updateStatusBarColor = () => {
        let statusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
        if (!statusBarMeta) {
          statusBarMeta = document.createElement('meta');
          statusBarMeta.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
          document.head.appendChild(statusBarMeta);
        }
        statusBarMeta.setAttribute('content', 'black-translucent');
      };
      
      updateStatusBarColor();

      // Disable iOS text size adjustment
      // @ts-ignore - webkitTextSizeAdjust is a valid iOS CSS property
      document.body.style.webkitTextSizeAdjust = '100%';
      
      // Improve touch target sizes for iOS
      const buttons = document.querySelectorAll('button, [role="button"], a');
      buttons.forEach(button => {
        const element = button as HTMLElement;
        const computedStyle = window.getComputedStyle(element);
        const height = parseInt(computedStyle.height);
        const width = parseInt(computedStyle.width);
        
        // Ensure minimum touch target size of 44x44px (iOS HIG requirement)
        if (height < 44) {
          element.style.minHeight = '44px';
        }
        if (width < 44) {
          element.style.minWidth = '44px';
        }
      });

      // Handle iOS safe area insets
      const updateSafeAreaInsets = () => {
        const safeAreaTop = getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top');
        const safeAreaBottom = getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom');
        
        // Apply to main content container
        const mainContent = document.querySelector('[data-main-content]');
        if (mainContent) {
          (mainContent as HTMLElement).style.paddingTop = `max(1rem, ${safeAreaTop})`;
          (mainContent as HTMLElement).style.paddingBottom = `max(1rem, ${safeAreaBottom})`;
        }
      };

      updateSafeAreaInsets();
      
      // Listen for orientation changes
      window.addEventListener('orientationchange', () => {
        setTimeout(() => {
          handleViewportChange();
          updateSafeAreaInsets();
        }, 100);
      });
    };

    // Apply optimizations after DOM is ready
    if (document.readyState === 'complete') {
      applyIOSOptimizations();
    } else {
      window.addEventListener('load', applyIOSOptimizations);
    }

    return () => {
      // Cleanup event listeners
      window.removeEventListener('load', applyIOSOptimizations);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', () => {});
      }
      window.removeEventListener('orientationchange', () => {});
    };
  }, [isMobile, isIOS]);

  return null; // This component doesn't render anything visible
};

export default IOSEnhancements;