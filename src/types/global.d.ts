declare global {
  interface Window {
    _lastNotificationId?: string;
    _lastNotificationTimes?: Record<string, number>;
  }
}

export {};