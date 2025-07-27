import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { useToast } from '@/hooks/use-toast';

interface ShareOptions {
  title?: string;
  text?: string;
  url?: string;
  dialogTitle?: string;
}

export const useShare = () => {
  const { toast } = useToast();
  const isSupported = Capacitor.isNativePlatform() || ('share' in navigator);

  const shareContent = async (options: ShareOptions): Promise<boolean> => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Sharing is not supported on this device.",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Use native share if available
      if (Capacitor.isNativePlatform()) {
        await Share.share({
          title: options.title || '',
          text: options.text || '',
          url: options.url || '',
          dialogTitle: options.dialogTitle || 'Share'
        });
        return true;
      }
      
      // Use Web Share API for web browsers
      if ('share' in navigator) {
        await navigator.share({
          title: options.title,
          text: options.text,
          url: options.url
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Share error:', error);
      // Don't show error toast if user cancelled sharing
      if (error instanceof Error && error.name !== 'AbortError') {
        toast({
          title: "Share Failed",
          description: "Could not share content. Please try again.",
          variant: "destructive",
        });
      }
      return false;
    }
  };

  const shareProfile = async (profileName: string, profileId?: string): Promise<boolean> => {
    const appUrl = window.location.origin;
    const profileUrl = profileId ? `${appUrl}/profile/${profileId}` : appUrl;
    
    return shareContent({
      title: 'Check out this profile on MS Dating',
      text: `Meet ${profileName} on MS Dating - the dating app for people with Multiple Sclerosis`,
      url: profileUrl,
      dialogTitle: 'Share Profile'
    });
  };

  const shareApp = async (): Promise<boolean> => {
    const appUrl = window.location.origin;
    
    return shareContent({
      title: 'MS Dating - Dating App for People with Multiple Sclerosis',
      text: 'Join MS Dating, a supportive community where people with Multiple Sclerosis can find meaningful connections and relationships.',
      url: appUrl,
      dialogTitle: 'Share MS Dating'
    });
  };

  const shareMatch = async (matchName: string): Promise<boolean> => {
    return shareContent({
      title: 'Great news!',
      text: `I just matched with ${matchName} on MS Dating! 💕`,
      url: window.location.origin,
      dialogTitle: 'Share Match'
    });
  };

  const shareToSocial = async (platform: 'facebook' | 'twitter' | 'linkedin', options: ShareOptions): Promise<boolean> => {
    if (Capacitor.isNativePlatform()) {
      // Use native sharing which will show platform options
      return shareContent(options);
    }

    // For web, create platform-specific URLs
    const text = encodeURIComponent(options.text || '');
    const url = encodeURIComponent(options.url || window.location.origin);
    
    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
      return true;
    }

    return false;
  };

  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        toast({
          title: "Copied!",
          description: "Content copied to clipboard.",
        });
        return true;
      }
      
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      toast({
        title: "Copied!",
        description: "Content copied to clipboard.",
      });
      return true;
    } catch (error) {
      console.error('Copy error:', error);
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    isSupported,
    shareContent,
    shareProfile,
    shareApp,
    shareMatch,
    shareToSocial,
    copyToClipboard
  };
};