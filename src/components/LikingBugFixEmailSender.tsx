import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Mail, Send, Eye, Bug, Heart } from 'lucide-react';

const LikingBugFixEmailSender = () => {
  const [previewEmail, setPreviewEmail] = useState('');
  const [isPreviewSending, setIsPreviewSending] = useState(false);
  const [isSendingAll, setIsSendingAll] = useState(false);
  const { toast } = useToast();

  const sendPreview = async () => {
    if (!previewEmail) {
      toast({
        title: "Email Required",
        description: "Please enter an email address for the preview",
        variant: "destructive",
      });
      return;
    }

    setIsPreviewSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-liking-bug-fix-email', {
        body: {
          preview_only: true,
          preview_email: previewEmail
        }
      });

      if (error) throw error;

      toast({
        title: "Preview Sent! 📧",
        description: `Preview email sent to ${previewEmail}`,
      });
    } catch (error: any) {
      console.error('Error sending preview:', error);
      toast({
        title: "Preview Failed",
        description: error.message || "Failed to send preview email",
        variant: "destructive",
      });
    } finally {
      setIsPreviewSending(false);
    }
  };

  const sendToAllUsers = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to send the liking bug fix email to ALL users? This action cannot be undone."
    );

    if (!confirmed) return;

    setIsSendingAll(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-liking-bug-fix-email', {
        body: {
          preview_only: false
        }
      });

      if (error) throw error;

      toast({
        title: "Emails Sent! 🎉",
        description: `Bug fix announcement sent to ${data?.stats?.success_count || 0} users successfully`,
      });

      console.log('Email campaign results:', data);
    } catch (error: any) {
      console.error('Error sending emails:', error);
      toast({
        title: "Send Failed",
        description: error.message || "Failed to send bug fix emails",
        variant: "destructive",
      });
    } finally {
      setIsSendingAll(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="w-5 h-5 text-green-600" />
          <Heart className="w-5 h-5 text-red-500" />
          Liking Bug Fix Announcement
        </CardTitle>
        <CardDescription>
          Send professional announcement about the liking bug fix with community appreciation message
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Email Preview Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">📧 Email Preview</h3>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p><strong>From:</strong> MSTwins &lt;team@sharedgenes.org&gt;</p>
              <p><strong>Subject:</strong> 🎉 Bug Fixed! Come Back & Like People - Amazing Community Growth!</p>
              <div className="text-sm text-muted-foreground mt-2 space-y-2">
                <p>• Professional email from MSTwins Robot mascot</p>
                <p>• Announces liking bug is fixed</p>
                <p>• Encourages users to return and like profiles</p>
                <p>• Celebrates building big community in under 2 weeks</p>
                <p>• Requests feedback on features</p>
                <p>• Encourages sharing with others who would benefit</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Enter your email for preview"
              value={previewEmail}
              onChange={(e) => setPreviewEmail(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={sendPreview}
              disabled={isPreviewSending}
              variant="outline"
            >
              <Eye className="w-4 h-4 mr-2" />
              {isPreviewSending ? 'Sending...' : 'Send Preview'}
            </Button>
          </div>
        </div>

        {/* Send to All Section */}
        <div className="border-t pt-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-primary">💌 Send to All Users</h3>
              <p className="text-sm text-muted-foreground">
                This will send the liking bug fix announcement to ALL registered users on MStwins.
                Make sure you've tested the preview first!
              </p>
            </div>

            <Button 
              onClick={sendToAllUsers}
              disabled={isSendingAll}
              variant="default"
              size="lg"
              className="w-full"
            >
              <Send className="w-4 h-4 mr-2" />
              {isSendingAll ? 'Sending to All Users...' : 'Send Bug Fix Announcement to All Users'}
            </Button>
          </div>
        </div>

      </CardContent>
    </Card>
  );
};

export default LikingBugFixEmailSender;