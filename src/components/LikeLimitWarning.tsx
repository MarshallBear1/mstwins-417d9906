import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, Clock, Target, Gift } from "lucide-react";
import { ReferralBonusPopup } from '@/components/ReferralBonusPopup';
import { useDailyLikesReferral } from '@/hooks/useDailyLikesReferral';

interface LikeLimitWarningProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  remainingLikes: number;
}

const LikeLimitWarning = ({ open, onOpenChange, remainingLikes }: LikeLimitWarningProps) => {
  const [showReferralPopup, setShowReferralPopup] = useState(false);
  const { claimReferralBonus, canGetBonus } = useDailyLikesReferral();

  const handleGetMoreLikes = () => {
    onOpenChange(false);
    setShowReferralPopup(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-5 h-5 text-pink-500" />
              <DialogTitle>
                {remainingLikes === 0 ? "Out of Likes! ❤️" : "Daily Like Limit"}
              </DialogTitle>
            </div>
            <DialogDescription className="text-left space-y-4">
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-4 h-4 text-orange-600" />
                  <span className="font-medium text-orange-800 dark:text-orange-200">
                    1 like remaining today
                  </span>
                </div>
              </div>
              
              {canGetBonus && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Gift className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-gray-900">Want 5 more likes for today?</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Share the link to someone, check back and you will have 5 more likes. 
                    (Likes work when someone clicks the referral link - they don't have to sign up!)
                  </p>
                </div>
              )}
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  💡 Come back tomorrow for fresh likes!
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onOpenChange(false);
              }}
            >
              Got it!
            </Button>
            {canGetBonus && (
              <Button onClick={handleGetMoreLikes}>
                <Gift className="w-4 h-4 mr-2" />
                Get More Likes
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ReferralBonusPopup
        open={showReferralPopup}
        onOpenChange={setShowReferralPopup}
        onClaimBonus={claimReferralBonus}
        remainingLikes={remainingLikes}
      />
    </>
  );
};

export default LikeLimitWarning;