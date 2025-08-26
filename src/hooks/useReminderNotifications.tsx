import { useEffect, useCallback, useState } from 'react';
import { useLocalNotifications } from './useLocalNotifications';
import { useAuth } from './useAuth';
import { Capacitor } from '@capacitor/core';

export interface ReminderSchedule {
  id: string;
  title: string;
  message: string;
  delayHours: number;
  enabled: boolean;
}

export const useReminderNotifications = () => {
  const { user } = useAuth();
  const { scheduleNotification, cancelNotification, isEnabled } = useLocalNotifications();
  const [scheduledReminders, setScheduledReminders] = useState<Map<string, number>>(new Map());

  // Default reminder schedules
  const defaultReminders: ReminderSchedule[] = [
    {
      id: 'welcome-back-1',
      title: '👋 Missing you already!',
      message: 'Come back and discover new profiles waiting for you.',
      delayHours: 24,
      enabled: true
    },
    {
      id: 'welcome-back-2',
      title: '💫 New matches could be waiting!',
      message: 'Check your profile and see who liked you today.',
      delayHours: 48,
      enabled: true
    },
    {
      id: 'welcome-back-3',
      title: '🌟 Don\'t miss out on love!',
      message: 'Your perfect match might be just a swipe away.',
      delayHours: 72,
      enabled: true
    },
    {
      id: 'weekly-reminder',
      title: '💝 Weekly dating check-in',
      message: 'Take a moment to explore new connections this week.',
      delayHours: 168, // 7 days
      enabled: true
    }
  ];

  // Schedule a reminder notification
  const scheduleReminder = useCallback(async (reminder: ReminderSchedule) => {
    if (!isEnabled || !user) return false;

    try {
      const scheduleAt = new Date(Date.now() + reminder.delayHours * 60 * 60 * 1000);
      
      const notificationId = await scheduleNotification({
        title: reminder.title,
        body: reminder.message,
        schedule: { at: scheduleAt },
        channelId: 'mstwins-reminders',
        iconColor: '#8b5cf6',
        extra: { 
          type: 'reminder', 
          reminderId: reminder.id,
          userId: user.id 
        }
      });

      if (notificationId) {
        setScheduledReminders(prev => new Map(prev.set(reminder.id, notificationId)));
        console.log(`✅ Reminder scheduled: ${reminder.title} for ${scheduleAt.toLocaleString()}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error scheduling reminder:', error);
      return false;
    }
  }, [isEnabled, user, scheduleNotification]);

  // Schedule all enabled reminders
  const scheduleAllReminders = useCallback(async () => {
    if (!isEnabled || !user) return;

    console.log('🔄 Scheduling all reminder notifications...');
    
    const enabledReminders = defaultReminders.filter(r => r.enabled);
    const results = await Promise.all(
      enabledReminders.map(reminder => scheduleReminder(reminder))
    );
    
    const successCount = results.filter(Boolean).length;
    console.log(`✅ Scheduled ${successCount}/${enabledReminders.length} reminders`);
    
    return successCount;
  }, [isEnabled, user, scheduleReminder]);

  // Cancel a specific reminder
  const cancelReminder = useCallback(async (reminderId: string) => {
    const notificationId = scheduledReminders.get(reminderId);
    if (notificationId) {
      await cancelNotification(notificationId);
      setScheduledReminders(prev => {
        const newMap = new Map(prev);
        newMap.delete(reminderId);
        return newMap;
      });
      console.log(`❌ Cancelled reminder: ${reminderId}`);
      return true;
    }
    return false;
  }, [scheduledReminders, cancelNotification]);

  // Cancel all reminders
  const cancelAllReminders = useCallback(async () => {
    const reminderIds = Array.from(scheduledReminders.keys());
    const results = await Promise.all(
      reminderIds.map(id => cancelReminder(id))
    );
    
    const successCount = results.filter(Boolean).length;
    console.log(`❌ Cancelled ${successCount}/${reminderIds.length} reminders`);
    
    return successCount;
  }, [scheduledReminders, cancelReminder]);

  // Schedule reminder when user becomes inactive (e.g., app goes to background)
  const scheduleInactivityReminder = useCallback(async () => {
    if (!isEnabled || !user) return;

    // Schedule a gentle reminder for 2 hours after inactivity
    const reminder: ReminderSchedule = {
      id: 'inactivity-reminder',
      title: '💭 Taking a break?',
      message: 'New profiles are being added every day. Don\'t miss out!',
      delayHours: 2,
      enabled: true
    };

    return await scheduleReminder(reminder);
  }, [isEnabled, user, scheduleReminder]);

  // Schedule reminder when user hasn't been active for a while
  const scheduleLongInactivityReminder = useCallback(async (daysInactive: number) => {
    if (!isEnabled || !user) return;

    let title: string;
    let message: string;
    let delayHours: number;

    if (daysInactive >= 7) {
      title = '💔 We miss you!';
      message: 'It\'s been a while. Your matches are waiting for you to return.';
      delayHours = 12; // Send soon after detection
    } else if (daysInactive >= 3) {
      title = '💫 Time to check in!';
      message: 'New connections are waiting. Take a moment to explore.';
      delayHours = 24;
    } else {
      return false; // Don't send for short inactivity
    }

    const reminder: ReminderSchedule = {
      id: `inactivity-${daysInactive}days`,
      title,
      message,
      delayHours,
      enabled: true
    };

    return await scheduleReminder(reminder);
  }, [isEnabled, user, scheduleReminder]);

  // Initialize reminders when user logs in
  useEffect(() => {
    if (user && isEnabled) {
      // Schedule initial reminders after a short delay
      const timer = setTimeout(() => {
        scheduleAllReminders();
      }, 5000); // 5 second delay after login

      return () => clearTimeout(timer);
    }
  }, [user, isEnabled, scheduleAllReminders]);

  // Clean up reminders when user logs out
  useEffect(() => {
    if (!user && scheduledReminders.size > 0) {
      cancelAllReminders();
    }
  }, [user, cancelAllReminders]);

  return {
    // State
    scheduledReminders: Array.from(scheduledReminders.entries()),
    isEnabled,
    
    // Actions
    scheduleReminder,
    scheduleAllReminders,
    cancelReminder,
    cancelAllReminders,
    scheduleInactivityReminder,
    scheduleLongInactivityReminder,
    
    // Configuration
    defaultReminders,
    
    // Utility
    hasActiveReminders: scheduledReminders.size > 0
  };
};
