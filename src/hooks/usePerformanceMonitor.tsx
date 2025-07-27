import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  userId?: string;
}

interface PageLoadMetrics {
  navigationStart: number;
  loadEventEnd: number;
  domContentLoadedEventEnd: number;
  firstPaint?: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  cumulativeLayoutShift?: number;
  firstInputDelay?: number;
}

export const usePerformanceMonitor = () => {
  const { user } = useAuth();
  const metricsRef = useRef<PerformanceMetric[]>([]);
  const observersRef = useRef<Map<string, PerformanceObserver>>(new Map());

  // Log performance metric
  const logMetric = useCallback((name: string, value: number) => {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      userId: user?.id
    };

    metricsRef.current.push(metric);
    
    // Keep only last 100 metrics to prevent memory issues
    if (metricsRef.current.length > 100) {
      metricsRef.current = metricsRef.current.slice(-100);
    }

    console.log(`Performance: ${name} = ${value}ms`, metric);
  }, [user?.id]);

  // Measure component render time
  const measureRender = useCallback((componentName: string, startTime: number) => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    logMetric(`render_${componentName}`, duration);
    return duration;
  }, [logMetric]);

  // Measure API call duration
  const measureApiCall = useCallback((apiName: string, startTime: number) => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    logMetric(`api_${apiName}`, duration);
    return duration;
  }, [logMetric]);

  // Get page load metrics
  const getPageLoadMetrics = useCallback((): PageLoadMetrics | null => {
    if (!performance.timing) return null;

    const timing = performance.timing;
    return {
      navigationStart: timing.navigationStart,
      loadEventEnd: timing.loadEventEnd,
      domContentLoadedEventEnd: timing.domContentLoadedEventEnd
    };
  }, []);

  // Measure Web Vitals
  const measureWebVitals = useCallback(() => {
    // First Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const fcpObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              logMetric('first_contentful_paint', entry.startTime);
            }
          }
        });
        fcpObserver.observe({ entryTypes: ['paint'] });
        observersRef.current.set('fcp', fcpObserver);
      } catch (error) {
        console.warn('FCP measurement not supported:', error);
      }

      // Largest Contentful Paint
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          logMetric('largest_contentful_paint', lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        observersRef.current.set('lcp', lcpObserver);
      } catch (error) {
        console.warn('LCP measurement not supported:', error);
      }

      // Cumulative Layout Shift
      try {
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          logMetric('cumulative_layout_shift', clsValue);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        observersRef.current.set('cls', clsObserver);
      } catch (error) {
        console.warn('CLS measurement not supported:', error);
      }

      // First Input Delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            logMetric('first_input_delay', (entry as any).processingStart - entry.startTime);
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        observersRef.current.set('fid', fidObserver);
      } catch (error) {
        console.warn('FID measurement not supported:', error);
      }
    }
  }, [logMetric]);

  // Measure memory usage
  const measureMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      logMetric('memory_used_mb', memory.usedJSHeapSize / 1024 / 1024);
      logMetric('memory_total_mb', memory.totalJSHeapSize / 1024 / 1024);
      logMetric('memory_limit_mb', memory.jsHeapSizeLimit / 1024 / 1024);
    }
  }, [logMetric]);

  // Get performance summary
  const getPerformanceSummary = useCallback(() => {
    const recent = metricsRef.current.slice(-50); // Last 50 metrics
    const summary = recent.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = {
          count: 0,
          total: 0,
          avg: 0,
          min: Infinity,
          max: -Infinity
        };
      }
      
      const stat = acc[metric.name];
      stat.count++;
      stat.total += metric.value;
      stat.min = Math.min(stat.min, metric.value);
      stat.max = Math.max(stat.max, metric.value);
      stat.avg = stat.total / stat.count;
      
      return acc;
    }, {} as Record<string, any>);

    return summary;
  }, []);

  // Monitor long tasks
  const monitorLongTasks = useCallback(() => {
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            logMetric('long_task_duration', entry.duration);
          }
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        observersRef.current.set('longtask', longTaskObserver);
      } catch (error) {
        console.warn('Long task monitoring not supported:', error);
      }
    }
  }, [logMetric]);

  // Setup performance monitoring
  useEffect(() => {
    measureWebVitals();
    monitorLongTasks();

    // Measure page load time
    if (document.readyState === 'complete') {
      const pageLoadMetrics = getPageLoadMetrics();
      if (pageLoadMetrics) {
        const loadTime = pageLoadMetrics.loadEventEnd - pageLoadMetrics.navigationStart;
        logMetric('page_load_time', loadTime);
        
        const domLoadTime = pageLoadMetrics.domContentLoadedEventEnd - pageLoadMetrics.navigationStart;
        logMetric('dom_content_loaded_time', domLoadTime);
      }
    }

    // Periodic memory monitoring
    const memoryInterval = setInterval(measureMemoryUsage, 30000);

    return () => {
      clearInterval(memoryInterval);
      
      // Disconnect all observers
      observersRef.current.forEach(observer => {
        observer.disconnect();
      });
      observersRef.current.clear();
    };
  }, [measureWebVitals, monitorLongTasks, getPageLoadMetrics, logMetric, measureMemoryUsage]);

  return {
    logMetric,
    measureRender,
    measureApiCall,
    getPageLoadMetrics,
    measureMemoryUsage,
    getPerformanceSummary,
    metrics: metricsRef.current
  };
};
