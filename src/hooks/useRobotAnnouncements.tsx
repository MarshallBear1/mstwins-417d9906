import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface RobotAnnouncement {
  id: string;
  title: string;
  message: string;
  announcement_type: string;
  target_audience: string;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export const useRobotAnnouncements = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<RobotAnnouncement[]>([]);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<Set<string>>(new Set());
  const [currentAnnouncement, setCurrentAnnouncement] = useState<RobotAnnouncement | null>(null);
  const [showAnnouncement, setShowAnnouncement] = useState(false);

  // Load dismissed announcements from localStorage
  useEffect(() => {
    const dismissed = localStorage.getItem('dismissedAnnouncements');
    if (dismissed) {
      setDismissedAnnouncements(new Set(JSON.parse(dismissed)));
    }
  }, []);

  // Fetch active announcements
  useEffect(() => {
    if (!user) return;

    const fetchAnnouncements = async () => {
      const { data, error } = await supabase
        .from('robot_announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (data && !error) {
        setAnnouncements(data);
        
        // Check for new announcements to show
        const newAnnouncement = data.find(
          announcement => !dismissedAnnouncements.has(announcement.id)
        );
        
        if (newAnnouncement) {
          setCurrentAnnouncement(newAnnouncement);
          setShowAnnouncement(true);
        }
      }
    };

    fetchAnnouncements();
  }, [user, dismissedAnnouncements]);

  const dismissAnnouncement = (announcementId: string) => {
    const updated = new Set([...dismissedAnnouncements, announcementId]);
    setDismissedAnnouncements(updated);
    localStorage.setItem('dismissedAnnouncements', JSON.stringify([...updated]));
    setShowAnnouncement(false);
    setCurrentAnnouncement(null);
  };

  return {
    announcements,
    currentAnnouncement,
    showAnnouncement,
    dismissAnnouncement
  };
};