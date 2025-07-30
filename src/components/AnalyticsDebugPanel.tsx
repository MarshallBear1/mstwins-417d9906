import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { analytics } from '@/lib/analytics';
import { useAuth } from '@/hooks/useAuth';

export const AnalyticsDebugPanel = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [testResults, setTestResults] = useState<string[]>([]);
  const { user } = useAuth();

  const refreshDebugInfo = () => {
    const info = analytics.getDebugInfo();
    setDebugInfo(info);
    console.log('📊 Analytics Debug Info:', info);
  };

  const runTest = () => {
    analytics.testAnalytics();
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, `Test event sent at ${timestamp}`]);
  };

  const testSpecificEvents = () => {
    if (!user) return;
    
    analytics.track('debug_test_feature_used', { feature: 'analytics_debug_panel' });
    analytics.track('debug_test_profile_viewed', { viewer_id: user.id, viewed_profile_id: 'test' });
    
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, `Specific test events sent at ${timestamp}`]);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📊 Analytics Debug
          <Badge variant={analytics.isInitialized() ? "default" : "destructive"}>
            {analytics.isInitialized() ? "Active" : "Inactive"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Button onClick={refreshDebugInfo} variant="outline" className="w-full">
            Refresh Debug Info
          </Button>
          
          {debugInfo && (
            <div className="text-sm space-y-1 p-2 bg-muted rounded">
              <div>Initialized: {debugInfo.initialized ? '✅' : '❌'}</div>
              <div>Distinct ID: {debugInfo.distinctId || 'None'}</div>
              <div>Session ID: {debugInfo.sessionId || 'None'}</div>
              <div>Environment: {debugInfo.environment}</div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Button onClick={runTest} className="w-full">
            Send Test Event
          </Button>
          
          <Button onClick={testSpecificEvents} variant="secondary" className="w-full">
            Test App Events
          </Button>
        </div>

        {testResults.length > 0 && (
          <div className="space-y-1">
            <div className="text-sm font-medium">Test Results:</div>
            <div className="text-xs space-y-1 max-h-20 overflow-y-auto">
              {testResults.map((result, index) => (
                <div key={index} className="text-muted-foreground">
                  {result}
                </div>
              ))}
            </div>
            <Button 
              onClick={() => setTestResults([])} 
              variant="ghost" 
              size="sm"
              className="w-full"
            >
              Clear Results
            </Button>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          Check browser network tab for requests to us.i.posthog.com
        </div>
      </CardContent>
    </Card>
  );
};