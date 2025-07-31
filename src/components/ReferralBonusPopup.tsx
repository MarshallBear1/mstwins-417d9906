import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Share2, Gift, Users, Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReferralBonusPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClaimBonus: () => Promise<{ referralCode: string; referralLink: string } | null>;
  remainingLikes: number;
}

export const ReferralBonusPopup = ({ 
  open, 
  onOpenChange, 
  onClaimBonus, 
  remainingLikes 
}: ReferralBonusPopupProps) => {
  const [referralLink, setReferralLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReferralLink, setShowReferralLink] = useState(false);
  const { toast } = useToast();

  const handleClaimBonus = async () => {
    setLoading(true);
    try {
      const result = await onClaimBonus();
      if (result) {
        setReferralLink(result.referralLink);
        setShowReferralLink(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      toast({
        title: "Link Copied! 📋",
        description: "Your referral link has been copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Please manually copy the link",
        variant: "destructive"
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join MSTwins - MS Support Community',
          text: 'Hey! I found this amazing MS support community. Join me on MSTwins where we connect with others who understand our journey!',
          url: referralLink,
        });
        toast({
          title: "Shared Successfully! 🎉",
          description: "Thanks for spreading the word!",
        });
      } catch (error) {
        // User cancelled sharing or share failed
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state when closing
    setTimeout(() => {
      setShowReferralLink(false);
      setReferralLink('');
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            {showReferralLink ? "Share & Get Bonus Likes! 🎁" : "Out of Likes? Get 5 More! ❤️"}
          </DialogTitle>
          <DialogDescription>
            {showReferralLink 
              ? "Share your referral link to help others discover our community!"
              : `You've used all ${5 - remainingLikes} of your daily likes. Want 5 more?`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!showReferralLink ? (
            <>
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Spread the Love!</h3>
                    <p className="text-sm text-gray-600">Help others discover our supportive community</p>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-500" />
                    <span>Share your referral link with someone</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-green-500" />
                    <span>Get 5 bonus likes for today</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span>Help others find support in our community</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleClaimBonus}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? "Generating..." : "Get My Referral Link"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleClose}
                  className="px-4"
                >
                  Maybe Later
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-800">Bonus Claimed! 🎉</span>
                </div>
                <p className="text-sm text-green-700">
                  You now have 5 additional likes for today. Share this link to help others discover our community!
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Your Referral Link:</label>
                <div className="flex gap-2">
                  <Input 
                    value={referralLink}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={handleCopyLink}
                    title="Copy link"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleShare}
                  className="flex-1"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Link
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleClose}
                  className="px-4"
                >
                  Done
                </Button>
              </div>

              <div className="text-xs text-gray-500 text-center">
                This bonus is available once per day. Tomorrow you'll get a fresh set of 5 likes!
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};