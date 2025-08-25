import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Battery, BatteryLow } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileOfflineIndicatorProps {
  className?: string;
}

const MobileOfflineIndicator = ({ className }: MobileOfflineIndicatorProps) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Battery API
    const updateBattery = async () => {
      if ('getBattery' in navigator) {
        try {
          const battery = await (navigator as any).getBattery();
          setBatteryLevel(battery.level);
          setIsCharging(battery.charging);
          
          battery.addEventListener('levelchange', () => setBatteryLevel(battery.level));
          battery.addEventListener('chargingchange', () => setIsCharging(battery.charging));
        } catch (error) {
          console.log('Battery API not available');
        }
      }
    };

    updateBattery();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const showBatteryWarning = batteryLevel !== null && batteryLevel < 0.2 && !isCharging;

  if (isOnline && !showBatteryWarning) return null;

  return (
    <div className={cn(
      "fixed top-20 left-4 right-4 z-50 bg-destructive/90 backdrop-blur-sm text-destructive-foreground px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium animate-slide-down",
      className
    )}>
      {!isOnline && (
        <>
          <WifiOff className="w-4 h-4" />
          <span>You're offline. Some features may be limited.</span>
        </>
      )}
      
      {showBatteryWarning && (
        <>
          <BatteryLow className="w-4 h-4" />
          <span>Low battery ({Math.round((batteryLevel || 0) * 100)}%)</span>
        </>
      )}
    </div>
  );
};

export default MobileOfflineIndicator;