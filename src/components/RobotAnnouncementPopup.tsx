import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRobotAnnouncements } from "@/hooks/useRobotAnnouncements";

const RobotAnnouncementPopup = () => {
  const { currentAnnouncement, showAnnouncement, dismissAnnouncement } = useRobotAnnouncements();

  if (!showAnnouncement || !currentAnnouncement) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
      <Card className="w-80 max-w-[calc(100vw-2rem)] shadow-xl border-0 bg-background/95 backdrop-blur-md">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            {/* Robot mascot */}
            <div className="flex-shrink-0">
              <img 
                src="/lovable-uploads/2293d200-728d-46fb-a007-7994ca0a639c.png" 
                alt="MSTwins robot" 
                className="w-12 h-12 rounded-full"
              />
            </div>
            
            {/* Content */}
            <div className="flex-1">
              <div className="bg-white rounded-lg p-3 shadow-sm relative">
                <div className="absolute -left-2 top-3 w-0 h-0 border-t-4 border-t-transparent border-r-4 border-r-white border-b-4 border-b-transparent"></div>
                
                <div className="mb-2">
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    {currentAnnouncement.title}
                  </h3>
                </div>
                
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {currentAnnouncement.message}
                </p>
              </div>
            </div>
            
            {/* Dismiss button */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => dismissAnnouncement(currentAnnouncement.id)}
              className="flex-shrink-0 p-1 h-auto"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RobotAnnouncementPopup;