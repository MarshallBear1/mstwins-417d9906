import React, { useEffect } from 'react';
import { getSecurityHeaders, setCSRFToken, logAdminAction } from '@/lib/security';

// Enhanced Component to add security headers, CSRF protection, and security monitoring
export const SecurityEnhancements: React.FC = () => {
  useEffect(() => {
    // Initialize CSRF token for admin operations
    setCSRFToken();

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

    // Enhanced CSP with stricter policies
    const cspContent = "default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.posthog.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';";
    addMetaTag('Content-Security-Policy', cspContent);
    
    // Add additional security headers
    addMetaTag('referrer', 'strict-origin-when-cross-origin');
    addMetaTag('X-Content-Type-Options', 'nosniff');
    addMetaTag('X-Frame-Options', 'DENY');
    addMetaTag('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // Force HTTPS redirect if on HTTP (client-side fallback)
    try {
      if (location.protocol === 'http:' && !location.hostname.includes('localhost')) {
        console.warn('Redirecting to HTTPS for security');
        location.replace(location.href.replace('http:', 'https:'));
      }
    } catch (error) {
      // Silently handle cross-origin restrictions in iframe environments
      console.debug('HTTPS redirect check skipped due to cross-origin restrictions');
    }

    // Enhanced security monitoring
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    
    console.error = (...args) => {
      const errorString = args.join(' ');
      if (errorString.includes('script') || errorString.includes('eval') || errorString.includes('XSS')) {
        console.warn('🔒 Potential security issue detected:', errorString);
        // Log to admin audit in production
        if (process.env.NODE_ENV === 'production') {
          logAdminAction('security_alert', { 
            type: 'console_error', 
            message: errorString.substring(0, 500),
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent 
          });
        }
      }
      originalConsoleError.apply(console, args);
    };

    console.warn = (...args) => {
      const warnString = args.join(' ');
      if (warnString.includes('Mixed Content') || warnString.includes('Insecure')) {
        console.error('🔒 Security warning detected:', warnString);
        // Log security warnings
        if (process.env.NODE_ENV === 'production') {
          logAdminAction('security_warning', { 
            type: 'console_warn', 
            message: warnString.substring(0, 500),
            timestamp: new Date().toISOString() 
          });
        }
      }
      originalConsoleWarn.apply(console, args);
    };

    // Monitor for DOM manipulation attempts
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              // Check for suspicious script injections
              try {
                if (element.tagName?.toLowerCase() === 'script' && 
                    !element.getAttribute('src')?.includes(location.hostname)) {
                  console.error('🔒 Suspicious script injection detected');
                  element.remove(); // Remove the suspicious script
                }
              } catch (error) {
                // Handle cross-origin restrictions when accessing location.hostname
                console.debug('Script injection check skipped due to cross-origin restrictions');
              }
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Session timeout monitoring for admin users
    let sessionTimeoutWarning: NodeJS.Timeout;
    const checkAdminSession = () => {
      const adminToken = sessionStorage.getItem('admin_session_token');
      if (adminToken) {
        // Warn admin users about session timeout after 1.5 hours
        sessionTimeoutWarning = setTimeout(() => {
          console.warn('🔒 Admin session will expire soon. Please save your work.');
        }, 90 * 60 * 1000); // 1.5 hours
      }
    };

    checkAdminSession();

    return () => {
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
      observer.disconnect();
      if (sessionTimeoutWarning) {
        clearTimeout(sessionTimeoutWarning);
      }
    };
  }, []);

  return null; // This component doesn't render anything visible
};

// Enhanced Performance and security monitoring hook
export const useSecurityMonitoring = () => {
  useEffect(() => {
    // Enhanced suspicious activity detection
    const detectSuspiciousActivity = () => {
      // Check for common attack patterns in URL and referrer
      const suspiciousPatterns = [
        /javascript:/i,
        /data:text\/html/i,
        /<script/i,
        /eval\(/i,
        /expression\(/i,
        /vbscript:/i,
        /onload=/i,
        /onerror=/i,
        /%3Cscript/i, // URL encoded script
        /\.\.\//i // Directory traversal
      ];
      
      const url = window.location.href;
      const referrer = document.referrer;
      
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(url)) {
          console.warn('🔒 Suspicious URL pattern detected:', url);
          logAdminAction('security_alert', { 
            type: 'suspicious_url', 
            url: url.substring(0, 500),
            pattern: pattern.toString(),
            timestamp: new Date().toISOString()
          });
        }
        if (referrer && pattern.test(referrer)) {
          console.warn('🔒 Suspicious referrer detected:', referrer);
          logAdminAction('security_alert', { 
            type: 'suspicious_referrer', 
            referrer: referrer.substring(0, 500),
            pattern: pattern.toString(),
            timestamp: new Date().toISOString()
          });
        }
      }
    };

    // Enhanced performance monitoring with security implications
    const monitorPerformance = () => {
      if ('performance' in window) {
        // Monitor page load times (could indicate attacks)
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
          
          // Very slow loads could indicate attacks
          if (loadTime > 10000) { // 10 seconds
            console.warn('🔒 Extremely slow page load detected (potential attack):', loadTime + 'ms');
            logAdminAction('security_warning', { 
              type: 'slow_load_potential_attack', 
              loadTime,
              timestamp: new Date().toISOString()
            });
          } else if (loadTime > 5000) { // 5 seconds
            console.warn('⚠️ Slow page load detected:', loadTime + 'ms');
          }
        }

        // Monitor resource loading for potential security issues
        const resources = performance.getEntriesByType('resource');
        resources.forEach((resource: PerformanceEntry) => {
          const entry = resource as PerformanceResourceTiming;
          // Check for resources from suspicious domains
          try {
            if (entry.name && !entry.name.includes(location.hostname) && 
                !entry.name.includes('supabase.co') && 
                !entry.name.includes('posthog.com')) {
              console.warn('🔒 External resource loaded:', entry.name);
            }
          } catch (error) {
            // Handle cross-origin restrictions when accessing location.hostname
            console.debug('Resource domain check skipped due to cross-origin restrictions');
          }
        });
      }
    };

    // Monitor local storage for suspicious activity
    const monitorStorage = () => {
      const suspiciousKeys = ['eval', 'script', 'payload', 'xss', 'injection'];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          suspiciousKeys.forEach(suspiciousKey => {
            if (key.toLowerCase().includes(suspiciousKey) || 
                (value && value.toLowerCase().includes(suspiciousKey))) {
              console.warn('🔒 Suspicious localStorage entry detected:', key);
              logAdminAction('security_alert', { 
                type: 'suspicious_storage', 
                key,
                timestamp: new Date().toISOString()
              });
            }
          });
        }
      }
    };

    // Detect potential clickjacking
    const detectClickjacking = () => {
      try {
        if (window.top !== window.self) {
          // Try to access top frame's hostname to detect legitimate iframe usage
          let topDomain = 'unknown';
          try {
            topDomain = window.top?.location?.hostname || 'unknown';
          } catch (crossOriginError) {
            // If we can't access the top frame's location, it's likely a cross-origin iframe
            // This is common in development environments and legitimate embedding scenarios
            console.debug('Cross-origin iframe detected (normal in development)');
            return; // Skip logging for cross-origin iframes
          }
          
          console.error('🔒 Potential clickjacking detected - page is in a frame');
          logAdminAction('security_alert', { 
            type: 'potential_clickjacking', 
            timestamp: new Date().toISOString(),
            topDomain
          });
        }
      } catch (error) {
        // Handle any other cross-origin restrictions
        console.debug('Clickjacking detection skipped due to cross-origin restrictions');
      }
    };

    // Run initial checks
    detectSuspiciousActivity();
    monitorPerformance();
    monitorStorage();
    detectClickjacking();
    
    // Run checks periodically
    const securityInterval = setInterval(() => {
      detectSuspiciousActivity();
      monitorStorage();
    }, 30000); // Every 30 seconds

    const performanceInterval = setInterval(() => {
      monitorPerformance();
    }, 60000); // Every minute

    return () => {
      clearInterval(securityInterval);
      clearInterval(performanceInterval);
    };
  }, []);
};