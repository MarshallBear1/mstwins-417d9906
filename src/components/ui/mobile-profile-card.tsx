import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  User, 
  MapPin, 
  Calendar, 
  ArrowLeftRight, 
  Eye,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CollapsibleSection } from "./collapsible-section";

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

interface MobileProfileCardProps {
  profile: Profile;
  onImageClick?: (index: number) => void;
  isUserOnline?: (userId: string) => boolean;
  getLastSeenText?: (lastSeen: string | null) => string;
  showActions?: boolean;
  onLike?: () => void;
  onPass?: () => void;
  actionLoading?: boolean;
  className?: string;
}

export const MobileProfileCard = ({
  profile,
  onImageClick,
  isUserOnline = () => false,
  getLastSeenText = () => "Recently",
  showActions = false,
  onLike,
  onPass,
  actionLoading = false,
  className
}: MobileProfileCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showAllAbout, setShowAllAbout] = useState(false);

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

  const hasExtendedContent = profile.additional_photos?.length || 
                           profile.selected_prompts?.length || 
                           profile.medications?.length || 
                           profile.symptoms?.length;

  const allImages = [
    ...(profile.avatar_url ? [profile.avatar_url] : []),
    ...(profile.additional_photos || [])
  ];

  // Debug logging and safety check
  if (!profile) {
    console.error('❌ MobileProfileCard: No profile provided');
    return <div style={{border: '2px solid red', padding: '10px'}}>ERROR: No profile data</div>;
  }

  console.log('📱 MobileProfileCard rendering:', {
    name: `${profile.first_name} ${profile.last_name}`,
    hasAvatar: !!profile.avatar_url,
    location: profile.location
  });

  return (
    <div className={cn("flip-card-container profile-card-mobile mx-auto", className)}>
      <div className={cn("flip-card-inner", isFlipped && "rotate-y-180")}>
        {/* Front Side */}
        <Card className="flip-card-face shadow-lg hover:shadow-xl transition-shadow duration-300 bg-background border border-border">
          {/* Header */}
          <div className="relative h-28 bg-gradient-to-br from-primary/80 via-primary/60 to-primary/40 flex items-center justify-center">
            <button
              onClick={() => onImageClick?.(0)}
              className="relative w-16 h-16 rounded-full overflow-hidden border-3 border-white shadow-lg hover:scale-105 transition-transform duration-200 mobile-touch-target"
            >
              {profile.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={profile.first_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <User className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div className={cn(
                "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white shadow-md",
                isUserOnline(profile.user_id) ? 'bg-green-500' : 'bg-muted-foreground'
              )} />
            </button>

            {hasExtendedContent && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFlipped(!isFlipped)}
                className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 shadow-lg mobile-touch-target"
              >
                <ArrowLeftRight className="w-4 h-4 text-white drop-shadow-sm" />
              </Button>
            )}

            {profile.additional_photos && profile.additional_photos.length > 0 && (
              <div className="absolute bottom-2 left-2 bg-white/90 rounded-full px-2 py-1 shadow-lg">
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  <span className="text-xs font-medium">+{profile.additional_photos.length}</span>
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <CardContent className="p-3 profile-content-scroll">
            {/* Header Info */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold truncate flex-1 mr-2">
                {profile.first_name} {profile.last_name}
              </h3>
              <div className="flex items-center gap-2 shrink-0">
                {profile.date_of_birth && (
                  <span className="text-base font-semibold text-muted-foreground">
                    {calculateAge(profile.date_of_birth)}
                  </span>
                )}
                <div className="flex items-center gap-1">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    isUserOnline(profile.user_id) ? 'bg-green-500' : 'bg-muted-foreground'
                  )} />
                  <span className="text-xs text-muted-foreground">
                    {isUserOnline(profile.user_id) ? 'Online' : getLastSeenText(profile.last_seen)}
                  </span>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-center gap-2 text-muted-foreground mb-3">
              <MapPin className="w-4 h-4 shrink-0" />
              <span className="text-sm truncate">{profile.location}</span>
            </div>

            <div className="mobile-section-spacing">
              {/* MS Type */}
              {profile.ms_subtype && (
                <div>
                  <h4 className="text-sm font-semibold mb-1">MS Type</h4>
                  <Badge variant="secondary" className="text-xs">
                    {profile.ms_subtype.toUpperCase()}
                  </Badge>
                </div>
              )}

              {/* Diagnosis Year */}
              {profile.diagnosis_year && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span className="text-sm">Diagnosed in {profile.diagnosis_year}</span>
                </div>
              )}

              {/* Hobbies/Interests */}
              {profile.hobbies && profile.hobbies.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Interests</h4>
                  <div className="flex flex-wrap gap-1">
                    {profile.hobbies.slice(0, 4).map((hobby, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {hobby}
                      </Badge>
                    ))}
                    {profile.hobbies.length > 4 && (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        +{profile.hobbies.length - 4} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* About Me */}
              {profile.about_me && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">About</h4>
                  <div className="text-sm text-muted-foreground leading-relaxed">
                    <p className={cn(
                      "transition-all duration-300",
                      !showAllAbout && "line-clamp-3"
                    )}>
                      {profile.about_me}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAllAbout(!showAllAbout)}
                      className="p-0 h-auto text-xs text-primary hover:text-primary/80 mt-1 transition-colors"
                    >
                      {showAllAbout ? (
                        <>Show Less <ChevronUp className="w-3 h-3 ml-1" /></>
                      ) : (
                        <>Show More <ChevronDown className="w-3 h-3 ml-1" /></>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* See More Button */}
            {hasExtendedContent && (
              <div className="mt-4 pt-3 border-t">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-primary hover:text-primary hover:bg-primary/10 text-sm mobile-touch-target"
                  onClick={() => setIsFlipped(!isFlipped)}
                >
                  See More →
                </Button>
              </div>
            )}

            {/* Action buttons */}
            {showActions && (
              <div className="flex gap-2 pt-3 mt-3 border-t">
                <Button
                  variant="outline"
                  onClick={onPass}
                  disabled={actionLoading}
                  className="flex-1 mobile-touch-target"
                >
                  Pass
                </Button>
                <Button
                  onClick={onLike}
                  disabled={actionLoading}
                  className="flex-1 mobile-touch-target bg-gradient-primary"
                >
                  {actionLoading ? 'Liking...' : 'Like'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Back Side */}
        <Card className="flip-card-face flip-card-back shadow-lg hover:shadow-xl transition-shadow duration-300 bg-background border border-border">
          <div className="relative h-28 bg-gradient-to-br from-accent/80 via-accent/60 to-accent/40 flex items-center justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFlipped(!isFlipped)}
              className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 shadow-lg mobile-touch-target"
            >
              <ArrowLeftRight className="w-4 h-4 text-white drop-shadow-sm" />
            </Button>
            <div className="text-center text-white">
              <h3 className="text-base font-bold">{profile.first_name}'s Story</h3>
            </div>
          </div>

          <CardContent className="p-3 profile-content-scroll">
            {hasExtendedContent ? (
              <div className="mobile-section-spacing">
                {/* Additional Photos */}
                {profile.additional_photos && profile.additional_photos.length > 0 && (
                  <CollapsibleSection title={`Photos (${profile.additional_photos.length})`} defaultExpanded>
                    <div className="grid grid-cols-2 gap-2">
                      {profile.additional_photos.slice(0, 4).map((photo, index) => (
                        <button
                          key={index}
                          onClick={() => onImageClick?.(1 + index)}
                          className="aspect-square overflow-hidden rounded-lg border hover:scale-105 transition-transform duration-200 mobile-touch-target"
                        >
                          <img
                            src={photo}
                            alt={`Photo ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                    {profile.additional_photos.length > 4 && (
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        +{profile.additional_photos.length - 4} more photos
                      </p>
                    )}
                  </CollapsibleSection>
                )}

                {/* Health Information */}
                {(profile.symptoms?.length || profile.medications?.length) && (
                  <CollapsibleSection title="Health Info">
                    {profile.symptoms && profile.symptoms.length > 0 && (
                      <div className="mb-3">
                        <h5 className="text-xs font-medium text-muted-foreground mb-1">Symptoms</h5>
                        <div className="mobile-badge-grid">
                          {profile.symptoms.slice(0, 6).map((symptom, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {symptom}
                            </Badge>
                          ))}
                        </div>
                        {profile.symptoms.length > 6 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            +{profile.symptoms.length - 6} more
                          </p>
                        )}
                      </div>
                    )}

                    {profile.medications && profile.medications.length > 0 && (
                      <div>
                        <h5 className="text-xs font-medium text-muted-foreground mb-1">Medications</h5>
                        <div className="mobile-badge-grid">
                          {profile.medications.slice(0, 4).map((medication, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {medication}
                            </Badge>
                          ))}
                        </div>
                        {profile.medications.length > 4 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            +{profile.medications.length - 4} more
                          </p>
                        )}
                      </div>
                    )}
                  </CollapsibleSection>
                )}

                {/* Personal Stories */}
                {profile.selected_prompts && profile.selected_prompts.length > 0 && (
                  <CollapsibleSection title="Personal Stories">
                    <div className="space-y-3">
                      {profile.selected_prompts.slice(0, 3).map((prompt, index) => (
                        <div key={index} className="bg-muted/50 rounded-lg p-3 space-y-2">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            {prompt.question}
                          </p>
                          <p className="text-sm leading-relaxed text-truncate-mobile-3">
                            {prompt.answer}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CollapsibleSection>
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
  );
};