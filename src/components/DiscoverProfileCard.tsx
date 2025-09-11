import { useState } from "react";
import { useRealtimePresence } from "@/hooks/useRealtimePresence";
import ProfileImageViewer from "./ProfileImageViewer";
import MobileProfileCard from "@/components/ui/mobile-profile-card";

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
}

interface DiscoverProfileCardProps {
  profile: Profile;
  isFlipped?: boolean;
  onFlipChange?: (flipped: boolean) => void;
  onLike?: () => void;
  onPass?: () => void;
}

const DiscoverProfileCard = ({ profile, isFlipped, onFlipChange, onLike, onPass }: DiscoverProfileCardProps) => {
  const { isUserOnline, getLastSeenText } = useRealtimePresence();
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);

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
      <MobileProfileCard
        profile={profile}
        onImageClick={openImageViewer}
        isUserOnline={isUserOnline}
        getLastSeenText={getLastSeenText}
        isFlipped={isFlipped}
        onFlipChange={onFlipChange}
        onLike={onLike}
        onPass={onPass}
      />

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