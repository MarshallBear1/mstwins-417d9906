import { useState } from "react";
import { useRealtimePresence } from "@/hooks/useRealtimePresence";
import ProfileImageViewer from "./ProfileImageViewer";
import { MobileProfileCard } from "@/components/ui/mobile-profile-card";

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