import React, { useState, useEffect } from 'react';
import { ArrowLeft, Heart, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  age: number | null;
  city: string;
  gender: string | null;
  ms_subtype: string | null;
  avatar_url: string | null;
  about_me_preview: string | null;
  hobbies: string[];
  additional_photos?: string[];
  selected_prompts?: any;
  extended_profile_completed?: boolean;
  symptoms?: string[];
  medications?: string[];
  last_seen?: string;
}

interface ExtendedProfileOverlayProps {
  profile: Profile;
  isOpen: boolean;
  onClose: () => void;
  onLike?: () => void;
  onPass?: () => void;
  onImageClick?: (imageIndex: number) => void;
  isUserOnline?: (userId: string) => boolean;
  getLastSeenText?: (userId: string, lastSeen?: string) => string;
}

const ExtendedProfileOverlay = ({
  profile,
  isOpen,
  onClose,
  onLike,
  onPass,
  onImageClick,
  isUserOnline,
  getLastSeenText,
}: ExtendedProfileOverlayProps) => {
  const [showAllAbout, setShowAllAbout] = useState(false);
  const [showAllSymptoms, setShowAllSymptoms] = useState(false);
  const [showAllMedications, setShowAllMedications] = useState(false);
  const [fullAbout, setFullAbout] = useState<string | null>(null);
  const [fullSymptoms, setFullSymptoms] = useState<string[] | null>(null);
  const [fullMedications, setFullMedications] = useState<string[] | null>(null);
  const [isLoadingAbout, setIsLoadingAbout] = useState(false);

  // Load full data when overlay opens
  useEffect(() => {
    if (isOpen && !fullAbout) {
      const loadFullData = async () => {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('about_me, symptoms, medications')
            .eq('user_id', profile.user_id)
            .single();
          
          if (data) {
            setFullAbout(data.about_me);
            setFullSymptoms(data.symptoms);
            setFullMedications(data.medications);
          }
        } catch (error) {
          console.error('Error loading full profile data:', error);
        }
      };
      loadFullData();
    }
  }, [isOpen, profile.user_id, fullAbout]);

  // Prevent body scroll when overlay is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
      <Card className="w-full max-w-md h-[90vh] flex flex-col overflow-hidden bg-white shadow-2xl">
        {/* Header */}
        <div className="relative h-48 bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-black/10 pointer-events-none"></div>
          
          {/* Back Button */}
          <button 
            onClick={onClose}
            className="absolute top-3 left-3 w-12 h-12 bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/60 transition-all duration-200 shadow-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="text-center text-white z-10">
            <h3 className="text-xl font-bold">{profile.first_name}'s Details</h3>
            <p className="text-base opacity-90">Extended Profile</p>
          </div>
        </div>

        {/* Scrollable Content */}
        <CardContent className="flex-1 p-6 space-y-5 overflow-y-auto">
          {/* About Me section */}
          {(profile.about_me_preview || fullAbout) && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-base font-semibold text-gray-800 mb-3">About Me:</div>
              <div className={`text-base text-gray-800 leading-relaxed whitespace-pre-wrap ${!showAllAbout ? 'line-clamp-3' : ''}`}>
                {showAllAbout ? (fullAbout || profile.about_me_preview) : profile.about_me_preview}
              </div>
              {(profile.about_me_preview && profile.about_me_preview.length > 100) && (
                <button
                  onClick={async () => {
                    if (!showAllAbout && !fullAbout && !isLoadingAbout) {
                      setIsLoadingAbout(true);
                      try {
                        const { data } = await supabase
                          .from('profiles')
                          .select('about_me')
                          .eq('user_id', profile.user_id)
                          .single();
                        if (data?.about_me) {
                          setFullAbout(data.about_me);
                        }
                      } catch (error) {
                        console.error('Error fetching full about_me:', error);
                      } finally {
                        setIsLoadingAbout(false);
                      }
                    }
                    setShowAllAbout(!showAllAbout);
                  }}
                  className="text-sm text-green-600 hover:text-green-700 mt-3 font-semibold transition-colors duration-200 flex items-center gap-1"
                >
                  {isLoadingAbout ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-green-600" />
                      Loading...
                    </>
                  ) : (
                    showAllAbout ? 'Show Less' : 'Read More'
                  )}
                </button>
              )}
            </div>
          )}

          {/* Symptoms */}
          {(fullSymptoms || profile.symptoms) && (fullSymptoms || profile.symptoms)?.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="text-base font-semibold text-gray-800 mb-3">My Symptoms:</div>
              <div className="flex flex-wrap gap-2">
                {(showAllSymptoms ? (fullSymptoms || profile.symptoms || []) : (fullSymptoms || profile.symptoms || []).slice(0, 6)).map((symptom, index) => {
                  const colors = [
                    'bg-orange-400/80 border-orange-300/50 text-white',
                    'bg-red-400/80 border-red-300/50 text-white', 
                    'bg-yellow-400/80 border-yellow-300/50 text-white',
                    'bg-amber-400/80 border-amber-300/50 text-white',
                    'bg-rose-400/80 border-rose-300/50 text-white',
                    'bg-pink-400/80 border-pink-300/50 text-white'
                  ];
                  return (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className={`text-sm px-3 py-1.5 transition-colors shadow-sm ${colors[index % colors.length]}`}
                    >
                      {symptom}
                    </Badge>
                  );
                })}
                {(fullSymptoms || profile.symptoms || []).length > 6 && (
                  <button
                    onClick={() => setShowAllSymptoms(!showAllSymptoms)}
                    className="text-sm text-orange-600 hover:text-orange-700 font-semibold transition-colors"
                  >
                    <Badge variant="outline" className="text-sm px-3 py-1.5 hover:bg-orange-100 cursor-pointer border-orange-400 text-orange-600">
                      {showAllSymptoms ? 'Show Less' : `+${(fullSymptoms || profile.symptoms || []).length - 6} more`}
                    </Badge>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Medications */}
          {(fullMedications || profile.medications) && (fullMedications || profile.medications)?.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-base font-semibold text-gray-800 mb-3">Current Medications:</div>
              <div className="flex flex-wrap gap-2">
                {(showAllMedications ? (fullMedications || profile.medications || []) : (fullMedications || profile.medications || []).slice(0, 3)).map((medication, index) => {
                  const colors = [
                    'bg-blue-400/80 border-blue-300/50 text-white',
                    'bg-indigo-400/80 border-indigo-300/50 text-white', 
                    'bg-purple-400/80 border-purple-300/50 text-white',
                    'bg-cyan-400/80 border-cyan-300/50 text-white',
                    'bg-teal-400/80 border-teal-300/50 text-white'
                  ];
                  return (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className={`text-sm px-3 py-1.5 transition-colors shadow-sm ${colors[index % colors.length]}`}
                    >
                      {medication}
                    </Badge>
                  );
                })}
              </div>
              {(fullMedications || profile.medications || []).length > 3 && (
                <button
                  onClick={() => setShowAllMedications(!showAllMedications)}
                  className="text-sm text-blue-600 hover:text-blue-700 mt-2 font-semibold transition-colors"
                >
                  <Badge variant="outline" className="text-sm px-3 py-1.5 hover:bg-blue-100 cursor-pointer border-blue-400 text-blue-600">
                    {showAllMedications ? 'Show Less' : `+${(fullMedications || profile.medications || []).length - 3} more`}
                  </Badge>
                </button>
              )}
            </div>
          )}

          {/* Additional Photos */}
          {profile.additional_photos && profile.additional_photos.length > 0 && (
            <div>
              <h4 className="font-bold text-gray-900 mb-3 text-base">More Photos</h4>
              <div className="grid grid-cols-2 gap-2">
                {profile.additional_photos.slice(0, 4).map((photoUrl, index) => (
                  <button
                    key={index}
                    onClick={() => onImageClick?.(index + 1)}
                    className="aspect-square rounded-lg overflow-hidden bg-gray-100 hover:scale-105 transition-transform duration-200"
                  >
                    <Avatar className="w-full h-full">
                      <AvatarImage 
                        src={photoUrl}
                        alt={`${profile.first_name}'s photo ${index + 2}`}
                        className="w-full h-full object-cover"
                      />
                      <AvatarFallback>{profile.first_name[0]}</AvatarFallback>
                    </Avatar>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Prompts */}
          {profile.selected_prompts && profile.selected_prompts.length > 0 && (
            <div className="space-y-4">
              {profile.selected_prompts.filter(prompt => prompt?.question && prompt?.answer?.trim()).map((prompt, index) => (
                <div key={index} className="bg-gray-100 rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-sm font-semibold text-gray-700 mb-3 leading-tight">{prompt.question}</p>
                  <p className="text-base text-gray-900 leading-relaxed">{prompt.answer}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>

        {/* Action Buttons */}
        {(onLike || onPass) && (
          <div className="flex-shrink-0 p-4 bg-gray-50 border-t flex gap-3">
            {onPass && (
              <button
                onClick={onPass}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <X className="w-5 h-5" />
                Pass
              </button>
            )}
            {onLike && (
              <button
                onClick={onLike}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Heart className="w-5 h-5" />
                Say Hi!
              </button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ExtendedProfileOverlay;