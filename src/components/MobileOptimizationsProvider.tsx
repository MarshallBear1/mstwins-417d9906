import { useMobileTouchOptimizations } from '@/hooks/useMobileOptimizations';

interface MobileOptimizationsProviderProps {
  disableContextMenu?: boolean;
  disableCallout?: boolean;
  disableUserSelect?: boolean;
}

const MobileOptimizationsProvider = ({
  disableContextMenu = true,
  disableCallout = true,
  disableUserSelect = false,
}: MobileOptimizationsProviderProps) => {
  useMobileTouchOptimizations({
    disableContextMenu,
    disableCallout,
    disableUserSelect,
  });

  return null;
};

export default MobileOptimizationsProvider;