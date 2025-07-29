import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, Mail } from "lucide-react";

type EmailType = "announcement" | "day2" | "patrick";
type SendMode = "preview" | "all";

export const EmailManagement = () => {
  const [emailType, setEmailType] = useState<EmailType>("announcement");
  const [sendMode, setSendMode] = useState<SendMode>("preview");
  const [previewEmail, setPreviewEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const emailTypes = {
    announcement: {
      label: "📢 Announcement Email",
      description: "General announcements to users with referral and feedback links"
    },
    day2: {
      label: "📅 Day 2 Welcome Email", 
      description: "Welcome email sent to users 2 days after registration"
    },
    patrick: {
      label: "💌 Patrick Special Email",
      description: "Personalized email to Patrick (patrickelsner@hotmail.com)"
    }
  };

  const handleSend = async () => {
    // Validation
    if (sendMode === "preview" && !previewEmail) {
      toast.error("Please enter an email address for preview");
      return;
    }

    if (sendMode === "all") {
      const emailTypeName = emailTypes[emailType].label;
      const confirmed = window.confirm(
        `Are you sure you want to send "${emailTypeName}" to ALL users? This action cannot be undone.`
      );
      if (!confirmed) return;
    }

    setIsLoading(true);
    
    try {
      let requestBody: any = {};
      
      switch (emailType) {
        case "announcement":
          requestBody = {
            operation: 'send-announcement-email',
            ...(sendMode === "preview" ? {
              email: previewEmail,
              firstName: 'Preview User',
              referralLink: 'https://mstwins.com/?ref=preview',
              feedbackLink: 'https://mstwins.com/feedback'
            } : {
              sendToAll: true,
              referralLink: 'https://mstwins.com/?ref=announcement',
              feedbackLink: 'https://mstwins.com/feedback'
            })
          };
          break;
          
        case "day2":
          if (sendMode === "preview") {
            requestBody = {
              operation: 'send-day2-email',
              email: 'marshallgould303030@gmail.com',
              firstName: 'Marshall'
            };
          } else {
            requestBody = {
              operation: 'send-day2-all-users'
            };
          }
          break;
          
        case "patrick":
          requestBody = {
            operation: 'send-patrick-feedback-email',
            email: 'patrickelsner@hotmail.com',
            firstName: 'Patrick'
          };
          break;
      }

      const { data, error } = await supabase.functions.invoke('admin-email-operations', {
        body: requestBody
      });

      if (error) throw error;

      const action = sendMode === "preview" ? "Preview email sent" : "Emails sent to all users";
      const stats = data?.stats?.emails_sent ? ` (${data.stats.emails_sent} emails sent)` : "";
      toast.success(`${action} successfully!${stats}`);
      
      // Clear preview email after successful send
      if (sendMode === "preview") {
        setPreviewEmail("");
      }
      
    } catch (error: any) {
      console.error("Error sending email:", error);
      toast.error("Failed to send email: " + (error.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  const isPatrickEmail = emailType === "patrick";
  const showPreviewEmail = sendMode === "preview" && !isPatrickEmail;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Email Management</h2>
        <p className="text-muted-foreground">Simple email sending for user communications</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Email
          </CardTitle>
          <CardDescription>
            Select email type and choose to preview or send to all users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Type Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Email Type</Label>
            <Select value={emailType} onValueChange={(value: EmailType) => setEmailType(value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select email type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(emailTypes).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {emailTypes[emailType].description}
            </p>
          </div>

          {/* Send Mode Selection */}
          {!isPatrickEmail && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Send Mode</Label>
              <RadioGroup value={sendMode} onValueChange={(value: SendMode) => setSendMode(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="preview" id="preview" />
                  <Label htmlFor="preview">Preview - Send to one email for testing</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all">Send to All - Send to all eligible users</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Preview Email Input */}
          {showPreviewEmail && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Preview Email Address</Label>
              <Input
                type="email"
                placeholder="Enter email for preview"
                value={previewEmail}
                onChange={(e) => setPreviewEmail(e.target.value)}
              />
            </div>
          )}

          {/* Special Notice for Day 2 Preview */}
          {emailType === "day2" && sendMode === "preview" && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-amber-800 font-medium text-sm">⚠️ Day 2 Preview Restriction</p>
              <p className="text-amber-700 text-sm">Preview will be sent to marshallgould303030@gmail.com only</p>
            </div>
          )}

          {/* Send Button */}
          <Button 
            onClick={handleSend}
            disabled={isLoading}
            className="w-full h-12"
            size="lg"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                {isPatrickEmail 
                  ? "Send to Patrick" 
                  : sendMode === "preview" 
                    ? "Send Preview" 
                    : "Send to All Users"
                }
              </div>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};