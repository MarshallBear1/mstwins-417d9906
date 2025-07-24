import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Perform basic health checks
    const healthChecks = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      checks: {
        database: 'unknown',
        auth: 'unknown',
        storage: 'unknown',
        functions: 'healthy'
      },
      version: '1.0.0',
      uptime: process.uptime?.() || 0
    };

    // Test database connectivity
    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      healthChecks.checks.database = error ? 'unhealthy' : 'healthy';
    } catch (error) {
      console.error('Database health check failed:', error);
      healthChecks.checks.database = 'unhealthy';
    }

    // Test auth service
    try {
      const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
      healthChecks.checks.auth = error ? 'unhealthy' : 'healthy';
    } catch (error) {
      console.error('Auth health check failed:', error);
      healthChecks.checks.auth = 'unhealthy';
    }

    // Test storage service
    try {
      const { data, error } = await supabase.storage.listBuckets();
      healthChecks.checks.storage = error ? 'unhealthy' : 'healthy';
    } catch (error) {
      console.error('Storage health check failed:', error);
      healthChecks.checks.storage = 'unhealthy';
    }

    // Determine overall status
    const hasUnhealthyChecks = Object.values(healthChecks.checks).includes('unhealthy');
    healthChecks.status = hasUnhealthyChecks ? 'degraded' : 'healthy';

    // Return appropriate status code
    const statusCode = healthChecks.status === 'healthy' ? 200 : 503;

    return new Response(
      JSON.stringify(healthChecks, null, 2),
      {
        status: statusCode,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }
    );

  } catch (error) {
    console.error('Health check error:', error);
    
    const errorResponse = {
      timestamp: new Date().toISOString(),
      status: 'unhealthy',
      error: error.message || 'Internal server error',
      version: '1.0.0'
    };

    return new Response(
      JSON.stringify(errorResponse, null, 2),
      {
        status: 503,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});