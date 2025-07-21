import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, X, User, MapPin, Calendar, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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
}

const DiscoverProfiles = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfiles();
    }
  }, [user]);

  const fetchProfiles = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get profiles excluding current user, people already liked/passed, and matched users
      const { data: existingLikes } = await supabase
        .from('likes')
        .select('liked_id')
        .eq('liker_id', user.id);

      const { data: existingMatches } = await supabase
        .from('matches')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      const likedIds = existingLikes?.map(like => like.liked_id) || [];
      const matchedIds = existingMatches?.map(match => 
        match.user1_id === user.id ? match.user2_id : match.user1_id
      ) || [];
      
      const excludedIds = [...likedIds, ...matchedIds];
      
      let query = supabase
        .from('profiles')
        .select('*')
        .neq('user_id', user.id);

      if (excludedIds.length > 0) {
        query = query.not('user_id', 'in', `(${excludedIds.join(',')})`);
      }

      const { data, error } = await query.limit(10);

      if (error) {
        console.error('Error fetching profiles:', error);
        return;
      }

      setProfiles(data || []);
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
    if (!user || !currentProfile) return;
    
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('likes')
        .insert({
          liker_id: user.id,
          liked_id: currentProfile.user_id
        });

      if (!error) {
        // Send email notification to liked user
        const { data: likedUserAuth } = await supabase.auth.admin.getUserById(currentProfile.user_id);
        const { data: currentUserProfile } = await supabase
          .from('profiles')
          .select('first_name')
          .eq('user_id', user.id)
          .single();

        if (likedUserAuth.user?.email) {
          // Send like notification email in background
          setTimeout(async () => {
            try {
              await supabase.functions.invoke('send-notification-email', {
                body: {
                  email: likedUserAuth.user.email,
                  firstName: currentProfile.first_name,
                  type: 'like',
                  fromUser: currentUserProfile?.first_name
                }
              });
            } catch (error) {
              console.error('Error sending like notification email:', error);
            }
          }, 0);
        }

        handleNext();
      }
    } catch (error) {
      console.error('Error liking profile:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePass = () => {
    handleNext();
  };

  const handleNext = () => {
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
                  onClick={() => {/* Add review skipped logic here */}}
                  className="flex items-center gap-2"
                >
                  <Heart className="w-4 h-4" />
                  Review Skipped
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-md mx-auto">
        <Card className="overflow-hidden shadow-xl animate-scale-in">
          {/* Avatar Section with Gradient Background */}
          <div className="relative h-48 bg-gradient-to-br from-blue-400 via-blue-300 to-teal-300 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg">
              {currentProfile.avatar_url ? (
                <img 
                  src={currentProfile.avatar_url} 
                  alt={currentProfile.first_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <User className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
            </div>
            {/* Profile indicator */}
            <div className="absolute top-4 left-4 bg-white/80 rounded-full px-3 py-1">
              <span className="text-sm font-medium">
                {currentIndex + 1} of {profiles.length}
              </span>
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

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={handlePass}
                disabled={actionLoading}
              >
                <X className="w-4 h-4 mr-2" />
                Pass
              </Button>
              <Button 
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleLike}
                disabled={actionLoading}
              >
                <Heart className="w-4 h-4 mr-2" fill="currentColor" />
                {actionLoading ? 'Liking...' : 'Like'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DiscoverProfiles;