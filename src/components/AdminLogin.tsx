import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, LogIn } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAuth } from '@/hooks/useAuth';

export const AdminLogin = () => {
  const { user } = useAuth();
  const { createAdminSession, adminLoading } = useAdminAuth();
  const [isRequesting, setIsRequesting] = useState(false);

  const handleRequestAdminAccess = async () => {
    setIsRequesting(true);
    await createAdminSession();
    setIsRequesting(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please log in to your account first before accessing admin features.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/auth'} className="w-full">
              <LogIn className="h-4 w-4 mr-2" />
              Go to Login
            </Button>
          </CardContent>
        </Card>
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
          <CardTitle>Admin Access Required</CardTitle>
          <CardDescription>
            Request admin access to manage feedback and system settings. Only users with admin roles can access these features.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleRequestAdminAccess} 
            disabled={isRequesting || adminLoading}
            className="w-full"
          >
            {isRequesting ? 'Requesting Access...' : 'Request Admin Access'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};