import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Eye, EyeOff, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export const TempPasswordAdminLogin = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      toast({
        title: "Password Required",
        description: "Please enter the admin password.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Get the admin password from Supabase secrets
      const { data: secretData, error } = await supabase.functions.invoke('secrets', {
        body: { name: 'ADMIN_PASSWORD' }
      });

      if (error) {
        console.error('Error fetching admin password:', error);
        toast({
          title: "Configuration Error",
          description: "Admin password not configured. Please contact administrator.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const adminPassword = secretData?.value;
      
      if (password === adminPassword) {
        // Set temporary admin authentication flag
        sessionStorage.setItem('temp_admin_authenticated', 'true');
        toast({
          title: "Access Granted",
          description: "Welcome to the admin portal.",
        });
        navigate('/dashboard/admin/feedback');
      } else {
        toast({
          title: "Access Denied",
          description: "Incorrect password. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Authentication error:', error);
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
            Enter admin password to access admin features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Admin Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              <Lock className="h-4 w-4 mr-2" />
              {isLoading ? 'Authenticating...' : 'Access Admin Portal'}
            </Button>
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
            <p className="text-xs text-orange-600 mt-1">
              Temporary password authentication mode
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};