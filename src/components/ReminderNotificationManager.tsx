import { useEffect, useCallback } from 'react';
import { useReminderNotifications } from '@/hooks/useReminderNotifications';
import { useAuth } from '@/hooks/useAuth';
import { Capacitor } from '@capacitor/core';

export const ReminderNotificationManager = () => {
  const { user } = useAuth();
  const {
    scheduleInactivityReminder,
    scheduleLongInactivityReminder,
    scheduleAllReminders
  } = useReminderNotifications();

  // Handle app lifecycle events for better reminder scheduling
  const handleAppStateChange = useCallback(async (isActive: boolean) => {
    if (!user) return;

    if (!isActive) {
      // App going to background - schedule inactivity reminder
      console.log('📱 App going to background, scheduling inactivity reminder...');
      await scheduleInactivityReminder();
    } else {
      // App coming to foreground - user is active again
      console.log('📱 App coming to foreground, user is active');
    }
  }, [user, scheduleInactivityReminder]);

  // Handle visibility change (tab switching, etc.)
  const handleVisibilityChange = useCallback(async () => {
    if (!user) return;

    if (document.hidden) {
      // Page/tab hidden - schedule reminder
      console.log('👁️ Page hidden, scheduling reminder...');
      await scheduleInactivityReminder();
    }
  }, [user, scheduleInactivityReminder]);

  // Check for long-term inactivity and schedule appropriate reminders
  const checkLongTermInactivity = useCallback(async () => {
    if (!user) return;

    try {
      // Get last activity from localStorage or user preferences
      const lastActivityKey = `last_activity_${user.id}`;
      const lastActivityStr = localStorage.getItem(lastActivityKey);
      
      if (lastActivityStr) {
        const lastActivity = new Date(lastActivityStr);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff >= 3) {
          console.log(`📅 User inactive for ${daysDiff} days, scheduling long-term reminder...`);
          await scheduleLongInactivityReminder(daysDiff);
        }
      }
    } catch (error) {
      console.error('Error checking long-term inactivity:', error);
    }
  }, [user, scheduleLongInactivityReminder]);

  // Update last activity timestamp
  const updateLastActivity = useCallback(() => {
    if (!user) return;

    const lastActivityKey = `last_activity_${user.id}`;
    localStorage.setItem(lastActivityKey, new Date().toISOString());
  }, [user]);

  // Set up event listeners
  useEffect(() => {
    if (!user) return;

    // Update activity on user interactions
    const updateActivity = () => updateLastActivity();
    
    // Common user interaction events
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Handle visibility change
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Handle page unload
    window.addEventListener('beforeunload', () => {
      handleAppStateChange(false);
    });

    // Check for long-term inactivity periodically (every hour)
    const inactivityCheckInterval = setInterval(checkLongTermInactivity, 60 * 60 * 1000);
    
    // Initial inactivity check
    checkLongTermInactivity();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', () => {
        handleAppStateChange(false);
      });
      clearInterval(inactivityCheckInterval);
    };
  }, [user, handleVisibilityChange, handleAppStateChange, checkLongTermInactivity, updateLastActivity]);

  // Handle Capacitor app state changes on native platforms
  useEffect(() => {
    if (!user || !Capacitor.isNativePlatform()) return;

    const setupCapacitorListeners = async () => {
      try {
        const { App } = await import('@capacitor/app');
        
        // Listen for app state changes
        App.addListener('appStateChange', ({ isActive }) => {
          handleAppStateChange(isActive);
        });

        // Listen for app resume
        App.addListener('resume', () => {
          handleAppStateChange(true);
        });

        // Listen for app pause
        App.addListener('pause', () => {
          handleAppStateChange(false);
        });

        console.log('✅ Capacitor app state listeners set up');
      } catch (error) {
        console.error('Error setting up Capacitor listeners:', error);
      }
    };

    setupCapacitorListeners();
  }, [user, handleAppStateChange]);

  // Schedule initial reminders when user logs in
  useEffect(() => {
    if (user) {
      // Update activity immediately
      updateLastActivity();
      
      // Schedule initial reminders after a short delay
      const timer = setTimeout(() => {
        scheduleAllReminders();
      }, 3000); // 3 second delay

      return () => clearTimeout(timer);
    }
  }, [user, updateLastActivity, scheduleAllReminders]);

  // This component doesn't render anything visible
  return null;
};
