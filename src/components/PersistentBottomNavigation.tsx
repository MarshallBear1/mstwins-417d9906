import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Heart, Users, MessageCircle, User, Edit, HandHeart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMobileOptimizations } from "@/hooks/useMobileOptimizations";

interface Tab {
  id: string;
  label: string;
  icon: any;
  path: string;
}

const tabs: Tab[] = [
  { id: 'discover', label: 'Discover', icon: Heart, path: '/dashboard' },
  { id: 'likes', label: 'Connections', icon: HandHeart, path: '/dashboard?tab=likes' },
  { id: 'messages', label: 'Messages', icon: MessageCircle, path: '/dashboard?tab=messages' },
  { id: 'forum', label: 'Forum', icon: Edit, path: '/dashboard?tab=forum' },
];

const PersistentBottomNavigation = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile, safeAreaInsets } = useMobileOptimizations();
  const [activeTab, setActiveTab] = useState('discover');

  // Determine if we should show the navigation
  const shouldShowNavigation = user && ![
    '/', 
    '/auth', 
    '/privacy-policy', 
    '/terms-of-service',
    '/admin/feedback',
    '/profile-setup',
    '/extended-profile'
  ].includes(location.pathname);

  // Update active tab based on current location
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    
    if (location.pathname === '/dashboard') {
      setActiveTab(tabParam || 'discover');
    } else if (location.pathname === '/profile-setup' || location.pathname === '/extended-profile') {
      setActiveTab('profile');
    }
  }, [location]);

  // Handle tab navigation
  const handleTabClick = (tab: Tab) => {
    setActiveTab(tab.id);
    
    if (tab.id === 'discover') {
      navigate('/dashboard');
    } else {
      navigate(`/dashboard?tab=${tab.id}`);
    }
  };

  // Always show on mobile for iOS app experience
  if (!shouldShowNavigation) {
    return null;
  }

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 z-50 shadow-[0_-2px_20px_rgba(0,0,0,0.08)]" 
      style={{
        paddingBottom: isMobile ? `max(0.75rem, ${safeAreaInsets.bottom}px)` : '0.75rem'
      }}
    >
      <div className="flex items-center justify-around py-2 mobile-safe-x max-w-full mx-auto px-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button 
              key={tab.id} 
              onClick={() => handleTabClick(tab)} 
              className={`flex flex-col items-center space-y-1 py-2 px-2 transition-all duration-300 ease-out mobile-touch-target min-w-[60px] ${
                isActive 
                  ? "text-black transform scale-105" 
                  : "text-gray-400 hover:text-gray-600 active:scale-95"
              }`}
            >
              <div className={`transition-all duration-300 ${isActive ? 'transform scale-110' : ''}`}>
                <Icon className={`${isActive ? 'w-5 h-5' : 'w-4 h-4'} stroke-[1.5]`} />
              </div>
              <span className={`text-[10px] font-medium transition-all duration-300 text-center leading-tight ${
                isActive ? 'text-black font-semibold' : 'text-gray-400'
              }`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="w-1 h-1 bg-black rounded-full animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PersistentBottomNavigation; 