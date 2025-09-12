import { useRef, useCallback, useState } from 'react';
import { useHaptics } from './useHaptics';

interface SwipeConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  preventDefaultTouchmove?: boolean;
}

export const useSwipeGestures = (config: SwipeConfig) => {
  const { threshold = 50, preventDefaultTouchmove = false } = config;
  const { selection, impact } = useHaptics();
  
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [swipeProgress, setSwipeProgress] = useState({ x: 0, y: 0 });

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Check if the touch started on an element that should not trigger swipes
    const target = e.target as HTMLElement;
    if (target.closest('[data-no-swipe="true"]')) {
      return;
    }
    
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
    setSwipeProgress({ x: 0, y: 0 });
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    
    // Check if the touch is on an element that should not trigger swipes
    const target = e.target as HTMLElement;
    if (target.closest('[data-no-swipe="true"]')) {
      return;
    }
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    
    setSwipeProgress({ x: deltaX, y: deltaY });
    
    if (preventDefaultTouchmove && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
      e.preventDefault();
    }
  }, [preventDefaultTouchmove]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || isTransitioning) return;

    // Check if the touch ended on an element that should not trigger swipes
    const target = e.changedTouches[0].target as HTMLElement;
    if (target.closest('[data-no-swipe="true"]')) {
      touchStartRef.current = null;
      setSwipeProgress({ x: 0, y: 0 });
      return;
    }

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;
    
    // Only trigger if swipe was fast enough (under 500ms) and far enough
    if (deltaTime > 500) {
      touchStartRef.current = null;
      setSwipeProgress({ x: 0, y: 0 });
      return;
    }

    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    if (absDeltaX > threshold && absDeltaX > absDeltaY) {
      setIsTransitioning(true);
      if (deltaX > 0) {
        selection();
        config.onSwipeRight?.();
      } else {
        selection();
        config.onSwipeLeft?.();
      }
      setTimeout(() => setIsTransitioning(false), 300);
    } else if (absDeltaY > threshold && absDeltaY > absDeltaX) {
      if (deltaY > 0) {
        impact('light');
        config.onSwipeDown?.();
      } else {
        impact('light');
        config.onSwipeUp?.();
      }
    }

    touchStartRef.current = null;
    setSwipeProgress({ x: 0, y: 0 });
  }, [config, threshold, selection, impact, isTransitioning]);

  const swipeHandlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };

  return {
    swipeHandlers,
    swipeProgress,
    isTransitioning
  };
};