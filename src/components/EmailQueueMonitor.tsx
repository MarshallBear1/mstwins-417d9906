import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Mail, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const EmailQueueMonitor = () => {
  const [loading, setLoading] = useState(false);
  const [queueStats, setQueueStats] = useState<any>(null);
  const { toast } = useToast();

  const checkQueue = async () => {
    try {
      const { data, error } = await supabase
        .from('email_queue')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const stats = {
        total: data.length,
        pending: data.filter(item => !item.processed).length,
        processed: data.filter(item => item.processed).length,
        failed: data.filter(item => item.attempts >= 3 && !item.processed).length,
        recent: data.slice(0, 5)
      };

      setQueueStats(stats);
    } catch (error) {
      console.error('Error checking queue:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to check email queue status"
      });
    }
  };

  const triggerProcessing = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-email-queue', {
        body: { manual: true }
      });

      if (error) throw error;

      toast({
        title: "Processing Triggered",
        description: `Processed ${data.processed || 0} emails`
      });

      // Refresh queue stats
      await checkQueue();
    } catch (error) {
      console.error('Error triggering processing:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to trigger email processing"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Email Queue Monitor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={checkQueue} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Check Queue
          </Button>
          <Button onClick={triggerProcessing} disabled={loading} size="sm">
            <Mail className="w-4 h-4 mr-2" />
            {loading ? "Processing..." : "Process Now"}
          </Button>
        </div>

        {queueStats && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{queueStats.total}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{queueStats.pending}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{queueStats.processed}</div>
                <div className="text-sm text-muted-foreground">Processed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{queueStats.failed}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
            </div>

            {queueStats.recent.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Recent Queue Items</h4>
                <div className="space-y-2">
                  {queueStats.recent.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <Badge variant={item.type === 'match' ? 'default' : 'secondary'}>
                          {item.type}
                        </Badge>
                        <span className="text-sm">
                          {new Date(item.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.processed ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : item.attempts >= 3 ? (
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        ) : (
                          <Badge variant="outline">{item.attempts} attempts</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmailQueueMonitor;