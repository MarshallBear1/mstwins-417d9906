import posthog from 'posthog-js';

class AnalyticsService {
  private initialized = false;
  private initAttempts = 0;
  private maxInitAttempts = 3;

  isInitialized(): boolean {
    return this.initialized;
  }

  init(apiKey: string, config?: any) {
    if (this.initialized) return;
    
    this.initAttempts++;
    
    try {
      if (!apiKey) {
        console.warn('📊 Analytics: No API key provided, analytics disabled');
        return;
      }

      posthog.init(apiKey, {
        api_host: 'https://us.i.posthog.com',
        person_profiles: 'identified_only',
        capture_pageview: false, // We'll manually capture pageviews
        capture_pageleave: true,
        ...config
      });
      
      this.initialized = true;
      console.log('📊 PostHog analytics initialized successfully');
    } catch (error) {
      console.error('📊 Analytics initialization failed:', error);
      
      if (this.initAttempts < this.maxInitAttempts) {
        console.log(`📊 Retrying analytics init (attempt ${this.initAttempts + 1}/${this.maxInitAttempts})`);
        setTimeout(() => this.init(apiKey, config), 1000 * this.initAttempts);
      } else {
        console.warn('📊 Analytics initialization failed after multiple attempts, analytics disabled');
      }
    }
  }

  // Page tracking
  pageView(route: string) {
    if (!this.initialized) {
      console.warn('📊 Analytics not initialized, skipping pageview:', route);
      return;
    }
    try {
      posthog.capture('$pageview', { $current_url: route });
    } catch (error) {
      console.error('📊 Failed to track pageview:', error);
    }
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
      console.warn('📊 Analytics not initialized, skipping event:', eventName);
      return;
    }
    try {
      posthog.capture(eventName, properties);
    } catch (error) {
      console.error('📊 Failed to track event:', eventName, error);
    }
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