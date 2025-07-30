import { memo, useMemo, useState, useRef, useEffect } from 'react';

// Optimized avatar component with memoization
interface OptimizedAvatarProps {
  src?: string | null;
  alt: string;
  fallbackSeed: string;
  className?: string;
  loading?: 'eager' | 'lazy';
}

export const OptimizedAvatar = memo(({ src, alt, fallbackSeed, className = '', loading = 'lazy' }: OptimizedAvatarProps) => {
  const fallbackUrl = useMemo(() => 
    `https://api.dicebear.com/6.x/avataaars/svg?seed=${fallbackSeed}&backgroundColor=b6e3f4,c0aede&eyes=happy&mouth=smile`,
    [fallbackSeed]
  );

  return (
    <img 
      src={src || fallbackUrl}
      alt={alt}
      className={className}
      loading={loading}
      onError={(e) => {
        if (e.currentTarget.src !== fallbackUrl) {
          e.currentTarget.src = fallbackUrl;
        }
      }}
      style={{
        opacity: '0',
        transition: 'opacity 0.3s ease'
      }}
      onLoad={(e) => {
        e.currentTarget.style.opacity = '1';
      }}
    />
  );
});

OptimizedAvatar.displayName = 'OptimizedAvatar';

// Debounced search input component
interface DebouncedInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  delay?: number;
  className?: string;
}

export const DebouncedInput = memo(({ value, onChange, placeholder, delay = 300, className }: DebouncedInputProps) => {
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (newValue: string) => {
    setLocalValue(newValue);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      onChange(newValue);
    }, delay);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <input
      type="text"
      value={localValue}
      onChange={(e) => handleChange(e.target.value)}
      placeholder={placeholder}
      className={className}
    />
  );
});

DebouncedInput.displayName = 'DebouncedInput';

// Performance monitoring component
export const PerformanceMonitor = memo(() => {
  useEffect(() => {
    // Monitor performance and log slow operations
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.duration > 100) { // Log operations taking more than 100ms
          console.warn(`🐌 Slow operation detected: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
        }
      });
    });

    observer.observe({ type: 'measure', buffered: true });
    observer.observe({ type: 'navigation', buffered: true });

    return () => observer.disconnect();
  }, []);

  return null;
});

PerformanceMonitor.displayName = 'PerformanceMonitor';