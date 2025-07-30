import { useEffect, useState, memo } from 'react';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';

// Global performance manager to handle app-wide optimizations
export const PerformanceManager = memo(() => {
  const [performanceMetrics, setPerformanceMetrics] = useState<any>({});
  const { 
    logMetric, 
    measureApiCall, 
    measureRender, 
    getPerformanceSummary,
    measureMemoryUsage 
  } = usePerformanceMonitor();

  useEffect(() => {
    // Monitor critical web vitals
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach((entry) => {
        // Log slow operations
        if (entry.duration > 100) {
          console.warn(`🐌 Slow operation: ${entry.name} (${entry.duration.toFixed(2)}ms)`);
          logMetric(`slow_operation_${entry.name}`, entry.duration);
        }

        // Monitor specific metrics
        switch (entry.entryType) {
          case 'navigation':
            const navEntry = entry as PerformanceNavigationTiming;
            logMetric('page_load_time', navEntry.loadEventEnd - navEntry.fetchStart);
            logMetric('dom_content_loaded', navEntry.domContentLoadedEventEnd - navEntry.fetchStart);
            logMetric('first_byte', navEntry.responseStart - navEntry.fetchStart);
            break;
            
          case 'measure':
            logMetric(`custom_${entry.name}`, entry.duration);
            break;
            
          case 'paint':
            if (entry.name === 'first-contentful-paint') {
              logMetric('first_contentful_paint', entry.startTime);
            }
            break;
        }
      });
    });

    // Monitor different types of performance data
    try {
      observer.observe({ type: 'navigation', buffered: true });
      observer.observe({ type: 'measure', buffered: true });
      observer.observe({ type: 'paint', buffered: true });
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (error) {
      console.warn('Some performance metrics not supported:', error);
    }

    // Memory monitoring interval
    const memoryInterval = setInterval(() => {
      measureMemoryUsage();
    }, 30000); // Every 30 seconds

    // Performance summary interval
    const summaryInterval = setInterval(() => {
      const summary = getPerformanceSummary();
      setPerformanceMetrics(summary);
      
      // Log critical performance issues
      Object.entries(summary).forEach(([metric, data]: [string, any]) => {
        if (data.average > 1000) { // More than 1 second average
          console.error(`🚨 Performance Issue: ${metric} averaging ${data.average.toFixed(2)}ms`);
        }
      });
    }, 60000); // Every minute

    return () => {
      observer.disconnect();
      clearInterval(memoryInterval);
      clearInterval(summaryInterval);
    };
  }, [logMetric, measureMemoryUsage, getPerformanceSummary]);

  // Performance debugging in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Expose performance utilities to window for debugging
      (window as any).performanceDebug = {
        metrics: performanceMetrics,
        logMetric,
        measureApiCall,
        measureRender,
        getPerformanceSummary,
        measureMemoryUsage
      };
    }
  }, [performanceMetrics, logMetric, measureApiCall, measureRender, getPerformanceSummary, measureMemoryUsage]);

  return null; // This component doesn't render anything
});

PerformanceManager.displayName = 'PerformanceManager';

// Enhanced loading state component with better UX
interface EnhancedLoadingProps {
  message?: string;
  showProgress?: boolean;
  className?: string;
}

export const EnhancedLoading = memo(({ 
  message = "Loading...", 
  showProgress = false, 
  className = "" 
}: EnhancedLoadingProps) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <div className="relative">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        {showProgress && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          </div>
        )}
      </div>
      <p className="mt-4 text-sm text-gray-600 animate-pulse">
        {message}{dots}
      </p>
    </div>
  );
});

EnhancedLoading.displayName = 'EnhancedLoading';

// Optimized error fallback
interface OptimizedErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
  className?: string;
}

export const OptimizedErrorFallback = memo(({ 
  error, 
  resetError, 
  className = "" 
}: OptimizedErrorFallbackProps) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Something went wrong
      </h3>
      <p className="text-gray-600 mb-4 max-w-md">
        We encountered an error while loading this content. Please try again.
      </p>
      {error && process.env.NODE_ENV === 'development' && (
        <details className="mb-4 text-left">
          <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
            Error Details
          </summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-w-md">
            {error.stack || error.message}
          </pre>
        </details>
      )}
      {resetError && (
        <button
          onClick={resetError}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
});

OptimizedErrorFallback.displayName = 'OptimizedErrorFallback';

// Performance-optimized image component
interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
}

export const OptimizedImage = memo(({ 
  src, 
  alt, 
  className = "", 
  fallbackSrc,
  loading = 'lazy',
  onLoad,
  onError 
}: OptimizedImageProps) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleLoad = () => {
    setImageLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setImageError(true);
    onError?.();
  };

  const imageSrc = imageError && fallbackSrc ? fallbackSrc : src;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!imageLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        </div>
      )}
      <img
        src={imageSrc}
        alt={alt}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';