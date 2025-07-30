import { useState } from "react";
import { Bell, Clock, Volume2, Smartphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";
import { useToast } from "@/hooks/use-toast";

const NotificationSettings = () => {
  const { preferences, updatePreferences, isLoading } = useNotificationPreferences();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = async (key: string, value: boolean | string, subKey?: string) => {
    setIsSaving(true);
    try {
      const updates = subKey 
        ? { [key]: { ...(preferences[key as keyof typeof preferences] as any), [subKey]: value } }
        : { [key]: value };
      
      const success = await updatePreferences(updates);
      
      if (success) {
        toast({
          title: "Settings updated",
          description: "Your notification preferences have been saved.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to save settings. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notification Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* General Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="popup-notifications" className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              Popup Notifications
            </Label>
            <Switch
              id="popup-notifications"
              checked={preferences.enablePopups}
              onCheckedChange={(checked) => handleToggle('enablePopups', checked)}
              disabled={isSaving}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Show notification popups for likes and matches
          </p>
        </div>

        <Separator />

        {/* Notification Types */}
        <div className="space-y-4">
          <h4 className="font-medium">Notification Types</h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="likes-notifications">💕 Likes</Label>
              <Switch
                id="likes-notifications"
                checked={preferences.notificationTypes.likes}
                onCheckedChange={(checked) => handleToggle('notificationTypes', checked, 'likes')}
                disabled={isSaving}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="matches-notifications">🎉 Matches</Label>
              <Switch
                id="matches-notifications"
                checked={preferences.notificationTypes.matches}
                onCheckedChange={(checked) => handleToggle('notificationTypes', checked, 'matches')}
                disabled={isSaving}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="messages-notifications">💬 Messages</Label>
              <Switch
                id="messages-notifications"
                checked={preferences.notificationTypes.messages}
                onCheckedChange={(checked) => handleToggle('notificationTypes', checked, 'messages')}
                disabled={isSaving}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Feedback Settings */}
        <div className="space-y-4">
          <h4 className="font-medium">Feedback</h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="haptics" className="flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                Haptic Feedback
              </Label>
              <Switch
                id="haptics"
                checked={preferences.enableHaptics}
                onCheckedChange={(checked) => handleToggle('enableHaptics', checked)}
                disabled={isSaving}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="sounds" className="flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                Sounds
              </Label>
              <Switch
                id="sounds"
                checked={preferences.enableSounds}
                onCheckedChange={(checked) => handleToggle('enableSounds', checked)}
                disabled={isSaving}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Quiet Hours */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="quiet-hours" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Quiet Hours
            </Label>
            <Switch
              id="quiet-hours"
              checked={preferences.quietHours.enabled}
              onCheckedChange={(checked) => handleToggle('quietHours', checked, 'enabled')}
              disabled={isSaving}
            />
          </div>
          
          {preferences.quietHours.enabled && (
            <div className="space-y-2 pl-6">
              <p className="text-sm text-muted-foreground">
                No notifications between {preferences.quietHours.start} and {preferences.quietHours.end}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quiet-start" className="text-sm">Start Time</Label>
                  <input
                    id="quiet-start"
                    type="time"
                    value={preferences.quietHours.start}
                    onChange={(e) => handleToggle('quietHours', e.target.value, 'start')}
                    className="w-full px-3 py-2 border rounded-md"
                    disabled={isSaving}
                  />
                </div>
                <div>
                  <Label htmlFor="quiet-end" className="text-sm">End Time</Label>
                  <input
                    id="quiet-end"
                    type="time"
                    value={preferences.quietHours.end}
                    onChange={(e) => handleToggle('quietHours', e.target.value, 'end')}
                    className="w-full px-3 py-2 border rounded-md"
                    disabled={isSaving}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Browser Notifications */}
        <Separator />
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="browser-notifications">🔔 Browser Notifications</Label>
            <Switch
              id="browser-notifications"
              checked={preferences.enableBrowserNotifications}
              onCheckedChange={(checked) => handleToggle('enableBrowserNotifications', checked)}
              disabled={isSaving}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Receive notifications even when the app is not active
          </p>
        </div>

        {isSaving && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Saving settings...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;