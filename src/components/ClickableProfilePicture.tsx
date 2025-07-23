
import { useState } from "react";
import { User } from "lucide-react";
import ProfileImageViewer from "./ProfileImageViewer";

interface ClickableProfilePictureProps {
  avatarUrl: string | null;
  additionalPhotos?: string[];
  firstName: string;
  className?: string;
}

const ClickableProfilePicture = ({ 
  avatarUrl, 
  additionalPhotos = [], 
  firstName, 
  className = "" 
}: ClickableProfilePictureProps) => {
  const [showImageViewer, setShowImageViewer] = useState(false);

  // Prepare all images for the viewer
  const allImages = [
    ...(avatarUrl ? [avatarUrl] : []),
    ...additionalPhotos
  ];

  const openImageViewer = () => {
    if (allImages.length > 0) {
      setShowImageViewer(true);
    }
  };

  return (
    <>
      <button
        onClick={openImageViewer}
        className={`overflow-hidden hover:scale-105 transition-transform duration-200 ${className}`}
        disabled={allImages.length === 0}
      >
        {avatarUrl ? (
          <img 
            src={avatarUrl} 
            alt={`${firstName}'s avatar`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-primary flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
        )}
      </button>

      {allImages.length > 0 && (
        <ProfileImageViewer
          images={allImages}
          currentIndex={0}
          isOpen={showImageViewer}
          onClose={() => setShowImageViewer(false)}
        />
      )}
    </>
  );
};

export default ClickableProfilePicture;
