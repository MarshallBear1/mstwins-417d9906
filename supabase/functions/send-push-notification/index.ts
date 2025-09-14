import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { SignJWT, importPKCS8 } from 'https://esm.sh/jose@5.2.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushNotificationRequest {
  user_id: string;
  title: string;
  body: string;
  data?: any;
  type: 'like' | 'match' | 'message' | 'likes_reset';
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { user_id, title, body, data, type }: PushNotificationRequest = await req.json();

    console.log(`📱 Sending ${type} push notification to user:`, user_id);

    // Get user's push tokens
    const { data: tokens, error: tokenError } = await supabaseClient
      .from('push_tokens')
      .select('token, platform')
      .eq('user_id', user_id);

    if (tokenError) {
      console.error('Error fetching push tokens:', tokenError);
      throw tokenError;
    }

    if (!tokens || tokens.length === 0) {
      console.log('No push tokens found for user:', user_id);
      return new Response(
        JSON.stringify({ message: 'No push tokens found for user' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Dedupe: Check last push sent to this user with same type/body within last 10 minutes
    const nowIso = new Date().toISOString();
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const signature = `${type}:${title}:${body}`.slice(0, 256);
    const { data: recentLogs } = await supabaseClient
      .from('notification_logs')
      .select('id, sent_at, title, body, type')
      .eq('user_id', user_id)
      .gte('sent_at', tenMinAgo)
      .order('sent_at', { ascending: false })
      .limit(20);

    const isDuplicate = (recentLogs || []).some((log) => log.type === type && log.title === title && log.body === body);
    if (isDuplicate) {
      console.log('⏭️ Skipping duplicate push within 10 minutes for user', user_id, signature);
      return new Response(
        JSON.stringify({ success: true, message: 'Duplicate push suppressed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For iOS notifications, we need to send to Apple Push Notification service
    // For Android, we'd use Firebase Cloud Messaging
    
    // Env for OneSignal (optional)
    const oneSignalKey = Deno.env.get('ONESIGNAL_REST_API_KEY');
    const oneSignalAppId = Deno.env.get('ONESIGNAL_APP_ID');
    // Env for direct APNs
    const apnKeyPem = Deno.env.get('APN_KEY'); // .p8 private key contents (PEM)
    const apnKeyId = Deno.env.get('APN_KEY_ID');
    const apnTeamId = Deno.env.get('APN_TEAM_ID');
    const apnBundleId = Deno.env.get('APN_BUNDLE_ID');
    const apnEnv = (Deno.env.get('APN_ENV') || 'prod').toLowerCase(); // 'prod' or 'sandbox'

    const createApnsJwt = async () => {
      if (!apnKeyPem || !apnKeyId || !apnTeamId) return null;
      const alg = 'ES256';
      const privateKey = await importPKCS8(apnKeyPem, alg);
      const jwt = await new SignJWT({})
        .setProtectedHeader({ alg, kid: apnKeyId })
        .setIssuer(apnTeamId)
        .setIssuedAt()
        .setAudience('https://api.push.apple.com')
        .sign(privateKey);
      return jwt;
    };
    const notifications = tokens.map(async (tokenData) => {
      try {
        console.log(`📲 Sending notification to ${tokenData.platform} device:`, tokenData.token);
        
        // Prefer direct APNs for iOS if configured
        if (tokenData.platform === 'ios' && apnBundleId) {
          const jwt = await createApnsJwt();
          if (!jwt) {
            console.warn('APNs env not fully configured, falling back');
          } else {
            const apnsHost = apnEnv === 'sandbox' ? 'https://api.sandbox.push.apple.com' : 'https://api.push.apple.com';
            const url = `${apnsHost}/3/device/${tokenData.token}`;
            const apnsBody = {
              aps: {
                alert: { title, body },
                sound: 'default',
                badge: 1
              },
              ...(data ? { data: { ...data, type } } : { type })
            };
            const res = await fetch(url, {
              method: 'POST',
              headers: {
                'apns-topic': apnBundleId,
                'apns-push-type': 'alert',
                'authorization': `bearer ${jwt}`,
                'content-type': 'application/json'
              },
              body: JSON.stringify(apnsBody)
            });
            if (!res.ok) {
              const text = await res.text();
              throw new Error(`APNs error: ${res.status} ${text}`);
            }
            return { success: true, provider: 'apns' };
          }
        }

        // Otherwise use OneSignal if configured (maps user_id via external ids)
        if (oneSignalKey && oneSignalAppId) {
          const osBody = {
            app_id: oneSignalAppId,
            include_external_user_ids: [user_id],
            headings: { en: title },
            contents: { en: body },
            data: { ...data, type },
            ios_badgeType: 'Increase',
            ios_badgeCount: 1,
            ios_sound: 'default',
            android_channel_id: undefined
          };
          const res = await fetch('https://api.onesignal.com/notifications', {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${oneSignalKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(osBody)
          });
          const json = await res.json();
          if (!res.ok) throw new Error(JSON.stringify(json));
          return { success: true, provider: 'onesignal', id: json.id };
        } else {
          // Fallback: log only
          console.log('Log-only notification:', { title, body, type, data, token: tokenData.token, platform: tokenData.platform });
          return { success: true, token: tokenData.token, platform: tokenData.platform };
        }
      } catch (error) {
        console.error(`Error sending notification to ${tokenData.platform}:`, error);
        return { success: false, token: tokenData.token, platform: tokenData.platform, error: error.message };
      }
    });

    const results = await Promise.all(notifications);
    
    // Log notification event for analytics
    await supabaseClient
      .from('notification_logs')
      .insert({
        user_id,
        type,
        title,
        body,
        sent_at: new Date().toISOString(),
        results: results
      })
      .select()
      .single()
      .catch(console.error); // Don't fail if logging fails

    console.log(`✅ Push notification sending completed for user ${user_id}:`, results);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Push notification sent for ${type}`,
        results 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error in send-push-notification function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
};

serve(handler);