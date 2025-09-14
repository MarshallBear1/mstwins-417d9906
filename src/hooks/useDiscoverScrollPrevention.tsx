import { useEffect } from 'react';

interface UseDiscoverScrollPreventionProps {
  isDiscoverTab: boolean;
  isCardFlipped: boolean;
}

export const useDiscoverScrollPrevention = ({ isDiscoverTab, isCardFlipped }: UseDiscoverScrollPreventionProps) => {
  useEffect(() => {
    // Simplified: only prevent scroll on discover tab, extended profile handles its own scroll prevention
    if (isDiscoverTab) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
      };
    }
  }, [isDiscoverTab]);
};