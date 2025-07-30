import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, Wifi, WifiOff, AlertTriangle } from "lucide-react";

interface LoadingWithRetryProps {
  isLoading: boolean;
  error?: string | null;
  onRetry: () => void;
  loadingText?: string;
  errorTitle?: string;
  retryText?: string;
  showConnectionStatus?: boolean;
  connectionStatus?: 'connected' | 'disconnected' | 'error';
}

const LoadingWithRetry = ({
  isLoading,
  error = null,
  onRetry,
  loadingText = "Loading...",
  errorTitle = "Something went wrong",
  retryText = "Try Again",
  showConnectionStatus = false,
  connectionStatus = 'connected'
}: LoadingWithRetryProps) => {
  const [retryCount, setRetryCount] = useState(0);
  const isOnline = navigator?.onLine ?? true;

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    onRetry();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-6"></div>
        <h3 className="text-xl font-semibold text-foreground mb-2">{loadingText}</h3>
        {showConnectionStatus && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4">
            {connectionStatus === 'connected' ? (
              <>
                <Wifi className="w-4 h-4 text-green-500" />
                <span>Connected</span>
              </>
            ) : connectionStatus === 'error' ? (
              <>
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span>Connection issues</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-gray-500" />
                <span>Disconnected</span>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  if (error) {
    const isNetworkError = !isOnline || error.includes('fetch') || error.includes('network');
    
    return (
      <Card className="mx-auto max-w-md mt-8">
        <CardContent className="p-6 text-center">
          {isNetworkError ? (
            <WifiOff className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          ) : (
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-destructive" />
          )}
          
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {isNetworkError ? "Connection Problem" : errorTitle}
          </h3>
          
          <p className="text-sm text-muted-foreground mb-4">
            {isNetworkError 
              ? "Please check your internet connection and try again."
              : error
            }
          </p>

          {showConnectionStatus && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
              {isOnline ? (
                <>
                  <Wifi className="w-4 h-4 text-green-500" />
                  <span>Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-red-500" />
                  <span>Offline</span>
                </>
              )}
            </div>
          )}

          <Button 
            onClick={handleRetry} 
            disabled={!isOnline}
            className="w-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {retryText}
          </Button>

          {retryCount > 2 && (
            <p className="text-xs text-muted-foreground mt-4">
              Still having trouble? Try refreshing the page.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return null;
};

export default LoadingWithRetry;