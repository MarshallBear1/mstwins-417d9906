import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, LogIn, UserCheck, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Link } from 'react-router-dom';

export const SecureAdminLogin = () => {
  const { toast } = useToast();
  const { user, session } = useAuth();
  const { isAdminAuthenticated, adminLoading, authenticateAdminUser, checkAdminRole } = useAdminAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [hasAdminRole, setHasAdminRole] = useState<boolean | null>(null);

  useEffect(() => {
    const checkUserRole = async () => {
      if (user && session) {
        const isAdmin = await checkAdminRole();
        setHasAdminRole(isAdmin);
      } else {
        setHasAdminRole(null);
      }
    };

    checkUserRole();
  }, [user, session, checkAdminRole]);

  const handleAdminAuthentication = async () => {
    if (!user || !session) {
      toast({
        title: "Authentication Required",
        description: "Please log in with your account first.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const success = await authenticateAdminUser();
      if (success) {
        // Redirect will happen automatically via useAdminAuth
        window.location.href = '/admin/feedback';
      }
    } catch (error) {
      toast({
        title: "Authentication Failed",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // If user is already authenticated as admin, redirect
  useEffect(() => {
    if (isAdminAuthenticated && !adminLoading) {
      window.location.href = '/admin/feedback';
    }
  }, [isAdminAuthenticated, adminLoading]);

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-8 w-8 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Checking admin access...</p>
        </div>
      </div>
    );
  }

  if (isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <UserCheck className="h-8 w-8 mx-auto mb-4 text-green-600" />
          <p className="text-muted-foreground">Redirecting to admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Admin Portal Access</CardTitle>
          <CardDescription>
            Secure authentication required for admin features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!user || !session ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Please log in with your account first to access admin features.
                </p>
              </div>
              <Button asChild className="w-full">
                <Link to="/auth">
                  Log In to Continue
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link to="/">
                  Back to Home
                </Link>
              </Button>
            </div>
          ) : hasAdminRole === false ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 p-3 bg-destructive/10 rounded-lg">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <p className="text-sm text-destructive">
                  Access denied. Admin role required for this area.
                </p>
              </div>
              <Button variant="outline" asChild className="w-full">
                <Link to="/">
                  Back to Home
                </Link>
              </Button>
            </div>
          ) : hasAdminRole === true ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 p-3 bg-primary/10 rounded-lg">
                <UserCheck className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Admin Role Verified</p>
                  <p className="text-xs text-muted-foreground">
                    Click below to create secure admin session
                  </p>
                </div>
              </div>
              <Button 
                onClick={handleAdminAuthentication}
                disabled={isLoading}
                className="w-full"
              >
                <LogIn className="h-4 w-4 mr-2" />
                {isLoading ? 'Authenticating...' : 'Access Admin Portal'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                <Shield className="h-4 w-4 text-muted-foreground animate-pulse" />
                <p className="text-sm text-muted-foreground">
                  Checking admin permissions...
                </p>
              </div>
            </div>
          )}
          
          <div className="pt-4 border-t text-center">
            <p className="text-xs text-muted-foreground">
              Admin access is logged for security purposes
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};