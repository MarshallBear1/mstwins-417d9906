import { ReactNode, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FABAction {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'destructive';
}

interface MobileFloatingActionButtonProps {
  actions?: FABAction[];
  mainAction?: () => void;
  className?: string;
  disabled?: boolean;
}

const MobileFloatingActionButton = ({
  actions = [],
  mainAction,
  className,
  disabled = false
}: MobileFloatingActionButtonProps) => {
  const { buttonPress, impact } = useHaptics();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleMainClick = () => {
    if (disabled) return;
    
    buttonPress();
    
    if (actions.length > 0) {
      setIsExpanded(!isExpanded);
      impact(isExpanded ? 'light' : 'medium');
    } else if (mainAction) {
      mainAction();
    }
  };

  const handleActionClick = (action: FABAction) => {
    buttonPress();
    setIsExpanded(false);
    action.onClick();
  };

  const getActionButtonVariant = (color?: string) => {
    switch (color) {
      case 'secondary': return 'secondary';
      case 'destructive': return 'destructive';
      default: return 'default';
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 animate-fade-in"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Action Buttons */}
      {isExpanded && actions.length > 0 && (
        <div className="fixed right-6 bottom-24 z-50 flex flex-col-reverse gap-3 animate-fade-in">
          {actions.map((action, index) => (
            <div
              key={index}
              className="flex items-center gap-3 animate-slide-in-right"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="bg-card px-3 py-2 rounded-lg shadow-lg border border-border">
                <span className="text-sm font-medium whitespace-nowrap">
                  {action.label}
                </span>
              </div>
              <Button
                size="lg"
                variant={getActionButtonVariant(action.color)}
                onClick={() => handleActionClick(action)}
                className={cn(
                  "w-12 h-12 rounded-full shadow-lg hover:shadow-xl",
                  "transition-all duration-200 hover:scale-110 active:scale-95"
                )}
              >
                {action.icon}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Main FAB */}
      <Button
        size="lg"
        onClick={handleMainClick}
        disabled={disabled}
        className={cn(
          "fixed right-6 bottom-6 z-50 w-14 h-14 rounded-full shadow-lg hover:shadow-xl",
          "transition-all duration-200 hover:scale-110 active:scale-95",
          "bg-primary hover:bg-primary/90 text-primary-foreground",
          isExpanded && "rotate-45",
          className
        )}
      >
        {isExpanded ? (
          <X className="w-6 h-6" />
        ) : (
          <Plus className="w-6 h-6" />
        )}
      </Button>
    </>
  );
};

export default MobileFloatingActionButton;