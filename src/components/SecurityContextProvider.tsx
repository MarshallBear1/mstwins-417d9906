import React, { createContext, useContext, useEffect, useState } from 'react';
import { SecurityEnhancements, useSecurityMonitoring } from './SecurityEnhancements';
import { validateAdminSession, checkAdminRateLimit, logAdminAction } from '@/lib/security';
import { toast } from 'sonner';

interface SecurityContextType {
  isSecurityEnabled: boolean;
  performSecureAction: <T>(
    action: () => Promise<T>,
    actionName: string,
    requiresAdminAuth?: boolean
  ) => Promise<T | null>;
  checkRateLimit: (action: string) => boolean;
  logSecurityEvent: (event: string, details?: any) => void;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

interface SecurityContextProviderProps {
  children: React.ReactNode;
}

export const SecurityContextProvider: React.FC<SecurityContextProviderProps> = ({ children }) => {
  const [isSecurityEnabled, setIsSecurityEnabled] = useState(true);
  
  // Initialize security monitoring
  useSecurityMonitoring();

  useEffect(() => {
    // Enable security features
    setIsSecurityEnabled(true);
    
    // Log security context initialization
    logAdminAction('security_context_initialized', {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
  }, []);

  const performSecureAction = async <T,>(
    action: () => Promise<T>,
    actionName: string,
    requiresAdminAuth: boolean = false
  ): Promise<T | null> => {
    try {
      // Check if security is enabled
      if (!isSecurityEnabled) {
        toast.error('Security features are disabled');
        return null;
      }

      // Validate admin session if required
      if (requiresAdminAuth) {
        const sessionValidation = await validateAdminSession();
        if (!sessionValidation.isValid) {
          toast.error('Admin session expired or invalid');
          logAdminAction('security_action_blocked', {
            action: actionName,
            reason: 'invalid_admin_session',
            timestamp: new Date().toISOString()
          });
          return null;
        }
      }

      // Check rate limiting for admin actions
      const adminId = sessionStorage.getItem('admin_session_token') || 'anonymous';
      if (requiresAdminAuth) {
        const rateLimit = checkAdminRateLimit(adminId, actionName);
        if (!rateLimit.allowed) {
          toast.error(`Rate limit exceeded for ${actionName}. Please wait before trying again.`);
          logAdminAction('security_rate_limit_exceeded', {
            action: actionName,
            adminId,
            remaining: rateLimit.remaining,
            timestamp: new Date().toISOString()
          });
          return null;
        }
      }

      // Log the secure action attempt
      logAdminAction('security_action_attempted', {
        action: actionName,
        requiresAuth: requiresAdminAuth,
        timestamp: new Date().toISOString()
      });

      // Execute the action
      const result = await action();

      // Log successful completion
      logAdminAction('security_action_completed', {
        action: actionName,
        success: true,
        timestamp: new Date().toISOString()
      });

      return result;
    } catch (error: any) {
      // Log failed action
      logAdminAction('security_action_failed', {
        action: actionName,
        error: error.message || 'Unknown error',
        timestamp: new Date().toISOString()
      });

      toast.error(`Failed to perform ${actionName}: ${error.message}`);
      return null;
    }
  };

  const checkRateLimit = (action: string): boolean => {
    const adminId = sessionStorage.getItem('admin_session_token') || 'anonymous';
    const rateLimit = checkAdminRateLimit(adminId, action);
    
    if (!rateLimit.allowed) {
      toast.error(`Rate limit exceeded for ${action}. ${rateLimit.remaining} attempts remaining.`);
      return false;
    }
    
    return true;
  };

  const logSecurityEvent = (event: string, details?: any) => {
    logAdminAction('security_event', {
      event,
      details,
      timestamp: new Date().toISOString(),
      url: window.location.href
    });
  };

  const contextValue: SecurityContextType = {
    isSecurityEnabled,
    performSecureAction,
    checkRateLimit,
    logSecurityEvent
  };

  return (
    <SecurityContext.Provider value={contextValue}>
      <SecurityEnhancements />
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurityContext = (): SecurityContextType => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurityContext must be used within a SecurityContextProvider');
  }
  return context;
};

// HOC for protecting admin components
export const withSecurityProtection = <P extends object>(
  Component: React.ComponentType<P>,
  requiresAdminAuth: boolean = false
) => {
  const ProtectedComponent = (props: P) => {
    const { performSecureAction, logSecurityEvent } = useSecurityContext();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isLoading, setIsLoading] = useState(requiresAdminAuth);

    useEffect(() => {
      const checkAuthorization = async () => {
        if (requiresAdminAuth) {
          setIsLoading(true);
          
          const result = await performSecureAction(
            async () => {
              const validation = await validateAdminSession();
              return validation.isValid;
            },
            'component_authorization_check',
            true
          );

          setIsAuthorized(result === true);
          setIsLoading(false);

          if (result !== true) {
            logSecurityEvent('unauthorized_component_access', {
              component: Component.displayName || Component.name,
              requiresAdminAuth
            });
          }
        } else {
          setIsAuthorized(true);
          setIsLoading(false);
        }
      };

      checkAuthorization();
    }, []);

    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!isAuthorized) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-destructive mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You don't have permission to access this component.</p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };

  ProtectedComponent.displayName = `withSecurityProtection(${Component.displayName || Component.name})`;
  return ProtectedComponent;
};