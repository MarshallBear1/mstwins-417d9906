import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, Mail, Users, Eye, Heart, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
export const EmailManagement = () => {
  const [selectedEmailType, setSelectedEmailType] = useState("day3");
  const [previewEmail, setPreviewEmail] = useState("");
  const [isPreviewSending, setIsPreviewSending] = useState(false);
  const [isSendingAll, setIsSendingAll] = useState(false);
  const emailTypes = {
    day2: {
      label: "Day 2 Email",
      description: "Welcome & engagement email for new users",
      icon: Calendar,
      previewOperation: "send-day2-email",
      bulkOperation: "send-day2-all-users"
    },
    day3: {
      label: "Day 3 Email",
      description: "Community building email",
      icon: Users,
      previewOperation: "send-day3-email",
      bulkOperation: "send-day3-all-users"
    },
    day4: {
      label: "Day 4 Email",
      description: "Send to ALL users (regardless of join date)",
      icon: Heart,
      previewOperation: "send-day4-email",
      bulkOperation: "send-day4-all-users"
    },
    announcement: {
      label: "Announcement Email",
      description: "General announcements to all users",
      icon: Mail,
      previewOperation: "send-announcement-email",
      bulkOperation: "send-announcement-email"
    }
  };
  const currentEmailType = emailTypes[selectedEmailType];
  const sendPreview = async () => {
    if (!previewEmail) {
      toast.error("Please enter an email address for preview");
      return;
    }
    setIsPreviewSending(true);
    try {
      const params: any = {
        operation: currentEmailType.previewOperation,
        email: previewEmail,
        firstName: 'Preview User'
      };
      if (selectedEmailType === 'announcement') {
        params.referralLink = 'https://sharedgenes.lovable.app/?ref=preview';
        params.feedbackLink = 'https://sharedgenes.lovable.app/feedback';
      }
      const {
        error
      } = await supabase.functions.invoke('admin-email-operations', {
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
  const sendToAll = async () => {
    const confirmMessage = `Are you sure you want to send the ${currentEmailType.label} to all eligible users? This action cannot be undone.`;
    if (!window.confirm(confirmMessage)) return;
    setIsSendingAll(true);
    try {
      const params: any = {
        operation: currentEmailType.bulkOperation,
        sendToAll: true
      };
      if (selectedEmailType === 'announcement') {
        params.referralLink = 'https://sharedgenes.lovable.app/?ref=announcement';
        params.feedbackLink = 'https://sharedgenes.lovable.app/feedback';
      }
      const {
        data,
        error
      } = await supabase.functions.invoke('admin-email-operations', {
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
  return <div className="space-y-6">
      <div className="text-center mb-6">
        
        
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email Campaign</CardTitle>
          <CardDescription>Select an email type and choose how to send it</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Type Selector */}
          <div>
            <label className="text-sm font-medium mb-2 block">Email Type</label>
            <Select value={selectedEmailType} onValueChange={setSelectedEmailType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select email type" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                {Object.entries(emailTypes).map(([key, type]) => {
                const IconComponent = type.icon;
                return <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>;
              })}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-1">
              {currentEmailType.description}
            </p>
          </div>

          {/* Send Options */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Preview */}
            <div className="space-y-3">
              <h3 className="font-medium flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Send Preview
              </h3>
              <Input type="email" placeholder="Enter email for preview" value={previewEmail} onChange={e => setPreviewEmail(e.target.value)} />
              <Button onClick={sendPreview} disabled={isPreviewSending} className="w-full" variant="outline">
                {isPreviewSending ? "Sending..." : "Send Preview"}
              </Button>
            </div>

            {/* Send to All */}
            <div className="space-y-3">
              <h3 className="font-medium flex items-center gap-2">
                <Send className="h-4 w-4" />
                Send to All
              </h3>
              <p className="text-sm text-muted-foreground">
                {selectedEmailType === 'announcement' || selectedEmailType === 'day4' ? "Send to all registered users" : `Send to users who joined ${selectedEmailType.replace('day', '')} days ago`}
              </p>
              <Button onClick={sendToAll} disabled={isSendingAll} className="w-full">
                {isSendingAll ? "Sending..." : "Send to All"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>;
};