import { ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { cn } from '@/lib/utils';

interface MobilePullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}

const MobilePullToRefresh = ({ 
  onRefresh, 
  children, 
  disabled = false,
  className 
}: MobilePullToRefreshProps) => {
  const {
    containerRef,
    isRefreshing,
    pullDistance,
    shouldTrigger,
    pullToRefreshStyles,
  } = usePullToRefresh({ onRefresh, disabled });

  const refreshIndicatorOpacity = Math.min(pullDistance / 80, 1);
  const refreshIndicatorScale = Math.min(pullDistance / 80, 1);

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden", className)}
    >
      {/* Pull to Refresh Indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex justify-center items-center z-50 pointer-events-none"
        style={{
          height: `${Math.max(pullDistance, 0)}px`,
          opacity: refreshIndicatorOpacity,
          transform: `scale(${refreshIndicatorScale})`,
        }}
      >
        <div className={cn(
          "bg-card/90 backdrop-blur-sm border border-border rounded-full p-3 shadow-lg transition-colors",
          shouldTrigger && "bg-primary text-primary-foreground border-primary"
        )}>
          <RefreshCw 
            className={cn(
              "w-5 h-5 transition-transform duration-200",
              (isRefreshing || shouldTrigger) && "animate-spin"
            )} 
          />
        </div>
      </div>

      {/* Content */}
      <div style={pullToRefreshStyles} className="min-h-full">
        {children}
      </div>

      {/* Loading Overlay */}
      {isRefreshing && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-40 pointer-events-none">
          <div className="bg-card rounded-full p-4 shadow-lg border border-border">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
          </div>
        </div>
      )}
    </div>
  );
};

export default MobilePullToRefresh;