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
          className={`relative w-full transition-transform duration-700 ${
            isFlipped ? 'rotateY-180' : ''
          }`}
          style={{ 
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
          }}
        >
          {/* Front Side */}
          <Card className={`w-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ${
            isFlipped ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          style={{ 
            backfaceVisibility: 'hidden',
            position: isFlipped ? 'absolute' : 'relative',
            zIndex: isFlipped ? 1 : 2
          }}
          >
            <div className="relative h-40 bg-gradient-to-br from-blue-400 via-blue-300 to-teal-300 flex items-center justify-center">
              <button
                onClick={() => openImageViewer(0)}
                className="relative w-36 h-36 rounded-full overflow-hidden border-4 border-white shadow-lg hover:scale-105 transition-transform duration-200"
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
                <div className={`absolute bottom-1 right-1 w-8 h-8 rounded-full border-3 border-white shadow-md ${
                  isUserOnline(profile.user_id) ? 'bg-green-500' : 'bg-gray-400'
                }`} />
              </button>

              {hasExtendedContent && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="absolute top-3 right-3 h-8 w-8 p-0 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 shadow-lg animate-pulse"
                >
                  <ArrowLeftRight className="w-4 h-4 text-white drop-shadow-sm" />
                </Button>
              )}
            </div>

            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-bold">{profile.first_name} {profile.last_name}</h3>
                <div className="flex items-center gap-2">
                  {profile.date_of_birth && (
                    <span className="text-lg font-semibold text-muted-foreground">
                      {calculateAge(profile.date_of_birth)}
                    </span>
                  )}
                </div>
              </div>

              {/* MS Type */}
              {profile.ms_subtype && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">MS Type</h4>
                  <Badge className="bg-pink-100 text-pink-700 border-pink-200 hover:bg-pink-200">
                    {profile.ms_subtype.toUpperCase()}
                  </Badge>
                </div>
              )}

              {profile.about_me && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">About</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                    {profile.about_me}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Back Side */}
          <Card className={`w-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ${
            !isFlipped ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            position: !isFlipped ? 'absolute' : 'relative',
            top: !isFlipped ? 0 : 'auto',
            zIndex: !isFlipped ? 1 : 2
          }}
          >
            <div className="relative h-40 bg-gradient-to-br from-purple-400 via-purple-300 to-pink-300 flex items-center justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFlipped(!isFlipped)}
                className="absolute top-3 right-3 h-8 w-8 p-0 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 shadow-lg"
              >
                <ArrowLeftRight className="w-4 h-4 text-white drop-shadow-sm" />
              </Button>
              <div className="text-center text-white">
                <h3 className="text-lg font-bold">{profile.first_name}'s Story</h3>
              </div>
            </div>

            <CardContent className="p-4 space-y-3">
              {hasExtendedContent ? (
                <>
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
                </>
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