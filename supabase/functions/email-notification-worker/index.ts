import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailJobRequest {
  type: 'like' | 'match' | 'message';
  likerUserId: string;
  likedUserId: string;
  messageContent?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, likerUserId, likedUserId, messageContent }: EmailJobRequest = await req.json();

    console.log(`Processing ${type} email job:`, { likerUserId, likedUserId });

    // Get user profiles and emails
    const [likerProfile, likedProfile] = await Promise.all([
      supabase.from('profiles').select('first_name').eq('user_id', likerUserId).single(),
      supabase.from('profiles').select('first_name').eq('user_id', likedUserId).single()
    ]);

    // Get user emails from auth
    const [likerAuth, likedAuth] = await Promise.all([
      supabase.auth.admin.getUserById(likerUserId),
      supabase.auth.admin.getUserById(likedUserId)
    ]);

    const likerEmail = likerAuth.data.user?.email;
    const likedEmail = likedAuth.data.user?.email;
    const likerName = likerProfile.data?.first_name;
    const likedName = likedProfile.data?.first_name;

    console.log('User emails:', { likerEmail, likedEmail, likerName, likedName });

    // Send appropriate emails
    if (type === 'like' && likedEmail) {
      // Send like notification to liked user
      await supabase.functions.invoke('send-notification-email', {
        body: {
          email: likedEmail,
          firstName: likedName,
          type: 'like',
          fromUser: likerName
        }
      });
      console.log('Like email sent to:', likedEmail);
    } 
    else if (type === 'match' && likerEmail && likedEmail) {
      // Send match notifications to both users
      await Promise.all([
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
      console.log('Match emails sent to both users');
    }
    else if (type === 'message' && likedEmail) {
      // Send message notification
      await supabase.functions.invoke('send-notification-email', {
        body: {
          email: likedEmail,
          firstName: likedName,
          type: 'message',
          fromUser: likerName,
          message: messageContent
        }
      });
      console.log('Message email sent to:', likedEmail);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in email-notification-worker:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);