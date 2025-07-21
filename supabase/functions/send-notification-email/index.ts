import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationEmailRequest {
  email: string;
  firstName?: string;
  type: 'match' | 'like' | 'message';
  fromUser?: string;
  message?: string;
}

const getEmailContent = (type: string, firstName: string, fromUser?: string, message?: string) => {
  switch (type) {
    case 'match':
      return {
        subject: "You have a new connection! 🤝",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="background: linear-gradient(135deg, #10b981, #34d399); padding: 15px; border-radius: 10px; display: inline-block;">
                <span style="color: white; font-size: 24px;">🤝</span>
              </div>
              <h1 style="color: #333; margin-top: 20px;">New Connection!</h1>
            </div>
            
            <div style="background: #f0fdf4; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
              <h2 style="color: #333; margin-top: 0;">Hi ${firstName}! 👋</h2>
              <p style="color: #666; line-height: 1.6;">
                Great news! You've been matched with ${fromUser || 'another community member'} who shares similar experiences in the MS community.
              </p>
              <p style="color: #666; line-height: 1.6;">
                This is a wonderful opportunity to connect, share experiences, and build a supportive friendship.
              </p>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #888; font-size: 14px;">
                💙 Building connections within the MS community
              </p>
            </div>
          </div>
        `
      };
    
    case 'like':
      return {
        subject: "Someone liked your profile! 💙",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="background: linear-gradient(135deg, #ec4899, #f472b6); padding: 15px; border-radius: 10px; display: inline-block;">
                <span style="color: white; font-size: 24px;">💙</span>
              </div>
              <h1 style="color: #333; margin-top: 20px;">Profile Liked!</h1>
            </div>
            
            <div style="background: #fdf2f8; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
              <h2 style="color: #333; margin-top: 0;">Hi ${firstName}! 👋</h2>
              <p style="color: #666; line-height: 1.6;">
                ${fromUser || 'Someone'} liked your profile and is interested in connecting with you in our supportive MS community.
              </p>
              <p style="color: #666; line-height: 1.6;">
                This could be the start of a meaningful friendship and mutual support within our community.
              </p>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #888; font-size: 14px;">
                🤝 Community focused • 💙 MS support network
              </p>
            </div>
          </div>
        `
      };
    
    case 'message':
      return {
        subject: "You have a new message! 💬",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="background: linear-gradient(135deg, #3b82f6, #60a5fa); padding: 15px; border-radius: 10px; display: inline-block;">
                <span style="color: white; font-size: 24px;">💬</span>
              </div>
              <h1 style="color: #333; margin-top: 20px;">New Message!</h1>
            </div>
            
            <div style="background: #eff6ff; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
              <h2 style="color: #333; margin-top: 0;">Hi ${firstName}! 👋</h2>
              <p style="color: #666; line-height: 1.6;">
                You've received a new message from ${fromUser || 'a community member'}.
              </p>
              ${message ? `
                <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #3b82f6;">
                  <p style="color: #333; margin: 0; font-style: italic;">"${message}"</p>
                </div>
              ` : ''}
              <p style="color: #666; line-height: 1.6;">
                Log in to MSTwins to continue the conversation and strengthen your connection within our supportive community.
              </p>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #888; font-size: 14px;">
                💙 MS support network • 🤝 Building connections
              </p>
            </div>
          </div>
        `
      };
    
    default:
      return {
        subject: "Notification from MSTwins",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333;">MSTwins Notification</h1>
            <p style="color: #666;">You have a new notification from the MSTwins community.</p>
          </div>
        `
      };
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, firstName, type, fromUser, message }: NotificationEmailRequest = await req.json();

    console.log(`Sending ${type} notification email to:`, email);

    const emailContent = getEmailContent(type, firstName || 'there', fromUser, message);

    const emailResponse = await resend.emails.send({
      from: "MSTwins <notifications@sharedgenes.org>",
      to: [email],
      subject: emailContent.subject,
      html: emailContent.html,
    });

    console.log(`${type} notification email sent successfully:`, emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending notification email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);