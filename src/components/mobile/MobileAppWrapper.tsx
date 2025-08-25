import { ReactNode } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMobileOptimizations } from '@/hooks/useMobileOptimizations';
import { useMobileEnhancements } from '@/hooks/useMobileEnhancements';
import MobileOptimizationsProvider from '@/components/MobileOptimizationsProvider';
import MobileFloatingActionButton from './MobileFloatingActionButton';
import MobileOfflineIndicator from './MobileOfflineIndicator';
import MobileErrorBoundary from './MobileErrorBoundary';

interface MobileAppWrapperProps {
  children: ReactNode;
}

const MobileAppWrapper = ({ children }: MobileAppWrapperProps) => {
  const isMobile = useIsMobile();
  const { safeAreaInsets } = useMobileOptimizations();
  const { isOffline, hasLowBattery } = useMobileEnhancements();

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <MobileErrorBoundary>
      <MobileOptimizationsProvider />
      <div 
        className="mobile-app-wrapper min-h-screen bg-background"
        style={{
          paddingTop: safeAreaInsets.top,
          paddingBottom: safeAreaInsets.bottom,
          paddingLeft: safeAreaInsets.left,
          paddingRight: safeAreaInsets.right,
        }}
      >
        <MobileOfflineIndicator />
        {children}
        <MobileFloatingActionButton />
      </div>
    </MobileErrorBoundary>
  );
};

export default MobileAppWrapper;