import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.tsx";
import "./index.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/useAuth";
import { analytics } from "@/lib/analytics";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Initialize analytics with proper error handling
try {
  const POSTHOG_API_KEY = "phc_V1c2CgJ3M0h1K2ZjE3Q5P2R0X0YtT3L4S0W1J2B9R6";
  if (POSTHOG_API_KEY) {
    analytics.init(POSTHOG_API_KEY);
    console.log('🚀 Application analytics initialized');
  } else {
    console.warn('⚠️ PostHog API key not found - analytics disabled');
  }
} catch (error) {
  console.error('🚨 Failed to initialize analytics:', error);
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on auth errors (4xx)
        if (error?.status >= 400 && error?.status < 500) {
          console.log('🚨 Auth error detected, not retrying:', error?.status);
          return false;
        }
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: true,
    },
  },
});

// Global error handler
window.addEventListener('error', (event) => {
  console.error('🚨 Global error:', event.error);
  analytics.errorOccurred(event.error?.message || 'Unknown error', {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled promise rejection:', event.reason);
  analytics.errorOccurred('Unhandled Promise Rejection', {
    reason: event.reason?.toString()
  });
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary onError={(error, errorInfo) => {
      console.error('🚨 Root error boundary triggered:', error, errorInfo);
      analytics.errorOccurred(error.message, {
        componentStack: errorInfo.componentStack,
        stack: error.stack
      });
    }}>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <App />
            <Toaster />
          </AuthProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);
