import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Mail, Send, Users, Calendar, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

interface EmailList {
  id: string;
  list_name: string;
  description: string;
  email_count: number;
}

interface Campaign {
  id: string;
  campaign_name: string;
  subject: string;
  status: string;
  sent_count: number;
  failed_count: number;
  created_at: string;
  list_name: string;
}

export const AnnouncementManager = () => {
  const [emailLists, setEmailLists] = useState<EmailList[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedList, setSelectedList] = useState<string>('');
  const [testEmail, setTestEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchEmailLists();
    fetchCampaigns();
  }, []);

  const fetchEmailLists = async () => {
    try {
      const { data, error } = await supabase
        .from('announcement_email_lists')
        .select(`
          *,
          announcement_email_addresses(count)
        `);

      if (error) throw error;

      const listsWithCounts = data?.map(list => ({
        ...list,
        email_count: list.announcement_email_addresses?.[0]?.count || 0
      })) || [];

      setEmailLists(listsWithCounts);
    } catch (error: any) {
      console.error('Error fetching email lists:', error);
      toast.error('Failed to fetch email lists');
    }
  };

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('announcement_campaigns')
        .select(`
          *,
          announcement_email_lists(list_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const campaignsWithListName = data?.map(campaign => ({
        ...campaign,
        list_name: campaign.announcement_email_lists?.list_name || 'Unknown'
      })) || [];

      setCampaigns(campaignsWithListName);
    } catch (error: any) {
      console.error('Error fetching campaigns:', error);
      toast.error('Failed to fetch campaigns');
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail || !selectedList) {
      toast.error('Please select an email list and enter a test email address');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🧪 Sending test migration announcement email...');
      
      const { data, error } = await supabase.functions.invoke('send-migration-announcement', {
        body: {
          campaign_name: 'SharedGenes Migration Test',
          list_name: selectedList,
          test_email: testEmail
        }
      });

      if (error) throw error;

      console.log('✅ Test email response:', data);
      toast.success(`Test email sent successfully to ${testEmail}`);
      
      // Refresh campaigns
      fetchCampaigns();
    } catch (error: any) {
      console.error('❌ Error sending test email:', error);
      toast.error(`Failed to send test email: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const sendAnnouncementToAll = async () => {
    if (!selectedList) {
      toast.error('Please select an email list');
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to send the migration announcement to ALL users in the selected list? This action cannot be undone.'
    );

    if (!confirmed) return;

    setIsSending(true);
    try {
      console.log('📧 Sending migration announcement to all users...');
      
      const { data, error } = await supabase.functions.invoke('send-migration-announcement', {
        body: {
          campaign_name: 'SharedGenes to MStwins Migration Announcement',
          list_name: selectedList,
          send_to_all: true
        }
      });

      if (error) throw error;

      console.log('✅ Bulk email response:', data);
      toast.success(`Migration announcement sent to ${data.sent_count} users successfully!`);
      
      if (data.failed_count > 0) {
        toast.warning(`${data.failed_count} emails failed to send`);
      }
      
      // Refresh campaigns
      fetchCampaigns();
    } catch (error: any) {
      console.error('❌ Error sending bulk emails:', error);
      toast.error(`Failed to send announcement: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'completed_with_errors':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertTriangle className="h-3 w-3 mr-1" />Completed with Errors</Badge>;
      case 'sending':
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1" />Sending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Email Lists */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Email Lists</span>
            </CardTitle>
            <CardDescription>Available email lists for announcements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {emailLists.map((list) => (
                <div
                  key={list.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedList === list.list_name
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedList(list.list_name)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{list.list_name}</h4>
                      <p className="text-sm text-muted-foreground">{list.description}</p>
                    </div>
                    <Badge variant="outline">
                      {list.email_count} emails
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Send Announcement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5" />
              <span>Migration Announcement</span>
            </CardTitle>
            <CardDescription>
              Send the SharedGenes to MStwins migration announcement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This will send a pre-written email announcing the migration from SharedGenes.org to MStwins.com.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div>
                <Label htmlFor="test-email">Test Email Address</Label>
                <Input
                  id="test-email"
                  type="email"
                  placeholder="your-email@example.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Send a test email first to preview the content
                </p>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={sendTestEmail}
                  disabled={isLoading || !selectedList || !testEmail}
                  variant="outline"
                  className="flex-1"
                >
                  {isLoading ? 'Sending...' : 'Send Test Email'}
                </Button>
              </div>

              <div className="border-t pt-4">
                <Button
                  onClick={sendAnnouncementToAll}
                  disabled={isSending || !selectedList}
                  className="w-full"
                  size="lg"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isSending ? 'Sending to All Users...' : 'Send to All Users'}
                </Button>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  This will send the migration announcement to all active emails in the selected list
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Recent Campaigns</span>
          </CardTitle>
          <CardDescription>Recent announcement email campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {campaigns.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No campaigns yet</p>
            ) : (
              campaigns.map((campaign) => (
                <div key={campaign.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{campaign.campaign_name}</h4>
                    {getStatusBadge(campaign.status)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{campaign.subject}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>List: {campaign.list_name}</span>
                    <div className="flex space-x-4">
                      <span>Sent: {campaign.sent_count}</span>
                      {campaign.failed_count > 0 && (
                        <span className="text-destructive">Failed: {campaign.failed_count}</span>
                      )}
                      <span>{new Date(campaign.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};