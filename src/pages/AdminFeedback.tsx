import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Mail, MessageSquare, Clock, User } from "lucide-react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AnnouncementEmailSender from "@/components/AnnouncementEmailSender";
import { PatrickFeedbackEmail } from "@/components/PatrickFeedbackEmail";

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
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    // Check if user is already authenticated via localStorage
    const isAuth = localStorage.getItem('admin_authenticated') === 'true';
    setIsAuthenticated(isAuth);
    if (isAuth) {
      fetchFeedback();
    } else {
      setLoading(false);
    }
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = "SharedGenes2025";
    
    if (passwordInput === correctPassword) {
      setIsAuthenticated(true);
      localStorage.setItem('admin_authenticated', 'true');
      setPasswordError("");
      fetchFeedback();
    } else {
      setPasswordError("Incorrect password");
      setPasswordInput("");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('admin_authenticated');
    setPasswordInput("");
    setPasswordError("");
  };

  const fetchFeedback = async () => {
    try {
      const { data, error } = await supabase
        .from("feedback")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFeedback(data || []);
    } catch (error) {
      console.error("Error fetching feedback:", error);
      toast({
        title: "Error",
        description: "Failed to load feedback",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFeedbackStatus = async (id: string, status: string, notes?: string) => {
    try {
      const updateData: any = { status };
      if (notes !== undefined) {
        updateData.admin_notes = notes;
      }

      const { error } = await supabase
        .from("feedback")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      setFeedback(prev => 
        prev.map(item => 
          item.id === id 
            ? { ...item, status, admin_notes: notes || item.admin_notes }
            : item
        )
      );

      if (selectedFeedback?.id === id) {
        setSelectedFeedback(prev => prev ? { ...prev, status, admin_notes: notes || prev.admin_notes } : null);
      }

      toast({
        title: "Updated",
        description: "Feedback status updated successfully",
      });
    } catch (error) {
      console.error("Error updating feedback:", error);
      toast({
        title: "Error",
        description: "Failed to update feedback",
        variant: "destructive",
      });
    }
  };

  const filteredFeedback = feedback.filter(item => 
    statusFilter === "all" || item.status === statusFilter
  );

  // Show password form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin Access Required</CardTitle>
            <CardDescription>
              Please enter the admin password to access the feedback management system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <Input
                  type="password"
                  placeholder="Enter admin password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className={passwordError ? "border-destructive" : ""}
                />
                {passwordError && (
                  <p className="text-sm text-destructive mt-1">{passwordError}</p>
                )}
              </div>
              <Button type="submit" className="w-full">
                Access Admin Panel
              </Button>
              <Button type="button" variant="outline" className="w-full" asChild>
                <Link to="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to App
                </Link>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" asChild>
                <Link to="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to App
                </Link>
              </Button>
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
                            <strong>Email:</strong> {selectedFeedback.email}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="flex items-center justify-center h-48">
                      <div className="text-center">
                        <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Select feedback to view details</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="emails" className="mt-6">
            <div className="space-y-6">
              <PatrickFeedbackEmail />
              <AnnouncementEmailSender />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}