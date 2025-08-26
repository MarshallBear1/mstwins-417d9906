import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, Clock, Settings } from 'lucide-react';
import { useReminderNotifications } from '@/hooks/useReminderNotifications';
import { useLocalNotifications } from '@/hooks/useLocalNotifications';
import { useToast } from '@/hooks/use-toast';

export const ReminderNotificationSettings = () => {
  const { toast } = useToast();
  const { scheduleNotification } = useLocalNotifications();
  const {
    defaultReminders,
    scheduledReminders,
    isEnabled,
    scheduleAllReminders,
    cancelAllReminders,
    hasActiveReminders
  } = useReminderNotifications();

  const [localReminders, setLocalReminders] = useState(defaultReminders);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleReminder = (reminderId: string, enabled: boolean) => {
    setLocalReminders(prev => 
      prev.map(r => 
        r.id === reminderId ? { ...r, enabled } : r
      )
    );
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      if (hasActiveReminders) {
        await cancelAllReminders();
      }
      
      const enabledReminders = localReminders.filter(r => r.enabled);
      if (enabledReminders.length > 0) {
        await scheduleAllReminders();
      }
      
      toast({
        title: "Settings saved!",
        description: `Reminder notifications ${enabledReminders.length > 0 ? 'enabled' : 'disabled'}.`,
      });
    } catch (error) {
      console.error('Error saving reminder settings:', error);
      toast({
        title: "Error",
        description: "Failed to save reminder settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestReminder = async () => {
    try {
      // Schedule a test reminder for 10 seconds from now
      const scheduleTime = new Date(Date.now() + 10000); // 10 seconds from now
      
      await scheduleNotification({
        title: '🧪 Test Reminder',
        body: 'This is a test reminder notification!',
        schedule: { at: scheduleTime }
      });
      
      toast({
        title: "Test reminder scheduled!",
        description: "You should receive a notification in about 10 seconds.",
      });
    } catch (error) {
      console.error('Error scheduling test reminder:', error);
      toast({
        title: "Error",
        description: "Failed to schedule test reminder. Please try again.",
        variant: "destructive"
      });
    }
  };

  const formatDelay = (hours: number) => {
    if (hours < 1) {
      const minutes = Math.round(hours * 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else if (hours < 24) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      const days = hours / 24;
      return `${days} day${days !== 1 ? 's' : ''}`;
    }
  };

  if (!isEnabled) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5 text-muted-foreground" />
            Reminder Notifications Disabled
          </CardTitle>
          <CardDescription>
            Enable local notifications to receive reminder notifications about getting back on the app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Reminder notifications help you stay engaged with potential matches and new connections.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Reminder Notifications
        </CardTitle>
        <CardDescription>
          Configure when you'd like to be reminded to get back on the app and discover new connections.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Active Reminders Status */}
        {hasActiveReminders && (
          <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              {scheduledReminders.length} active reminder{scheduledReminders.length !== 1 ? 's' : ''} scheduled
            </span>
            <Badge variant="secondary" className="ml-auto">
              Active
            </Badge>
          </div>
        )}

        {/* Reminder Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Reminder Schedule
          </h3>
          
          {localReminders.map((reminder) => (
            <div key={reminder.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{reminder.title}</h4>
                  <Badge variant="outline" className="text-xs">
                    {formatDelay(reminder.delayHours)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{reminder.message}</p>
              </div>
              
              <Switch
                checked={reminder.enabled}
                onCheckedChange={(enabled) => handleToggleReminder(reminder.id, enabled)}
                aria-label={`Toggle ${reminder.title}`}
              />
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button 
            onClick={handleSaveSettings} 
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? "Saving..." : "Save Settings"}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleTestReminder}
            className="flex-1"
          >
            Test Reminder
          </Button>
        </div>

        {/* Help Text */}
        <div className="text-xs text-muted-foreground space-y-2">
          <p>
            💡 <strong>Pro tip:</strong> These reminders are sent locally on your device and won't use data or require internet connection.
          </p>
          <p>
            🔔 <strong>Note:</strong> Make sure your device's notification settings allow the app to send notifications.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
