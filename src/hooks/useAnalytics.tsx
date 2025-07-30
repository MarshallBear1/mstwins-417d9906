import { useCallback, useEffect } from 'react';
import { analytics } from '@/lib/analytics';
import { useAuth } from '@/hooks/useAuth';

export const useAnalytics = () => {
  const { user } = useAuth();

  // Track page views
  const trackPageView = useCallback((page: string) => {
    analytics.pageView(page);
  }, []);

  // Track user actions with automatic user context
  const trackAction = useCallback((action: string, properties?: Record<string, any>) => {
    analytics.track(action, {
      ...properties,
      user_id: user?.id,
      timestamp: Date.now()
    });
  }, [user?.id]);

  // Track feature usage
  const trackFeature = useCallback((feature: string, properties?: Record<string, any>) => {
    analytics.featureUsed(feature, user?.id, properties);
  }, [user?.id]);

  // Track errors with context
  const trackError = useCallback((error: string | Error, context?: Record<string, any>) => {
    const errorMessage = error instanceof Error ? error.message : error;
    analytics.errorOccurred(errorMessage, {
      ...context,
      user_id: user?.id,
      url: window.location.href,
      userAgent: navigator.userAgent
    });
  }, [user?.id]);

  // Identify user when they log in
  useEffect(() => {
    if (user && analytics.isInitialized()) {
      analytics.identify(user.id, {
        email: user.email,
        first_name: user.user_metadata?.first_name,
        last_name: user.user_metadata?.last_name,
        created_at: user.created_at
      });
    }
  }, [user]);

  return {
    trackPageView,
    trackAction,
    trackFeature,
    trackError,
    isInitialized: analytics.isInitialized(),
    debugInfo: analytics.getDebugInfo,
    testAnalytics: analytics.testAnalytics
  };
};