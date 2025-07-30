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
            className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Card - Improved positioning */}
          <div className="fixed top-16 left-1/2 -translate-x-1/2 w-[calc(100vw-1rem)] max-w-sm sm:absolute sm:top-14 sm:right-0 sm:left-auto sm:translate-x-0 sm:w-80 z-[101] mx-auto">
            <Card className="border-0 shadow-2xl bg-white backdrop-blur-xl rounded-2xl overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
              {/* Modern Header */}
              <div className="bg-blue-600 p-4 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-90" />
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
                    className="h-8 w-8 p-0 text-white hover:bg-white/10 rounded-full flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <CardContent className="p-4 space-y-4">
                {/* Native Share Button */}
                {isSupported && (
                  <Button
                    onClick={handleNativeShare}
                    className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Share MSTwins App
                  </Button>
                )}

                {/* Referral Link Section */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 text-sm">Your Referral Link</h4>
                  <div className="flex gap-2">
                    <div className="flex-1 p-3 bg-gray-50 rounded-lg border text-sm text-gray-700 truncate font-mono">
                      {referralLink}
                    </div>
                    <Button
                      onClick={copyReferralLink}
                      variant="outline"
                      size="sm"
                      className="px-3 py-3 border-gray-200 hover:bg-gray-50 flex-shrink-0"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {/* Social Media Section */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 text-sm">Share on Social Media</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {socialLinks.map((social) => (
                      <a
                        key={social.name}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${social.color} text-white rounded-xl p-3 flex flex-col items-center justify-center gap-2 hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg text-xs font-medium min-h-[72px]`}
                        onClick={() => setIsOpen(false)}
                      >
                        <social.icon className="w-5 h-5" />
                        <span>{social.name}</span>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Benefits Section */}
                <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                  <h4 className="font-semibold text-blue-900 text-sm mb-2">Why Refer Friends?</h4>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>• Help others find supportive MS connections</li>
                    <li>• Grow our caring community</li>
                    <li>• Make finding your MSTwin easier</li>
                  </ul>
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