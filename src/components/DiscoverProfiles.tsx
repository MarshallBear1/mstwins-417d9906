import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, X, User, MapPin, Calendar, RefreshCw, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimePresence } from "@/hooks/useRealtimePresence";
import { analytics } from "@/lib/analytics";
import ProfileViewDialog from "@/components/ProfileViewDialog";

interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  location: string;
  ms_subtype: string | null;
  diagnosis_year: number | null;
  symptoms: string[];
  medications: string[];
  hobbies: string[];
  avatar_url: string | null;
  about_me: string | null;
  last_seen: string | null;
}

const DiscoverProfiles = () => {
  const { user } = useAuth();
  const { isUserOnline, getLastSeenText } = useRealtimePresence();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showingSkipped, setShowingSkipped] = useState(false);
  const [showMatchAnnouncement, setShowMatchAnnouncement] = useState(false);
  const [showProfileView, setShowProfileView] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfiles();
    }
  }, [user]);

  const fetchProfiles = async () => {
    if (!user) return;

    setLoading(true);
    try {
      if (showingSkipped) {
        // Get profiles that were previously passed on, but exclude current matches and likes
        console.log('🔍 Fetching skipped profiles...');
        
        const { data: passedProfiles } = await supabase
          .from('passes')
          .select('passed_id')
          .eq('passer_id', user.id);

        if (passedProfiles && passedProfiles.length > 0) {
          const passedIds = passedProfiles.map(p => p.passed_id);
          
          // Get current matches and likes to exclude them from skipped profiles
          const { data: existingMatches } = await supabase
            .from('matches')
            .select('user1_id, user2_id')
            .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

          const { data: existingLikes } = await supabase
            .from('likes')
            .select('liked_id')
            .eq('liker_id', user.id);

          const matchedIds = existingMatches?.map(match => 
            match.user1_id === user.id ? match.user2_id : match.user1_id
          ) || [];
          const likedIds = existingLikes?.map(like => like.liked_id) || [];
          
          // Only show skipped profiles that aren't now matched or liked
          const availableSkippedIds = passedIds.filter(id => 
            !matchedIds.includes(id) && !likedIds.includes(id)
          );

          console.log('📝 Skipped profiles data:', {
            totalPassed: passedIds.length,
            matchedIds: matchedIds.length,
            likedIds: likedIds.length,
            availableSkipped: availableSkippedIds.length
          });
          
          if (availableSkippedIds.length > 0) {
            const { data: skippedProfiles } = await supabase
              .from('profiles')
              .select('*')
              .in('user_id', availableSkippedIds);
            
            console.log(`✅ Found ${skippedProfiles?.length || 0} available skipped profiles`);
            setProfiles(skippedProfiles || []);
          } else {
            console.log('📭 No skipped profiles available (all are now matched or liked)');
            setProfiles([]);
          }
        } else {
          console.log('📭 No passed profiles found');
          setProfiles([]);
        }
      } else {
        // Get profiles excluding current user, people already liked/passed, and matched users
        console.log('🔍 Fetching profiles excluding matches, likes, and passes...');
        
        const { data: existingLikes } = await supabase
          .from('likes')
          .select('liked_id')
          .eq('liker_id', user.id);

        const { data: existingMatches } = await supabase
          .from('matches')
          .select('user1_id, user2_id')
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

        const { data: existingPasses } = await supabase
          .from('passes')
          .select('passed_id')
          .eq('passer_id', user.id);

        const likedIds = existingLikes?.map(like => like.liked_id) || [];
        const matchedIds = existingMatches?.map(match => 
          match.user1_id === user.id ? match.user2_id : match.user1_id
        ) || [];
        const passedIds = existingPasses?.map(pass => pass.passed_id) || [];
        
        const excludedIds = [...likedIds, ...matchedIds, ...passedIds, user.id];
        
        console.log('📝 Exclusion data:', {
          likedIds: likedIds.length,
          matchedIds: matchedIds.length,
          passedIds: passedIds.length,
          totalExcluded: excludedIds.length
        });
        
        let query = supabase
          .from('profiles')
          .select('*');

        if (excludedIds.length > 0) {
          query = query.not('user_id', 'in', `(${excludedIds.join(',')})`);
        }

        // Add random ordering instead of default created_at ordering
        const { data, error } = await query
          .order('RANDOM()')
          .limit(20);

        if (error) {
          console.error('Error fetching profiles:', error);
          return;
        }

        console.log(`✅ Found ${data?.length || 0} available profiles`);
        setProfiles(data || []);
      }
      setCurrentIndex(0);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (birthDate: string | null) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1;
    }
    return age;
  };

  const handleLike = async () => {
    if (!user || !currentProfile || actionLoading) return;
    
    setActionLoading(true);
    
    // Track profile like
    analytics.profileLiked(user.id, currentProfile.user_id);
    
    console.log('🚀 Starting like process for profile:', currentProfile.user_id);
    
    try {
      // First, check if this will create a match
      const { data: existingLike } = await supabase
        .from('likes')
        .select('*')
        .eq('liker_id', currentProfile.user_id)
        .eq('liked_id', user.id)
        .maybeSingle();

      const willCreateMatch = !!existingLike;
      console.log('📊 Will create match:', willCreateMatch);

      // Insert the like
      const { data: newLike, error } = await supabase
        .from('likes')
        .insert({
          liker_id: user.id,
          liked_id: currentProfile.user_id
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating like:', error);
        throw error;
      }

      console.log('✅ Like created successfully:', newLike);

      // Send email notifications in background (non-blocking for speed)
      supabase.functions.invoke('email-notification-worker', {
        body: {
          type: willCreateMatch ? 'match' : 'like',
          likerUserId: user.id,
          likedUserId: currentProfile.user_id
        }
      }).then(() => {
        console.log('✅ Email notification sent successfully');
      }).catch((emailError) => {
        console.error('❌ Error sending email notification:', emailError);
      });

      // Show match announcement if it's a match
      if (willCreateMatch) {
        setShowMatchAnnouncement(true);
        setTimeout(() => setShowMatchAnnouncement(false), 4000);
        console.log('🎉 Match announcement shown!');
      }

      // IMPORTANT: Move to next profile AFTER like is successfully processed
      handleNext();

    } catch (error) {
      console.error('❌ Error in like process:', error);
    } finally {
      setActionLoading(false);
      console.log('🔄 Like process completed, actionLoading set to false');
    }
  };

  const handlePass = async () => {
    if (!user || !currentProfile || actionLoading) return;
    
    // Track profile pass
    analytics.profilePassed(user.id, currentProfile.user_id);
    
    // Move to next profile immediately for better UX
    handleNext();
    
    console.log('⏭️ Starting pass process for profile:', currentProfile.user_id);
    
    if (!showingSkipped) {
      // Record the pass in the database
      try {
        const { error } = await supabase
          .from('passes')
          .insert({
            passer_id: user.id,
            passed_id: currentProfile.user_id
          });

        if (error) {
          console.error('❌ Error recording pass:', error);
        } else {
          console.log('✅ Pass recorded successfully');
        }
      } catch (error) {
        console.error('❌ Error recording pass:', error);
      }
    }
    
    console.log('⏭️ Pass process completed');
  };

  const handleNext = () => {
    // Immediately move to next profile for snappiness
    if (currentIndex < profiles.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // No more profiles, fetch new ones
      fetchProfiles();
    }
  };

  const currentProfile = profiles[currentIndex];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentProfile) {
    return (
      <div className="p-6 text-center">
        <div className="mb-8">
          <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Discover Community</h2>
          <p className="text-muted-foreground">Find supportive connections in the MS community</p>
        </div>
        <Card className="mb-4">
          <CardContent className="p-6">
            <div className="space-y-4">
              <p className="text-muted-foreground mb-4">
                No new profiles to discover right now.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                More profiles will appear as new users join the MSTwins community. Check back later to find your perfect matches!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={fetchProfiles}
                  className="flex items-center gap-2"
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh Profiles
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowingSkipped(!showingSkipped);
                    fetchProfiles();
                  }}
                  className="flex items-center gap-2"
                >
                  <Heart className="w-4 h-4" />
                  {showingSkipped ? 'Back to Discovery' : 'Review Skipped Profiles'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 min-h-screen"> {/* Reduced mobile padding */}
      {/* Match Announcement Modal */}
      {showMatchAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 text-center max-w-sm w-full mx-4 shadow-2xl animate-scale-in">
            <div className="mb-6">
              <img 
                src="/lovable-uploads/2293d200-728d-46fb-a007-7994ca0a639c.png" 
                alt="MSTwins mascot" 
                className="w-16 sm:w-20 h-16 sm:h-20 mx-auto mb-4 animate-bounce"
              />
              <h2 className="text-2xl sm:text-3xl font-bold text-green-600 mb-2">🎉 It's a Match!</h2>
              <p className="text-gray-600 text-sm sm:text-base">
                You and {currentProfile?.first_name} {currentProfile?.last_name} liked each other! Start chatting now.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => setShowMatchAnnouncement(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm sm:text-base"
              >
                Continue Discovering
              </button>
              <button 
                onClick={() => {
                  setShowMatchAnnouncement(false);
                  // Navigate to matches tab (you'd need to pass this function down from parent)
                }}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm sm:text-base"
              >
                Start Chatting
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-md mx-auto"> {/* Profile Card Container */}
        <Card className="overflow-hidden shadow-xl animate-scale-in">
          {/* Avatar Section with Gradient Background */}
          <div className="relative h-48 bg-gradient-to-br from-blue-400 via-blue-300 to-teal-300 flex items-center justify-center">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg">
              {currentProfile.avatar_url ? (
                <img 
                  src={currentProfile.avatar_url} 
                  alt={currentProfile.first_name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onLoad={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                  onError={(e) => {
                    e.currentTarget.src = `https://api.dicebear.com/6.x/avataaars/svg?seed=${currentProfile.first_name}&backgroundColor=b6e3f4,c0aede&eyes=happy&mouth=smile`;
                  }}
                  style={{ opacity: 0, transition: 'opacity 0.3s ease' }}
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <User className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              {/* Online status indicator */}
              <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white ${
                isUserOnline(currentProfile.user_id) ? 'bg-green-500' : 'bg-gray-400'
              }`} />
            </div>
            {/* Profile indicator */}
            <div className="absolute top-4 left-4 bg-white/80 rounded-full px-3 py-1">
              <span className="text-sm font-medium">
                {currentIndex + 1} of {profiles.length}
              </span>
            </div>
            {/* Online status badge */}
            <div className="absolute top-4 right-4 bg-white/90 rounded-full px-3 py-1">
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${
                  isUserOnline(currentProfile.user_id) ? 'bg-green-500' : 'bg-gray-400'
                }`} />
                <span className="text-xs font-medium">
                  {isUserOnline(currentProfile.user_id) ? 'Online' : getLastSeenText(currentProfile.last_seen)}
                </span>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <CardContent className="p-6 space-y-4">
            {/* Name and Age */}
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold">{currentProfile.first_name} {currentProfile.last_name}</h3>
              {currentProfile.date_of_birth && (
                <span className="text-xl font-semibold text-muted-foreground">
                  {calculateAge(currentProfile.date_of_birth)}
                </span>
              )}
            </div>

            {/* Location and Diagnosis */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{currentProfile.location}</span>
              </div>
              {currentProfile.diagnosis_year && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Diagnosed in {currentProfile.diagnosis_year}</span>
                </div>
              )}
            </div>

            {/* MS Type */}
            {currentProfile.ms_subtype && (
              <div>
                <h4 className="text-sm font-semibold mb-2">MS Type</h4>
                <span className="text-muted-foreground">{currentProfile.ms_subtype}</span>
              </div>
            )}

            {/* Interests */}
            {currentProfile.hobbies.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Interests</h4>
                <div className="flex flex-wrap gap-2">
                  {currentProfile.hobbies.slice(0, 6).map((hobby, index) => (
                    <Badge 
                      key={index}
                      variant="secondary"
                      className="bg-blue-100 text-blue-700 hover:bg-blue-200"
                    >
                      {hobby}
                    </Badge>
                  ))}
                  {currentProfile.hobbies.length > 6 && (
                    <Badge variant="outline">
                      +{currentProfile.hobbies.length - 6} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* About */}
            {currentProfile.about_me && (
              <div>
                <h4 className="text-sm font-semibold mb-2">About</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {currentProfile.about_me}
                </p>
              </div>
            )}

            {/* Action Buttons - Improved mobile layout */}
            <div className="space-y-3">
              {/* View Profile Button */}
              <Button 
                variant="outline" 
                className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 h-12"
                onClick={() => setShowProfileView(true)}
              >
                <Eye className="w-4 h-4 mr-2" />
                View Full Profile
              </Button>
              
              {/* Like/Pass Buttons - Stack on mobile, side-by-side on larger screens */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 h-12"
                  onClick={handlePass}
                  disabled={actionLoading}
                >
                  <X className="w-4 h-4 mr-2" />
                  Pass
                </Button>
                <Button 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-12"
                  onClick={handleLike}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Liking...
                    </>
                  ) : (
                    <>
                      <Heart className="w-4 h-4 mr-2" fill="currentColor" />
                      Like
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profile View Dialog */}
      <ProfileViewDialog 
        profile={currentProfile}
        open={showProfileView}
        onOpenChange={setShowProfileView}
        onLike={handleLike}
        onPass={handlePass}
        showActions={true}
        isLiking={actionLoading}
      />
    </div>
  );
};

export default DiscoverProfiles;