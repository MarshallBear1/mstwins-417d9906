import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Heart, Users, MessageCircle, User, Edit } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMobileOptimizations } from "@/hooks/useMobileOptimizations";
import { useDailyLikes } from "@/hooks/useDailyLikes";
import { supabase } from "@/integrations/supabase/client";

interface Tab {
  id: string;
  label: string;
  icon: any;
  path: string;
}

const tabs: Tab[] = [
  { id: 'discover', label: 'Discover', icon: Heart, path: '/dashboard' },
  { id: 'likes', label: 'Likes', icon: Users, path: '/dashboard?tab=likes' },
  { id: 'messages', label: 'Messages', icon: MessageCircle, path: '/dashboard?tab=messages' },
  { id: 'forum', label: 'Forum', icon: Edit, path: '/dashboard?tab=forum' },
];

const PersistentBottomNavigation = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile, safeAreaInsets } = useMobileOptimizations();
  const { remainingLikes } = useDailyLikes();
  const [activeTab, setActiveTab] = useState('discover');
  const [unreadCounts, setUnreadCounts] = useState<{[key: string]: number}>({});

  // Fetch unread message counts
  useEffect(() => {
    const fetchUnreadCounts = async () => {
      if (!user) return;

      try {
        // Get unread message count
        const { data: unreadMessages } = await supabase
          .from('messages')
          .select('id')
          .eq('receiver_id', user.id)
          .eq('is_read', false);

        // Get unread notification counts by type
        const { data: unreadNotifications } = await supabase
          .from('notifications')
          .select('type')
          .eq('user_id', user.id)
          .eq('is_read', false);

        const likesCount = unreadNotifications?.filter(n => n.type === 'like').length || 0;
        const messagesCount = unreadMessages?.length || 0;

        setUnreadCounts({
          likes: likesCount,
          messages: messagesCount
        });
      } catch (error) {
        console.error('Error fetching unread counts:', error);
      }
    };

    fetchUnreadCounts();

    // Set up real-time subscription for unread counts
    const channel = supabase
      .channel('unread-counts')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user?.id}`
      }, () => {
        fetchUnreadCounts();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${user?.id}`
      }, () => {
        fetchUnreadCounts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Determine if we should show the navigation
  const shouldShowNavigation = user && ![
    '/', 
    '/auth', 
    '/privacy-policy', 
    '/terms-of-service',
    '/admin/feedback'
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

  if (!shouldShowNavigation) {
    return null;
  }

  return (
    <>
      {/* Likes counter above tabs - only show on discover tab and if visible */}
      {activeTab === 'discover' && remainingLikes !== 999 && (
        <div className="fixed bottom-16 left-0 right-0 z-40 pointer-events-none" style={{
          bottom: isMobile ? `max(4rem, ${safeAreaInsets.bottom + 64}px)` : '4rem'
        }}>
          <div className="flex justify-center px-4">
            <div className="bg-white/95 backdrop-blur-md border border-gray-200 px-4 py-2 rounded-full shadow-lg pointer-events-auto">
              <span className="text-sm font-semibold text-gray-800">
                {remainingLikes} likes left today
              </span>
            </div>
          </div>
        </div>
      )}
      
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
              className={`flex flex-col items-center space-y-1 py-2 px-2 transition-all duration-300 ease-out mobile-touch-target min-w-[60px] relative ${
                isActive 
                  ? "text-black transform scale-105" 
                  : "text-gray-400 hover:text-gray-600 active:scale-95"
              }`}
            >
              <div className={`transition-all duration-300 relative ${isActive ? 'transform scale-110' : ''}`}>
                <Icon className={`${isActive ? 'w-5 h-5' : 'w-4 h-4'} stroke-[1.5]`} />
                {/* Unread count badge */}
                {unreadCounts[tab.id] > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[8px] font-bold shadow-lg animate-pulse">
                    {unreadCounts[tab.id] > 9 ? '9+' : unreadCounts[tab.id]}
                  </div>
                )}
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
    </>
  );
};

export default PersistentBottomNavigation; 