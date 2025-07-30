import { useState } from 'react';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { useToast } from '@/hooks/use-toast';

interface CameraOptions {
  quality?: number;
  source?: CameraSource;
  resultType?: CameraResultType;
  saveToGallery?: boolean;
  width?: number;
  height?: number;
}

export const useCamera = () => {
  const { toast } = useToast();
  const [isSupported] = useState(true); // Support both web and mobile

  const requestPermissions = async () => {
    // For web, we'll handle permissions through file input
    if (!Capacitor.isNativePlatform()) {
      return true;
    }

    try {
      const permissions = await Camera.requestPermissions();
      return permissions.camera === 'granted';
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
      toast({
        title: "Permission Error", 
        description: "Could not access camera permissions.",
        variant: "destructive",
      });
      return false;
    }
  };

  const takePhoto = async (options: CameraOptions = {}): Promise<Photo | null> => {
    try {
      // For web, we'll use a file input instead
      if (!Capacitor.isNativePlatform()) {
        return new Promise((resolve) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.capture = 'environment'; // Use rear camera on mobile web
          
          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = () => {
                resolve({
                  webPath: reader.result as string,
                  format: file.type.split('/')[1] as any,
                  saved: false
                });
              };
              reader.readAsDataURL(file);
            } else {
              resolve(null);
            }
          };
          
          input.click();
        });
      }

      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        toast({
          title: "Permission Denied",
          description: "Camera access is required to take photos.",
          variant: "destructive",
        });
        return null;
      }

      const photo = await Camera.getPhoto({
        quality: options.quality || 90,
        source: options.source || CameraSource.Camera,
        resultType: options.resultType || CameraResultType.Uri,
        saveToGallery: options.saveToGallery || false,
        width: options.width || 800,
        height: options.height || 800,
        ...options
      });

      return photo;
    } catch (error) {
      console.error('Error taking photo:', error);
      toast({
        title: "Camera Error",
        description: "Could not take photo. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const pickFromGallery = async (options: CameraOptions = {}): Promise<Photo | null> => {
    try {
      // For web, use file input for gallery selection
      if (!Capacitor.isNativePlatform()) {
        return new Promise((resolve) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          
          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = () => {
                resolve({
                  webPath: reader.result as string,
                  format: file.type.split('/')[1] as any,
                  saved: false
                });
              };
              reader.readAsDataURL(file);
            } else {
              resolve(null);
            }
          };
          
          input.click();
        });
      }

      return takePhoto({
        ...options,
        source: CameraSource.Photos
      });
    } catch (error) {
      console.error('Error picking from gallery:', error);
      toast({
        title: "Gallery Error",
        description: "Could not access gallery. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const pickMultiple = async (options: CameraOptions = {}): Promise<Photo[]> => {
    // Note: Multiple photo selection requires additional configuration
    // For now, we'll simulate by allowing single selection
    const photo = await pickFromGallery(options);
    return photo ? [photo] : [];
  };

  return {
    isSupported,
    takePhoto,
    pickFromGallery,
    pickMultiple,
    requestPermissions
  };
};