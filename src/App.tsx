
import { Toaster } from "@/components/ui/toaster";
import ReferralPopup from "@/components/ReferralPopup";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, lazy, Suspense, memo } from "react";
import { AuthProvider } from "./hooks/useAuth";
import { analytics } from "./lib/analytics";
import { supabase } from "@/integrations/supabase/client";
import OptimizedIndex from "./pages/OptimizedIndex";
import MobileStatusBar from "./components/MobileStatusBar";
import MobileOptimizationsProvider from "./components/MobileOptimizationsProvider";
import IOSEnhancements from "./components/IOSEnhancements";
import AccessibilityEnhancements from "./components/AccessibilityEnhancements";
import { SecurityContextProvider } from "./components/SecurityContextProvider";
import { AdminAuthProvider } from "./hooks/useAdminAuth";
import { NativeCapabilities } from "./hooks/useNativeCapabilities";
import { ErrorBoundary } from "./components/ErrorBoundary";
import IOSNotificationManager from "./components/IOSNotificationManager";
import PersistentBottomNavigation from "./components/PersistentBottomNavigation";
import { PerformanceMonitor } from "./components/PerformanceOptimizer";

// Lazy load non-critical pages with error handling
const Auth = lazy(() => import("./pages/Auth").catch(err => {
  console.error('Failed to load Auth page:', err);
  return { default: () => <div>Failed to load page. Please refresh.</div> };
}));
const PasswordReset = lazy(() => import("./pages/PasswordReset").catch(err => {
  console.error('Failed to load PasswordReset page:', err);
  return { default: () => <div>Failed to load page. Please refresh.</div> };
}));
const Dashboard = lazy(() => import("./pages/Dashboard").catch(err => {
  console.error('Failed to load Dashboard page:', err);
  return { default: memo(() => <div>Failed to load page. Please refresh.</div>) };
}));
const ProfileSetup = lazy(() => import("./pages/ProfileSetup").catch(err => {
  console.error('Failed to load ProfileSetup page:', err);
  return { default: () => <div>Failed to load page. Please refresh.</div> };
}));
const ExtendedProfileSetup = lazy(() => import("./components/ExtendedProfileSetup").catch(err => {
  console.error('Failed to load ExtendedProfileSetup component:', err);
  return { default: () => <div>Failed to load page. Please refresh.</div> };
}));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy").catch(err => {
  console.error('Failed to load PrivacyPolicy page:', err);
  return { default: () => <div>Failed to load page. Please refresh.</div> };
}));
const TermsOfService = lazy(() => import("./pages/TermsOfService").catch(err => {
  console.error('Failed to load TermsOfService page:', err);
  return { default: () => <div>Failed to load page. Please refresh.</div> };
}));
const AdminFeedback = lazy(() => import("./pages/AdminFeedback").catch(err => {
  console.error('Failed to load AdminFeedback page:', err);
  return { default: () => <div>Failed to load page. Please refresh.</div> };
}));
const AdminModeration = lazy(() => import("./pages/AdminModeration").catch(err => {
  console.error('Failed to load AdminModeration page:', err);
  return { default: () => <div>Failed to load page. Please refresh.</div> };
}));
const NotFound = lazy(() => import("./pages/NotFound").catch(err => {
  console.error('Failed to load NotFound page:', err);
  return { default: () => <div>Page not found. Please refresh.</div> };
}));
const TempPasswordAdminLogin = lazy(() => import("./components/TempPasswordAdminLogin").then(module => ({
  default: module.TempPasswordAdminLogin
})).catch(err => {
  console.error('Failed to load TempPasswordAdminLogin component:', err);
  return { default: () => <div>Failed to load page. Please refresh.</div> };
}));
const TempAdminProtectedRoute = lazy(() => import("./components/TempAdminProtectedRoute").then(module => ({
  default: module.TempAdminProtectedRoute
})).catch(err => {
  console.error('Failed to load TempAdminProtectedRoute component:', err);
  return { default: ({ children }: { children: React.ReactNode }) => <>{children}</> };
}));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

