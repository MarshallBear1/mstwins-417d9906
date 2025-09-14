import { useEffect } from 'react';

interface UseDiscoverScrollPreventionProps {
  isDiscoverTab: boolean;
  isCardFlipped: boolean;
}

export const useDiscoverScrollPrevention = ({ isDiscoverTab, isCardFlipped }: UseDiscoverScrollPreventionProps) => {
  useEffect(() => {
    // Only prevent scroll when extended profile overlay is open
    // Allow normal scrolling on the discover page itself
    return () => {
      // Cleanup function - restore scroll if needed
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isDiscoverTab]);
};