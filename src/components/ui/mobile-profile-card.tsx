import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, MapPin, Calendar, ArrowLeftRight, Eye, ChevronDown, ChevronUp } from "lucide-react";
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

  // Reset the "show more" state when profile changes
  useEffect(() => {
    setShowAllAbout(false);
    setIsFlipped(false);
  }, [profile.id]);
  const calculateAge = (birthDate: string | null) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || monthDiff === 0 && today.getDate() < birth.getDate()) {
      return age - 1;
    }
    return age;
  };
  const hasExtendedContent = profile.additional_photos?.length || profile.selected_prompts?.length || profile.medications?.length || profile.symptoms?.length;
  const allImages = [...(profile.avatar_url ? [profile.avatar_url] : []), ...(profile.additional_photos || [])];
  return <div className={cn("flip-card-container profile-card-mobile mx-auto", className)} style={{
    minHeight: '420px',
    width: '100%',
    maxWidth: '300px',
    display: 'block',
    visibility: 'visible',
    position: 'relative'
  }}>
      <div className={cn("flip-card-inner", isFlipped && "rotate-y-180")} style={{
      width: '100%',
      height: '100%',
      position: 'relative'
    }}>
        {/* Front Side */}
        <Card className="flip-card-face shadow-2xl hover:shadow-3xl transition-all duration-500 bg-white border-0 rounded-2xl overflow-hidden" style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'block'
      }}>
          {/* Smaller Header focused on profile picture */}
          <div className="relative h-48 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-400 flex items-center justify-center overflow-hidden">
            {/* Larger Profile Image as main focus */}
            <button onClick={() => onImageClick?.(0)} className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-2xl hover:scale-110 transition-all duration-300 mobile-touch-target">
              {profile.avatar_url ? <img src={profile.avatar_url} alt={profile.first_name} className="w-full h-full object-cover transition-opacity duration-200" loading="eager" onLoad={e => {
              e.currentTarget.style.opacity = '1';
            }} onError={e => {
              e.currentTarget.src = `https://api.dicebear.com/6.x/avataaars/svg?seed=${profile.first_name}&backgroundColor=b6e3f4,c0aede&eyes=happy&mouth=smile`;
            }} style={{
              opacity: '0'
            }} /> : <div className="w-full h-full bg-white/20 flex items-center justify-center">
                <User className="w-10 h-10 text-white" />
              </div>}
            </button>
            
            {/* Online Status */}
            {isUserOnline(profile.user_id) && (
              <div className="absolute top-3 right-3 w-3 h-3 bg-green-400 rounded-full border-2 border-white shadow-lg animate-pulse" />
            )}
            
            {/* Flip Button */}
            {hasExtendedContent && (
              <button 
                onClick={() => setIsFlipped(!isFlipped)}
                className="absolute top-3 left-3 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-200 mobile-touch-target shadow-lg"
                title="More details"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Modern Content Section */}
          <CardContent className="p-4 space-y-3">
            {/* Compact Name and Age */}
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">{profile.first_name}</h3>
              <span className="text-sm font-medium text-gray-600">{calculateAge(profile.date_of_birth)}</span>
            </div>

            {/* Compact Location */}
            {profile.location && (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm truncate">{profile.location}</span>
              </div>
            )}

            {/* MS Info - more compact */}
            {profile.ms_subtype && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs px-2 py-1">
                  {profile.ms_subtype}
                </Badge>
                {profile.diagnosis_year && (
                  <span className="text-xs text-gray-500">
                    Diagnosed {profile.diagnosis_year}
                  </span>
                )}
              </div>
            )}

            {/* Compact Hobbies */}
            {profile.hobbies && profile.hobbies.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {profile.hobbies.slice(0, 3).map((hobby, index) => (
                  <Badge key={index} variant="secondary" className="text-xs px-2 py-1">
                    {hobby}
                  </Badge>
                ))}
                {profile.hobbies.length > 3 && (
                  <Badge variant="outline" className="text-xs px-2 py-1">
                    +{profile.hobbies.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Compact About */}
            {profile.about_me && (
              <div>
                <p className={`text-sm text-gray-600 leading-relaxed ${!showAllAbout ? 'line-clamp-2' : ''}`}>
                  {profile.about_me}
                </p>
                {profile.about_me.length > 80 && (
                  <button
                    onClick={() => setShowAllAbout(!showAllAbout)}
                    className="text-xs text-blue-600 hover:text-blue-700 mt-1"
                  >
                    {showAllAbout ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>
            )}

            {/* Compact Action buttons */}
            {showActions && (
              <div className="flex gap-2 pt-3">
                <Button 
                  variant="outline" 
                  onClick={onPass} 
                  disabled={actionLoading} 
                  className="flex-1 h-10 border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 font-medium rounded-xl transition-all duration-200"
                >
                  Pass
                </Button>
                <Button 
                  onClick={onLike} 
                  disabled={actionLoading} 
                  className="flex-1 h-10 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Like
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Back Side */}
        <Card className="flip-card-face flip-card-back shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white border border-gray-200" style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0
      }}>
          <div className="relative h-28 bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
            <Button variant="ghost" size="sm" onClick={() => setIsFlipped(!isFlipped)} className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 shadow-lg mobile-touch-target">
              <ArrowLeftRight className="w-4 h-4 text-white drop-shadow-sm" />
            </Button>
            <div className="text-center text-white">
              <h3 className="text-base font-bold">{profile.first_name}'s Story</h3>
            </div>
          </div>

          <CardContent className="p-3 profile-content-scroll">
            {hasExtendedContent ? <div className="mobile-section-spacing">
                {/* Additional Photos */}
                {profile.additional_photos && profile.additional_photos.length > 0 && <CollapsibleSection title={`Photos (${profile.additional_photos.length})`} defaultExpanded>
                    <div className="grid grid-cols-2 gap-2">
                      {profile.additional_photos.slice(0, 4).map((photo, index) => <button key={index} onClick={() => onImageClick?.(1 + index)} className="aspect-square overflow-hidden rounded-lg border hover:scale-105 transition-transform duration-200 mobile-touch-target">
                          <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                        </button>)}
                    </div>
                    {profile.additional_photos.length > 4 && <p className="text-xs text-muted-foreground text-center mt-2">
                        +{profile.additional_photos.length - 4} more photos
                      </p>}
                  </CollapsibleSection>}

                {/* Health Information */}
                {(profile.symptoms?.length || profile.medications?.length) && <CollapsibleSection title="Health Info">
                    {profile.symptoms && profile.symptoms.length > 0 && <div className="mb-3">
                        <h5 className="text-xs font-medium text-muted-foreground mb-1">Symptoms</h5>
                        <div className="mobile-badge-grid">
                          {profile.symptoms.slice(0, 6).map((symptom, index) => <Badge key={index} variant="outline" className="text-xs">
                              {symptom}
                            </Badge>)}
                        </div>
                        {profile.symptoms.length > 6 && <p className="text-xs text-muted-foreground mt-1">
                            +{profile.symptoms.length - 6} more
                          </p>}
                      </div>}

                    {profile.medications && profile.medications.length > 0 && <div>
                        <h5 className="text-xs font-medium text-muted-foreground mb-1">Medications</h5>
                        <div className="mobile-badge-grid">
                          {profile.medications.slice(0, 4).map((medication, index) => <Badge key={index} variant="outline" className="text-xs">
                              {medication}
                            </Badge>)}
                        </div>
                        {profile.medications.length > 4 && <p className="text-xs text-muted-foreground mt-1">
                            +{profile.medications.length - 4} more
                          </p>}
                      </div>}
                  </CollapsibleSection>}

                {/* Personal Stories */}
                {profile.selected_prompts && profile.selected_prompts.length > 0 && <CollapsibleSection title="Personal Stories">
                    <div className="space-y-3">
                      {profile.selected_prompts.slice(0, 3).map((prompt, index) => <div key={index} className="bg-muted/50 rounded-lg p-3 space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            {prompt.question}
                          </p>
                          <p className="text-xs leading-relaxed">
                            {prompt.answer}
                          </p>
                        </div>)}
                    </div>
                  </CollapsibleSection>}
              </div> : <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">
                  {profile.first_name} hasn't shared extended details yet.
                </p>
              </div>}
          </CardContent>
        </Card>
      </div>
    </div>;
};