const PostHogInitializer = () => {
  useEffect(() => {
    const initializePostHog = async () => {
      try {
        // Check if PostHog is already initialized
        if (analytics.isInitialized()) {
          return;
        }

        // Try to get PostHog key (works for both authenticated and anonymous users)
        try {
          const { data: secrets } = await supabase.functions.invoke('secrets', {
            body: { name: 'POSTHOG_API_KEY' }
          });
          
          if (secrets?.value) {
            analytics.init(secrets.value);
            console.log('✅ PostHog initialized for all users');
            
            if (process.env.NODE_ENV === 'development') {
              // Test event only in development
              setTimeout(() => {
                analytics.track('app_loaded', { 
                  timestamp: Date.now(),
                  user_type: 'visitor'
                });
              }, 1000);
            }
          }
        } catch (error) {
          // PostHog is optional - don't break the app if it fails
          console.log('📊 PostHog initialization skipped (key not available)');
        }
      } catch (error) {
        console.log('📊 PostHog initialization failed gracefully');
      }
    };

    initializePostHog();
  }, []);

  return null;
};

const RouteTracker = () => {
  const location = useLocation();
  
  useEffect(() => {
    // Track page views
    analytics.pageView(location.pathname);
  }, [location]);

  // Handle password reset hash parameters
  useEffect(() => {
    const handlePasswordResetHash = () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const type = hashParams.get('type');
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      
      // If we're on the root path and have password reset parameters in hash
      if (window.location.pathname === '/' && type === 'recovery' && accessToken && refreshToken) {
        console.log('🔑 Password reset hash detected on root path, redirecting to password-reset...');
        
        // Redirect to password-reset page with hash parameters preserved
        const currentHash = window.location.hash;
        window.location.href = `/password-reset${currentHash}`;
      }
    };

    // Check immediately
    handlePasswordResetHash();
    
    // Also listen for hash changes
    const handleHashChange = () => {
      handlePasswordResetHash();
    };
    
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return null;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AdminAuthProvider>
        <SecurityContextProvider>
          <TooltipProvider>
            <ErrorBoundary>
              <MobileStatusBar theme="light" color="#2563eb" />
              <MobileOptimizationsProvider disableContextMenu={true} />
              <IOSEnhancements />
              <AccessibilityEnhancements />
              <Toaster />
              <Sonner />
              <NativeCapabilities />
              <IOSNotificationManager />
              <PerformanceMonitor />
          <BrowserRouter>
            <PostHogInitializer />
            <RouteTracker />
            <Routes>
            <Route path="/" element={<OptimizedIndex />} />
            <Route path="/auth" element={
              <Suspense fallback={<LoadingSpinner />}>
                <Auth />
              </Suspense>
            } />
            <Route path="/password-reset" element={
              <Suspense fallback={<LoadingSpinner />}>
                <PasswordReset />
              </Suspense>
            } />
            <Route path="/dashboard" element={
              <Suspense fallback={<LoadingSpinner />}>
                <Dashboard />
              </Suspense>
            } />
            <Route path="/profile-setup" element={
              <Suspense fallback={<LoadingSpinner />}>
                <ProfileSetup />
              </Suspense>
            } />
            <Route path="/extended-profile" element={
              <Suspense fallback={<LoadingSpinner />}>
                <ExtendedProfileSetup />
              </Suspense>
            } />
            <Route path="/privacy-policy" element={
              <Suspense fallback={<LoadingSpinner />}>
                <PrivacyPolicy />
              </Suspense>
            } />
            <Route path="/terms-of-service" element={
              <Suspense fallback={<LoadingSpinner />}>
                <TermsOfService />
              </Suspense>
            } />
            <Route path="/admin-login" element={
              <Suspense fallback={<LoadingSpinner />}>
                <TempPasswordAdminLogin />
              </Suspense>
            } />
            <Route path="/temp-admin-login" element={
              <Suspense fallback={<LoadingSpinner />}>
                <TempPasswordAdminLogin />
              </Suspense>
            } />
            <Route path="/dashboard/admin/feedback" element={
              <Suspense fallback={<LoadingSpinner />}>
                <TempAdminProtectedRoute>
                  <AdminFeedback />
                </TempAdminProtectedRoute>
              </Suspense>
            } />
            <Route path="/dashboard/admin/moderation" element={
              <Suspense fallback={<LoadingSpinner />}>
                <TempAdminProtectedRoute>
                  <AdminModeration />
                </TempAdminProtectedRoute>
                </Suspense>
            } />
            <Route path="*" element={
              <Suspense fallback={<LoadingSpinner />}>
                <NotFound />
              </Suspense>
            } />
          </Routes>
              <PersistentBottomNavigation />
              <ReferralPopup />
            </BrowserRouter>
            </ErrorBoundary>
          </TooltipProvider>
        </SecurityContextProvider>
      </AdminAuthProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
