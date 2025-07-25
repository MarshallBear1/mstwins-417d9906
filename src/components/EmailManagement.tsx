import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, Mail, Users, Eye, MessageSquare, Heart, Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const EmailManagement = () => {
  // Announcement Email State
  const [previewEmail, setPreviewEmail] = useState("");
  const [isPreviewSending, setIsPreviewSending] = useState(false);
  const [isSendingAll, setIsSendingAll] = useState(false);

  // Day 2 Email State  
  const [day2PreviewEmail, setDay2PreviewEmail] = useState("");
  const [isDay2PreviewSending, setIsDay2PreviewSending] = useState(false);
  const [isDay2SendingAll, setIsDay2SendingAll] = useState(false);

  // Patrick Email State
  const [isPatrickSending, setIsPatrickSending] = useState(false);

  // Announcement Email Functions
  const sendAnnouncementPreview = async () => {
    if (!previewEmail) {
      toast.error("Please enter an email address for preview");
      return;
    }

    setIsPreviewSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-announcement-email', {
        body: {
          email: previewEmail,
          firstName: 'Preview User',
          referralLink: 'https://sharedgenes.lovable.app/?ref=preview',
          feedbackLink: 'https://sharedgenes.lovable.app/feedback'
        }
      });

      if (error) throw error;
      toast.success("Preview email sent successfully!");
    } catch (error: any) {
      console.error("Error sending preview:", error);
      toast.error("Failed to send preview: " + error.message);
    } finally {
      setIsPreviewSending(false);
    }
  };

  const sendAnnouncementToAll = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to send the announcement email to ALL registered users? This action cannot be undone."
    );
    
    if (!confirmed) return;

    setIsSendingAll(true);
    try {
      const { error } = await supabase.functions.invoke('send-announcement-email', {
        body: {
          sendToAll: true,
          referralLink: 'https://sharedgenes.lovable.app/?ref=announcement',
          feedbackLink: 'https://sharedgenes.lovable.app/feedback'
        }
      });

      if (error) throw error;
      toast.success("Announcement email queued for all users!");
    } catch (error: any) {
      console.error("Error sending to all users:", error);
      toast.error("Failed to send to all users: " + error.message);
    } finally {
      setIsSendingAll(false);
    }
  };

  // Day 2 Email Functions
  const sendDay2Preview = async () => {
    const targetEmail = "marshallgould303030@gmail.com";
    
    console.log("RESTRICTION: Only sending Day 2 emails to marshallgould303030@gmail.com");

    setIsDay2PreviewSending(true);
    try {
      console.log("Attempting to send Day 2 email to:", targetEmail);
      
      const { data, error } = await supabase.functions.invoke('send-day2-email', {
        body: {
          email: targetEmail,
          firstName: 'Marshall'
        }
      });

      console.log("Day 2 email response:", { data, error });

      if (error) {
        console.error("Day 2 email error details:", error);
        throw error;
      }
      
      toast.success(`Day 2 email sent successfully to ${targetEmail}!`);
    } catch (error: any) {
      console.error("Error sending Day 2 email:", error);
      toast.error("Failed to send Day 2 email: " + (error.message || "Unknown error"));
    } finally {
      setIsDay2PreviewSending(false);
    }
  };

  const sendDay2ToAll = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to send the Day 2 email to ALL eligible users? This action cannot be undone."
    );
    
    if (!confirmed) return;

    setIsDay2SendingAll(true);
    try {
      // This would need a backend function to send to all eligible users
      // For now, we'll show a message that this feature needs implementation
      toast.info("Day 2 email to all users feature needs backend implementation");
    } catch (error: any) {
      console.error("Error sending Day 2 to all users:", error);
      toast.error("Failed to send Day 2 to all users: " + error.message);
    } finally {
      setIsDay2SendingAll(false);
    }
  };

  // Patrick Email Function
  const sendEmailToPatrick = async () => {
    setIsPatrickSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-patrick-feedback-email', {
        body: {
          email: 'patrickelsner@hotmail.com',
          firstName: 'Patrick'
        }
      });

      if (error) throw error;
      toast.success("Email sent to Patrick successfully!");
    } catch (error: any) {
      console.error("Error sending email to Patrick:", error);
      toast.error("Failed to send email: " + error.message);
    } finally {
      setIsPatrickSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Email Management Center</h2>
        <p className="text-muted-foreground">Send announcements, Day 2 emails, and manage user communications</p>
      </div>

      <Tabs defaultValue="announcements" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="announcements" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Announcements
          </TabsTrigger>
          <TabsTrigger value="day2" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Day 2 Emails
          </TabsTrigger>
          <TabsTrigger value="special" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Special Emails
          </TabsTrigger>
        </TabsList>

        <TabsContent value="announcements" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Preview Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Preview Announcement
                </CardTitle>
                <CardDescription>
                  Send a test announcement email to verify content and formatting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Preview Email Address</label>
                  <Input
                    type="email"
                    placeholder="Enter email for preview"
                    value={previewEmail}
                    onChange={(e) => setPreviewEmail(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={sendAnnouncementPreview} 
                  disabled={isPreviewSending}
                  className="w-full"
                  variant="outline"
                >
                  {isPreviewSending ? "Sending Preview..." : "Send Preview"}
                </Button>
              </CardContent>
            </Card>

            {/* Send to All Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Send to All Users
                </CardTitle>
                <CardDescription>
                  Send announcement email to all registered users with referral and feedback links
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>✓ Includes referral link for user sharing</p>
                  <p>✓ Includes feedback link for user input</p>
                  <p>✓ Personalized with user names</p>
                  <p className="font-medium text-foreground">This will send to ALL registered users!</p>
                </div>
                <Button 
                  onClick={sendAnnouncementToAll} 
                  disabled={isSendingAll}
                  className="w-full"
                  variant="default"
                >
                  {isSendingAll ? "Sending to All Users..." : "Send to All Users"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="day2" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Day 2 Preview Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Preview Day 2 Email
                </CardTitle>
                <CardDescription>
                  Test the Day 2 welcome/engagement email before sending to users
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-amber-800 font-medium">⚠️ Safety Restriction Active</p>
                    <p className="text-amber-700 text-sm">Day 2 emails are currently restricted to marshallgould303030@gmail.com only</p>
                  </div>
                </div>
                <Button 
                  onClick={sendDay2Preview} 
                  disabled={isDay2PreviewSending}
                  className="w-full"
                  variant="outline"
                >
                  {isDay2PreviewSending ? "Sending to Marshall..." : "Send Day 2 Email to Marshall"}
                </Button>
              </CardContent>
            </Card>

            {/* Day 2 Send to All Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Send Day 2 to Eligible Users
                </CardTitle>
                <CardDescription>
                  Send Day 2 engagement email to users who registered 2 days ago
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>✓ Targets users who joined 2 days ago</p>
                  <p>✓ Personalized welcome content</p>
                  <p>✓ Encourages community engagement</p>
                  <p className="font-medium text-amber-600">Feature requires backend implementation</p>
                </div>
                <Button 
                  onClick={sendDay2ToAll} 
                  disabled={isDay2SendingAll}
                  className="w-full"
                  variant="secondary"
                >
                  {isDay2SendingAll ? "Processing..." : "Send Day 2 to Eligible Users"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="special" className="mt-6">
          <div className="grid gap-6">
            {/* Patrick Email Section */}
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Send Email to Patrick
                </CardTitle>
                <CardDescription>
                  Send personalized feedback response and password reset confirmation to patrickelsner@hotmail.com
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={sendEmailToPatrick} 
                  disabled={isPatrickSending}
                  className="w-full"
                >
                  {isPatrickSending ? "Sending..." : "Send Email to Patrick"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};