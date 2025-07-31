import posthog from 'posthog-js';

class AnalyticsService {
  private initialized = false;

  isInitialized(): boolean {
    return this.initialized;
  }

  init(apiKey: string, config?: any) {
    if (this.initialized) return;
    
    try {
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

      // Test connection with delay to ensure initialization is complete
      setTimeout(() => {
        this.track('analytics_initialized', { 
          timestamp: Date.now(),
          initialization_type: 'auto'
        });
      }, 500);
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

  // Reset analytics (for logout)
  reset() {
    if (!this.initialized) return;
    posthog.reset();
  }
}

export const analytics = new AnalyticsService();