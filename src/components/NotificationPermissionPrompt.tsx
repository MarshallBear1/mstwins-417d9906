import { useState, useEffect } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useIsNativeApp } from '@/hooks/useIsNativeApp';
import { useToast } from '@/hooks/use-toast';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';

export const NotificationPermissionPrompt = () => {
  const { user } = useAuth();
  const { isNativeApp } = useIsNativeApp();
  const { toast } = useToast();
  const [isVisible, setIsVisible] = useState(false);
  const [hasAsked, setHasAsked] = useState(false);
  const [interactionReady, setInteractionReady] = useState(false);
  const { requestAllPermissions } = useRealtimeNotifications();

  // Require a user interaction before showing the prompt (prevents auto-pop)
  useEffect(() => {
    const onFirstInteraction = () => {
      setInteractionReady(true);
      window.removeEventListener('click', onFirstInteraction);
      window.removeEventListener('touchstart', onFirstInteraction);
    };
    window.addEventListener('click', onFirstInteraction, { once: true });
    window.addEventListener('touchstart', onFirstInteraction, { once: true });
    return () => {
      window.removeEventListener('click', onFirstInteraction);
      window.removeEventListener('touchstart', onFirstInteraction);
    };
  }, []);

  useEffect(() => {
    // Show prompt after first interaction, only on native app, and only once
    const hasBeenAsked = localStorage.getItem('notification-permission-asked');
    if (user && isNativeApp && interactionReady && !hasBeenAsked && !hasAsked) {
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, [user, hasAsked, isNativeApp, interactionReady]);

  const handleEnableNotifications = async () => {
    try {
      const granted = await requestAllPermissions();
      if (granted) {
        localStorage.setItem('notifications_opt_in', 'true');
        toast({ title: "🔔 Notifications Enabled", description: "You're all set!" });
      } else {
        localStorage.setItem('notifications_opt_in', 'false');
        toast({ title: "Notifications Disabled", description: "You can enable them later in settings." });
      }
    } catch (error) {
      console.error('Error with notifications:', error);
      toast({
        title: "Notifications Ready",
        description: "The app is configured to send notifications when appropriate.",
      });
    }
    
    setHasAsked(true);
    setIsVisible(false);
    localStorage.setItem('notification-permission-asked', 'true');
  };

  const handleSkip = () => {
    setIsVisible(false);
    setHasAsked(true);
    localStorage.setItem('notification-permission-asked', 'true');
    
    toast({
      title: "Notifications Disabled",
      description: "You can enable them later in your profile settings.",
    });
  };

  if (!isVisible || !user || !isNativeApp) {
    return null;
  }

  // Don't show if the user has already been asked
  if (hasAsked) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Bell className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Stay Connected!</CardTitle>
          <CardDescription>
            Get notified instantly when someone likes your profile or sends you a message.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-3">
              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span>Instant match notifications</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span>New message alerts</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span>Profile like notifications</span>
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={handleSkip}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Maybe Later
            </Button>
            <Button 
              onClick={handleEnableNotifications}
              className="flex-1"
            >
              <Bell className="h-4 w-4 mr-2" />
              Enable Notifications
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            You can change this anytime in your profile settings.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};