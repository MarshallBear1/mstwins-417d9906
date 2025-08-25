import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface AdminAuthContextType {
  isAdminAuthenticated: boolean;
  adminSessionToken: string | null;
  adminLoading: boolean;
  authenticateAdminUser: () => Promise<boolean>;
  validateAdminSession: () => Promise<boolean>;
  revokeAdminSession: () => Promise<void>;
  checkAdminRole: () => Promise<boolean>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

interface AdminAuthProviderProps {
  children: ReactNode;
}

export const AdminAuthProvider = ({ children }: AdminAuthProviderProps) => {
  const { user, session } = useAuth();
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminSessionToken, setAdminSessionToken] = useState<string | null>(null);
  const [adminLoading, setAdminLoading] = useState(true);

  useEffect(() => {
    // Only run admin checks if we're on an admin route or have an existing admin session
    const checkExistingSession = async () => {
      if (!user || !session) {
        setAdminLoading(false);
        return;
      }

      // Check if we're on an admin route
      const isAdminRoute = window.location.pathname.includes('/admin') || 
                          window.location.pathname.includes('/temp-admin-login');
      
      const storedToken = sessionStorage.getItem('admin_session_token');
      
      if (storedToken) {
        // We have a stored token, validate it
        await validateStoredSession(storedToken);
      }
      // Remove automatic admin role checking to prevent endless RPC calls
      
      setAdminLoading(false);
    };

    checkExistingSession();
  }, [user, session]);

  const checkUserAdminRole = async (): Promise<boolean> => {
    // Simplified check - no RPC calls that can fail
    console.log('🔒 Admin role check bypassed - using password auth instead');
    return false; // Always return false to skip automatic admin authentication
  };

  const validateStoredSession = async (token: string) => {
    // Simple validation - just check if token exists and isn't expired
    const timestamp = sessionStorage.getItem('admin_session_timestamp');
    const currentTime = Date.now();
    const sessionAge = timestamp ? currentTime - parseInt(timestamp) : Infinity;
    
    // Session expires after 2 hours (7200000 ms)
    if (sessionAge < 7200000) {
      setIsAdminAuthenticated(true);
      setAdminSessionToken(token);
      console.log('✅ Valid admin session restored');
    } else {
      // Expired session, clear storage
      sessionStorage.removeItem('admin_session_token');
      sessionStorage.removeItem('admin_session_timestamp');
      setIsAdminAuthenticated(false);
      setAdminSessionToken(null);
      console.log('⏰ Admin session expired');
    }
  };

  const authenticateAdminUser = async (): Promise<boolean> => {
    if (!user || !session) {
      toast.error('Please log in first');
      return false;
    }

    try {
      // Check if user has admin role in database
      const { data, error } = await supabase.rpc('authenticate_admin_user');
      
      if (error) {
        console.error('Admin authentication error:', error);
        toast.error('Authentication failed');
        return false;
      }

      if ((data as any)?.authenticated) {
        const token = crypto.randomUUID();
        setAdminSessionToken(token);
        setIsAdminAuthenticated(true);
        
        // Store token and timestamp in sessionStorage
        sessionStorage.setItem('admin_session_token', token);
        sessionStorage.setItem('admin_session_timestamp', Date.now().toString());
        
        toast.success('Admin access granted');
        return true;
      } else {
        toast.error('Access denied: Admin role required');
        return false;
      }
    } catch (error) {
      console.error('Admin authentication error:', error);
      toast.error('Authentication failed');
      return false;
    }
  };

  const validateAdminSession = async (): Promise<boolean> => {
    if (!adminSessionToken || !user) return false;

    // Simple validation - check timestamp
    const timestamp = sessionStorage.getItem('admin_session_timestamp');
    const currentTime = Date.now();
    const sessionAge = timestamp ? currentTime - parseInt(timestamp) : Infinity;
    
    // Session expires after 2 hours
    if (sessionAge < 7200000) {
      return true;
    } else {
      setIsAdminAuthenticated(false);
      setAdminSessionToken(null);
      sessionStorage.removeItem('admin_session_token');
      sessionStorage.removeItem('admin_session_timestamp');
      return false;
    }
  };

  const checkAdminRole = async (): Promise<boolean> => {
    return await checkUserAdminRole();
  };

  const revokeAdminSession = async (): Promise<void> => {
    // Simple cleanup - just clear local storage
    setIsAdminAuthenticated(false);
    setAdminSessionToken(null);
    sessionStorage.removeItem('admin_session_token');
    sessionStorage.removeItem('admin_session_timestamp');
    toast.success('Admin session ended');
  };

  return (
    <AdminAuthContext.Provider value={{
      isAdminAuthenticated,
      adminSessionToken,
      adminLoading,
      authenticateAdminUser,
      validateAdminSession,
      revokeAdminSession,
      checkAdminRole
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};