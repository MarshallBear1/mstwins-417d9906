import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, Mail, Users, Eye, MessageSquare, Heart, Calendar, ChevronDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const EmailManagement = () => {
  // General State
  const [selectedEmailType, setSelectedEmailType] = useState("day2");
  const [previewEmail, setPreviewEmail] = useState("");
  const [isPreviewSending, setIsPreviewSending] = useState(false);
  const [isSendingAll, setIsSendingAll] = useState(false);
  const [isPatrickSending, setIsPatrickSending] = useState(false);

  // Email type configuration
  const emailTypes = {
    day2: {
      label: "Day 2 - Welcome & Engagement",
      description: "Sent to users who joined 2 days ago to encourage engagement",
      icon: Calendar,
      previewOperation: "send-day2-email",
      bulkOperation: "send-day2-all-users",
      restrictedToMarshall: true
    },
    day3: {
      label: "Day 3 - Community Building", 
      description: "Sent to users who joined 3 days ago to build community connections",
      icon: Users,
      previewOperation: "send-day3-email",
      bulkOperation: "send-day3-all-users",
      restrictedToMarshall: false
    },
    day4: {
      label: "Day 4 - Deeper Connections",
      description: "Sent to users who joined 4 days ago to encourage meaningful connections", 
      icon: Heart,
      previewOperation: "send-day4-email",
      bulkOperation: "send-day4-all-users",
      restrictedToMarshall: false
    },
    announcement: {
      label: "General Announcements",
      description: "Send announcements to all registered users",
      icon: Mail,
      previewOperation: "send-announcement-email",
      bulkOperation: "send-announcement-email",
      restrictedToMarshall: false
    }
  };

  const currentEmailType = emailTypes[selectedEmailType];

  // Send preview email
  const sendPreview = async () => {
    const targetEmail = currentEmailType.restrictedToMarshall 
      ? "marshallgould303030@gmail.com" 
      : previewEmail;

    if (!currentEmailType.restrictedToMarshall && !previewEmail) {
      toast.error("Please enter an email address for preview");
      return;
    }

    setIsPreviewSending(true);
    try {
      const params: any = {
        operation: currentEmailType.previewOperation,
        email: targetEmail,
        firstName: currentEmailType.restrictedToMarshall ? 'Marshall' : 'Preview User'
      };

      // Add specific params for announcement emails
      if (selectedEmailType === 'announcement') {
        params.referralLink = 'https://sharedgenes.lovable.app/?ref=preview';
        params.feedbackLink = 'https://sharedgenes.lovable.app/feedback';
      }

      const { error } = await supabase.functions.invoke('admin-email-operations', {
        body: params
      });

      if (error) throw error;
      toast.success(`${currentEmailType.label} preview sent successfully!`);
    } catch (error: any) {
      console.error("Error sending preview:", error);
      toast.error("Failed to send preview: " + error.message);
    } finally {
      setIsPreviewSending(false);
    }
  };

  // Send to all eligible users
  const sendToAll = async () => {
    const isAnnouncement = selectedEmailType === 'announcement';
    const confirmMessage = isAnnouncement
      ? "Are you sure you want to send the announcement email to ALL registered users? This action cannot be undone."
      : `Are you sure you want to send the ${currentEmailType.label} to ALL eligible users? This action cannot be undone.`;
    
    const confirmed = window.confirm(confirmMessage);
    if (!confirmed) return;

    setIsSendingAll(true);
    try {
      const params: any = {
        operation: currentEmailType.bulkOperation
      };

      // Add specific params for announcement emails
      if (isAnnouncement) {
        params.sendToAll = true;
        params.referralLink = 'https://sharedgenes.lovable.app/?ref=announcement';
        params.feedbackLink = 'https://sharedgenes.lovable.app/feedback';
      } else {
        params.sendToAll = true;
      }

      const { data, error } = await supabase.functions.invoke('admin-email-operations', {
        body: params
      });

      if (error) throw error;
      
      const emailCount = data?.stats?.emails_sent || data?.stats?.total_users || 0;
      toast.success(`${currentEmailType.label} sent successfully! ${emailCount} emails sent.`);
    } catch (error: any) {
      console.error("Error sending to all users:", error);
      toast.error("Failed to send to all users: " + error.message);
    } finally {
      setIsSendingAll(false);
    }
  };

  // Patrick Email Function
  const sendEmailToPatrick = async () => {
    setIsPatrickSending(true);
    try {
      const { error } = await supabase.functions.invoke('admin-email-operations', {
        body: {
          operation: 'send-patrick-feedback-email',
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
        <h2 className="text-2xl font-bold mb-2">📧 Email Management Center</h2>
        <p className="text-muted-foreground">Organized email campaigns and user communications</p>
      </div>

      {/* Email Type Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChevronDown className="h-5 w-5" />
            Select Email Campaign Type
          </CardTitle>
          <CardDescription>
            Choose from day-based emails, announcements, or special campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedEmailType} onValueChange={setSelectedEmailType}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select email type" />
            </SelectTrigger>
            <SelectContent className="bg-background border border-border">
              {Object.entries(emailTypes).map(([key, type]) => {
                const IconComponent = type.icon;
                return (
                  <SelectItem key={key} value={key} className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-4 w-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Current Email Type Display */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <currentEmailType.icon className="h-5 w-5" />
            {currentEmailType.label}
          </CardTitle>
          <CardDescription>{currentEmailType.description}</CardDescription>
        </CardHeader>
      </Card>

      {/* Email Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Preview Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Preview Email
            </CardTitle>
            <CardDescription>
              Send a test email to verify content and formatting
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentEmailType.restrictedToMarshall ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-amber-800 font-medium">⚠️ Safety Restriction Active</p>
                <p className="text-amber-700 text-sm">
                  This email type is currently restricted to marshallgould303030@gmail.com only
                </p>
              </div>
            ) : (
              <div>
                <label className="text-sm font-medium mb-2 block">Preview Email Address</label>
                <Input
                  type="email"
                  placeholder="Enter email for preview"
                  value={previewEmail}
                  onChange={(e) => setPreviewEmail(e.target.value)}
                />
              </div>
            )}
            <Button 
              onClick={sendPreview} 
              disabled={isPreviewSending}
              className="w-full"
              variant="outline"
            >
              {isPreviewSending ? "Sending Preview..." : 
                currentEmailType.restrictedToMarshall ? "Send to Marshall" : "Send Preview"}
            </Button>
          </CardContent>
        </Card>

        {/* Send to All Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Send to All Eligible Users
            </CardTitle>
            <CardDescription>
              {selectedEmailType === 'announcement' 
                ? "Send to all registered users" 
                : "Send to users who meet the criteria"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm text-muted-foreground">
              {selectedEmailType === 'announcement' ? (
                <>
                  <p>✓ Includes referral link for user sharing</p>
                  <p>✓ Includes feedback link for user input</p>
                  <p>✓ Personalized with user names</p>
                  <p className="font-medium text-foreground">This will send to ALL registered users!</p>
                </>
              ) : (
                <>
                  <p>✓ Targets users who joined {selectedEmailType.replace('day', '')} days ago</p>
                  <p>✓ Personalized engagement content</p>
                  <p>✓ Prevents duplicate emails with tracking</p>
                  <p>✓ Encourages community participation</p>
                </>
              )}
            </div>
            <Button 
              onClick={sendToAll} 
              disabled={isSendingAll}
              className="w-full"
              variant="default"
            >
              {isSendingAll ? "Sending..." : 
                selectedEmailType === 'announcement' ? "Send to All Users" : "Send to All Eligible Users"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Special Emails Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Special Email Actions
          </CardTitle>
          <CardDescription>
            One-off emails and special communications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {/* Patrick Email */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Send Email to Patrick</h4>
                <p className="text-sm text-muted-foreground">
                  Personalized feedback response to patrickelsner@hotmail.com
                </p>
              </div>
              <Button 
                onClick={sendEmailToPatrick} 
                disabled={isPatrickSending}
                variant="outline"
                size="sm"
              >
                {isPatrickSending ? "Sending..." : "Send to Patrick"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Quick Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">Day 2</div>
              <div className="text-xs text-muted-foreground">Welcome emails</div>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-secondary">Day 3</div>
              <div className="text-xs text-muted-foreground">Community emails</div>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-accent">Day 4</div>
              <div className="text-xs text-muted-foreground">Connection emails</div>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-muted-foreground">More</div>
              <div className="text-xs text-muted-foreground">Coming soon</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};