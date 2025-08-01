import posthog from 'posthog-js';

class AnalyticsService {
  private initialized = false;
  private anonymousMode = false;
  private sessionStartTime = Date.now();
  private pageViewCount = 0;
  private lastActivityTime = Date.now();

  isInitialized(): boolean {
    return this.initialized;
  }

  // Initialize immediately for anonymous tracking
  initAnonymous() {
    if (this.initialized) return;
    
    try {
      // Use a fallback key for immediate anonymous tracking
      const fallbackKey = 'phc_anonymous_fallback';
      
      posthog.init(fallbackKey, {
        api_host: 'https://us.posthog.com',
        person_profiles: 'never', // Anonymous only
        capture_pageview: true,
        capture_pageleave: true,
        debug: process.env.NODE_ENV === 'development',
        disable_session_recording: false,
        disable_compression: false,
        secure_cookie: true,
        cross_subdomain_cookie: false,
        respect_dnt: true,
        opt_out_capturing_by_default: false,
        bootstrap: {
          distinctID: 'anonymous_' + Math.random().toString(36).substring(7)
        },
        loaded: (posthog) => {
          console.log('📊 PostHog anonymous mode loaded');
        }
      });
      
      this.initialized = true;
      this.anonymousMode = true;
      console.log('📊 PostHog anonymous analytics initialized');

      // Track session start
      this.track('session_started', { 
        timestamp: Date.now(),
        initialization_type: 'anonymous',
        user_agent: navigator.userAgent,
        referrer: document.referrer,
        landing_page: window.location.pathname
      });
    } catch (error) {
      console.error('❌ Failed to initialize PostHog anonymous mode:', error);
      this.initialized = false;
    }
  }

  // Upgrade to authenticated mode
  init(apiKey: string, config?: any) {
    try {
      if (this.anonymousMode && apiKey !== 'phc_anonymous_fallback') {
        // Reinitialize with proper key
        posthog.init(apiKey, {
          api_host: 'https://us.posthog.com',
          person_profiles: 'identified_only',
          capture_pageview: false,
          capture_pageleave: true,
          debug: process.env.NODE_ENV === 'development',
          disable_session_recording: false,
          disable_compression: false,
          secure_cookie: true,
          cross_subdomain_cookie: false,
          respect_dnt: true,
          opt_out_capturing_by_default: false,
          loaded: (posthog) => {
            console.log('📊 PostHog upgraded to authenticated mode');
          },
          ...config
        });
        
        this.anonymousMode = false;
        console.log('📊 PostHog upgraded to authenticated mode with API key');
        
        this.track('analytics_upgraded', { 
          timestamp: Date.now(),
          initialization_type: 'authenticated'
        });
      } else if (!this.initialized) {
        // First time initialization with proper key
        posthog.init(apiKey, {
          api_host: 'https://us.posthog.com',
          person_profiles: 'identified_only',
          capture_pageview: false,
          capture_pageleave: true,
          debug: process.env.NODE_ENV === 'development',
          disable_session_recording: false,
          disable_compression: false,
          secure_cookie: true,
          cross_subdomain_cookie: false,
          respect_dnt: true,
          opt_out_capturing_by_default: false,
          loaded: (posthog) => {
            console.log('📊 PostHog loaded successfully');
          },
          ...config
        });
        
        this.initialized = true;
        console.log('📊 PostHog analytics initialized successfully', {
          apiKey: apiKey.substring(0, 8) + '...',
          environment: process.env.NODE_ENV,
          host: 'https://us.posthog.com',
          timestamp: new Date().toISOString()
        });

        this.track('analytics_initialized', { 
          timestamp: Date.now(),
          initialization_type: 'direct'
        });
      }
    } catch (error) {
      console.error('❌ Failed to initialize PostHog:', error);
      this.initialized = false;
    }
  }

  // Page tracking
  pageView(route: string) {
    if (!this.initialized) return;
    posthog.capture('$pageview', { $current_url: route });
  }

  // User events
  identify(userId: string, properties?: Record<string, any>) {
    if (!this.initialized) return;
    posthog.identify(userId, properties);
  }

