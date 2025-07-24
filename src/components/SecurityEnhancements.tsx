import React, { useEffect } from 'react';
import { getSecurityHeaders } from '@/lib/security';

// Component to add security headers and HSTS
export const SecurityEnhancements: React.FC = () => {
  useEffect(() => {
    // Add security headers via meta tags where possible
    const addMetaTag = (name: string, content: string) => {
      const existing = document.querySelector(`meta[name="${name}"]`);
      if (existing) {
        existing.setAttribute('content', content);
      } else {
        const meta = document.createElement('meta');
        meta.setAttribute('name', name);
        meta.setAttribute('content', content);
        document.head.appendChild(meta);
      }
    };

    // Add CSP meta tag
    const cspContent = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.posthog.com;";
    addMetaTag('Content-Security-Policy', cspContent);
    
    // Add referrer policy
    addMetaTag('referrer', 'strict-origin-when-cross-origin');
    
    // Force HTTPS redirect if on HTTP (client-side fallback)
    if (location.protocol === 'http:' && !location.hostname.includes('localhost')) {
      location.replace(location.href.replace('http:', 'https:'));
    }

    // Security monitoring - detect potential XSS attempts
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const errorString = args.join(' ');
      if (errorString.includes('script') || errorString.includes('eval')) {
        // Log potential security issues
        console.warn('Potential security issue detected:', errorString);
      }
      originalConsoleError.apply(console, args);
    };

    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  return null; // This component doesn't render anything visible
};

// Performance and security monitoring hook
export const useSecurityMonitoring = () => {
  useEffect(() => {
    // Monitor for suspicious activity
    const detectSuspiciousActivity = () => {
      // Check for common attack patterns in URL
      const suspiciousPatterns = [
        /javascript:/i,
        /data:text\/html/i,
        /<script/i,
        /eval\(/i,
        /expression\(/i
      ];
      
      const url = window.location.href;
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(url)) {
          console.warn('Suspicious URL pattern detected:', url);
          // In a real app, you might want to report this to your security team
        }
      }
    };

    // Performance monitoring
    const monitorPerformance = () => {
      if ('performance' in window) {
        // Monitor page load times
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
          if (loadTime > 5000) { // 5 seconds
            console.warn('Slow page load detected:', loadTime + 'ms');
          }
        }
      }
    };

    detectSuspiciousActivity();
    monitorPerformance();
    
    // Run checks periodically
    const interval = setInterval(() => {
      detectSuspiciousActivity();
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);
};