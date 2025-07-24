import { useEffect } from 'react';
import { useMobileOptimizations } from '@/hooks/useMobileOptimizations';

interface MobileStatusBarProps {
  theme?: 'light' | 'dark';
  color?: string;
}

const MobileStatusBar = ({ 
  theme = 'light', 
  color = '#2563eb' 
}: MobileStatusBarProps) => {
  const { isMobile, isIOS, isAndroid } = useMobileOptimizations();

  useEffect(() => {
    if (!isMobile) return;

    // Update theme color meta tag
    let themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeColorMeta) {
      themeColorMeta = document.createElement('meta');
      themeColorMeta.setAttribute('name', 'theme-color');
      document.head.appendChild(themeColorMeta);
    }
    themeColorMeta.setAttribute('content', color);

    // iOS specific status bar styling
    if (isIOS) {
      let statusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
      if (!statusBarMeta) {
        statusBarMeta = document.createElement('meta');
        statusBarMeta.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
        document.head.appendChild(statusBarMeta);
      }
      statusBarMeta.setAttribute('content', theme === 'dark' ? 'black-translucent' : 'default');
    }

    // Android specific theme color for status bar
    if (isAndroid) {
      // Android uses theme-color meta tag which we already set above
    }

    return () => {
      // Cleanup not needed as we want to keep the meta tags
    };
  }, [isMobile, isIOS, isAndroid, theme, color]);

  return null; // This component doesn't render anything
};

export default MobileStatusBar;
