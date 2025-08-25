import { ReactNode, useState } from 'react';
import { MessageCircle, Heart, Users, Settings } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useIsNativeApp } from '@/hooks/useIsNativeApp';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileOptimizationsProvider from '@/components/MobileOptimizationsProvider';
import MobileKeyboardHandler from '@/components/MobileKeyboardHandler';
import MobileFloatingActionButton from '@/components/mobile/MobileFloatingActionButton';
import { NativeCapabilities } from '@/hooks/useNativeCapabilities';

interface MobileAppWrapperProps {
  children: ReactNode;
}

const MobileAppWrapper = ({ children }: MobileAppWrapperProps) => {
  const { user } = useAuth();
  const { isNativeApp } = useIsNativeApp();
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();

  // Only show FAB on certain pages and for authenticated users
  const showFAB = user && (
    location.pathname === '/dashboard' || 
    location.pathname.startsWith('/discover') ||
    location.pathname.startsWith('/matches')
  );

  const fabActions = [
    {
      icon: <MessageCircle className="w-5 h-5" />,
      label: 'Messages',
      onClick: () => navigate('/dashboard?tab=matches'),
      color: 'primary' as const
    },
    {
      icon: <Heart className="w-5 h-5" />,
      label: 'Discover',
      onClick: () => navigate('/dashboard?tab=discover'),
      color: 'secondary' as const
    },
    {
      icon: <Users className="w-5 h-5" />,
      label: 'Matches',
      onClick: () => navigate('/dashboard?tab=matches'),
      color: 'success' as const
    }
  ];

  // If not mobile, return children without mobile enhancements
  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Native capabilities initialization */}
      {isNativeApp && <NativeCapabilities />}
      
      {/* Mobile optimizations */}
      <MobileOptimizationsProvider 
        disableContextMenu={true}
        disableCallout={true}
        disableUserSelect={false}
      />

      {/* Keyboard handler for better mobile experience */}
      <MobileKeyboardHandler adjustForKeyboard={true}>
        <div className="min-h-screen bg-background">
          {children}
        </div>
      </MobileKeyboardHandler>

      {/* Floating Action Button */}
      {showFAB && (
        <MobileFloatingActionButton
          actions={fabActions}
          className="z-50"
        />
      )}
    </>
  );
};

export default MobileAppWrapper;