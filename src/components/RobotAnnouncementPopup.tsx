import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RobotAnnouncement {
  id: string;
  title: string;
  message: string;
  announcement_type: string;
  target_audience: string;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

interface RobotAnnouncementPopupProps {
  announcement: RobotAnnouncement;
  onDismiss: () => void;
}

const RobotAnnouncementPopup = ({ announcement, onDismiss }: RobotAnnouncementPopupProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in p-4">
      <div className="bg-background rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl animate-scale-in border border-border">
        <div className="flex items-start space-x-3 mb-4">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center flex-shrink-0">
            <img 
              src="/lovable-uploads/2293d200-728d-46fb-a007-7994ca0a639c.png" 
              alt="MSTwins Robot" 
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-2">{announcement.title}</h3>
            <p className="text-sm text-muted-foreground">{announcement.message}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="flex-shrink-0 p-1 h-auto"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex justify-end">
          <Button onClick={onDismiss} size="sm">
            Got it!
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RobotAnnouncementPopup;