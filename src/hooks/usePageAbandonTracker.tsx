import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAnalytics } from './useAnalytics';

export const usePageAbandonTracker = () => {
  const location = useLocation();
  const { trackPageAbandon } = useAnalytics();
  const pageStartTime = useRef<number>(Date.now());
  const currentPage = useRef<string>(location.pathname);

  useEffect(() => {
    // Track abandonment of previous page when navigating
    const previousPage = currentPage.current;
    const timeOnPage = Date.now() - pageStartTime.current;

    if (previousPage !== location.pathname && timeOnPage > 1000) { // Only track if spent more than 1 second
      trackPageAbandon(previousPage, timeOnPage);
    }

    // Update refs for new page
    currentPage.current = location.pathname;
    pageStartTime.current = Date.now();
  }, [location.pathname, trackPageAbandon]);

  // Track page abandonment on window unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      const timeOnPage = Date.now() - pageStartTime.current;
      if (timeOnPage > 1000) {
        trackPageAbandon(currentPage.current, timeOnPage);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [trackPageAbandon]);

  // Track visibility changes (tab switching)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        const timeOnPage = Date.now() - pageStartTime.current;
        if (timeOnPage > 5000) { // Only track if spent more than 5 seconds
          trackPageAbandon(currentPage.current, timeOnPage);
        }
      } else {
        // Reset timer when coming back to tab
        pageStartTime.current = Date.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [trackPageAbandon]);
};