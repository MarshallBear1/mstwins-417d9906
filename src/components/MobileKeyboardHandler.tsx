import { useEffect, useState, ReactNode } from 'react';
import { useMobileOptimizations } from '@/hooks/useMobileOptimizations';

interface MobileKeyboardHandlerProps {
  children: ReactNode;
  adjustForKeyboard?: boolean;
}

const MobileKeyboardHandler = ({ 
  children, 
  adjustForKeyboard = true 
}: MobileKeyboardHandlerProps) => {
  const { keyboard, isMobile } = useMobileOptimizations();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isMobile || !adjustForKeyboard) return;

    // Detect keyboard visibility with a delay to avoid false positives
    const timer = setTimeout(() => {
      setIsVisible(keyboard.isVisible);
    }, 100);

    return () => clearTimeout(timer);
  }, [keyboard.isVisible, isMobile, adjustForKeyboard]);

  useEffect(() => {
    if (!isMobile) return;

    // Scroll active input into view when keyboard appears
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        setTimeout(() => {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }, 300); // Wait for keyboard animation
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    return () => document.removeEventListener('focusin', handleFocusIn);
  }, [isMobile]);

  const containerStyle = isMobile && adjustForKeyboard && isVisible ? {
    paddingBottom: `${keyboard.height}px`,
    transition: 'padding-bottom 0.3s ease-in-out',
  } : {};

  return (
    <div style={containerStyle} className="w-full">
      {children}
    </div>
  );
};

export default MobileKeyboardHandler;