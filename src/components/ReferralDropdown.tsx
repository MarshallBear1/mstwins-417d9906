import { useState } from "react";
import { Share2, Sparkles, X, Facebook, MessageCircle, Mail, Link, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useShare } from "@/hooks/useShare";
import { useAuth } from "@/hooks/useAuth";

const ReferralDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { shareApp, isSupported, copyToClipboard } = useShare();
  const { user } = useAuth();

  const referralLink = `https://mstwins.com?ref=${user?.id || 'user'}`;
  
  const handleNativeShare = async () => {
    const success = await shareApp();
    if (success) {
      setIsOpen(false);
    }
  };
  
  const socialLinks = [
    {
      name: "Facebook",
      icon: Facebook,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`,
      color: "bg-blue-600 hover:bg-blue-700"
    },
    {
      name: "Reddit",
      icon: MessageCircle,
      url: `https://reddit.com/submit?url=${encodeURIComponent(referralLink)}&title=${encodeURIComponent('Join me on MSTwins - MS Community Support')}`,
      color: "bg-orange-600 hover:bg-orange-700"
    },
    {
      name: "Email",
      icon: Mail,
      url: `mailto:?subject=${encodeURIComponent('Join MSTwins with me!')}&body=${encodeURIComponent(`I found this amazing MS support community and thought you might be interested: ${referralLink}`)}`,
      color: "bg-gray-600 hover:bg-gray-700"
    }
  ];

  const copyReferralLink = async () => {
    const success = await copyToClipboard(referralLink);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Link Copied!",
        description: "Referral link copied to clipboard",
      });
    }
  };

  return (
    <div className="relative">
      {/* Modern Trigger Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 min-h-[44px] min-w-[44px] flex-shrink-0 rounded-full transition-all duration-200 relative"
        title="Refer Friends"
      >
        <Share2 className="w-5 h-5" />
        <span className="sr-only">Refer</span>
        
        {/* Subtle notification dot */}
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
      </Button>

      {/* Modern Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Card */}
          <div className="fixed top-20 left-4 right-4 sm:absolute sm:top-12 sm:right-0 sm:left-auto sm:w-80 max-w-[calc(100vw-2rem)] z-50 transform transition-all duration-300 animate-in slide-in-from-top-2 fade-in">
            <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-xl rounded-2xl overflow-hidden">
              {/* Modern Header */}
              <div className="bg-blue-600 p-4 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-black/5" />
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold">Refer Friends</CardTitle>
                      <p className="text-white/90 text-sm">Grow our MS community</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <CardContent className="p-4 space-y-4">
                {/* Native Share Button for Mobile */}
                {isSupported && (
                  <Button
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                    onClick={handleNativeShare}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share MSTwins App
                  </Button>
                )}
                
                {/* Copy Link Section */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-700">Your Referral Link</label>
                  <div className="flex gap-2">
                    <div className="flex-1 p-3 bg-gray-50 rounded-xl text-sm font-mono text-gray-600 truncate border border-gray-200">
                      {referralLink}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyReferralLink}
                      className="h-12 px-4 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-xl transition-all duration-200"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Social Sharing */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-700">Share on Social Media</label>
                  <div className="grid gap-2">
                    {socialLinks.map((social) => (
                      <Button
                        key={social.name}
                        variant="outline"
                        className="w-full h-12 justify-start gap-3 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition-all duration-200"
                        onClick={() => {
                          window.open(social.url, '_blank', 'noopener,noreferrer');
                          setIsOpen(false);
                        }}
                      >
                        <social.icon className="w-4 h-4" />
                        Share on {social.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Benefits */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-100">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-gray-900">
                    💙 Why Refer Friends?
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Help others find supportive MS connections</li>
                    <li>• Grow our caring community together</li>
                    <li>• Make a difference in someone's journey</li>
                  </ul>
                </div>

                {/* Community Message */}
                <div className="text-center text-xs text-gray-500 pt-2 border-t border-gray-100">
                  🤝 Building connections • 💙 MS support network
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default ReferralDropdown;