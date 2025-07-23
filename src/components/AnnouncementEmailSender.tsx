import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Mail, Send, Eye } from 'lucide-react';

const AnnouncementEmailSender = () => {
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
      const { data, error } = await supabase.functions.invoke('send-announcement-email', {
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
      "Are you sure you want to send the announcement email to ALL users in the platform? This action cannot be undone."
    );

    if (!confirmed) return;

    setIsSendingAll(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-announcement-email', {
        body: {
          preview_only: false
        }
      });

      if (error) throw error;

      toast({
        title: "Emails Sent! 🎉",
        description: `Announcement email sent to ${data?.stats?.success_count || 0} users successfully`,
      });

      console.log('Email campaign results:', data);
    } catch (error: any) {
      console.error('Error sending emails:', error);
      toast({
        title: "Send Failed",
        description: error.message || "Failed to send announcement emails",
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
          <Mail className="w-5 h-5" />
          Send Announcement Email
        </CardTitle>
        <CardDescription>
          Send a "Day 1 Complete" announcement email to all platform users
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Email Preview Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">📧 Email Preview</h3>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p><strong>Subject:</strong> 🎉 Day 1 Complete - Thank You & New Updates Inside!</p>
              <p className="text-sm text-muted-foreground mt-2">
                A beautiful HTML email thanking users for joining on day one, highlighting new features, 
                and encouraging them to log back in, refer friends, and provide feedback.
              </p>
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
              <h3 className="text-lg font-semibold text-destructive">⚠️ Send to All Users</h3>
              <p className="text-sm text-muted-foreground">
                This will send the announcement email to ALL registered users on the platform.
                Make sure you've tested the preview first!
              </p>
            </div>

            <Button 
              onClick={sendToAllUsers}
              disabled={isSendingAll}
              variant="destructive"
              size="lg"
              className="w-full"
            >
              <Send className="w-4 h-4 mr-2" />
              {isSendingAll ? 'Sending to All Users...' : 'Send to All Users'}
            </Button>
          </div>
        </div>

      </CardContent>
    </Card>
  );
};

export default AnnouncementEmailSender;