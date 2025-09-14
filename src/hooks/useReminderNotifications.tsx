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
  const [lastScheduledAt, setLastScheduledAt] = useState<number>(0);

  // Default reminder schedules
  const defaultReminders: ReminderSchedule[] = [
    {
      id: 'welcome-back-1',
      title: '👋 We miss you!',
      message: 'Come back and check your connections when you have a minute.',
      delayHours: 24,
      enabled: true
    },
    {
      id: 'welcome-back-2',
      title: '🔔 Quick check-in',
      message: 'New messages and connections may be waiting for you.',
      delayHours: 48,
      enabled: true
    },
    {
      id: 'welcome-back-3',
      title: '🌟 Stay connected',
      message: 'See what\'s new in your community when you\'re ready.',
      delayHours: 72,
      enabled: true
    },
    {
      id: 'weekly-reminder',
      title: '💬 Weekly community check-in',
      message: 'Drop by to explore new connections this week.',
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
    
    // Prevent scheduling more than once per day
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const last = Number(localStorage.getItem(`reminders_last_scheduled_${user.id}`) || 0);
    if (now - last < oneDayMs) {
      console.log('⏱️ Skipping scheduling reminders (already scheduled within 24h)');
      return 0;
    }

    const enabledReminders = defaultReminders.filter(r => r.enabled);
    const results = await Promise.all(
      enabledReminders.map(reminder => scheduleReminder(reminder))
    );
    
    const successCount = results.filter(Boolean).length;
    console.log(`✅ Scheduled ${successCount}/${enabledReminders.length} reminders`);
    localStorage.setItem(`reminders_last_scheduled_${user.id}`, String(now));
    setLastScheduledAt(now);
    
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

    // Throttle inactivity reminder to at most once every 6 hours
    const key = `inactivity_last_scheduled_${user.id}`;
    const last = Number(localStorage.getItem(key) || 0);
    const now = Date.now();
    if (now - last < 6 * 60 * 60 * 1000) {
      console.log('⏱️ Skipping inactivity reminder (recently scheduled)');
      return false;
    }

    // Schedule a gentle reminder for 2 hours after inactivity
    const reminder: ReminderSchedule = {
      id: 'inactivity-reminder',
      title: '💭 Taking a break?',
      message: 'New profiles are being added every day. Don\'t miss out!',
      delayHours: 2,
      enabled: true
    };

    const ok = await scheduleReminder(reminder);
    if (ok) localStorage.setItem(key, String(now));
    return ok;
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
