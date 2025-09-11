import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

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
    
    // This is a simplified example - in production you'd need proper APNs/FCM integration
    const notifications = tokens.map(async (tokenData) => {
      try {
        console.log(`📲 Sending notification to ${tokenData.platform} device:`, tokenData.token);
        
        // Create notification payload
        const notificationPayload = {
          to: tokenData.token,
          title,
          body,
          data: {
            ...data,
            type,
            click_action: 'FLUTTER_NOTIFICATION_CLICK'
          },
          // iOS specific settings
          ...(tokenData.platform === 'ios' && {
            apns: {
              headers: {
                'apns-priority': '10',
                'apns-push-type': 'alert'
              },
              payload: {
                aps: {
                  alert: {
                    title,
                    body
                  },
                  badge: 1,
                  sound: 'default',
                  'content-available': 1
                }
              }
            }
          }),
          // Android specific settings
          ...(tokenData.platform === 'android' && {
            android: {
              priority: 'high',
              notification: {
                title,
                body,
                icon: 'ic_notification',
                color: '#2563eb',
                sound: 'default',
                click_action: 'FLUTTER_NOTIFICATION_CLICK'
              }
            }
          })
        };

        // Here you would integrate with your push notification service
        // For now, we'll just log the notification that would be sent
        console.log('Notification payload:', JSON.stringify(notificationPayload, null, 2));
        
        return { success: true, token: tokenData.token, platform: tokenData.platform };
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