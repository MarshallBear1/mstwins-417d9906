import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCcw, Wifi, WifiOff } from 'lucide-react';

interface LoadingWithRetryProps {
  isLoading: boolean;
  error?: string | null;
  onRetry: () => void;
  retryText?: string;
  loadingText?: string;
  errorText?: string;
  showConnectionStatus?: boolean;
}

export function LoadingWithRetry({ 
  isLoading, 
  error, 
  onRetry, 
  retryText = "Try Again",
  loadingText = "Loading...",
  errorText,
  showConnectionStatus = false
}: LoadingWithRetryProps) {
  const [retryCount, setRetryCount] = useState(0);
  const isOnline = navigator?.onLine ?? true;

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    onRetry();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">{loadingText}</p>
          {retryCount > 0 && (
            <p className="text-xs text-muted-foreground">Attempt {retryCount + 1}</p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="mx-auto max-w-sm border-destructive/20">
        <CardContent className="text-center py-6 space-y-4">
          <div className="text-destructive">
            {!isOnline ? <WifiOff className="w-8 h-8 mx-auto" /> : <RefreshCcw className="w-8 h-8 mx-auto" />}
          </div>
          
          <div className="space-y-2">
            <p className="font-medium text-destructive">
              {!isOnline ? 'No Internet Connection' : 'Loading Failed'}
            </p>
            <p className="text-sm text-muted-foreground">
              {errorText || error || (!isOnline ? 'Please check your internet connection' : 'Something went wrong')}
            </p>
          </div>

          {showConnectionStatus && (
            <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </div>
          )}

          <Button 
            onClick={handleRetry} 
            size="sm" 
            variant="outline"
            disabled={!isOnline}
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            {retryText}
          </Button>

          {retryCount > 2 && (
            <p className="text-xs text-muted-foreground">
              Still having issues? Try refreshing the page.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return null;
}