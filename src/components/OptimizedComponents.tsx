import React, { memo, useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Optimized button with debouncing to prevent double-clicks
interface OptimizedButtonProps {
  onClick?: () => void | Promise<void>;
  debounceMs?: number;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export const OptimizedButton = memo(({ 
  onClick, 
  debounceMs = 500, 
  children, 
  disabled = false,
  className,
  variant,
  size,
  ...props 
}: OptimizedButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastClickRef = useRef<number>(0);

  const handleClick = useCallback(async () => {
    const now = Date.now();
    
    // Prevent double clicks
    if (now - lastClickRef.current < debounceMs || isLoading) {
      return;
    }
    
    lastClickRef.current = now;
    
    if (!onClick) return;
    
    try {
      setIsLoading(true);
      await onClick();
    } catch (error) {
      console.error('Button click error:', error);
    } finally {
      // Minimum loading state duration for better UX
      timeoutRef.current = setTimeout(() => {
        setIsLoading(false);
      }, 200);
    }
  }, [onClick, debounceMs, isLoading]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={cn(
        isLoading && "opacity-70 cursor-not-allowed",
        className
      )}
      variant={variant}
      size={size}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 animate-spin rounded-full border border-current border-t-transparent" />
          {typeof children === 'string' ? 'Loading...' : children}
        </div>
      ) : (
        children
      )}
    </Button>
  );
});

OptimizedButton.displayName = 'OptimizedButton';

// Optimized card with intersection observer for lazy loading
interface OptimizedCardProps {
  children: React.ReactNode;
  className?: string;
  onVisible?: () => void;
  threshold?: number;
}

export const OptimizedCard = memo(({ 
  children, 
  className, 
  onVisible,
  threshold = 0.1 
}: OptimizedCardProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver>();

  useEffect(() => {
    if (!cardRef.current || !onVisible) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
          onVisible();
          observerRef.current?.disconnect();
        }
      },
      { threshold }
    );

    observerRef.current.observe(cardRef.current);

    return () => observerRef.current?.disconnect();
  }, [onVisible, threshold, isVisible]);

  return (
    <Card ref={cardRef} className={className}>
      {children}
    </Card>
  );
});

OptimizedCard.displayName = 'OptimizedCard';

// Optimized list component with virtual scrolling for large datasets
interface OptimizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  itemHeight?: number;
  containerHeight?: number;
  overscan?: number;
}

export function OptimizedList<T>({ 
  items, 
  renderItem, 
  className,
  itemHeight = 100,
  containerHeight = 400,
  overscan = 5 
}: OptimizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index
    }));
  }, [items, startIndex, endIndex]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  if (items.length < 50) {
    // Don't use virtual scrolling for small lists
    return (
      <div className={className}>
        {items.map((item, index) => renderItem(item, index))}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("overflow-auto", className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map(({ item, index }) => (
            <div key={index} style={{ height: itemHeight }}>
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Optimized loading skeleton
interface LoadingSkeletonProps {
  count?: number;
  height?: string;
  className?: string;
}

export const LoadingSkeleton = memo(({ 
  count = 3, 
  height = "4rem", 
  className 
}: LoadingSkeletonProps) => {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse bg-gray-200 rounded-lg"
          style={{ height }}
        />
      ))}
    </div>
  );
});

LoadingSkeleton.displayName = 'LoadingSkeleton';

// Optimized error boundary component
interface OptimizedErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error) => void;
}

export class OptimizedErrorBoundary extends React.Component<
  OptimizedErrorBoundaryProps,
  { hasError: boolean; error?: Error }
> {
  constructor(props: OptimizedErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('OptimizedErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <Card className="p-6 text-center">
          <CardContent>
            <h3 className="text-lg font-semibold text-red-600 mb-2">Something went wrong</h3>
            <p className="text-gray-600 mb-4">
              We encountered an error while loading this content.
            </p>
            <Button
              onClick={() => this.setState({ hasError: false, error: undefined })}
              variant="outline"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}