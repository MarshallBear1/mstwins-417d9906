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

    console.log(`🚀 Processing ${type} email job:`, { likerUserId, likedUserId, messageContent });

    // Get user profiles and emails
    const [likerProfile, likedProfile] = await Promise.all([
      supabase.from('profiles').select('first_name').eq('user_id', likerUserId).single(),
      supabase.from('profiles').select('first_name').eq('user_id', likedUserId).single()
    ]);

    console.log('📋 Profile data:', { 
      likerProfile: likerProfile.data, 
      likedProfile: likedProfile.data 
    });

    // Get user emails from auth
    const [likerAuth, likedAuth] = await Promise.all([
      supabase.auth.admin.getUserById(likerUserId),
      supabase.auth.admin.getUserById(likedUserId)
    ]);

    const likerEmail = likerAuth.data.user?.email;
    const likedEmail = likedAuth.data.user?.email;
    const likerName = likerProfile.data?.first_name;
    const likedName = likedProfile.data?.first_name;

    console.log('📧 User details:', { 
      likerEmail, 
      likedEmail, 
      likerName, 
      likedName,
      type 
    });

    // Send appropriate emails
    if (type === 'like' && likedEmail) {
      console.log('💙 Sending like notification to:', likedEmail);
      // Send like notification to liked user
      const likeEmailResult = await supabase.functions.invoke('send-notification-email', {
        body: {
          email: likedEmail,
          firstName: likedName,
          type: 'like',
          fromUser: likerName
        }
      });
      console.log('💙 Like email result:', likeEmailResult);
    } 
    else if (type === 'match' && likerEmail && likedEmail) {
      console.log('🤝 Sending match notifications to both users');
      // Send match notifications to both users
      const matchEmailResults = await Promise.all([
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
      console.log('🤝 Match email results:', matchEmailResults);
    }
    else if (type === 'message' && likedEmail) {
      console.log('💬 Sending message notification to:', likedEmail);
      // Send message notification
      const messageEmailResult = await supabase.functions.invoke('send-notification-email', {
        body: {
          email: likedEmail,
          firstName: likedName,
          type: 'message',
          fromUser: likerName,
          message: messageContent
        }
      });
      console.log('💬 Message email result:', messageEmailResult);
    }
    else {
      console.warn('⚠️ Email not sent - missing data:', {
        type,
        likerEmail: !!likerEmail,
        likedEmail: !!likedEmail,
        condition: type === 'like' ? 'like && likedEmail' : 
                  type === 'match' ? 'match && both emails' : 
                  type === 'message' ? 'message && likedEmail' : 'unknown'
      });
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