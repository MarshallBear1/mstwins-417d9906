import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔄 Starting likes reset notification process...');

    // Get all users who had their likes reset today (daily_likes count was reset to 0)
    const { data: usersWithResetLikes, error: resetError } = await supabaseClient
      .from('daily_likes')
      .select(`
        user_id,
        profiles!inner(first_name, user_id)
      `)
      .eq('like_date', new Date().toISOString().split('T')[0])
      .eq('like_count', 0);

    if (resetError) {
      console.error('Error fetching users with reset likes:', resetError);
      throw resetError;
    }

    if (!usersWithResetLikes || usersWithResetLikes.length === 0) {
      console.log('No users found with reset likes for today');
      return new Response(
        JSON.stringify({ message: 'No users found with reset likes' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📬 Sending likes reset notifications to ${usersWithResetLikes.length} users`);

    // Prevent duplicate sends per user per day by checking notification_logs
    const todayIso = new Date().toISOString().split('T')[0];

    // Send notifications to all users
    const notificationPromises = usersWithResetLikes.map(async (userData: any) => {
      try {
        const firstName = userData.profiles?.first_name || 'there';
        
        // Has this user already received a likes_reset push today?
        const { data: existingLogs } = await supabaseClient
          .from('notification_logs')
          .select('id, sent_at')
          .eq('user_id', userData.user_id)
          .eq('type', 'likes_reset')
          .gte('sent_at', `${todayIso}T00:00:00.000Z`);
        if (existingLogs && existingLogs.length > 0) {
          console.log(`⏭️ Skipping duplicate likes_reset push for user ${userData.user_id} today`);
          return { user_id: userData.user_id, success: true, skipped: true };
        }
        
        // Send push notification
        const pushResponse = await supabaseClient.functions.invoke('send-push-notification', {
          body: {
            user_id: userData.user_id,
            title: '🔄 Likes Refreshed!',
            body: `Hi ${firstName}! Your daily likes have been refreshed. Start connecting with new people!`,
            type: 'likes_reset',
            data: {
              action: 'likes_reset',
              timestamp: new Date().toISOString()
            }
          }
        });

        if (pushResponse.error) {
          console.error(`Error sending push notification to user ${userData.user_id}:`, pushResponse.error);
        } else {
          console.log(`✅ Likes reset notification sent to user ${userData.user_id}`);
        }

        return { user_id: userData.user_id, success: !pushResponse.error };
      } catch (error) {
        console.error(`Error sending notification to user ${userData.user_id}:`, error);
        return { user_id: userData.user_id, success: false, error: error.message };
      }
    });

    const results = await Promise.all(notificationPromises);
    const successCount = results.filter(r => r.success).length;

    console.log(`📊 Likes reset notifications completed: ${successCount}/${results.length} successful`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Likes reset notifications sent to ${successCount}/${results.length} users`,
        results
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error in send-likes-reset-notifications function:', error);
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