import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface QueueItem {
  id: string;
  type: 'like' | 'match' | 'message';
  liker_user_id: string;
  liked_user_id: string;
  message_content?: string;
  created_at: string;
  attempts: number;
}

interface WelcomeEmailItem {
  id: string;
  user_id: string;
  email: string;
  first_name: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Starting comprehensive email processing...');

    // Check if email processing is disabled
    const { data: flagData } = await supabase
      .from('system_flags')
      .select('enabled')
      .eq('flag_name', 'email_processing_enabled')
      .single();

    if (flagData && !flagData.enabled) {
      console.log('🚫 Email processing is disabled by system flag');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email processing is currently disabled',
          processed: 0,
          errors: 0 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    let processedCount = 0;
    let errorCount = 0;

    // 1. Process pending notification emails (likes, matches, messages)
    console.log('📧 Processing notification email queue...');
    
    const { data: queueItems, error: queueError } = await supabase
      .from('email_queue')
      .select('*')
      .eq('processed', false)
      .lt('attempts', 3)
      .order('created_at', { ascending: true })
      .limit(20);

    if (queueError) {
      console.error('❌ Error fetching queue items:', queueError);
    } else if (queueItems && queueItems.length > 0) {
      console.log(`📧 Found ${queueItems.length} notification emails to process`);

      for (const item of queueItems as QueueItem[]) {
        try {
          console.log(`Processing ${item.type} email for item ${item.id}`);

          // Update attempt count
          await supabase
            .from('email_queue')
            .update({ 
              attempts: item.attempts + 1,
              last_attempt: new Date().toISOString()
            })
            .eq('id', item.id);

          // Get user profiles and emails
          const [likerProfile, likedProfile] = await Promise.all([
            supabase.from('profiles').select('first_name').eq('user_id', item.liker_user_id).single(),
            supabase.from('profiles').select('first_name').eq('user_id', item.liked_user_id).single()
          ]);

          const [likerAuth, likedAuth] = await Promise.all([
            supabase.auth.admin.getUserById(item.liker_user_id),
            supabase.auth.admin.getUserById(item.liked_user_id)
          ]);

          const likerEmail = likerAuth.data.user?.email;
          const likedEmail = likedAuth.data.user?.email;
          const likerName = likerProfile.data?.first_name;
          const likedName = likedProfile.data?.first_name;

          // Send emails based on type
          let emailResult;
          
          if (item.type === 'like' && likedEmail) {
            emailResult = await supabase.functions.invoke('send-notification-email', {
              body: {
                email: likedEmail,
                firstName: likedName,
                type: 'like',
                fromUser: likerName
              }
            });
          } 
          else if (item.type === 'match' && likerEmail && likedEmail) {
            const [result1, result2] = await Promise.all([
              supabase.functions.invoke('send-notification-email', {
                body: {
                  email: likerEmail,
                  firstName: likerName,
                  type: 'match',
                  fromUser: likedName
                }
              }),
              supabase.functions.invoke('send-notification-email', {
                body: {
                  email: likedEmail,
                  firstName: likedName,
                  type: 'match',
                  fromUser: likerName
                }
              })
            ]);
            emailResult = { data: [result1.data, result2.data], error: result1.error || result2.error };
          }
          else if (item.type === 'message' && likedEmail) {
            emailResult = await supabase.functions.invoke('send-notification-email', {
              body: {
                email: likedEmail,
                firstName: likedName,
                type: 'message',
                fromUser: likerName,
                message: item.message_content
              }
            });
          }

          if (emailResult?.error) {
            throw new Error(`Email service error: ${JSON.stringify(emailResult.error)}`);
          }

          // Mark as processed
          await supabase
            .from('email_queue')
            .update({ 
              processed: true,
              error_message: null
            })
            .eq('id', item.id);

          processedCount++;
          console.log(`✅ Successfully processed ${item.type} email for item ${item.id}`);

        } catch (error) {
          console.error(`❌ Error processing notification email ${item.id}:`, error);
          errorCount++;
          
          await supabase
            .from('email_queue')
            .update({ 
              error_message: error instanceof Error ? error.message : String(error)
            })
            .eq('id', item.id);
        }
      }
    }

    // 2. Process pending welcome emails
    console.log('🎉 Processing welcome email queue...');
    
    const { data: welcomeItems, error: welcomeError } = await supabase
      .from('welcome_email_queue')
      .select('*')
      .eq('processed', false)
      .order('created_at', { ascending: true })
      .limit(10);

    if (welcomeError) {
      console.error('❌ Error fetching welcome emails:', welcomeError);
    } else if (welcomeItems && welcomeItems.length > 0) {
      console.log(`🎉 Found ${welcomeItems.length} welcome emails to process`);

      for (const item of welcomeItems as WelcomeEmailItem[]) {
        try {
          console.log(`Processing welcome email for user ${item.user_id}`);

          const emailResult = await supabase.functions.invoke('send-welcome-email', {
            body: {
              email: item.email,
              firstName: item.first_name
            }
          });

          if (emailResult?.error) {
            throw new Error(`Welcome email error: ${JSON.stringify(emailResult.error)}`);
          }

          // Mark as processed
          await supabase
            .from('welcome_email_queue')
            .update({ processed: true })
            .eq('id', item.id);

          processedCount++;
          console.log(`✅ Successfully sent welcome email to ${item.email}`);

        } catch (error) {
          console.error(`❌ Error processing welcome email ${item.id}:`, error);
          errorCount++;
        }
      }
    }

    // 3. Process re-engagement emails
    console.log('🔄 Processing re-engagement emails...');
    
    const { data: reEngagementUsers, error: reEngagementError } = await supabase
      .rpc('get_users_needing_re_engagement');

    if (reEngagementError) {
      console.error('❌ Error fetching re-engagement users:', reEngagementError);
    } else if (reEngagementUsers && reEngagementUsers.length > 0) {
      console.log(`🔄 Found ${reEngagementUsers.length} users needing re-engagement emails`);

      for (const user of reEngagementUsers) {
        try {
          console.log(`Sending ${user.email_type} re-engagement email to ${user.email}`);

          const emailResult = await supabase.functions.invoke('send-re-engagement-email', {
            body: {
              email: user.email,
              firstName: user.first_name,
              emailType: user.email_type,
              hoursOffline: user.hours_offline
            }
          });

          if (emailResult?.error) {
            throw new Error(`Re-engagement email error: ${JSON.stringify(emailResult.error)}`);
          }

          // Record that we sent this re-engagement email
          await supabase
            .from('re_engagement_emails')
            .insert({
              user_id: user.user_id,
              email_type: user.email_type
            });

          processedCount++;
          console.log(`✅ Successfully sent ${user.email_type} re-engagement email to ${user.email}`);

        } catch (error) {
          console.error(`❌ Error processing re-engagement email for ${user.user_id}:`, error);
          errorCount++;
        }
      }
    }

    // 4. Process like refresh notification emails
    console.log('🔄 Processing like refresh emails...');
    
    const { data: likeRefreshUsers, error: likeRefreshError } = await supabase
      .rpc('get_users_needing_like_refresh_emails');

    if (likeRefreshError) {
      console.error('❌ Error fetching like refresh users:', likeRefreshError);
    } else if (likeRefreshUsers && likeRefreshUsers.length > 0) {
      console.log(`🔄 Found ${likeRefreshUsers.length} users needing like refresh emails`);

      for (const user of likeRefreshUsers) {
        try {
          console.log(`Sending likes_refreshed email to ${user.email}`);

          const emailResult = await supabase.functions.invoke('send-re-engagement-email', {
            body: {
              email: user.email,
              firstName: user.first_name,
              emailType: 'likes_refreshed'
            }
          });

          if (emailResult?.error) {
            throw new Error(`Like refresh email error: ${JSON.stringify(emailResult.error)}`);
          }

          // Record that we sent this like refresh email
          await supabase
            .from('re_engagement_emails')
            .insert({
              user_id: user.user_id,
              email_type: 'likes_refreshed'
            });

          processedCount++;
          console.log(`✅ Successfully sent like refresh email to ${user.email}`);

        } catch (error) {
          console.error(`❌ Error processing like refresh email for ${user.user_id}:`, error);
          errorCount++;
        }
      }
    }

    console.log(`📊 Email processing complete: ${processedCount} processed, ${errorCount} errors`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Email processing completed',
      processed: processedCount,
      errors: errorCount
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("❌ Critical error in email processor:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  }
};

serve(handler);