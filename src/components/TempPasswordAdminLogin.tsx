import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export const TempPasswordAdminLogin = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Check if current user has admin role via proper authentication
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in first to access admin features.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Check admin role via database
      const { data, error } = await supabase.rpc('authenticate_admin_user');
      
      if (error) {
        console.error('Admin authentication error:', error);
        toast({
          title: "Authentication Error",
          description: "Unable to verify admin credentials. Please try again.",
          variant: "destructive",
        });
      } else if ((data as any)?.authenticated) {
        sessionStorage.setItem('temp_admin_authenticated', 'true');
        toast({
          title: "Access Granted",
          description: "Welcome to the admin portal.",
        });
        navigate('/dashboard/admin/feedback');
      } else {
        toast({
          title: "Access Denied",
          description: "Admin role required. Please contact administrator.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Admin authentication error:', error);
      toast({
        title: "Authentication Error",
        description: "Unable to verify credentials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Admin Portal Access</CardTitle>
          <CardDescription>
            Role-based authentication - Admin users can access admin features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Click below to verify your admin role and access admin features.
              </p>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                <Lock className="h-4 w-4 mr-2" />
                {isLoading ? 'Verifying Admin Role...' : 'Verify Admin Access'}
              </Button>
            </div>
          </form>
          
          <div className="mt-4 space-y-2">
            <Button variant="outline" asChild className="w-full">
              <Link to="/dashboard">
                Back to Dashboard
              </Link>
            </Button>
          </div>
          
          <div className="pt-4 border-t text-center">
            <p className="text-xs text-muted-foreground">
              Admin access is logged for security purposes
            </p>
            <p className="text-xs text-green-600 mt-1">
              Database role-based authentication
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};