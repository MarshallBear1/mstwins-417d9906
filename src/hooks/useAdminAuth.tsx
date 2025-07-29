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
    // Check for existing admin session on mount
    const checkExistingSession = async () => {
      if (!user || !session) {
        setAdminLoading(false);
        return;
      }

      const storedToken = sessionStorage.getItem('admin_session_token');
      if (storedToken) {
        await validateStoredSession(storedToken);
      } else {
        // Check if user has admin role even without stored session
        const hasAdminRole = await checkUserAdminRole();
        if (hasAdminRole) {
          // User has admin role but no session, create one
          await authenticateAdminUser();
        }
      }
      setAdminLoading(false);
    };

    checkExistingSession();
  }, [user, session]);

  const checkUserAdminRole = async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase.rpc('authenticate_admin_user');
      if (error) {
        console.error('Error checking admin role:', error);
        return false;
      }
      return (data as any)?.authenticated === true;
    } catch (error) {
      console.error('Error checking admin role:', error);
      return false;
    }
  };

  const validateStoredSession = async (token: string) => {
    try {
      const { data, error } = await supabase.rpc('validate_and_refresh_admin_session', {
        session_token: token
      });

      if (error) throw error;

      if ((data as any)?.valid) {
        setIsAdminAuthenticated(true);
        setAdminSessionToken(token);
      } else {
        // Invalid session, clear storage
        sessionStorage.removeItem('admin_session_token');
        setIsAdminAuthenticated(false);
        setAdminSessionToken(null);
      }
    } catch (error) {
      console.error('Error validating admin session:', error);
      sessionStorage.removeItem('admin_session_token');
      setIsAdminAuthenticated(false);
      setAdminSessionToken(null);
    }
  };

  const authenticateAdminUser = async (): Promise<boolean> => {
    if (!user || !session) {
      toast.error('Please log in first');
      return false;
    }

    try {
      // First check if user has admin role
      const { data: authData, error: authError } = await supabase.rpc('authenticate_admin_user');
      
      if (authError) {
        console.error('Error authenticating admin user:', authError);
        toast.error('Authentication failed');
        return false;
      }

      if (!(authData as any)?.authenticated) {
        const reason = (authData as any)?.reason || 'Unknown error';
        if (reason === 'not_admin') {
          toast.error('Access denied: Admin role required');
        } else if (reason === 'not_authenticated') {
          toast.error('Please log in first');
        } else {
          toast.error('Authentication failed');
        }
        return false;
      }

      // Create admin session
      const { data: sessionData, error: sessionError } = await supabase.rpc('create_admin_session');

      if (sessionError) {
        console.error('Error creating admin session:', sessionError);
        toast.error('Failed to create admin session');
        return false;
      }

      if ((sessionData as any)?.success) {
        const token = (sessionData as any).session_token;
        setAdminSessionToken(token);
        setIsAdminAuthenticated(true);
        
        // Store token in sessionStorage (more secure than localStorage)
        sessionStorage.setItem('admin_session_token', token);
        
        toast.success('Admin access granted');
        return true;
      }

      toast.error('Failed to create admin session');
      return false;
    } catch (error: any) {
      console.error('Error authenticating admin user:', error);
      toast.error('Authentication failed');
      return false;
    }
  };

  const validateAdminSession = async (): Promise<boolean> => {
    if (!adminSessionToken || !user) return false;

    try {
      const { data, error } = await supabase.rpc('validate_and_refresh_admin_session', {
        session_token: adminSessionToken
      });

      if (error) throw error;

      const isValid = (data as any)?.valid || false;
      if (!isValid) {
        setIsAdminAuthenticated(false);
        setAdminSessionToken(null);
        sessionStorage.removeItem('admin_session_token');
      }

      return isValid;
    } catch (error) {
      console.error('Error validating admin session:', error);
      setIsAdminAuthenticated(false);
      setAdminSessionToken(null);
      sessionStorage.removeItem('admin_session_token');
      return false;
    }
  };

  const checkAdminRole = async (): Promise<boolean> => {
    return await checkUserAdminRole();
  };

  const revokeAdminSession = async (): Promise<void> => {
    if (!adminSessionToken) return;

    try {
      await supabase.rpc('revoke_admin_session', {
        session_token: adminSessionToken
      });
    } catch (error) {
      console.error('Error revoking admin session:', error);
    } finally {
      // Always clear local state
      setIsAdminAuthenticated(false);
      setAdminSessionToken(null);
      sessionStorage.removeItem('admin_session_token');
      toast.success('Admin session ended');
    }
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