  // Profile events
  profileCreated(userId: string, profileData: Record<string, any>) {
    if (!this.initialized) return;
    posthog.capture('profile_created', {
      user_id: userId,
      ms_subtype: profileData.ms_subtype,
      diagnosis_year: profileData.diagnosis_year,
      has_avatar: !!profileData.avatar_url,
      interests_count: profileData.hobbies?.length || 0
    });
  }

  profileUpdated(userId: string) {
    if (!this.initialized) return;
    posthog.capture('profile_updated', { user_id: userId });
  }

  // Discovery events
  profileViewed(viewerId: string, viewedProfileId: string) {
    if (!this.initialized) return;
    posthog.capture('profile_viewed', {
      viewer_id: viewerId,
      viewed_profile_id: viewedProfileId
    });
  }

  profileLiked(likerId: string, likedProfileId: string) {
    if (!this.initialized) return;
    posthog.capture('profile_liked', {
      liker_id: likerId,
      liked_profile_id: likedProfileId
    });
  }

  profilePassed(passerId: string, passedProfileId: string) {
    if (!this.initialized) return;
    posthog.capture('profile_passed', {
      passer_id: passerId,
      passed_profile_id: passedProfileId
    });
  }

  // Match events
  matchCreated(user1Id: string, user2Id: string) {
    if (!this.initialized) return;
    posthog.capture('match_created', {
      user1_id: user1Id,
      user2_id: user2Id
    });
  }

  matchRemoved(userId: string, removedMatchId: string) {
    if (!this.initialized) return;
    posthog.capture('match_removed', {
      user_id: userId,
      removed_match_id: removedMatchId
    });
  }

  // Messaging events
  messageSent(senderId: string, receiverId: string, messageLength: number) {
    if (!this.initialized) return;
    posthog.capture('message_sent', {
      sender_id: senderId,
      receiver_id: receiverId,
      message_length: messageLength
    });
  }

  conversationStarted(user1Id: string, user2Id: string) {
    if (!this.initialized) return;
    posthog.capture('conversation_started', {
      user1_id: user1Id,
      user2_id: user2Id
    });
  }

  // Authentication events
  userSignedUp(userId: string, method: string = 'email') {
    if (!this.initialized) return;
    posthog.capture('user_signed_up', {
      user_id: userId,
      method
    });
  }

  userSignedIn(userId: string, method: string = 'email') {
    if (!this.initialized) return;
    posthog.capture('user_signed_in', {
      user_id: userId,
      method
    });
  }

  userSignedOut(userId: string) {
    if (!this.initialized) return;
    posthog.capture('user_signed_out', { user_id: userId });
  }

  // Feature usage
  featureUsed(feature: string, userId?: string, properties?: Record<string, any>) {
    if (!this.initialized) return;
    posthog.capture('feature_used', {
      feature,
      user_id: userId,
      ...properties
    });
  }

  // Error tracking
  errorOccurred(error: string, context?: Record<string, any>) {
    if (!this.initialized) return;
    posthog.capture('error_occurred', {
      error,
      ...context
    });
  }

  // Custom events
  track(eventName: string, properties?: Record<string, any>) {
    if (!this.initialized) {
      console.warn('🚫 Analytics not initialized, skipping event:', eventName);
      return;
    }
    
    try {
      posthog.capture(eventName, properties);
      console.log('📊 Analytics event sent:', eventName, properties);
    } catch (error) {
      console.error('❌ Failed to send analytics event:', eventName, error);
    }
  }

  // Debug helpers
  getDebugInfo() {
    return {
      initialized: this.initialized,
      distinctId: this.initialized ? posthog.get_distinct_id() : null,
      sessionId: this.initialized ? posthog.get_session_id() : null,
      environment: process.env.NODE_ENV
    };
  }

