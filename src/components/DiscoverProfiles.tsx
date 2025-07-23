import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, X, User, MapPin, Calendar, RotateCcw, Zap, ArrowLeftRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDailyLikes } from "@/hooks/useDailyLikes";
import { useQuery } from "@tanstack/react-query";
import { useRealtimePresence } from "@/hooks/useRealtimePresence";
import ClickableProfilePicture from "./ClickableProfilePicture";
import DiscoverProfileCard from "./DiscoverProfileCard";

interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  location: string;
  gender: string | null;
  ms_subtype: string | null;
  diagnosis_year: number | null;
  symptoms: string[];
  medications: string[];
  hobbies: string[];
  avatar_url: string | null;
  about_me: string | null;
  last_seen: string | null;
  additional_photos?: string[];
  selected_prompts?: {
    question: string;
    answer: string;
  }[];
  extended_profile_completed?: boolean;
}

const DiscoverProfiles = () => {
  const { user } = useAuth();
  const { remainingLikes, isLimitEnforced, hasUnlimitedLikes } = useDailyLikes();
  const { isUserOnline, getLastSeenText } = useRealtimePresence();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'card' | 'detailed'>('card');
  const [actionInProgress, setActionInProgress] = useState(false);

  const fetchProfiles = async (): Promise<Profile[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('user_id', user.id)
        .order('last_seen', { ascending: false });

      if (error) {
        console.error("Error fetching profiles:", error);
        return [];
      }

      return (data || []).map(profile => ({
        ...profile,
        selected_prompts: Array.isArray(profile.selected_prompts) ? profile.selected_prompts as { question: string; answer: string; }[] : []
      }));
    } catch (error) {
      console.error("Unexpected error fetching profiles:", error);
      return [];
    }
  };

  const handleLike = async () => {
    if (!user || !currentProfile) return;

    setActionInProgress(true);
    try {
      // Optimistically update the UI
      setCurrentIndex((prevIndex) => Math.min(prevIndex + 1, profiles.length - 1));

      const { error } = await supabase
        .from('likes')
        .insert([{ liker_id: user.id, liked_id: currentProfile.user_id }]);

      if (error) {
        console.error("Error liking profile:", error);
        // Revert the UI update in case of error
        setCurrentIndex((prevIndex) => Math.max(prevIndex - 1, 0));
      }
    } finally {
      setActionInProgress(false);
    }
  };

  const handleSkip = async () => {
    setActionInProgress(true);
    try {
      // Optimistically update the UI
      setCurrentIndex((prevIndex) => Math.min(prevIndex + 1, profiles.length - 1));
    } finally {
      setActionInProgress(false);
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

  const { data: profiles = [], isLoading, refetch } = useQuery({
    queryKey: ['discover-profiles', user?.id],
    queryFn: fetchProfiles,
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-6">
        <Heart className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No more profiles to discover</h3>
        <p className="text-muted-foreground mb-4">
          You've seen all available profiles. Check back later for new members!
        </p>
        <Button onClick={() => refetch()} variant="outline" className="mb-2">
          <RotateCcw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>
    );
  }

  const currentProfile = profiles[currentIndex];

  if (!currentProfile) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-6">
        <Heart className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No more profiles</h3>
        <p className="text-muted-foreground">Check back later for new members!</p>
      </div>
    );
  }

  // Toggle between card and detailed view
  const toggleViewMode = () => {
    setViewMode(viewMode === 'card' ? 'detailed' : 'card');
  };

  return (
    <div className="p-3 sm:p-6 flex flex-col items-center">
      {/* View Mode Toggle */}
      <div className="mb-4 flex justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleViewMode}
          className="border-primary/20 text-primary hover:bg-primary/10"
        >
          <ArrowLeftRight className="w-4 h-4 mr-2" />
          {viewMode === 'card' ? 'Detailed View' : 'Card View'}
        </Button>
      </div>

      {viewMode === 'detailed' ? (
        <div className="w-full max-w-sm">
          <DiscoverProfileCard profile={currentProfile} />
        </div>
      ) : (
        <Card className="w-full max-w-sm overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div className="relative h-40 bg-gradient-to-br from-blue-400 via-blue-300 to-teal-300 flex items-center justify-center">
            <ClickableProfilePicture
              avatarUrl={currentProfile.avatar_url}
              additionalPhotos={currentProfile.additional_photos}
              firstName={currentProfile.first_name}
              className="w-36 h-36 rounded-full border-4 border-white shadow-lg"
            />
            <div className={`absolute bottom-1 right-1/2 transform translate-x-1/2 translate-y-1/2 w-8 h-8 rounded-full border-3 border-white shadow-md ${
              isUserOnline(currentProfile.user_id) ? 'bg-green-500' : 'bg-gray-400'
            }`} />
          </div>

          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-bold">{currentProfile.first_name} {currentProfile.last_name}</h3>
              <div className="flex items-center gap-2">
                {currentProfile.date_of_birth && (
                  <span className="text-lg font-semibold text-muted-foreground">
                    {calculateAge(currentProfile.date_of_birth)}
                  </span>
                )}
              </div>
            </div>

            {/* Location */}
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 mr-1" />
              <span>{currentProfile.location}</span>
            </div>

            {/* MS Type */}
            {currentProfile.ms_subtype && (
              <div>
                <h4 className="text-sm font-semibold mb-2">MS Type</h4>
                <Badge className="bg-pink-100 text-pink-700 border-pink-200 hover:bg-pink-200">
                  {currentProfile.ms_subtype.toUpperCase()}
                </Badge>
              </div>
            )}

            {/* About Me */}
            {currentProfile.about_me && (
              <div>
                <h4 className="text-sm font-semibold mb-2">About</h4>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                  {currentProfile.about_me}
                </p>
              </div>
            )}

            {/* Hobbies */}
            {currentProfile.hobbies && currentProfile.hobbies.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Hobbies</h4>
                <div className="flex flex-wrap gap-1">
                  {currentProfile.hobbies.slice(0, 3).map((hobby, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {hobby}
                    </Badge>
                  ))}
                  {currentProfile.hobbies.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{currentProfile.hobbies.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Last Seen */}
            {!isUserOnline(currentProfile.user_id) && currentProfile.last_seen && (
              <div className="text-xs text-muted-foreground">
                {getLastSeenText(currentProfile.last_seen)}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action buttons */}
      <div className="flex justify-center space-x-4 mt-6">
        <Button
          onClick={handleSkip}
          disabled={actionInProgress}
          variant="outline"
          size="lg"
          className="rounded-full p-4 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 disabled:opacity-50"
        >
          <X className="w-6 h-6" />
        </Button>
        
        <Button
          onClick={handleLike}
          disabled={actionInProgress || (isLimitEnforced() && remainingLikes <= 0 && !hasUnlimitedLikes)}
          size="lg"
          className="rounded-full p-4 bg-gradient-primary hover:opacity-90 disabled:opacity-50 relative"
        >
          {hasUnlimitedLikes && (
            <Zap className="w-4 h-4 absolute -top-1 -right-1 text-yellow-400" />
          )}
          <Heart className="w-6 h-6" />
        </Button>
      </div>

      {/* Like limit warning */}
      {isLimitEnforced() && remainingLikes <= 3 && !hasUnlimitedLikes && (
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            {remainingLikes} likes remaining today
          </p>
        </div>
      )}

      {/* Profile counter */}
      <div className="mt-4 text-center">
        <p className="text-sm text-muted-foreground">
          {currentIndex + 1} of {profiles.length}
        </p>
      </div>
    </div>
  );
};

export default DiscoverProfiles;
