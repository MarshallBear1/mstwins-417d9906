import { useEffect } from 'react';
import { useMobileOptimizations } from '@/hooks/useMobileOptimizations';

const AccessibilityEnhancements = () => {
  const { isMobile } = useMobileOptimizations();

  useEffect(() => {
    // Enhanced keyboard navigation for mobile
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isMobile) return;

      // Handle escape key to close modals/overlays
      if (e.key === 'Escape') {
        const event = new CustomEvent('mobile-escape');
        document.dispatchEvent(event);
      }

      // Improve tab navigation
      if (e.key === 'Tab') {
        // Ensure focus is visible on mobile
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement) {
          activeElement.style.outline = '2px solid hsl(var(--ring))';
          activeElement.style.outlineOffset = '2px';
        }
      }
    };

    // Handle blur to remove focus outline
    const handleBlur = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target) {
        target.style.outline = '';
        target.style.outlineOffset = '';
      }
    };

    // Reduce motion for users who prefer it
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleReducedMotion = () => {
      if (prefersReducedMotion.matches) {
        document.documentElement.style.setProperty('--animation-duration', '0.01ms');
        document.documentElement.style.setProperty('--transition-duration', '0.01ms');
      } else {
        document.documentElement.style.removeProperty('--animation-duration');
        document.documentElement.style.removeProperty('--transition-duration');
      }
    };

    // Set up ARIA live region for announcements
    const createLiveRegion = () => {
      const existingRegion = document.getElementById('mobile-live-region');
      if (existingRegion) return;

      const liveRegion = document.createElement('div');
      liveRegion.id = 'mobile-live-region';
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.style.position = 'absolute';
      liveRegion.style.left = '-10000px';
      liveRegion.style.width = '1px';
      liveRegion.style.height = '1px';
      liveRegion.style.overflow = 'hidden';
      document.body.appendChild(liveRegion);
    };

    // Screen reader announcements
    const announceToScreenReader = (message: string) => {
      const liveRegion = document.getElementById('mobile-live-region');
      if (liveRegion) {
        liveRegion.textContent = message;
        setTimeout(() => {
          liveRegion.textContent = '';
        }, 1000);
      }
    };

    // Custom event listener for screen reader announcements
    const handleAnnouncement = (e: CustomEvent) => {
      announceToScreenReader(e.detail.message);
    };

    // Set up event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('blur', handleBlur, true);
    document.addEventListener('mobile-announce', handleAnnouncement as EventListener);
    
    handleReducedMotion();
    prefersReducedMotion.addEventListener('change', handleReducedMotion);
    
    if (isMobile) {
      createLiveRegion();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('blur', handleBlur, true);
      document.removeEventListener('mobile-announce', handleAnnouncement as EventListener);
      prefersReducedMotion.removeEventListener('change', handleReducedMotion);
      
      const liveRegion = document.getElementById('mobile-live-region');
      if (liveRegion) {
        document.body.removeChild(liveRegion);
      }
    };
  }, [isMobile]);

  return null;
};

export default AccessibilityEnhancements;