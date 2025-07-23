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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Processing email queue...');

    // Get unprocessed emails from queue
    const { data: queueItems, error: queueError } = await supabase
      .from('email_queue')
      .select('*')
      .eq('processed', false)
      .lt('attempts', 3) // Only retry up to 3 times
      .order('created_at', { ascending: true })
      .limit(50); // Process in batches

    if (queueError) {
      console.error('Error fetching queue items:', queueError);
      throw queueError;
    }

    if (!queueItems || queueItems.length === 0) {
      console.log('✅ No emails in queue to process');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No emails in queue',
        processed: 0
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`📧 Found ${queueItems.length} emails to process`);

    let processedCount = 0;
    let errorCount = 0;

    // Process each queue item
    for (const item of queueItems as QueueItem[]) {
      try {
        console.log(`Processing ${item.type} email for item ${item.id}`);

        // Update attempt count first
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

        // Get user emails from auth
        const [likerAuth, likedAuth] = await Promise.all([
          supabase.auth.admin.getUserById(item.liker_user_id),
          supabase.auth.admin.getUserById(item.liked_user_id)
        ]);

        const likerEmail = likerAuth.data.user?.email;
        const likedEmail = likedAuth.data.user?.email;
        const likerName = likerProfile.data?.first_name;
        const likedName = likedProfile.data?.first_name;

        console.log(`📧 Sending ${item.type} email:`, { 
          likerEmail: !!likerEmail, 
          likedEmail: !!likedEmail, 
          likerName: !!likerName, 
          likedName: !!likedName 
        });

        // Send appropriate emails based on type
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
          // Send match notifications to both users
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
        console.error(`❌ Error processing email ${item.id}:`, error);
        errorCount++;
        
        // Mark error but don't mark as processed so it can be retried
        await supabase
          .from('email_queue')
          .update({ 
            error_message: error instanceof Error ? error.message : String(error)
          })
          .eq('id', item.id);
      }
    }

    console.log(`📊 Queue processing complete: ${processedCount} processed, ${errorCount} errors`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Email queue processed',
      processed: processedCount,
      errors: errorCount,
      total: queueItems.length
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error processing email queue:", error);
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