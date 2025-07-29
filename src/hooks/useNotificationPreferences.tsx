import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface NotificationPreferences {
  enablePopups: boolean;
  enableSounds: boolean;
  enableHaptics: boolean;
  enableBrowserNotifications: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string; // HH:MM format
  };
  notificationTypes: {
    likes: boolean;
    matches: boolean;
    messages: boolean;
  };
}

const defaultPreferences: NotificationPreferences = {
  enablePopups: true,
  enableSounds: true,
  enableHaptics: true,
  enableBrowserNotifications: false,
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00'
  },
  notificationTypes: {
    likes: true,
    matches: true,
    messages: true
  }
};

export const useNotificationPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences from local storage
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const stored = localStorage.getItem(`notification-prefs-${user.id}`);
      if (stored) {
        const parsedPrefs = JSON.parse(stored);
        setPreferences({ ...defaultPreferences, ...parsedPrefs });
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Update preferences
  const updatePreferences = useCallback(async (newPrefs: Partial<NotificationPreferences>) => {
    if (!user) return false;

    const updatedPrefs = { ...preferences, ...newPrefs };
    setPreferences(updatedPrefs);

    try {
      // Save to local storage immediately
      localStorage.setItem(`notification-prefs-${user.id}`, JSON.stringify(updatedPrefs));
      return true;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      return false;
    }
  }, [user, preferences]);

  // Check if notifications should be shown based on preferences and quiet hours
  const shouldShowNotification = useCallback((type: 'like' | 'match' | 'message') => {
    if (!preferences.notificationTypes[type]) {
      return false;
    }

    // Check quiet hours
    if (preferences.quietHours.enabled) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const { start, end } = preferences.quietHours;

      // Handle quiet hours that span midnight
      if (start > end) {
        if (currentTime >= start || currentTime <= end) {
          return false;
        }
      } else {
        if (currentTime >= start && currentTime <= end) {
          return false;
        }
      }
    }

    return true;
  }, [preferences]);

  // Get effective notification settings for a type
  const getNotificationSettings = useCallback((type: 'like' | 'match' | 'message') => {
    const shouldShow = shouldShowNotification(type);
    
    return {
      shouldShow,
      enablePopups: shouldShow && preferences.enablePopups,
      enableSounds: shouldShow && preferences.enableSounds,
      enableHaptics: shouldShow && preferences.enableHaptics,
      enableBrowserNotifications: shouldShow && preferences.enableBrowserNotifications
    };
  }, [preferences, shouldShowNotification]);

  return {
    preferences,
    isLoading,
    updatePreferences,
    shouldShowNotification,
    getNotificationSettings
  };
};