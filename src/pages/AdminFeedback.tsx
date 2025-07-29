import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, MessageSquare, User, Calendar, AlertCircle, CheckCircle, Clock, XCircle, Mail, LogOut, Shield } from "lucide-react";
import { EmailManagement } from "@/components/EmailManagement";
// Removed useAdminAuth import - using simple password auth now
import { AdminLogin } from "@/components/AdminLogin";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface Feedback {
  id: string;
  user_id: string | null;
  type: string;
  subject: string;
  message: string;
  email: string | null;
  priority: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

const priorityColors = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-accent text-accent-foreground",
  high: "bg-destructive/10 text-destructive",
  urgent: "bg-destructive text-destructive-foreground",
};

const statusColors = {
  open: "bg-accent text-accent-foreground",
  in_progress: "bg-primary/10 text-primary",
  resolved: "bg-success/10 text-success",
  closed: "bg-muted text-muted-foreground",
};

const typeColors = {
  bug: "bg-destructive/10 text-destructive",
  feature: "bg-primary/10 text-primary",
  improvement: "bg-accent text-accent-foreground",
  general: "bg-muted text-muted-foreground",
  support: "bg-success/10 text-success",
};

export default function AdminFeedback() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    // Check if user is authenticated with simple password
    const isAuth = sessionStorage.getItem('admin_authenticated') === 'true';
    setIsAdminAuthenticated(isAuth);
    setAdminLoading(false);
    
    if (isAuth) {
      fetchFeedback();
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('admin_authenticated');
    setIsAdminAuthenticated(false);
    window.location.href = '/admin/feedback';
  };

  const fetchFeedback = async () => {
    try {
      const { data, error } = await supabase.rpc('get_feedback_admin');

      if (error) throw error;
      setFeedback(data || []);
    } catch (error: any) {
      console.error("Error fetching feedback:", error);
      toast.error("Failed to fetch feedback: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateFeedbackStatus = async (id: string, status: string, notes?: string) => {
    try {
      const { error } = await supabase.rpc('update_feedback_admin', {
        feedback_id: id,
        new_status: status,
        new_admin_notes: notes
      });

      if (error) throw error;

      setFeedback(prev => prev.map(item => 
        item.id === id 
          ? { ...item, status, admin_notes: notes || item.admin_notes, updated_at: new Date().toISOString() }
          : item
      ));
      
      setSelectedFeedback(prev => prev ? { ...prev, status, admin_notes: notes || prev.admin_notes } : null);
      toast.success("Feedback updated successfully");
    } catch (error: any) {
      console.error("Error updating feedback:", error);
      toast.error("Failed to update feedback: " + error.message);
    }
  };

  const handleSendDay3Email = async (sendToAll = false) => {
    try {
      const action = sendToAll ? 'all users' : 'test email only';
      console.log(`🚀 Triggering day 3 email function for ${action}...`);
      
      const { data, error } = await supabase.functions.invoke('admin-email-operations', {
        body: { 
          operation: 'send-day3-all-users',
          sendToAll 
        }
      });

      if (error) {
        console.error('❌ Error calling day 3 email function:', error);
        toast.error(`Failed to trigger day 3 emails: ${error.message}`);
        return;
      }

      console.log('✅ Day 3 email function completed:', data);
      toast.success(`Successfully triggered day 3 emails for ${action}. Check function logs for details.`);
    } catch (error: any) {
      console.error('❌ Unexpected error:', error);
      toast.error(`Unexpected error: ${error.message}`);
    }
  };

  const handleSendTestEmail = async () => {
    try {
      console.log('🧪 Sending test day 3 email...');
      
      const { data, error } = await supabase.functions.invoke('admin-email-operations', {
        body: {
          operation: 'send-day3-email',
          email: "marshallgould303030@gmail.com",
          first_name: "Marshall",
        }
      });

      if (error) {
        console.error('❌ Error sending test email:', error);
        toast.error(`Failed to send test email: ${error.message}`);
        return;
      }

      console.log('✅ Test email sent successfully:', data);
      toast.success("Test day 3 email sent successfully to marshallgould303030@gmail.com");
    } catch (error: any) {
      console.error('❌ Unexpected error:', error);
      toast.error(`Unexpected error: ${error.message}`);
    }
  };

  const filteredFeedback = feedback.filter(item => 
    statusFilter === "all" || item.status === statusFilter
  );

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Show admin login if not authenticated
  if (!isAdminAuthenticated) {
    return <AdminLogin />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to App
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/admin/moderation">
                    <Shield className="h-4 w-4 mr-2" />
                    Moderation
                  </Link>
                </Button>
              </div>
              <div>
                <h1 className="text-2xl font-bold">Feedback Management</h1>
                <p className="text-muted-foreground">Review and manage user feedback</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <Tabs defaultValue="feedback" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="feedback">Feedback Management</TabsTrigger>
            <TabsTrigger value="emails">Send Emails</TabsTrigger>
          </TabsList>
          
          <TabsContent value="feedback" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Feedback List */}
              <div className="lg:col-span-2 space-y-4">
                {filteredFeedback.length === 0 ? (
                  <Card>
                    <CardContent className="flex items-center justify-center h-32">
                      <p className="text-muted-foreground">No feedback found</p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredFeedback.map((item) => (
                    <Card 
                      key={item.id} 
                      className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                        selectedFeedback?.id === item.id ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() => {
                        setSelectedFeedback(item);
                        setAdminNotes(item.admin_notes || "");
                      }}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-base">{item.subject}</CardTitle>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className={typeColors[item.type as keyof typeof typeColors]}>
                                {item.type}
                              </Badge>
                              <Badge variant="outline" className={priorityColors[item.priority as keyof typeof priorityColors]}>
                                {item.priority}
                              </Badge>
                              <Badge variant="outline" className={statusColors[item.status as keyof typeof statusColors]}>
                                {item.status.replace("_", " ")}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.message}
                        </p>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t">
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            {item.user_id && (
                              <div className="flex items-center space-x-1">
                                <User className="h-3 w-3" />
                                <span>User</span>
                              </div>
                            )}
                            {item.email && (
                              <div className="flex items-center space-x-1">
                                <Mail className="h-3 w-3" />
                                <span>{item.email}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Feedback Detail */}
              <div className="lg:col-span-1">
                {selectedFeedback ? (
                  <Card className="sticky top-6">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <MessageSquare className="h-5 w-5" />
                        <span>Feedback Details</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Subject</h4>
                        <p className="text-sm">{selectedFeedback.subject}</p>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Message</h4>
                        <p className="text-sm whitespace-pre-wrap">{selectedFeedback.message}</p>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Status</h4>
                        <Select 
                          value={selectedFeedback.status} 
                          onValueChange={(value) => updateFeedbackStatus(selectedFeedback.id, value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Admin Notes</h4>
                        <Textarea
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          placeholder="Add internal notes about this feedback..."
                          className="min-h-[100px]"
                        />
                        <Button
                          size="sm"
                          className="mt-2 w-full"
                          onClick={() => updateFeedbackStatus(selectedFeedback.id, selectedFeedback.status, adminNotes)}
                        >
                          Save Notes
                        </Button>
                      </div>

                      <div className="pt-4 border-t space-y-2 text-sm text-muted-foreground">
                        <div>
                          <strong>Created:</strong> {new Date(selectedFeedback.created_at).toLocaleString()}
                        </div>
                        <div>
                          <strong>Priority:</strong> {selectedFeedback.priority}
                        </div>
                        <div>
                          <strong>Type:</strong> {selectedFeedback.type}
                        </div>
                        {selectedFeedback.email && (
                          <div>
                            <strong>Contact:</strong> {selectedFeedback.email}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="sticky top-6">
                    <CardContent className="flex items-center justify-center h-32">
                      <p className="text-muted-foreground">Select feedback to view details</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="emails" className="mt-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Mail className="h-5 w-5" />
                    <span>Day 3 Email Campaign</span>
                  </CardTitle>
                  <CardDescription>
                    Send day 3 re-engagement emails to users. Test first, then send to all eligible users.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button onClick={handleSendTestEmail} variant="outline">
                      Send Test Email
                    </Button>
                    <Button onClick={() => handleSendDay3Email(false)} variant="outline">
                      Send to Test Group
                    </Button>
                    <Button onClick={() => handleSendDay3Email(true)} variant="default">
                      Send to All Users
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <EmailManagement />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};