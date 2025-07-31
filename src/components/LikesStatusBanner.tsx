import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Gift, Users } from 'lucide-react';
import { ReferralBonusPopup } from '@/components/ReferralBonusPopup';
import { useDailyLikes } from '@/hooks/useDailyLikes';
import { useDailyLikesReferral } from '@/hooks/useDailyLikesReferral';

export const LikesStatusBanner = () => {
  const [showReferralPopup, setShowReferralPopup] = useState(false);
  const { likesData, isLimitEnforced } = useDailyLikes();
  const { claimReferralBonus } = useDailyLikesReferral();

  if (!likesData || !isLimitEnforced()) {
    return null; // Don't show banner before enforcement date
  }

  const { remaining, total_limit, has_bonus, can_get_bonus } = likesData;

  return (
    <>
      <Card className="mx-4 mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Heart className="w-5 h-5 text-red-500" />
              <span className="font-semibold text-gray-900">
                {remaining} likes left
              </span>
            </div>
            
            {has_bonus && (
              <div className="flex items-center gap-1 bg-green-100 px-2 py-1 rounded-full">
                <Gift className="w-4 h-4 text-green-600" />
                <span className="text-xs font-medium text-green-700">Bonus Active!</span>
              </div>
            )}
          </div>

          {remaining === 0 && can_get_bonus && (
            <Button 
              size="sm" 
              onClick={() => setShowReferralPopup(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Users className="w-4 h-4 mr-1" />
              Get 5 More
            </Button>
          )}
        </div>

        {remaining === 0 && !can_get_bonus && (
          <p className="text-sm text-gray-600 mt-2">
            Your likes reset at midnight. Come back tomorrow for fresh likes! 🌅
          </p>
        )}
        
        {remaining === 0 && can_get_bonus && (
          <p className="text-sm text-gray-600 mt-2">
            Share MStwins with someone to unlock 5 bonus likes for today!
          </p>
        )}
      </Card>

      <ReferralBonusPopup
        open={showReferralPopup}
        onOpenChange={setShowReferralPopup}
        onClaimBonus={claimReferralBonus}
        remainingLikes={remaining}
      />
    </>
  );
};