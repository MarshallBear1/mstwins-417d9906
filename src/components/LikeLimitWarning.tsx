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
                  <Clock className="w-4 h-4 text-orange-600" />
                  <span className="font-medium text-orange-800 dark:text-orange-200">
                    {remainingLikes} likes remaining today
                  </span>
                </div>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  You have a daily limit of 5 likes to encourage meaningful connections.
                </p>
              </div>
              
              {remainingLikes === 0 && canGetBonus && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Gift className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-gray-900">Want 5 More Likes?</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Share our community with someone and unlock 5 bonus likes for today!
                  </p>
                </div>
              )}
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Target className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Why do we have like limits?</p>
                    <p className="text-sm text-muted-foreground">
                      Daily limits encourage thoughtful connections and help you focus on quality relationships within our MS support community.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Heart className="w-5 h-5 text-pink-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Make each like count</p>
                    <p className="text-sm text-muted-foreground">
                      Take time to read profiles carefully and connect with people who share your MS journey.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  💡 <strong>Tip:</strong> Your likes reset every day at midnight, so come back tomorrow for 5 fresh likes!
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Got it!
            </Button>
            {remainingLikes === 0 && canGetBonus && (
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