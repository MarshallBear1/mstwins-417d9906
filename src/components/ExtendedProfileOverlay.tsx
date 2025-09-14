import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Heart, X, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { formatMSSubtype, calculateAge } from '@/lib/formatters';
import { useRealtimePresence } from '@/hooks/useRealtimePresence';

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
  getLastSeenText?: (lastSeen?: string) => string;
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
  const [fullAbout, setFullAbout] = useState<string>('');
  const [fullSymptoms, setFullSymptoms] = useState<string[]>([]);
  const [fullMedications, setFullMedications] = useState<string[]>([]);
  const [isLoadingAbout, setIsLoadingAbout] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | undefined>(profile.last_seen);

  // Fallback to realtime presence hook if not provided
  const { isUserOnline: hookIsUserOnline, getLastSeenText: hookGetLastSeenText } = useRealtimePresence();
  const effectiveIsUserOnline = isUserOnline ?? hookIsUserOnline;
  const effectiveGetLastSeenText = getLastSeenText ?? hookGetLastSeenText;

  // Remove body scroll prevention to allow internal scrolling

  // Inform other UI (e.g., Filters) to close when overlay opens
  useEffect(() => {
    if (isOpen) {
      document.dispatchEvent(new CustomEvent('extended-profile-open'));
    }
    return () => {
      document.dispatchEvent(new CustomEvent('extended-profile-close'));
    };
  }, [isOpen]);

  // Load full data on mount
  useEffect(() => {
    const loadFullData = async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('about_me, symptoms, medications, last_seen')
          .eq('user_id', profile.user_id)
          .single();
        
        console.log('Extended profile data loaded:', data); // Debug log
        
        if (data) {
          if (data.about_me) setFullAbout(data.about_me);
          if (data.symptoms) setFullSymptoms(data.symptoms);
          if (data.medications) setFullMedications(data.medications);
          if (data.last_seen) setLastSeen(data.last_seen);
        }
      } catch (error) {
        console.error('Error loading full profile data:', error);
      }
    };

    if (isOpen) {
      loadFullData();
    }
  }, [isOpen, profile.user_id]);

  const handleLike = () => {
    onLike?.();
    onClose(); // Close extended view after like
  };

  const handlePass = () => {
    onPass?.();
    onClose(); // Close extended view after pass
  };

  if (!isOpen) return null;

  const overlay = (
    <div className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onWheel={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
      <Card className="w-full max-w-md max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col z-[101]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 pt-8 border-b border-gray-200 flex-shrink-0">
          <span className="font-semibold text-gray-900">Profile Details</span>
          <button
            onClick={onClose}
            className="p-3 hover:bg-gray-100 rounded-full transition-colors touch-manipulation min-h-[48px] min-w-[48px] flex items-center justify-center"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Profile Header */}
        <div className="p-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button
                onClick={() => onImageClick?.(0)}
                className="relative block"
              >
                <Avatar className="w-20 h-20 rounded-full">
                  <AvatarImage 
                    src={profile.avatar_url || ''} 
                    alt={`${profile.first_name}'s profile`}
                    className="w-full h-full object-cover rounded-full bg-gradient-to-br from-purple-100 to-blue-100"
                  />
                  <AvatarFallback className="w-20 h-20 text-2xl rounded-full bg-gradient-to-br from-purple-400 to-blue-500 text-white">
                    {profile.first_name[0]}
                  </AvatarFallback>
                </Avatar>
              </button>
              
              {/* Online status */}
              {isUserOnline?.(profile.user_id) && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-gray-900">
                {profile.first_name}
                {profile.age && <span className="text-xl text-gray-600 ml-2">{calculateAge(profile.age)}</span>}
              </h2>
              
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <div className="flex items-center gap-1 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{profile.city}</span>
                </div>
                {profile.gender && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                    {profile.gender}
                  </Badge>
                )}
                {profile.ms_subtype && (
                  <span className="text-sm text-gray-700"><span className="font-medium">MS Subtype:</span> {formatMSSubtype(profile.ms_subtype)}</span>
                )}
              </div>
              
              {/* Last seen */}
              <div className="text-sm text-gray-500 mt-1">
                {effectiveIsUserOnline?.(profile.user_id) ? 'Online' : (effectiveGetLastSeenText?.(lastSeen ?? null) || 'Last seen long ago')}
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ WebkitOverflowScrolling: 'touch' }}>
          {/* About Me - Always show full content */}
          {(profile.about_me_preview && profile.about_me_preview.length > 0) && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-base font-semibold text-gray-800 mb-3">About Me:</div>
              <div className="text-base text-gray-800 leading-relaxed whitespace-pre-wrap">
                {fullAbout || profile.about_me_preview}
              </div>
            </div>
          )}

          {/* Selected Prompts */}
          {profile.selected_prompts && profile.selected_prompts.length > 0 && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <div className="text-base font-semibold text-gray-800 mb-3">Profile Prompts:</div>
              <div className="space-y-3">
                {(Array.isArray(profile.selected_prompts) ? profile.selected_prompts : []).slice(0, 3).map((prompt: any, index: number) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3 border border-indigo-100">
                    <div className="text-sm font-medium text-indigo-700 mb-1">
                      {prompt.question || prompt.prompt || 'Question'}
                    </div>
                    <div className="text-sm text-gray-700">
                      {prompt.answer || prompt.response || 'No response provided'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Symptoms */}
          {((fullSymptoms.length > 0 ? fullSymptoms : profile.symptoms) && (fullSymptoms.length > 0 ? fullSymptoms : profile.symptoms).length > 0) && (
            <div>
              <h4 className="font-bold text-gray-900 mb-3 text-base">My Symptoms</h4>
              <div className="flex flex-wrap gap-2">
                {(showAllSymptoms ? (fullSymptoms.length > 0 ? fullSymptoms : profile.symptoms) : (fullSymptoms.length > 0 ? fullSymptoms : profile.symptoms).slice(0, 6)).map((symptom, index) => {
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
                {(fullSymptoms.length > 0 ? fullSymptoms : profile.symptoms).length > 6 && (
                  <button
                    onClick={() => setShowAllSymptoms(!showAllSymptoms)}
                    className="text-sm text-orange-600 hover:text-orange-700 font-semibold transition-colors"
                  >
                    <Badge variant="outline" className="text-sm px-3 py-1.5 hover:bg-orange-100 cursor-pointer border-orange-400 text-orange-600">
                      {showAllSymptoms ? 'Show Less' : `+${(fullSymptoms.length > 0 ? fullSymptoms : profile.symptoms).length - 6} more`}
                    </Badge>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Medications */}
          {((fullMedications.length > 0 ? fullMedications : profile.medications) && (fullMedications.length > 0 ? fullMedications : profile.medications).length > 0) && (
            <div>
              <h4 className="font-bold text-gray-900 mb-3 text-base">Current Medications</h4>
              <div className="flex flex-wrap gap-2">
                {(showAllMedications ? (fullMedications.length > 0 ? fullMedications : profile.medications) : (fullMedications.length > 0 ? fullMedications : profile.medications).slice(0, 3)).map((medication, index) => {
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
                {(fullMedications.length > 0 ? fullMedications : profile.medications).length > 3 && (
                  <button
                    onClick={() => setShowAllMedications(!showAllMedications)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                  >
                    <Badge variant="outline" className="text-sm px-3 py-1.5 hover:bg-blue-100 cursor-pointer border-blue-400 text-blue-600">
                      {showAllMedications ? 'Show Less' : `+${(fullMedications.length > 0 ? fullMedications : profile.medications).length - 3} more`}
                    </Badge>
                  </button>
                )}
              </div>
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
                    <img 
                      src={photoUrl} 
                      alt={`${profile.first_name}'s photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Interests & Hobbies */}
          {profile.hobbies && profile.hobbies.length > 0 && (
            <div>
              <h4 className="font-bold text-gray-900 mb-3 text-base">Interests & Hobbies</h4>
              <div className="flex flex-wrap gap-2">
                {profile.hobbies.map((hobby, index) => {
                  const colors = [
                    'bg-purple-400/80 border-purple-300/50 text-white',
                    'bg-blue-400/80 border-blue-300/50 text-white',
                    'bg-green-400/80 border-green-300/50 text-white',
                    'bg-orange-400/80 border-orange-300/50 text-white',
                    'bg-pink-400/80 border-pink-300/50 text-white'
                  ];
                  return (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className={`text-sm px-3 py-1.5 transition-colors shadow-sm ${colors[index % colors.length]}`}
                    >
                      {hobby}
                    </Badge>
                  );
                })}
              </div>
            </div>
           )}
        </div>

        {/* Action Buttons */}
        <div className="relative z-[102] p-4 border-t border-gray-200 flex-shrink-0 bg-white shadow-lg">
          <div className="flex gap-3">
            <button
              onClick={handlePass}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 min-h-[48px] touch-manipulation shadow-sm"
            >
              <X className="w-5 h-5" />
              Dismiss
            </button>
            <button
              onClick={handleLike}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 min-h-[48px] touch-manipulation shadow-sm"
            >
              <Heart className="w-5 h-5" />
              Connect
            </button>
          </div>
        </div>
      </Card>
    </div>
  );

  return createPortal(overlay, document.body);
};

export default ExtendedProfileOverlay;