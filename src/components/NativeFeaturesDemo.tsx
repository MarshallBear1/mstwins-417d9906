import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useCamera } from '@/hooks/useCamera';
import { useLocation } from '@/hooks/useLocation';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useShare } from '@/hooks/useShare';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useAppState } from '@/hooks/useAppState';
import { useToast } from '@/hooks/use-toast';
import { Camera, MapPin, Upload, Share2, Wifi, WifiOff, Smartphone } from 'lucide-react';

export const NativeFeaturesDemo: React.FC = () => {
  const camera = useCamera();
  const location = useLocation();
  const fileUpload = useFileUpload();
  const share = useShare();
  const networkStatus = useNetworkStatus();
  const appState = useAppState();
  const { toast } = useToast();
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  const handleTakePhoto = async () => {
    const photo = await camera.takePhoto({
      quality: 80,
      saveToGallery: false
    });
    
    if (photo?.webPath) {
      setCapturedPhoto(photo.webPath);
      toast({
        title: "Photo Captured!",
        description: "Photo taken successfully.",
      });
    }
  };

  const handlePickFromGallery = async () => {
    const photo = await camera.pickFromGallery({
      quality: 80
    });
    
    if (photo?.webPath) {
      setCapturedPhoto(photo.webPath);
      toast({
        title: "Photo Selected!",
        description: "Photo selected from gallery.",
      });
    }
  };

  const handleGetLocation = async () => {
    const locationData = await location.getCurrentPosition();
    if (locationData) {
      toast({
        title: "Location Found!",
        description: `Lat: ${locationData.latitude.toFixed(4)}, Lng: ${locationData.longitude.toFixed(4)}`,
      });
    }
  };

  const handleUploadPhoto = async () => {
    if (!capturedPhoto) {
      toast({
        title: "No Photo",
        description: "Please take or select a photo first.",
        variant: "destructive",
      });
      return;
    }

    const uploadedUrl = await fileUpload.uploadFromCamera(capturedPhoto, {
      bucket: 'avatars',
      folder: 'demo',
      makePublic: true
    });

    if (uploadedUrl) {
      toast({
        title: "Upload Complete!",
        description: "Photo uploaded successfully.",
      });
    }
  };

  const handleShareApp = async () => {
    await share.shareApp();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Native Features Demo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Indicators */}
          <div className="flex flex-wrap gap-2">
            <Badge variant={networkStatus.isOnline ? "default" : "destructive"}>
              {networkStatus.isOnline ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
              {networkStatus.isOnline ? 'Online' : 'Offline'}
            </Badge>
            <Badge variant={appState.isActive ? "default" : "secondary"}>
              App {appState.isActive ? 'Active' : 'Background'}
            </Badge>
            <Badge variant={camera.isSupported ? "default" : "secondary"}>
              Camera {camera.isSupported ? 'Available' : 'Not Available'}
            </Badge>
            <Badge variant={location.isSupported ? "default" : "secondary"}>
              Location {location.isSupported ? 'Available' : 'Not Available'}
            </Badge>
            <Badge variant={share.isSupported ? "default" : "secondary"}>
              Share {share.isSupported ? 'Available' : 'Not Available'}
            </Badge>
          </div>

          {/* Camera Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Camera className="h-4 w-4" />
                Camera
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button 
                  onClick={handleTakePhoto}
                  disabled={!camera.isSupported}
                  size="sm"
                >
                  Take Photo
                </Button>
                <Button 
                  onClick={handlePickFromGallery}
                  disabled={!camera.isSupported}
                  variant="outline"
                  size="sm"
                >
                  Pick from Gallery
                </Button>
              </div>
              {capturedPhoto && (
                <div className="space-y-2">
                  <img 
                    src={capturedPhoto} 
                    alt="Captured" 
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                  <Button 
                    onClick={handleUploadPhoto}
                    disabled={fileUpload.isUploading}
                    size="sm"
                  >
                    <Upload className="h-3 w-3 mr-1" />
                    {fileUpload.isUploading ? 'Uploading...' : 'Upload to Cloud'}
                  </Button>
                  {fileUpload.isUploading && (
                    <Progress value={fileUpload.uploadProgress} className="w-full" />
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-4 w-4" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button 
                  onClick={handleGetLocation}
                  disabled={!location.isSupported || location.isLoading}
                  size="sm"
                >
                  {location.isLoading ? 'Getting Location...' : 'Get Current Location'}
                </Button>
                <Badge variant={location.permissionStatus === 'granted' ? "default" : "secondary"}>
                  Permission: {location.permissionStatus}
                </Badge>
              </div>
              {location.currentLocation && (
                <div className="text-sm text-muted-foreground">
                  <p>Lat: {location.currentLocation.latitude.toFixed(6)}</p>
                  <p>Lng: {location.currentLocation.longitude.toFixed(6)}</p>
                  <p>Accuracy: {location.currentLocation.accuracy.toFixed(0)}m</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Share Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Share2 className="h-4 w-4" />
                Share
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleShareApp}
                disabled={!share.isSupported}
                size="sm"
              >
                Share App
              </Button>
            </CardContent>
          </Card>

          {/* Network Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                {networkStatus.isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                Network Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm">
                  Status: <Badge variant={networkStatus.isOnline ? "default" : "destructive"}>
                    {networkStatus.isOnline ? 'Connected' : 'Disconnected'}
                  </Badge>
                </p>
                <p className="text-sm">
                  Type: <Badge variant="outline">{networkStatus.connectionType}</Badge>
                </p>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};