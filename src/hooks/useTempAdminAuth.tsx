import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useTempAdminAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user has valid admin session
    const checkAuth = async () => {
      const sessionToken = sessionStorage.getItem('admin_session_token');
      
      if (!sessionToken) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      try {
        // Validate session token with database
        const { data, error } = await supabase.rpc('enhanced_validate_admin_session', {
          session_token: sessionToken
        });

        if (error || !data?.valid) {
          console.warn('Admin session validation failed:', error?.message || data?.reason);
          sessionStorage.removeItem('admin_session_token');
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Session validation error:', error);
        sessionStorage.removeItem('admin_session_token');
        setIsAuthenticated(false);
      }
      
      setIsLoading(false);
    };

    checkAuth();

    // Listen for storage changes (in case user logs out in another tab)
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const logout = async () => {
    const sessionToken = sessionStorage.getItem('admin_session_token');
    
    if (sessionToken) {
      try {
        // Revoke session in database
        await supabase.rpc('revoke_admin_session', {
          session_token: sessionToken
        });
      } catch (error) {
        console.error('Session revocation error:', error);
      }
    }
    
    sessionStorage.removeItem('admin_session_token');
    setIsAuthenticated(false);
  };

  return {
    isAuthenticated,
    isLoading,
    logout
  };
};