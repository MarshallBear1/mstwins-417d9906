import { useEffect, useState } from 'react';
import { useMobileOptimizations } from '@/hooks/useMobileOptimizations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, XCircle, Smartphone, Monitor } from 'lucide-react';

interface ReadinessCheck {
  name: string;
  status: 'pass' | 'warning' | 'fail';
  description: string;
  recommendation?: string;
}

const MobileReadinessReport = () => {
  const { isMobile, isIOS, safeAreaInsets, keyboard } = useMobileOptimizations();
  const [checks, setChecks] = useState<ReadinessCheck[]>([]);

  useEffect(() => {
    const performChecks = () => {
      const readinessChecks: ReadinessCheck[] = [];

      // Viewport Configuration Check
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      readinessChecks.push({
        name: 'Viewport Configuration',
        status: viewportMeta?.getAttribute('content')?.includes('viewport-fit=cover') ? 'pass' : 'warning',
        description: 'Proper viewport meta tag with safe area support',
        recommendation: viewportMeta ? undefined : 'Add viewport meta tag with viewport-fit=cover'
      });

      // iOS App Icons Check
      const appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
      readinessChecks.push({
        name: 'iOS App Icons',
        status: appleIcon ? 'pass' : 'warning',
        description: 'Apple touch icons for home screen installation',
        recommendation: appleIcon ? undefined : 'Add apple-touch-icon link tags'
      });

      // Touch Target Size Check
      const buttons = document.querySelectorAll('button, [role="button"], a');
      let hasSmallTouchTargets = false;
      buttons.forEach(button => {
        const rect = button.getBoundingClientRect();
        if (rect.height < 44 || rect.width < 44) {
          hasSmallTouchTargets = true;
        }
      });
      
      readinessChecks.push({
        name: 'Touch Target Size',
        status: hasSmallTouchTargets ? 'warning' : 'pass',
        description: 'All interactive elements meet 44px minimum touch target size',
        recommendation: hasSmallTouchTargets ? 'Some touch targets are smaller than 44px' : undefined
      });

      // Font Size Check (prevents zoom on iOS)
      const inputs = document.querySelectorAll('input, textarea, select');
      let hasSmallFonts = false;
      inputs.forEach(input => {
        const styles = window.getComputedStyle(input);
        const fontSize = parseInt(styles.fontSize);
        if (fontSize < 16) {
          hasSmallFonts = true;
        }
      });

      readinessChecks.push({
        name: 'Input Font Size',
        status: hasSmallFonts ? 'fail' : 'pass',
        description: 'Input fields use 16px+ font size to prevent zoom on iOS',
        recommendation: hasSmallFonts ? 'Increase input font size to 16px or larger' : undefined
      });

      // Safe Area Support Check
      const safeAreaSupport = getComputedStyle(document.documentElement)
        .getPropertyValue('--safe-area-inset-top');
      readinessChecks.push({
        name: 'Safe Area Support',
        status: safeAreaSupport ? 'pass' : 'warning',
        description: 'CSS custom properties for safe area insets',
        recommendation: !safeAreaSupport ? 'Add safe area inset CSS variables' : undefined
      });

      // Theme Color Meta Tag Check
      const themeColor = document.querySelector('meta[name="theme-color"]');
      readinessChecks.push({
        name: 'Theme Color',
        status: themeColor ? 'pass' : 'warning',
        description: 'Theme color meta tag for browser chrome',
        recommendation: !themeColor ? 'Add theme-color meta tag' : undefined
      });

      // Manifest Check
      const manifest = document.querySelector('link[rel="manifest"]');
      readinessChecks.push({
        name: 'Web App Manifest',
        status: manifest ? 'pass' : 'warning',
        description: 'Web app manifest for PWA functionality',
        recommendation: !manifest ? 'Add web app manifest file' : undefined
      });

      // iOS Status Bar Style Check
      const statusBarStyle = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
      readinessChecks.push({
        name: 'iOS Status Bar Style',
        status: statusBarStyle ? 'pass' : 'warning',
        description: 'iOS status bar styling configuration',
        recommendation: !statusBarStyle ? 'Add apple-mobile-web-app-status-bar-style meta tag' : undefined
      });

      // Performance Check - Image Optimization
      const images = document.querySelectorAll('img');
      let hasUnoptimizedImages = false;
      images.forEach(img => {
        if (!img.loading && !img.getAttribute('loading')) {
          hasUnoptimizedImages = true;
        }
      });

      readinessChecks.push({
        name: 'Image Optimization',
        status: hasUnoptimizedImages ? 'warning' : 'pass',
        description: 'Images use lazy loading for better performance',
        recommendation: hasUnoptimizedImages ? 'Add loading="lazy" to non-critical images' : undefined
      });

      // Accessibility Check
      const hasSkipLink = document.querySelector('a[href="#main"], [data-skip-link]');
      readinessChecks.push({
        name: 'Accessibility',
        status: hasSkipLink ? 'pass' : 'warning',
        description: 'Skip navigation link for screen readers',
        recommendation: !hasSkipLink ? 'Add skip navigation link' : undefined
      });

      setChecks(readinessChecks);
    };

    // Perform checks after DOM is ready
    if (document.readyState === 'complete') {
      performChecks();
    } else {
      window.addEventListener('load', performChecks);
    }

    return () => {
      window.removeEventListener('load', performChecks);
    };
  }, []);

  const passCount = checks.filter(check => check.status === 'pass').length;
  const warningCount = checks.filter(check => check.status === 'warning').length;
  const failCount = checks.filter(check => check.status === 'fail').length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pass':
        return <Badge variant="secondary" className="bg-success/10 text-success">Pass</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700">Warning</Badge>;
      case 'fail':
        return <Badge variant="destructive">Fail</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isMobile ? <Smartphone className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
          iOS App Store Readiness Report
        </CardTitle>
        <div className="flex gap-4 text-sm">
          <span className="flex items-center gap-1">
            <CheckCircle className="h-4 w-4 text-success" />
            {passCount} Passed
          </span>
          <span className="flex items-center gap-1">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            {warningCount} Warnings
          </span>
          <span className="flex items-center gap-1">
            <XCircle className="h-4 w-4 text-destructive" />
            {failCount} Failed
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {checks.map((check, index) => (
            <div key={index} className="flex items-start justify-between p-4 border rounded-lg">
              <div className="flex items-start gap-3 flex-1">
                {getStatusIcon(check.status)}
                <div>
                  <h4 className="font-medium">{check.name}</h4>
                  <p className="text-sm text-muted-foreground">{check.description}</p>
                  {check.recommendation && (
                    <p className="text-xs text-orange-600 mt-1">
                      Recommendation: {check.recommendation}
                    </p>
                  )}
                </div>
              </div>
              {getStatusBadge(check.status)}
            </div>
          ))}
        </div>
        
        {isIOS && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">iOS Device Detected</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>Safe Area Insets: Top: {safeAreaInsets.top}px, Bottom: {safeAreaInsets.bottom}px</p>
              <p>Keyboard Status: {keyboard.isVisible ? 'Visible' : 'Hidden'}</p>
              {keyboard.isVisible && <p>Keyboard Height: {keyboard.height}px</p>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MobileReadinessReport;