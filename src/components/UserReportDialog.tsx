import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
}

interface UserReportDialogProps {
  profile: Profile;
  trigger?: React.ReactNode;
}

const UserReportDialog = ({ profile, trigger }: UserReportDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmitReport = async () => {
    if (!user || !reason.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_reports')
        .insert({
          reporter_id: user.id,
          reported_user_id: profile.user_id,
          reason: reason.trim(),
          description: description.trim() || null,
          status: 'pending'
        });

      if (error) {
        console.error('Error submitting report:', error);
        toast({
          title: "Error",
          description: "Failed to submit report. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Report Submitted",
        description: "Thank you for your report. Our team will review it shortly.",
      });

      setOpen(false);
      setReason("");
      setDescription("");
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const reportReasons = [
    "Inappropriate behavior",
    "Harassment or bullying",
    "Fake profile",
    "Spam or scam",
    "Offensive content",
    "Safety concerns",
    "Other"
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50">
            <AlertTriangle className="w-4 h-4 mr-1" />
            Report User
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span>Report {profile.first_name} {profile.last_name}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Reason for reporting</label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {reportReasons.map((reportReason) => (
                  <SelectItem key={reportReason} value={reportReason}>
                    {reportReason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Additional details (optional)</label>
            <Textarea
              placeholder="Please provide more details about your report..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1"
              rows={4}
            />
          </div>

          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <p className="text-xs text-yellow-800">
              Reports are reviewed by our moderation team. False reports may result in account restrictions.
            </p>
          </div>

          <div className="flex space-x-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReport}
              disabled={!reason.trim() || loading}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {loading ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserReportDialog;