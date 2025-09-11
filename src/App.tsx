
import { Toaster } from "@/components/ui/toaster";

import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, lazy, Suspense, memo } from "react";
import { AuthProvider } from "./hooks/useAuth";
import { analytics } from "./lib/analytics";
import { usePageAbandonTracker } from "./hooks/usePageAbandonTracker";
import { supabase } from "@/integrations/supabase/client";
import OptimizedIndex from "./pages/OptimizedIndex";
import MobileHome from "./components/MobileHome";
import { useIsNativeApp } from "./hooks/useIsNativeApp";
import MobileStatusBar from "./components/MobileStatusBar";
import MobileOptimizationsProvider from "./components/MobileOptimizationsProvider";
import MobileKeyboardHandler from "./components/MobileKeyboardHandler";
import MobileFloatingActionButton from "./components/mobile/MobileFloatingActionButton";
import IOSEnhancements from "./components/IOSEnhancements";
import AccessibilityEnhancements from "./components/AccessibilityEnhancements";
import { SecurityContextProvider } from "./components/SecurityContextProvider";
import { AdminAuthProvider } from "./hooks/useAdminAuth";
import { ErrorBoundary } from "./components/ErrorBoundary";
import PersistentBottomNavigation from "./components/PersistentBottomNavigation";
import { PerformanceMonitor } from "./components/PerformanceOptimizer";
import { NotificationPermissionPrompt } from "./components/NotificationPermissionPrompt";
import UnifiedNotificationManager from "./components/UnifiedNotificationManager";
import { NotificationProvider } from "./hooks/useUnifiedNotifications";

// Import required icons for FAB
import { Heart, MessageCircle } from "lucide-react";

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
    // Initialize with a real PostHog public key for anonymous tracking
    // This public key is safe to expose in client-side code
    const publicPostHogKey = 'phc_CcVjxuBE09RJ87MsfpqCN8Q2IEfgqeZtEn0tKlRhwgP';
    analytics.init(publicPostHogKey);
    console.log('✅ PostHog initialized with public key');
  }, []);

  return null;
};

// Mobile FAB component that shows conditionally
const MobileFAB = () => {
  const location = useLocation();
  const { isNativeApp } = useIsNativeApp();
  
  // Only show FAB on certain pages and in native app
  const showFAB = isNativeApp && (
    location.pathname === '/dashboard' || 
    location.pathname.startsWith('/discover') ||
    location.pathname.startsWith('/matches')
  );

  if (!showFAB) return null;

  const fabActions = [
    {
      icon: <Heart className="w-5 h-5" />,
      label: 'Discover',
      onClick: () => window.location.href = '/dashboard?tab=discover',
      color: 'secondary' as const
    },
    {
      icon: <MessageCircle className="w-5 h-5" />,
      label: 'Messages', 
      onClick: () => window.location.href = '/dashboard?tab=matches',
      color: 'primary' as const
    }
  ];

  return <MobileFloatingActionButton actions={fabActions} className="z-50" />;
};

const RouteTracker = () => {
  const location = useLocation();
  
  // Add page abandonment tracking
  usePageAbandonTracker();
  
  useEffect(() => {
    // Enhanced page view tracking with journey context
    analytics.pageView(location.pathname);
    
    // Track specific journey events
    if (location.pathname === '/') {
      const urlParams = new URLSearchParams(location.search);
      analytics.landingPageViewed(
        urlParams.get('utm_source') || document.referrer || 'direct',
        urlParams.get('utm_campaign') || undefined
      );
    }
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

// Component to conditionally render home screen based on platform
const ConditionalHome = () => {
  const { isNativeApp, isLoading } = useIsNativeApp();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }
  
  return isNativeApp ? <MobileHome /> : <OptimizedIndex />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AdminAuthProvider>
        <SecurityContextProvider>
          <NotificationProvider>
            <TooltipProvider>
              <ErrorBoundary>
                <MobileStatusBar theme="light" color="#2563eb" />
                <MobileOptimizationsProvider disableContextMenu={true} />
                <IOSEnhancements />
                <AccessibilityEnhancements />
                <Toaster />
                <Sonner />
                <UnifiedNotificationManager />
                <NotificationPermissionPrompt />
                <PerformanceMonitor />
            <BrowserRouter>
              <PostHogInitializer />
              <RouteTracker />
              <MobileFAB />
            
            <MobileKeyboardHandler adjustForKeyboard={true}>
            <Routes>
            <Route path="/" element={<ConditionalHome />} />
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
              
            </MobileKeyboardHandler>
              </BrowserRouter>
              </ErrorBoundary>
            </TooltipProvider>
          </NotificationProvider>
        </SecurityContextProvider>
      </AdminAuthProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
