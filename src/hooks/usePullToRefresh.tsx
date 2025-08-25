import { useCallback, useRef, useState, useEffect } from 'react';
import { useHaptics } from './useHaptics';

interface PullToRefreshConfig {
  onRefresh: () => Promise<void>;
  threshold?: number;
  disabled?: boolean;
}

export const usePullToRefresh = ({ 
  onRefresh, 
  threshold = 80, 
  disabled = false 
}: PullToRefreshConfig) => {
  const { impact } = useHaptics();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [shouldTrigger, setShouldTrigger] = useState(false);
  
  const startY = useRef<number>(0);
  const isDragging = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    const scrollTop = containerRef.current?.scrollTop || window.scrollY;
    if (scrollTop > 0) return;

    startY.current = e.touches[0].clientY;
    isDragging.current = true;
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging.current || disabled || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startY.current;

    if (deltaY > 0) {
      e.preventDefault();
      const distance = Math.min(deltaY * 0.5, threshold * 1.5);
      setPullDistance(distance);
      
      if (distance >= threshold && !shouldTrigger) {
        setShouldTrigger(true);
        impact('medium');
      } else if (distance < threshold && shouldTrigger) {
        setShouldTrigger(false);
      }
    }
  }, [threshold, impact, disabled, isRefreshing, shouldTrigger]);

  const handleTouchEnd = useCallback(async () => {
    if (!isDragging.current) return;

    isDragging.current = false;

    if (shouldTrigger && !isRefreshing) {
      setIsRefreshing(true);
      impact('heavy');
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }

    setPullDistance(0);
    setShouldTrigger(false);
  }, [shouldTrigger, isRefreshing, onRefresh, impact]);

  useEffect(() => {
    const element = containerRef.current || document;
    
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const pullToRefreshStyles = {
    transform: `translateY(${pullDistance * 0.8}px)`,
    transition: isDragging.current ? 'none' : 'transform 0.3s ease-out',
  };

  return {
    containerRef,
    isRefreshing,
    pullDistance,
    shouldTrigger,
    pullToRefreshStyles,
  };
};