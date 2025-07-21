import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Email notification helper functions
const sendWelcomeEmail = async (email: string, firstName?: string) => {
  try {
    const response = await supabase.functions.invoke('send-welcome-email', {
      body: { email, firstName }
    });
    console.log('Welcome email sent:', response);
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
};

export const sendNotificationEmail = async (
  email: string, 
  type: 'match' | 'like' | 'message',
  firstName?: string,
  fromUser?: string,
  message?: string
) => {
  try {
    const response = await supabase.functions.invoke('send-notification-email', {
      body: { email, firstName, type, fromUser, message }
    });
    console.log(`${type} notification email sent:`, response);
    return response;
  } catch (error) {
    console.error(`Error sending ${type} notification email:`, error);
    throw error;
  }
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: firstName,
            last_name: lastName,
          }
        }
      });

      if (error) {
        console.error('SignUp error:', error);
        toast({
          variant: "destructive",
          title: "Sign Up Error",
          description: error.message,
        });
        return { error };
      }

      console.log('SignUp successful:', data);

      // ALWAYS send welcome email - even if session is null
      if (data.user) {
        try {
          console.log('Sending welcome email to:', email);
          await supabase.functions.invoke('send-welcome-email', {
            body: { 
              email: email,
              firstName: firstName || 'friend'
            }
          });
          console.log('Welcome email sent successfully');
        } catch (emailError) {
          console.error('Error sending welcome email:', emailError);
          // Don't fail signup if email fails
        }
      }

      if (data.user && data.session) {
        toast({
          title: "Welcome!",
          description: "Your account has been created successfully. Check your email!",
        });
        
        // Navigate to profile setup after signup
        setTimeout(() => {
          window.location.href = '/profile-setup';
        }, 500);
      } else if (data.user && !data.session) {
        toast({
          title: "Account Created!",
          description: "Please check your email to verify your account.",
        });
      }

      return { error: null };
    } catch (error: any) {
      console.error('SignUp error:', error);
      toast({
        variant: "destructive",
        title: "Sign Up Error",
        description: error.message,
      });
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Sign In Error",
          description: error.message,
        });
        return { error };
      }

      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully.",
      });

      // Navigate to dashboard after signin
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 500);

      return { error: null };
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign In Error",
        description: error.message,
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          variant: "destructive",
          title: "Sign Out Error",
          description: error.message,
        });
      } else {
        toast({
          title: "Signed out",
          description: "You have been signed out successfully.",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign Out Error",
        description: error.message,
      });
    }
  };

  const value = {
    user,
    session,
    signUp,
    signIn,
    signOut,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};