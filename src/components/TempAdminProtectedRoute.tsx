import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useTempAdminAuth } from '@/hooks/useTempAdminAuth';
import { Shield } from 'lucide-react';

interface TempAdminProtectedRouteProps {
  children: ReactNode;
}

export const TempAdminProtectedRoute = ({ children }: TempAdminProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useTempAdminAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-8 w-8 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Checking admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/temp-admin-login" replace />;
  }

  return <>{children}</>;
};