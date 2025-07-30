import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface QueryOptions {
  enabled?: boolean;
  refetchInterval?: number;
  cacheTime?: number;
  staleTime?: number;
  retry?: boolean | number;
  retryDelay?: number;
}

interface QueryResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  isStale: boolean;
}

// Cache for storing query results
const queryCache = new Map<string, {
  data: any;
  timestamp: number;
  staleTime: number;
}>();

export function useOptimizedQuery<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options: QueryOptions = {}
): QueryResult<T> {
  const {
    enabled = true,
    refetchInterval,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    staleTime = 30 * 1000, // 30 seconds
    retry = 3,
    retryDelay = 1000
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState(false);

  const retryCountRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();

  const cacheKey = queryKey.join(':');

  // Check if data is cached and fresh
  const getCachedData = useCallback(() => {
    const cached = queryCache.get(cacheKey);
    if (!cached) return null;

    const now = Date.now();
    const isExpired = now - cached.timestamp > cacheTime;
    const isStaleData = now - cached.timestamp > cached.staleTime;

    if (isExpired) {
      queryCache.delete(cacheKey);
      return null;
    }

    return {
      data: cached.data,
      isStale: isStaleData
    };
  }, [cacheKey, cacheTime]);

  // Execute query with retry logic
  const executeQuery = useCallback(async (isRefetch = false): Promise<void> => {
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      // Check cache first (unless it's a manual refetch)
      if (!isRefetch) {
        const cached = getCachedData();
        if (cached) {
          setData(cached.data);
          setIsStale(cached.isStale);
          setError(null);
          setLoading(false);
          return;
        }
      }

      setLoading(true);
      setError(null);
      
      const result = await queryFn();
      
      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      // Cache the result
      queryCache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
        staleTime
      });

      setData(result);
      setIsStale(false);
      retryCountRef.current = 0;
    } catch (err) {
      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      const error = err instanceof Error ? err : new Error('Query failed');
      
      // Retry logic
      const maxRetries = typeof retry === 'number' ? retry : retry ? 3 : 0;
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        
        setTimeout(() => {
          executeQuery(isRefetch);
        }, retryDelay * retryCountRef.current);
        return;
      }

      setError(error);
      console.error(`Query failed for key ${cacheKey}:`, error);
    } finally {
      setLoading(false);
    }
  }, [queryFn, cacheKey, getCachedData, staleTime, retry, retryDelay]);

  // Refetch function
  const refetch = useCallback(async () => {
    await executeQuery(true);
  }, [executeQuery]);

  // Initial fetch
  useEffect(() => {
    if (!enabled) return;

    executeQuery();
  }, [enabled, executeQuery]);

  // Set up refetch interval
  useEffect(() => {
    if (!enabled || !refetchInterval) return;

    intervalRef.current = setInterval(() => {
      executeQuery();
    }, refetchInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, refetchInterval, executeQuery]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    refetch,
    isStale
  };
}

// Parallel query hook for running multiple queries simultaneously
export function useParallelQueries<T extends Record<string, any>>(
  queries: Array<{
    queryKey: string[];
    queryFn: () => Promise<any>;
    options?: QueryOptions;
  }>
): {
  data: Partial<T>;
  loading: boolean;
  error: Error | null;
  refetchAll: () => Promise<void>;
} {
  const [results, setResults] = useState<Partial<T>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const executeAllQueries = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const promises = queries.map(async (query, index) => {
        try {
          const result = await query.queryFn();
          return { index, result, error: null };
        } catch (err) {
          return { index, result: null, error: err as Error };
        }
      });

      const results = await Promise.allSettled(promises);
      const newData: Partial<T> = {};
      let hasError = false;

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const { result: data, error: queryError } = result.value;
          if (queryError) {
            hasError = true;
            setError(queryError);
          } else {
            const key = queries[index].queryKey.join(':');
            newData[key as keyof T] = data;
          }
        } else {
          hasError = true;
          setError(new Error(`Query ${index} failed: ${result.reason}`));
        }
      });

      setResults(newData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Parallel queries failed'));
    } finally {
      setLoading(false);
    }
  }, [queries]);

  useEffect(() => {
    executeAllQueries();
  }, [executeAllQueries]);

  return {
    data: results,
    loading,
    error,
    refetchAll: executeAllQueries
  };
}

// Simplified query hook for performance monitoring
export function usePerformanceQuery<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options: QueryOptions = {}
): QueryResult<T> {
  return useOptimizedQuery(queryKey, queryFn, options);
}