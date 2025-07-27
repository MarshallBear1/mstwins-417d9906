import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface AdminAuthContextType {
  isAdminAuthenticated: boolean;
  adminSessionToken: string | null;
  adminLoading: boolean;
  createAdminSession: () => Promise<boolean>;
  validateAdminSession: () => Promise<boolean>;
  revokeAdminSession: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

interface AdminAuthProviderProps {
  children: ReactNode;
}

export const AdminAuthProvider = ({ children }: AdminAuthProviderProps) => {
  const { user } = useAuth();
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminSessionToken, setAdminSessionToken] = useState<string | null>(null);
  const [adminLoading, setAdminLoading] = useState(true);

  useEffect(() => {
    // Check for existing admin session on mount
    const storedToken = sessionStorage.getItem('admin_session_token');
    if (storedToken && user) {
      validateStoredSession(storedToken);
    } else {
      setAdminLoading(false);
    }
  }, [user]);

  const validateStoredSession = async (token: string) => {
    try {
      const { data, error } = await supabase.rpc('validate_admin_session', {
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
    } finally {
      setAdminLoading(false);
    }
  };

  const createAdminSession = async (): Promise<boolean> => {
    if (!user) {
      toast.error('Please log in first');
      return false;
    }

    try {
      const { data, error } = await supabase.rpc('create_admin_session');

      if (error) throw error;

      if ((data as any)?.success) {
        const token = (data as any).session_token;
        setAdminSessionToken(token);
        setIsAdminAuthenticated(true);
        
        // Store token in sessionStorage (more secure than localStorage)
        sessionStorage.setItem('admin_session_token', token);
        
        toast.success('Admin access granted');
        return true;
      } else {
        const reason = (data as any)?.reason || 'Unknown error';
        if (reason === 'not_admin') {
          toast.error('Access denied: Admin role required');
        } else {
          toast.error('Failed to create admin session');
        }
        return false;
      }
    } catch (error: any) {
      console.error('Error creating admin session:', error);
      toast.error('Failed to authenticate as admin');
      return false;
    }
  };

  const validateAdminSession = async (): Promise<boolean> => {
    if (!adminSessionToken) return false;

    try {
      const { data, error } = await supabase.rpc('validate_admin_session', {
        session_token: adminSessionToken
      });

      if (error) throw error;

      return (data as any)?.valid || false;
    } catch (error) {
      console.error('Error validating admin session:', error);
      return false;
    }
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
      createAdminSession,
      validateAdminSession,
      revokeAdminSession
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