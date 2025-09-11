import { Button } from "@/components/ui/button";
import { User, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMobileOptimizations } from "@/hooks/useMobileOptimizations";
import ModernNotificationSystem from "@/components/ModernNotificationSystem";

interface ModernHeaderProps {
  activeTab?: string;
}

const ModernHeader = ({ activeTab }: ModernHeaderProps) => {
  const navigate = useNavigate();
  const { isMobile, safeAreaInsets } = useMobileOptimizations();

  return (
    <div 
      className="bg-white/95 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-40 shadow-sm" 
      style={{
        paddingTop: isMobile ? `max(0.75rem, ${safeAreaInsets.top}px)` : undefined
      }}
    >
      <div className="flex items-center justify-between mobile-safe-x py-3 px-4">
        {/* Left side - Modern Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
            <img 
              src="/lovable-uploads/2293d200-728d-46fb-a007-7994ca0a639c.png" 
              alt="MSTwins" 
              className="w-6 h-6 object-contain" 
            />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight">
              <span className="text-gray-900">MS</span>
              <span className="text-blue-600">Twins</span>
            </span>
            {activeTab && (
              <span className="text-xs text-gray-500 capitalize -mt-1">
                {activeTab === 'likes' ? 'Connections' : activeTab}
              </span>
            )}
          </div>
        </div>
        
        {/* Right side - Modern action buttons */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className="p-2 hover:bg-gray-100 rounded-full transition-colors ios-bounce"
          >
            <Search className="w-5 h-5 text-gray-600" />
          </Button>
          
          <ModernNotificationSystem />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard?tab=profile')}
            className={`p-2 transition-colors rounded-full ios-bounce ${
              activeTab === 'profile' 
                ? 'text-blue-600 bg-blue-50' 
                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
            }`}
          >
            <User className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ModernHeader;
