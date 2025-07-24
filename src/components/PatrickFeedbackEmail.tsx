import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send } from "lucide-react";

export const PatrickFeedbackEmail = () => {
  const [isSending, setIsSending] = useState(false);

  const sendEmailToPatrick = async () => {
    setIsSending(true);
    
    try {
      const { error } = await supabase.functions.invoke('send-patrick-feedback-email', {
        body: {
          email: 'patrickelsner@hotmail.com',
          firstName: 'Patrick'
        }
      });

      if (error) {
        throw error;
      }

      toast.success("Email sent to Patrick successfully!");
    } catch (error: any) {
      console.error("Error sending email to Patrick:", error);
      toast.error("Failed to send email: " + error.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="max-w-md">
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
          disabled={isSending}
          className="w-full"
        >
          {isSending ? "Sending..." : "Send Email to Patrick"}
        </Button>
      </CardContent>
    </Card>
  );
};