  // Manual test function
  testAnalytics() {
    console.log('🧪 Testing analytics...');
    console.log('Debug info:', this.getDebugInfo());
    
    this.track('manual_test', {
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
    
    console.log('✅ Test event sent. Check PostHog dashboard in a few minutes.');
  }

  // User properties
  setUserProperties(properties: Record<string, any>) {
    if (!this.initialized) return;
    posthog.setPersonProperties(properties);
  }

  // Journey tracking for churn analysis
  landingPageViewed(source?: string, campaign?: string) {
    this.updateActivity();
    this.pageViewCount++;
    this.track('landing_page_viewed', {
      source,
      campaign,
      referrer: document.referrer,
      user_agent: navigator.userAgent,
      page_view_count: this.pageViewCount,
      session_duration: Date.now() - this.sessionStartTime
    });
  }

  authPageEntered(action: 'signup' | 'signin') {
    this.updateActivity();
    this.track('auth_page_entered', {
      action,
      session_duration: Date.now() - this.sessionStartTime,
      page_view_count: this.pageViewCount
    });
  }

  authAttempted(action: 'signup' | 'signin', success: boolean, error?: string) {
    this.updateActivity();
    this.track('auth_attempted', {
      action,
      success,
      error,
      session_duration: Date.now() - this.sessionStartTime
    });
  }

  profileSetupStarted(userId: string) {
    this.updateActivity();
    this.track('profile_setup_started', {
      user_id: userId,
      session_duration: Date.now() - this.sessionStartTime
    });
  }

  profileSetupAbandoned(userId: string, step: string) {
    this.updateActivity();
    this.track('profile_setup_abandoned', {
      user_id: userId,
      step,
      session_duration: Date.now() - this.sessionStartTime
    });
  }

  profileSetupCompleted(userId: string, timeToComplete: number) {
    this.updateActivity();
    this.track('profile_setup_completed', {
      user_id: userId,
      time_to_complete: timeToComplete,
      session_duration: Date.now() - this.sessionStartTime
    });
  }

  dashboardFirstVisit(userId: string) {
    this.updateActivity();
    this.track('dashboard_first_visit', {
      user_id: userId,
      session_duration: Date.now() - this.sessionStartTime
    });
  }

  featureEngagement(feature: string, userId?: string, engagementLevel: 'low' | 'medium' | 'high' = 'medium') {
    this.updateActivity();
    this.track('feature_engagement', {
      feature,
      user_id: userId,
      engagement_level: engagementLevel,
      session_duration: Date.now() - this.sessionStartTime
    });
  }

  // Session quality metrics
  private updateActivity() {
    this.lastActivityTime = Date.now();
  }

  getSessionQuality() {
    const sessionDuration = Date.now() - this.sessionStartTime;
    const timeSinceLastActivity = Date.now() - this.lastActivityTime;
    
    let quality: 'high' | 'medium' | 'low' = 'low';
    
    if (sessionDuration > 300000 && this.pageViewCount > 3) { // 5+ minutes, 3+ pages
      quality = 'high';
    } else if (sessionDuration > 60000 && this.pageViewCount > 1) { // 1+ minute, 1+ pages
      quality = 'medium';
    }

    return {
      quality,
      duration: sessionDuration,
      pageViews: this.pageViewCount,
      timeSinceLastActivity,
      isActive: timeSinceLastActivity < 30000 // Active within last 30 seconds
    };
  }

  trackSessionEnd() {
    const sessionQuality = this.getSessionQuality();
    this.track('session_ended', {
      ...sessionQuality,
      total_duration: Date.now() - this.sessionStartTime,
      final_page: window.location.pathname
    });
  }

  // Abandonment tracking
  trackPageAbandon(page: string, timeOnPage: number) {
    this.track('page_abandoned', {
      page,
      time_on_page: timeOnPage,
      session_duration: Date.now() - this.sessionStartTime,
      session_quality: this.getSessionQuality().quality
    });
  }

  // Reset analytics (for logout)
  reset() {
    if (!this.initialized) return;
    this.trackSessionEnd();
    posthog.reset();
    
    // Reset session tracking
    this.sessionStartTime = Date.now();
    this.pageViewCount = 0;
    this.lastActivityTime = Date.now();
  }
}

export const analytics = new AnalyticsService();