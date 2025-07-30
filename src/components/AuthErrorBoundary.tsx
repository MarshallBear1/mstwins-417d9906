import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
  showSignInOption?: boolean;
  onSignInClick?: () => void;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  isAuthError: boolean;
}

export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, isAuthError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    const isAuthError = error.message.includes('auth') || 
                       error.message.includes('token') || 
                       error.message.includes('session') ||
                       error.message.includes('unauthorized');

    return { 
      hasError: true, 
      error,
      isAuthError 
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 AuthErrorBoundary caught an error:', error, errorInfo);
    
    // Log auth-specific errors differently
    if (this.state.isAuthError) {
      console.error('🔐 Authentication error detected:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
    }
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, isAuthError: false });
  };

  render() {
    if (this.state.hasError) {
      const { fallbackMessage, showSignInOption, onSignInClick } = this.props;
      const { isAuthError, error } = this.state;

      return (
        <Card className="mx-auto max-w-md mt-8 border-destructive/20">
          <CardHeader className="text-center">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <CardTitle className="text-destructive">
              {isAuthError ? 'Authentication Error' : 'Something went wrong'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              {fallbackMessage || 
               (isAuthError 
                 ? 'There was an issue with your authentication. Please sign in again.'
                 : 'We encountered an error. Please try again.')}
            </p>
            
            {process.env.NODE_ENV === 'development' && error && (
              <details className="text-left text-xs bg-gray-50 p-2 rounded">
                <summary className="cursor-pointer font-mono">Error Details</summary>
                <pre className="mt-2 whitespace-pre-wrap">{error.message}</pre>
              </details>
            )}

            <div className="flex flex-col gap-2">
              {isAuthError && showSignInOption && onSignInClick ? (
                <Button onClick={onSignInClick} className="w-full">
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In Again
                </Button>
              ) : (
                <Button onClick={this.handleRetry} className="w-full">
                  <RefreshCcw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}