import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { analytics } from '@/lib/analytics';
import { Capacitor } from '@capacitor/core';

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
        console.log('🔐 Auth state change:', {
          event,
          userId: session?.user?.id,
          hasSession: !!session,
          platform: Capacitor.isNativePlatform() ? Capacitor.getPlatform() : 'web'
        });
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Track authentication events
        if (event === 'SIGNED_IN' && session?.user) {
          // Check if this is a password reset flow to prevent automatic redirect
          const isPasswordReset = window.location.search.includes('type=recovery');
          
          console.log('✅ User signed in successfully:', {
            userId: session.user.id,
            email: session.user.email,
            platform: Capacitor.isNativePlatform() ? Capacitor.getPlatform() : 'web',
            isPasswordReset
          });
          
          analytics.identify(session.user.id, {
            email: session.user.email,
            created_at: session.user.created_at
          });
          
          // Only track sign in and redirect if NOT during password reset
          if (!isPasswordReset) {
            analytics.userSignedIn(session.user.id);
            
            // Navigate to dashboard after signin (only if not password reset)
            setTimeout(() => {
              window.location.href = '/dashboard';
            }, 200);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out');
          analytics.reset();
        } else if (event === 'TOKEN_REFRESHED' && session) {
          console.log('🔄 Auth token refreshed for user:', session.user?.id);
        }
      }
    );

    // Check for existing session with enhanced debugging
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('❌ Error getting session:', error);
      } else if (session) {
        console.log('✅ Existing session found:', {
          userId: session.user.id,
          email: session.user.email,
          expiresAt: session.expires_at,
          platform: Capacitor.isNativePlatform() ? Capacitor.getPlatform() : 'web'
        });
      } else {
        console.log('ℹ️ No existing session found');
      }
      
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

      // Send welcome email in background (non-blocking)
      if (data.user) {
        try {
          console.log('Queueing welcome email for:', email);
          // Don't await - send in background for better performance
          supabase.functions.invoke('send-welcome-email', {
            body: { 
              email: email,
              firstName: firstName || 'friend'
            }
          }).then((response) => {
            console.log('Welcome email queued successfully:', response);
          }).catch((emailError) => {
            console.error('Error queueing welcome email:', emailError);
            // Don't fail signup if email fails
          });
        } catch (emailError) {
          console.error('Error with welcome email request:', emailError);
          // Don't fail signup if email fails
        }
        }
        
        // Track signup event
        if (data.user) {
          analytics.userSignedUp(data.user.id);
        }

      if (data.user && data.session) {
        toast({
          title: "Welcome!",
          description: "Your account has been created successfully. Check your email!",
        });
        
        // Navigate directly to dashboard after signup, skipping initial profile setup prompt
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 200); // Reduced delay for snappier UX
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
        // Don't show toast here, let the calling component handle it
        return { error };
      }

      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully.",
      });

      // Only redirect to dashboard if not during password reset
      const isPasswordReset = window.location.search.includes('type=recovery');
      if (!isPasswordReset) {
        // Navigate to dashboard after signin
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 200); // Reduced delay for snappier UX
      }

      return { error: null };
    } catch (error: any) {
      // Don't show toast here, let the calling component handle it
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
        // Track sign out
        if (user) {
          analytics.userSignedOut(user.id);
        }
        analytics.reset();
        
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