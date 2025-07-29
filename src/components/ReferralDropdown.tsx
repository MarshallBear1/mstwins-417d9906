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

  const referralLink = `https://mstwins.com?ref=${user?.id || 'user'}`; // Dynamic based on user ID
  
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
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      {/* Trigger Button with Spark Animation */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative group overflow-hidden hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300"
      >
        <div className="relative z-10 flex items-center gap-2">
          <Share2 className="w-4 h-4" />
          <span className="text-sm font-medium">Refer</span>
        </div>
        
        {/* Spark Animation outside the button */}
        <div className="absolute -inset-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <Sparkles className="absolute -top-2 -right-2 w-3 h-3 text-yellow-400 animate-pulse" />
          <Sparkles className="absolute -bottom-2 -left-2 w-2 h-2 text-blue-400 animate-pulse delay-100" />
          <Sparkles className="absolute top-1/2 -left-3 w-2 h-2 text-purple-400 animate-pulse delay-200" />
          <Sparkles className="absolute -top-2 left-1/2 w-2 h-2 text-pink-400 animate-pulse delay-300" />
          <Sparkles className="absolute top-1/2 -right-3 w-2 h-2 text-orange-400 animate-pulse delay-400" />
          <Sparkles className="absolute -bottom-2 right-1/4 w-2 h-2 text-green-400 animate-pulse delay-500" />
        </div>
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-black/20" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Card */}
          <Card className="fixed top-16 left-1/2 -translate-x-1/2 sm:absolute sm:top-12 sm:left-auto sm:right-0 sm:translate-x-0 w-80 max-w-[calc(100vw-2rem)] z-50 shadow-xl border-0 bg-background/95 backdrop-blur-md animate-scale-in">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Share2 className="w-5 h-5 text-primary" />
                  <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-yellow-400 animate-pulse" />
                </div>
                <CardTitle className="text-lg">Refer Friends</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            
            <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
              {/* Native Share Button for Mobile */}
              {isSupported && (
                <div className="space-y-2">
                  <Button
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    onClick={handleNativeShare}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share MSTwins App
                  </Button>
                </div>
              )}
              
              {/* Description */}
              <div className="text-sm text-muted-foreground">
                <p className="mb-2">Help grow our MS support community! 💙</p>
                <p>Share MS<span className="text-blue-600">Twins</span> with friends who could benefit from connecting with others on similar journeys.</p>
              </div>

              {/* Copy Link Section */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Referral Link</label>
                <div className="flex gap-2">
                  <div className="flex-1 p-2 bg-muted rounded-md text-sm font-mono text-muted-foreground truncate text-center">
                    {referralLink}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyReferralLink}
                    className="flex-shrink-0"
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
                <label className="text-sm font-medium">Share on Social Media</label>
                <div className="grid gap-2">
                  {socialLinks.map((social) => (
                    <Button
                      key={social.name}
                      variant="outline"
                      className={`w-full justify-start gap-3 hover:text-white transition-colors ${social.color.replace('bg-', 'hover:bg-').replace('hover:bg-', 'hover:bg-')}`}
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
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg border">
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                  Why Refer?
                </h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Help others find supportive MS connections</li>
                  <li>• Grow our caring community together</li>
                  <li>• Make a difference in someone's journey</li>
                </ul>
              </div>

              {/* Community Message */}
              <div className="text-center text-xs text-muted-foreground pt-2 border-t">
                🤝 Building connections • 💙 MS support network
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ReferralDropdown;