
import { Toaster } from "@/components/ui/toaster";
import ReferralPopup from "@/components/ReferralPopup";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import { AuthProvider } from "./hooks/useAuth";
import { analytics } from "./lib/analytics";
import OptimizedIndex from "./pages/OptimizedIndex";
import MobileStatusBar from "./components/MobileStatusBar";
import MobileOptimizationsProvider from "./components/MobileOptimizationsProvider";
import AccessibilityEnhancements from "./components/AccessibilityEnhancements";
import { SecurityEnhancements } from "./components/SecurityEnhancements";
import { NativeCapabilities } from "./hooks/useNativeCapabilities";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Lazy load non-critical pages with error handling
const Auth = lazy(() => import("./pages/Auth").catch(err => {
  console.error('Failed to load Auth page:', err);
  return { default: () => <div>Failed to load page. Please refresh.</div> };
}));
const Dashboard = lazy(() => import("./pages/Dashboard").catch(err => {
  console.error('Failed to load Dashboard page:', err);
  return { default: () => <div>Failed to load page. Please refresh.</div> };
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
const NotFound = lazy(() => import("./pages/NotFound").catch(err => {
  console.error('Failed to load NotFound page:', err);
  return { default: () => <div>Page not found. Please refresh.</div> };
}));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

const RouteTracker = () => {
  const location = useLocation();
  
  useEffect(() => {
    analytics.pageView(location.pathname + location.search);
  }, [location]);
  
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
      <TooltipProvider>
        <ErrorBoundary>
          <SecurityEnhancements />
          <NativeCapabilities />
          <MobileStatusBar theme="light" color="#2563eb" />
          <MobileOptimizationsProvider disableContextMenu={true} />
          <AccessibilityEnhancements />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <RouteTracker />
            <Routes>
            <Route path="/" element={<OptimizedIndex />} />
            <Route path="/auth" element={
              <Suspense fallback={<LoadingSpinner />}>
                <Auth />
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
            <Route path="/admin/feedback" element={
              <Suspense fallback={<LoadingSpinner />}>
                <AdminFeedback />
              </Suspense>
            } />
            <Route path="*" element={
              <Suspense fallback={<LoadingSpinner />}>
                <NotFound />
              </Suspense>
            } />
          </Routes>
          <ReferralPopup />
        </BrowserRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
