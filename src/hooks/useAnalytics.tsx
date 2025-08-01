import { useCallback, useEffect } from 'react';
import { analytics } from '@/lib/analytics';
import { useAuth } from '@/hooks/useAuth';

export const useAnalytics = () => {
  const { user } = useAuth();

  // Track page views with automatic counting
  const trackPageView = useCallback((page: string) => {
    analytics.pageView(page);
    if (page === '/') {
      analytics.landingPageViewed();
    }
  }, []);

  // Track user actions with automatic user context
  const trackAction = useCallback((action: string, properties?: Record<string, any>) => {
    analytics.track(action, {
      ...properties,
      user_id: user?.id,
      timestamp: Date.now()
    });
  }, [user?.id]);

  // Track feature usage with engagement level
  const trackFeature = useCallback((feature: string, properties?: Record<string, any>) => {
    analytics.featureUsed(feature, user?.id, properties);
  }, [user?.id]);

  // Track feature engagement with level
  const trackFeatureEngagement = useCallback((feature: string, level: 'low' | 'medium' | 'high' = 'medium') => {
    analytics.featureEngagement(feature, user?.id, level);
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

  // Journey tracking methods
  const trackAuthPageEntered = useCallback((action: 'signup' | 'signin') => {
    analytics.authPageEntered(action);
  }, []);

  const trackAuthAttempted = useCallback((action: 'signup' | 'signin', success: boolean, error?: string) => {
    analytics.authAttempted(action, success, error);
  }, []);

  const trackProfileSetupStarted = useCallback(() => {
    if (user) {
      analytics.profileSetupStarted(user.id);
    }
  }, [user]);

  const trackProfileSetupAbandoned = useCallback((step: string) => {
    if (user) {
      analytics.profileSetupAbandoned(user.id, step);
    }
  }, [user]);

  const trackProfileSetupCompleted = useCallback((timeToComplete: number) => {
    if (user) {
      analytics.profileSetupCompleted(user.id, timeToComplete);
    }
  }, [user]);

  const trackDashboardFirstVisit = useCallback(() => {
    if (user) {
      analytics.dashboardFirstVisit(user.id);
    }
  }, [user]);

  // Session quality tracking
  const getSessionQuality = useCallback(() => {
    return analytics.getSessionQuality();
  }, []);

  // Page abandonment tracking
  const trackPageAbandon = useCallback((page: string, timeOnPage: number) => {
    analytics.trackPageAbandon(page, timeOnPage);
  }, []);

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
    trackFeatureEngagement,
    trackError,
    trackAuthPageEntered,
    trackAuthAttempted,
    trackProfileSetupStarted,
    trackProfileSetupAbandoned,
    trackProfileSetupCompleted,
    trackDashboardFirstVisit,
    getSessionQuality,
    trackPageAbandon,
    isInitialized: analytics.isInitialized(),
    debugInfo: analytics.getDebugInfo,
    testAnalytics: analytics.testAnalytics
  };
};