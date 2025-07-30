import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthDiagnostics {
  hasValidSession: boolean;
  hasValidUser: boolean;
  sessionExpiry: Date | null;
  tokenRefreshStatus: 'unknown' | 'success' | 'failed';
  lastAuthCheck: Date;
  authErrors: string[];
}

export function useEnhancedAuth() {
  const auth = useAuth();
  const { toast } = useToast();
  const [diagnostics, setDiagnostics] = useState<AuthDiagnostics>({
    hasValidSession: false,
    hasValidUser: false,
    sessionExpiry: null,
    tokenRefreshStatus: 'unknown',
    lastAuthCheck: new Date(),
    authErrors: []
  });

  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

  // Enhanced authentication diagnostics
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        const newDiagnostics: AuthDiagnostics = {
          hasValidSession: !!session && !error,
          hasValidUser: !!session?.user,
          sessionExpiry: session?.expires_at ? new Date(session.expires_at * 1000) : null,
          tokenRefreshStatus: error ? 'failed' : 'success',
          lastAuthCheck: new Date(),
          authErrors: error ? [error.message] : []
        };

        setDiagnostics(newDiagnostics);
        setConnectionStatus('connected');

        // Log detailed auth status
        console.log('🔐 Enhanced Auth Check:', {
          ...newDiagnostics,
          userId: session?.user?.id,
          email: session?.user?.email,
          expiresIn: newDiagnostics.sessionExpiry 
            ? Math.round((newDiagnostics.sessionExpiry.getTime() - Date.now()) / 1000 / 60) 
            : null
        });

        // Warn if session expires soon (within 5 minutes)
        if (newDiagnostics.sessionExpiry) {
          const expiresInMinutes = (newDiagnostics.sessionExpiry.getTime() - Date.now()) / 1000 / 60;
          if (expiresInMinutes < 5 && expiresInMinutes > 0) {
            console.warn('⚠️ Auth session expires soon:', expiresInMinutes, 'minutes');
          }
        }
      } catch (error) {
        console.error('🚨 Auth check failed:', error);
        setConnectionStatus('disconnected');
        setDiagnostics(prev => ({
          ...prev,
          authErrors: [...prev.authErrors, error instanceof Error ? error.message : 'Unknown auth error'],
          lastAuthCheck: new Date()
        }));
      }
    };

    // Initial check
    checkAuthStatus();

    // Periodic auth health checks
    const interval = setInterval(checkAuthStatus, 60000); // Every minute

    return () => clearInterval(interval);
  }, []);

  // Monitor auth state changes with enhanced logging
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 Enhanced Auth State Change:', {
        event,
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id,
        timestamp: new Date().toISOString()
      });

      // Handle token refresh failures
      if (event === 'TOKEN_REFRESHED' && !session) {
        console.error('🚨 Token refresh failed - session lost');
        toast({
          title: "Session Expired",
          description: "Please sign in again to continue.",
          variant: "destructive"
        });
      }

      // Handle sign out with cleanup
      if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out, clearing diagnostics');
        setDiagnostics({
          hasValidSession: false,
          hasValidUser: false,
          sessionExpiry: null,
          tokenRefreshStatus: 'unknown',
          lastAuthCheck: new Date(),
          authErrors: []
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [toast]);

  const refreshSession = async () => {
    try {
      console.log('🔄 Manual session refresh requested');
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('🚨 Manual session refresh failed:', error);
        toast({
          title: "Session Refresh Failed",
          description: "Please sign in again.",
          variant: "destructive"
        });
        return false;
      }

      console.log('✅ Manual session refresh successful');
      return true;
    } catch (error) {
      console.error('🚨 Manual session refresh exception:', error);
      return false;
    }
  };

  const testConnection = async () => {
    setConnectionStatus('checking');
    try {
      const { data, error } = await supabase.from('profiles').select('id').limit(1);
      setConnectionStatus(error ? 'disconnected' : 'connected');
      return !error;
    } catch (error) {
      console.error('🚨 Connection test failed:', error);
      setConnectionStatus('disconnected');
      return false;
    }
  };

  return {
    ...auth,
    diagnostics,
    connectionStatus,
    refreshSession,
    testConnection,
    isHealthy: diagnostics.hasValidSession && diagnostics.hasValidUser && connectionStatus === 'connected'
  };
}