import { useEffect } from 'react';
import { useMobileOptimizations } from '@/hooks/useMobileOptimizations';

interface MobileTouchOptimizationsProps {
  disableContextMenu?: boolean;
  disableCallout?: boolean;
  disableUserSelect?: boolean;
}

const MobileTouchOptimizations = ({
  disableContextMenu = false,
  disableCallout = true,
  disableUserSelect = false,
}: MobileTouchOptimizationsProps) => {
  const { isMobile } = useMobileOptimizations();

  useEffect(() => {
    if (!isMobile) return;

    // Disable context menu on mobile to prevent accidental image saves
    const handleContextMenu = (e: Event) => {
      if (disableContextMenu) {
        e.preventDefault();
      }
    };

    // Disable iOS callout (magnifying glass)
    if (disableCallout) {
      (document.body.style as any).webkitTouchCallout = 'none';
    }

    // Disable text selection if requested
    if (disableUserSelect) {
      (document.body.style as any).webkitUserSelect = 'none';
      document.body.style.userSelect = 'none';
    }

    // Enable hardware acceleration for smooth animations
    (document.body.style as any).webkitTransform = 'translateZ(0)';
    document.body.style.transform = 'translateZ(0)';

    // Add touch-action optimization
    document.body.style.touchAction = 'manipulation';

    // Add webkit optimization for iOS
    (document.body.style as any).webkitTapHighlightColor = 'transparent';

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

  return null;
};

export default MobileTouchOptimizations;