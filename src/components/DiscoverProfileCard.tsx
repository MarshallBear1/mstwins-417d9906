import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, MapPin, Calendar, ArrowLeftRight } from "lucide-react";
import { useRealtimePresence } from "@/hooks/useRealtimePresence";
import ProfileImageViewer from "./ProfileImageViewer";

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

interface DiscoverProfileCardProps {
  profile: Profile;
}

const DiscoverProfileCard = ({ profile }: DiscoverProfileCardProps) => {
  const { isUserOnline, getLastSeenText } = useRealtimePresence();
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

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

  // Prepare all images for the viewer
  const allImages = [
    ...(profile.avatar_url ? [profile.avatar_url] : []),
    ...(profile.additional_photos || [])
  ];

  const openImageViewer = (imageIndex: number) => {
    setImageViewerIndex(imageIndex);
    setShowImageViewer(true);
  };

  const hasExtendedContent = profile.additional_photos?.length || profile.selected_prompts?.length;

  return (
    <>
      <div className="w-full max-w-sm mx-auto" style={{ perspective: '1000px' }}>
        <div 
          className={`relative w-full transition-transform duration-700 preserve-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* Front Side */}
          <Card className={`absolute inset-0 w-full h-[520px] overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 backface-hidden ${
            isFlipped ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}>
            {/* Header */}
            <div className="relative h-32 bg-gradient-to-br from-primary/80 via-primary/60 to-primary/40 flex items-center justify-center">
              <button
                onClick={() => openImageViewer(0)}
                className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg hover:scale-105 transition-transform duration-200"
              >
                {profile.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt={profile.first_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <User className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
                <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white shadow-md ${
                  isUserOnline(profile.user_id) ? 'bg-green-500' : 'bg-muted-foreground'
                }`} />
              </button>

              {hasExtendedContent && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 shadow-lg"
                >
                  <ArrowLeftRight className="w-4 h-4 text-white drop-shadow-sm" />
                </Button>
              )}
            </div>

            {/* Scrollable Content */}
            <CardContent className="p-4 h-[calc(100%-8rem)] flex flex-col">
              {/* Fixed Header Info */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-bold">{profile.first_name} {profile.last_name}</h3>
                <div className="flex items-center gap-2">
                  {profile.date_of_birth && (
                    <span className="text-lg font-semibold text-muted-foreground">
                      {calculateAge(profile.date_of_birth)}
                    </span>
                  )}
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${
                      isUserOnline(profile.user_id) ? 'bg-green-500' : 'bg-muted-foreground'
                    }`} />
                    <span className="text-xs text-muted-foreground">
                      {isUserOnline(profile.user_id) ? 'Online' : getLastSeenText(profile.last_seen)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center gap-2 text-muted-foreground mb-3">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{profile.location}</span>
              </div>

              {/* Scrollable Content Area */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {/* MS Type */}
                {profile.ms_subtype && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">MS Type</h4>
                    <Badge variant="secondary">
                      {profile.ms_subtype.toUpperCase()}
                    </Badge>
                  </div>
                )}

                {/* Diagnosis Year */}
                {profile.diagnosis_year && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Diagnosed in {profile.diagnosis_year}</span>
                  </div>
                )}

                {/* Hobbies/Interests */}
                {profile.hobbies && profile.hobbies.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Interests</h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.hobbies.slice(0, 3).map((hobby, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {hobby}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* About Me */}
                {profile.about_me && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">About</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {profile.about_me}
                    </p>
                  </div>
                )}
              </div>

              {/* See More Button */}
              {hasExtendedContent && (
                <div className="mt-3 pt-3 border-t">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-primary hover:text-primary hover:bg-primary/10"
                    onClick={() => setIsFlipped(!isFlipped)}
                  >
                    See More →
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Back Side */}
          <Card className={`absolute inset-0 w-full h-[520px] overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 backface-hidden rotate-y-180 ${
            !isFlipped ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}>
            <div className="relative h-32 bg-gradient-to-br from-accent/80 via-accent/60 to-accent/40 flex items-center justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFlipped(!isFlipped)}
                className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 shadow-lg"
              >
                <ArrowLeftRight className="w-4 h-4 text-white drop-shadow-sm" />
              </Button>
              <div className="text-center text-white">
                <h3 className="text-lg font-bold">{profile.first_name}'s Story</h3>
              </div>
            </div>

            <CardContent className="p-4 h-[calc(100%-8rem)] overflow-y-auto">
              {hasExtendedContent ? (
                <div className="space-y-4">
                  {profile.additional_photos && profile.additional_photos.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">More Photos</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {profile.additional_photos.map((photo, index) => (
                          <button
                            key={index}
                            onClick={() => openImageViewer(1 + index)}
                            className="aspect-square overflow-hidden rounded-lg border hover:scale-105 transition-transform duration-200"
                          >
                            <img
                              src={photo}
                              alt={`Photo ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                   {profile.selected_prompts && profile.selected_prompts.length > 0 && (
                     <div className="space-y-3">
                       <h4 className="text-sm font-semibold">Personal Stories</h4>
                       {profile.selected_prompts.slice(0, 4).map((prompt, index) => (
                         <div key={index} className="bg-muted/50 rounded-lg p-3 space-y-2">
                           <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                             {prompt.question}
                           </p>
                           <p className="text-sm leading-relaxed">
                             {prompt.answer}
                           </p>
                         </div>
                       ))}
                     </div>
                   )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-sm">
                    {profile.first_name} hasn't shared extended details yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ProfileImageViewer
        images={allImages}
        currentIndex={imageViewerIndex}
        isOpen={showImageViewer}
        onClose={() => setShowImageViewer(false)}
      />
    </>
  );
};

export default DiscoverProfileCard;