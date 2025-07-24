import { useCallback } from 'react';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

export interface HapticsOptions {
  intensity?: 'light' | 'medium' | 'heavy';
  pattern?: 'success' | 'warning' | 'error' | 'selection' | 'impact';
}

export const useHaptics = () => {
  const isSupported = Capacitor.isNativePlatform();

  // Impact feedback for general interactions
  const impact = useCallback(async (style: 'light' | 'medium' | 'heavy' = 'medium') => {
    if (!isSupported) return;
    
    try {
      const impactStyle = {
        light: ImpactStyle.Light,
        medium: ImpactStyle.Medium,
        heavy: ImpactStyle.Heavy
      }[style];
      
      await Haptics.impact({ style: impactStyle });
    } catch (error) {
      console.warn('Haptics impact error:', error);
    }
  }, [isSupported]);

  // Notification feedback for success/error states
  const notification = useCallback(async (type: 'success' | 'warning' | 'error') => {
    if (!isSupported) return;
    
    try {
      const notificationType = {
        success: NotificationType.Success,
        warning: NotificationType.Warning,
        error: NotificationType.Error
      }[type];
      
      await Haptics.notification({ type: notificationType });
    } catch (error) {
      console.warn('Haptics notification error:', error);
    }
  }, [isSupported]);

  // Selection feedback for UI interactions
  const selection = useCallback(async () => {
    if (!isSupported) return;
    
    try {
      await Haptics.selectionStart();
      setTimeout(() => Haptics.selectionEnd(), 50);
    } catch (error) {
      console.warn('Haptics selection error:', error);
    }
  }, [isSupported]);

  // Vibrate with custom pattern
  const vibrate = useCallback(async (pattern: number[] = [100]) => {
    if (!isSupported) return;
    
    try {
      await Haptics.vibrate({ duration: pattern[0] || 100 });
    } catch (error) {
      console.warn('Haptics vibrate error:', error);
    }
  }, [isSupported]);

  // App-specific haptic patterns
  const like = useCallback(() => impact('light'), [impact]);
  const match = useCallback(() => notification('success'), [notification]);
  const message = useCallback(() => selection(), [selection]);
  const buttonPress = useCallback(() => impact('light'), [impact]);
  const cardSwipe = useCallback(() => selection(), [selection]);
  const errorFeedback = useCallback(() => notification('error'), [notification]);
  const successFeedback = useCallback(() => notification('success'), [notification]);

  return {
    isSupported,
    impact,
    notification,
    selection,
    vibrate,
    // App-specific patterns
    like,
    match,
    message,
    buttonPress,
    cardSwipe,
    errorFeedback,
    successFeedback
  };
};