import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Calendar, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import FeedbackDialog from "@/components/FeedbackDialog";

export default function LaunchStats() {
  const [userCount, setUserCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserCount();
    
    // Set up real-time subscription for user count updates
    const channel = supabase
      .channel('user-count-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'profiles'
        },
        () => fetchUserCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchUserCount = async () => {
    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true });

      if (error) throw error;
      setUserCount(count || 0);
    } catch (error) {
      console.error('Error fetching user count:', error);
      setUserCount(0);
    } finally {
      setLoading(false);
    }
  };

  const launchDate = new Date('2025-07-23');
  const today = new Date();
  const daysLive = Math.floor((today.getTime() - launchDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 border border-border/50 rounded-xl p-6 mx-auto max-w-4xl">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Launched 23/07/2025 • {daysLive >= 0 ? `${daysLive} days live` : 'Launching soon'}</span>
        </div>
        
        <div className="flex items-center justify-center gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-2xl font-bold text-primary">
              <Users className="h-6 w-6" />
              {loading ? (
                <span className="animate-pulse">...</span>
              ) : (
                <span>{userCount.toLocaleString()}</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {userCount === 1 ? 'person has' : 'people have'} joined our community
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <p className="text-muted-foreground max-w-2xl mx-auto">
            <strong className="text-foreground">Thank you for being here on our journey!</strong> 
            {" "}We're building this community together, and your voice matters. 
          </p>
          
          <div className="flex items-center justify-center gap-2">
            <MessageSquare className="h-4 w-4 text-accent" />
            <span className="text-sm text-muted-foreground">
              Please share your feedback to help us improve
            </span>
            <FeedbackDialog />
          </div>
        </div>
      </div>
    </div>
  );
}