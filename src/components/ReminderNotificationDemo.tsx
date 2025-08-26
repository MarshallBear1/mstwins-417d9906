import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Clock, Play, Pause, RotateCcw } from 'lucide-react';
import { useReminderNotifications } from '@/hooks/useReminderNotifications';
import { useToast } from '@/hooks/use-toast';

export const ReminderNotificationDemo = () => {
  const { toast } = useToast();
  const {
    defaultReminders,
    scheduledReminders,
    scheduleReminder,
    cancelAllReminders,
    hasActiveReminders
  } = useReminderNotifications();

  const [isDemoActive, setIsDemoActive] = useState(false);

  const handleDemoReminder = async (delayMinutes: number = 1) => {
    try {
      const demoReminder = {
        id: `demo-${Date.now()}`,
        title: '🧪 Demo Reminder',
        message: `This is a demo reminder that was scheduled ${delayMinutes} minute${delayMinutes !== 1 ? 's' : ''} ago!`,
        delayHours: delayMinutes / 60,
        enabled: true
      };

      const success = await scheduleReminder(demoReminder);
      
      if (success) {
        toast({
          title: "Demo reminder scheduled!",
          description: `You'll receive a notification in ${delayMinutes} minute${delayMinutes !== 1 ? 's' : ''}.`,
        });
        setIsDemoActive(true);
      } else {
        toast({
          title: "Error",
          description: "Failed to schedule demo reminder. Please check notification permissions.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error scheduling demo reminder:', error);
      toast({
        title: "Error",
        description: "Failed to schedule demo reminder. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleStopDemo = async () => {
    try {
      await cancelAllReminders();
      setIsDemoActive(false);
      toast({
        title: "Demo stopped",
        description: "All demo reminders have been cancelled.",
      });
    } catch (error) {
      console.error('Error stopping demo:', error);
      toast({
        title: "Error",
        description: "Failed to stop demo. Please try again.",
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

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Reminder Notification Demo
        </CardTitle>
        <CardDescription>
          Test the reminder notification system to see how it works
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Demo Controls */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Quick Demo</h3>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => handleDemoReminder(1)}
              disabled={isDemoActive}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              1 Minute Reminder
            </Button>
            
            <Button
              onClick={() => handleDemoReminder(2)}
              disabled={isDemoActive}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              2 Minute Reminder
            </Button>
            
            <Button
              onClick={() => handleDemoReminder(5)}
              disabled={isDemoActive}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              5 Minute Reminder
            </Button>
            
            {isDemoActive && (
              <Button
                onClick={handleStopDemo}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Pause className="h-4 w-4" />
                Stop Demo
              </Button>
            )}
          </div>
          
          {isDemoActive && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 Demo is active! You'll receive notifications based on the delays you set. 
                Check your device's notification center.
              </p>
            </div>
          )}
        </div>

        {/* Active Reminders Status */}
        {hasActiveReminders && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Active Reminders ({scheduledReminders.length})
            </h3>
            
            <div className="grid gap-3">
              {scheduledReminders.map(([reminderId, notificationId]) => {
                const reminder = defaultReminders.find(r => r.id === reminderId) || {
                  title: 'Custom Reminder',
                  message: 'Demo or custom reminder',
                  delayHours: 0
                };
                
                return (
                  <div key={reminderId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{reminder.title}</h4>
                        <Badge variant="secondary" className="text-xs">
                          ID: {notificationId}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{reminder.message}</p>
                    </div>
                    
                    <Badge variant="outline" className="text-xs">
                      Active
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Default Reminder Schedule */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Default Reminder Schedule</h3>
          <div className="grid gap-3">
            {defaultReminders.map((reminder) => (
              <div key={reminder.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{reminder.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {formatDelay(reminder.delayHours)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{reminder.message}</p>
                </div>
                
                <Badge variant={reminder.enabled ? "default" : "secondary"}>
                  {reminder.enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">How It Works</h3>
          <div className="grid gap-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <span className="text-primary">1.</span>
              <p>Reminders are scheduled locally on your device using the Capacitor Local Notifications plugin</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary">2.</span>
              <p>Notifications are sent even when the app is closed, helping users return to discover new connections</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary">3.</span>
              <p>The system automatically detects app lifecycle changes and schedules appropriate reminders</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary">4.</span>
              <p>Users can customize which reminders they want to receive and when</p>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <h4 className="font-medium text-amber-800 mb-2">💡 Pro Tips</h4>
          <ul className="text-sm text-amber-700 space-y-1">
            <li>• Make sure your device allows notifications from the app</li>
            <li>• Test with short delays first (1-2 minutes) to verify everything works</li>
            <li>• Reminders work offline and don't require internet connection</li>
            <li>• You can customize the reminder schedule in the main settings</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
