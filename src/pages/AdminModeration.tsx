import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Loader2, 
  AlertTriangle, 
  Shield, 
  Eye, 
  Ban, 
  CheckCircle, 
  XCircle, 
  ArrowLeft,
  LogOut,
  User,
  Calendar,
  MessageSquare
} from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { SecureAdminLogin } from "@/components/SecureAdminLogin";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";

interface ModerationFlag {
  id: string;
  user_id: string;
  content_type: string;
  content_text: string;
  content_id: string | null;
  is_flagged: boolean;
  confidence_score: number | null;
  status: string;
  flagged_categories: string[];
  moderation_result: any;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

interface UserReport {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  reason: string;
  description: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  resolved: "bg-blue-100 text-blue-800",
  under_review: "bg-orange-100 text-orange-800",
};

const severityColors = {
  high: "bg-red-100 text-red-800",
  medium: "bg-yellow-100 text-yellow-800", 
  low: "bg-green-100 text-green-800",
};

export default function AdminModeration() {
  const { isAdminAuthenticated, adminLoading, revokeAdminSession } = useAdminAuth();
  const [moderationFlags, setModerationFlags] = useState<ModerationFlag[]>([]);
  const [userReports, setUserReports] = useState<UserReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFlag, setSelectedFlag] = useState<ModerationFlag | null>(null);
  const [selectedReport, setSelectedReport] = useState<UserReport | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    if (isAdminAuthenticated) {
      fetchModerationData();
    } else {
      setLoading(false);
    }
  }, [isAdminAuthenticated]);

  const handleLogout = async () => {
    await revokeAdminSession();
    window.location.href = '/admin/moderation';
  };

  const fetchModerationData = async () => {
    try {
      // Fetch moderation flags
      const { data: flagsData, error: flagsError } = await supabase
        .from('moderation_flags')
        .select('*')
        .order('created_at', { ascending: false });

      if (flagsError) throw flagsError;

      // Fetch user reports
      const { data: reportsData, error: reportsError } = await supabase
        .from('user_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (reportsError) throw reportsError;

      setModerationFlags(flagsData || []);
      setUserReports(reportsData || []);
    } catch (error: any) {
      console.error("Error fetching moderation data:", error);
      toast.error("Failed to fetch moderation data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateFlagStatus = async (flagId: string, newStatus: string, notes?: string) => {
    try {
      const { error } = await supabase
        .from('moderation_flags')
        .update({
          status: newStatus,
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', flagId);

      if (error) throw error;

      setModerationFlags(prev => prev.map(flag => 
        flag.id === flagId 
          ? { ...flag, status: newStatus, reviewed_at: new Date().toISOString() }
          : flag
      ));

      setSelectedFlag(prev => prev ? { ...prev, status: newStatus } : null);
      toast.success("Moderation flag updated successfully");
    } catch (error: any) {
      console.error("Error updating flag:", error);
      toast.error("Failed to update flag: " + error.message);
    }
  };

  const updateReportStatus = async (reportId: string, newStatus: string, notes?: string) => {
    try {
      const { error } = await supabase
        .from('user_reports')
        .update({
          status: newStatus,
          admin_notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (error) throw error;

      setUserReports(prev => prev.map(report => 
        report.id === reportId 
          ? { ...report, status: newStatus, admin_notes: notes || report.admin_notes }
          : report
      ));

      setSelectedReport(prev => prev ? { ...prev, status: newStatus, admin_notes: notes || prev.admin_notes } : null);
      toast.success("User report updated successfully");
    } catch (error: any) {
      console.error("Error updating report:", error);
      toast.error("Failed to update report: " + error.message);
    }
  };

  const getSeverity = (flag: ModerationFlag) => {
    if (flag.confidence_score && flag.confidence_score > 0.8) return "high";
    if (flag.confidence_score && flag.confidence_score > 0.5) return "medium";
    return "low";
  };

  const filteredFlags = moderationFlags.filter(flag => 
    filterStatus === "all" || flag.status === filterStatus
  );

  const filteredReports = userReports.filter(report =>
    filterStatus === "all" || report.status === filterStatus
  );

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAdminAuthenticated) {
    return <SecureAdminLogin />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin/feedback">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Feedback
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center space-x-2">
                  <Shield className="h-6 w-6" />
                  <span>Moderation Dashboard</span>
                </h1>
                <p className="text-muted-foreground">Review and manage content moderation</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
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
        <Tabs defaultValue="flags" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="flags">Moderation Flags</TabsTrigger>
            <TabsTrigger value="reports">User Reports</TabsTrigger>
          </TabsList>
          
          <TabsContent value="flags" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Flags List */}
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5" />
                      <span>Content Flags ({filteredFlags.length})</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {filteredFlags.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No moderation flags found</p>
                    ) : (
                      <div className="space-y-3">
                        {filteredFlags.map((flag) => (
                          <Card 
                            key={flag.id}
                            className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                              selectedFlag?.id === flag.id ? "ring-2 ring-primary" : ""
                            }`}
                            onClick={() => {
                              setSelectedFlag(flag);
                              setAdminNotes("");
                            }}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="space-y-2 flex-1">
                                  <div className="flex items-center space-x-2">
                                    <Badge className={statusColors[flag.status as keyof typeof statusColors]}>
                                      {flag.status.replace("_", " ")}
                                    </Badge>
                                    <Badge className={severityColors[getSeverity(flag)]}>
                                      {getSeverity(flag)} severity
                                    </Badge>
                                    <Badge variant="outline">
                                      {flag.content_type}
                                    </Badge>
                                  </div>
                                  <p className="text-sm line-clamp-2">{flag.content_text}</p>
                                  {flag.flagged_categories.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {flag.flagged_categories.map((category, index) => (
                                        <Badge key={index} variant="destructive" className="text-xs">
                                          {category}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {formatDistanceToNow(new Date(flag.created_at), { addSuffix: true })}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Flag Detail */}
              <div className="lg:col-span-1">
                {selectedFlag ? (
                  <Card className="sticky top-6">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5" />
                        <span>Flag Details</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Content</h4>
                        <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded">
                          {selectedFlag.content_text}
                        </p>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Status</h4>
                        <Select 
                          value={selectedFlag.status} 
                          onValueChange={(value) => updateFlagStatus(selectedFlag.id, value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="under_review">Under Review</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Confidence Score:</span>
                          <span className="text-sm">{selectedFlag.confidence_score?.toFixed(2) || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Content Type:</span>
                          <span className="text-sm">{selectedFlag.content_type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Created:</span>
                          <span className="text-sm">{new Date(selectedFlag.created_at).toLocaleString()}</span>
                        </div>
                      </div>

                      {selectedFlag.flagged_categories.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Flagged Categories</h4>
                          <div className="flex flex-wrap gap-1">
                            {selectedFlag.flagged_categories.map((category, index) => (
                              <Badge key={index} variant="destructive" className="text-xs">
                                {category}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="default"
                          className="flex-1"
                          onClick={() => updateFlagStatus(selectedFlag.id, 'approved')}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1"
                          onClick={() => updateFlagStatus(selectedFlag.id, 'rejected')}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="sticky top-6">
                    <CardContent className="flex items-center justify-center h-32">
                      <p className="text-muted-foreground">Select a flag to view details</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Reports List */}
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="h-5 w-5" />
                      <span>User Reports ({filteredReports.length})</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {filteredReports.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No user reports found</p>
                    ) : (
                      <div className="space-y-3">
                        {filteredReports.map((report) => (
                          <Card 
                            key={report.id}
                            className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                              selectedReport?.id === report.id ? "ring-2 ring-primary" : ""
                            }`}
                            onClick={() => {
                              setSelectedReport(report);
                              setAdminNotes(report.admin_notes || "");
                            }}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="space-y-2 flex-1">
                                  <div className="flex items-center space-x-2">
                                    <Badge className={statusColors[report.status as keyof typeof statusColors]}>
                                      {report.status.replace("_", " ")}
                                    </Badge>
                                    <Badge variant="outline">
                                      {report.reason}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    Report: {report.description || "No description provided"}
                                  </p>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Report Detail */}
              <div className="lg:col-span-1">
                {selectedReport ? (
                  <Card className="sticky top-6">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <User className="h-5 w-5" />
                        <span>Report Details</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Reason</h4>
                        <p className="text-sm">{selectedReport.reason}</p>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Description</h4>
                        <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded">
                          {selectedReport.description || "No description provided"}
                        </p>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Status</h4>
                        <Select 
                          value={selectedReport.status} 
                          onValueChange={(value) => updateReportStatus(selectedReport.id, value, adminNotes)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="under_review">Under Review</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Admin Notes</h4>
                        <Textarea
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          placeholder="Add notes about this report..."
                          className="min-h-[100px]"
                        />
                        <Button
                          size="sm"
                          className="mt-2 w-full"
                          onClick={() => updateReportStatus(selectedReport.id, selectedReport.status, adminNotes)}
                        >
                          Save Notes
                        </Button>
                      </div>

                      <div className="pt-4 border-t space-y-2 text-sm text-muted-foreground">
                        <div>
                          <strong>Created:</strong> {new Date(selectedReport.created_at).toLocaleString()}
                        </div>
                        <div>
                          <strong>Reporter ID:</strong> {selectedReport.reporter_id}
                        </div>
                        <div>
                          <strong>Reported User ID:</strong> {selectedReport.reported_user_id}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="sticky top-6">
                    <CardContent className="flex items-center justify-center h-32">
                      <p className="text-muted-foreground">Select a report to view details</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};