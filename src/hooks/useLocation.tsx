import { useState, useEffect } from 'react';
import { Geolocation, Position, PositionOptions } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { useToast } from '@/hooks/use-toast';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export const useLocation = () => {
  const { toast } = useToast();
  const [isSupported, setIsSupported] = useState(Capacitor.isNativePlatform());
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'prompt-with-rationale'>('prompt');

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    if (!isSupported) return;

    try {
      const permissions = await Geolocation.checkPermissions();
      setPermissionStatus(permissions.location);
    } catch (error) {
      console.error('Error checking location permissions:', error);
    }
  };

  const requestPermissions = async () => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Location services are only available on mobile devices.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const permissions = await Geolocation.requestPermissions();
      setPermissionStatus(permissions.location);
      
      if (permissions.location === 'granted') {
        toast({
          title: "Location Enabled",
          description: "Location access granted successfully.",
        });
        return true;
      } else {
        toast({
          title: "Permission Denied",
          description: "Location access is required for distance-based matching.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      toast({
        title: "Permission Error",
        description: "Could not request location permissions.",
        variant: "destructive",
      });
      return false;
    }
  };

  const getCurrentPosition = async (options: PositionOptions = {}): Promise<LocationData | null> => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Location services are only available on mobile devices.",
        variant: "destructive",
      });
      return null;
    }

    if (permissionStatus !== 'granted') {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return null;
    }

    setIsLoading(true);
    try {
      const position: Position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 3600000, // 1 hour
        ...options
      });

      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp
      };

      setCurrentLocation(locationData);
      return locationData;
    } catch (error) {
      console.error('Error getting current position:', error);
      toast({
        title: "Location Error",
        description: "Could not get your current location. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  };

  const watchPosition = async (callback: (location: LocationData) => void, options: PositionOptions = {}): Promise<string | null> => {
    if (!isSupported || permissionStatus !== 'granted') return null;

    try {
      const watchId = await Geolocation.watchPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 3600000, // 1 hour
        ...options
      }, (position, error) => {
        if (error) {
          console.error('Watch position error:', error);
          return;
        }
        
        if (position) {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          };
          setCurrentLocation(locationData);
          callback(locationData);
        }
      });

      return watchId;
    } catch (error) {
      console.error('Error watching position:', error);
      return null;
    }
  };

  const clearWatch = async (watchId: string) => {
    try {
      await Geolocation.clearWatch({ id: watchId });
    } catch (error) {
      console.error('Error clearing watch:', error);
    }
  };

  return {
    isSupported,
    currentLocation,
    isLoading,
    permissionStatus,
    getCurrentPosition,
    requestPermissions,
    calculateDistance,
    watchPosition,
    clearWatch,
    isEnabled: permissionStatus === 'granted'
  };
};