import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, MapPin, Calendar, RotateCcw } from "lucide-react";
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
  const [showExtended, setShowExtended] = useState(false);

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

  return (
    <>
      <Card className="w-full max-w-sm mx-auto overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
        {/* Header with gradient background */}
        <div className="relative h-40 bg-gradient-to-br from-blue-400 via-blue-300 to-teal-300 flex items-center justify-center">
          <button
            onClick={() => openImageViewer(0)}
            className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-lg hover:scale-105 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
          >
            {profile.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={profile.first_name}
                className="w-full h-full object-cover"
                loading="lazy"
                onLoad={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
                onError={(e) => {
                  e.currentTarget.src = `https://api.dicebear.com/6.x/avataaars/svg?seed=${profile.first_name}&backgroundColor=b6e3f4,c0aede&eyes=happy&mouth=smile`;
                }}
                style={{ opacity: 0, transition: 'opacity 0.3s ease' }}
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <User className="w-10 h-10 text-muted-foreground" />
              </div>
            )}
            {/* Online status indicator */}
            <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-2 border-white ${
              isUserOnline(profile.user_id) ? 'bg-green-500' : 'bg-gray-400'
            }`} />
          </button>

          {/* Flip card button if extended profile exists */}
          {profile.extended_profile_completed && (profile.additional_photos?.length || profile.selected_prompts?.length) && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowExtended(!showExtended)}
              className="absolute top-3 right-3 h-8 w-8 p-0 rounded-full"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          )}
        </div>

        <CardContent className="p-4 space-y-3">
          {!showExtended ? (
            // Main Profile View
            <>
              {/* Name, Age, and Online Status */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-bold">{profile.first_name} {profile.last_name}</h3>
                <div className="flex items-center gap-2">
                  {profile.date_of_birth && (
                    <span className="text-lg font-semibold text-muted-foreground">
                      {calculateAge(profile.date_of_birth)}
                    </span>
                  )}
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${isUserOnline(profile.user_id) ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <span className="text-xs text-muted-foreground">
                      {isUserOnline(profile.user_id) ? 'Online' : getLastSeenText(profile.last_seen)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Location, Gender and Diagnosis */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{profile.location}</span>
                </div>
                {profile.gender && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span className="text-sm">{profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)}</span>
                  </div>
                )}
                {profile.diagnosis_year && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Diagnosed in {profile.diagnosis_year}</span>
                  </div>
                )}
              </div>

              {/* MS Type */}
              {profile.ms_subtype && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">MS Type</h4>
                  <span className="text-muted-foreground">{profile.ms_subtype.toUpperCase()}</span>
                </div>
              )}

              {/* Medications */}
              {profile.medications.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Medications</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.medications.slice(0, 4).map((medication, index) => (
                      <Badge 
                        key={index}
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 text-xs"
                      >
                        {medication}
                      </Badge>
                    ))}
                    {profile.medications.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{profile.medications.length - 4} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Interests */}
              {profile.hobbies.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Interests</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.hobbies.slice(0, 6).map((hobby, index) => (
                      <Badge 
                        key={index}
                        variant="secondary"
                        className="bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs"
                      >
                        {hobby}
                      </Badge>
                    ))}
                    {profile.hobbies.length > 6 && (
                      <Badge variant="outline" className="text-xs">
                        +{profile.hobbies.length - 6} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* About */}
              {profile.about_me && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">About</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                    {profile.about_me}
                  </p>
                </div>
              )}
            </>
          ) : (
            // Extended Profile View
            <>
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold">More About {profile.first_name}</h3>
                <p className="text-sm text-muted-foreground">Extended profile details</p>
              </div>

              {/* Additional Photos */}
              {profile.additional_photos && profile.additional_photos.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">More Photos</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {profile.additional_photos.map((photo, index) => (
                      <button
                        key={index}
                        onClick={() => openImageViewer(1 + index)} // +1 because avatar is at index 0
                        className="relative aspect-square overflow-hidden rounded-lg border hover:scale-105 transition-transform duration-200"
                      >
                        <img
                          src={photo}
                          alt={`Additional photo ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Answered Prompts */}
              {profile.selected_prompts && profile.selected_prompts.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Personal Stories</h4>
                  {profile.selected_prompts.map((prompt, index) => (
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

              {/* No extended content */}
              {(!profile.additional_photos || profile.additional_photos.length === 0) && 
               (!profile.selected_prompts || profile.selected_prompts.length === 0) && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-sm">
                    {profile.first_name} hasn't added extended profile details yet.
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Image Viewer */}
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