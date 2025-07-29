import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Day4EmailRequest {
  email: string;
  first_name: string;
  user_id?: string;
}

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

const handler = async (req: Request): Promise<Response> => {
  console.log('🚀 Day 4 email function called');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, first_name, user_id }: Day4EmailRequest = await req.json();
    console.log(`📧 Sending day 4 email to: ${email} (user_id: ${user_id || 'unknown'})`);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Journey Continues - Day 4</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
            background-color: #f8fafc;
          }
          .container { 
            background: white; 
            border-radius: 12px; 
            padding: 40px; 
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
          }
          .logo { 
            font-size: 28px; 
            font-weight: bold; 
            color: #6366f1; 
            margin-bottom: 10px;
          }
          .title { 
            font-size: 24px; 
            font-weight: 600; 
            color: #1f2937; 
            margin-bottom: 15px;
          }
          .subtitle { 
            font-size: 16px; 
            color: #6b7280; 
            margin-bottom: 30px;
          }
          .content { 
            margin-bottom: 30px; 
          }
          .highlight { 
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); 
            color: white; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0;
          }
          .cta-button { 
            display: inline-block; 
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); 
            color: white; 
            padding: 15px 30px; 
            border-radius: 8px; 
            text-decoration: none; 
            font-weight: 600; 
            margin: 10px 0;
          }
          .tips { 
            background: #f0f9ff; 
            border-left: 4px solid #0ea5e9; 
            padding: 15px; 
            margin: 20px 0;
          }
          .footer { 
            text-align: center; 
            font-size: 14px; 
            color: #6b7280; 
            margin-top: 30px; 
            padding-top: 20px; 
            border-top: 1px solid #e5e7eb;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🧬 Shared Genes</div>
            <h1 class="title">Building Meaningful Connections</h1>
            <p class="subtitle">Day 4: Making the most of your MS community experience</p>
          </div>
          
          <div class="content">
            <p>Hi ${first_name},</p>
            
            <p>We've been with you for the last few days now, and we're thrilled to see you're part of our growing MS community! 🌟</p>
            
            <div class="highlight">
              <h3 style="margin-top: 0;">🔧 Important Updates & Improvements</h3>
              <p>We've been hard at work making your experience even better:</p>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li><strong>Bug fixes implemented</strong> - We've resolved several issues for smoother performance</li>
                <li><strong>Enhanced stability</strong> - Everything should run much better now!</li>
                <li><strong>Mobile app coming soon</strong> - We'll be releasing in the app stores in the next few days!</li>
              </ul>
            </div>
            
            <p style="text-align: center;">
              <a href="https://sharedgenes.lovable.app/dashboard" class="cta-button">
                Check Out The Improvements →
              </a>
            </p>
            
            <div class="tips">
              <h4>💡 Pro Tips for Better Connections:</h4>
              <ul>
                <li><strong>Complete your extended profile</strong> - Share more about your journey and interests</li>
                <li><strong>Be active in conversations</strong> - Respond to matches and start meaningful discussions</li>
                <li><strong>Share your story</strong> - Authentic experiences resonate most with our community</li>
                <li><strong>Use daily likes wisely</strong> - Quality connections matter more than quantity</li>
              </ul>
            </div>
            
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
              <h4 style="margin-top: 0;">🚀 Exciting Things Coming!</h4>
              <p>We're adding some amazing new features in the next couple of days, so stay tuned! And please keep referring your friends - every new member makes our community stronger.</p>
            </div>
            
            <p>Remember, every connection you make here is built on shared understanding and genuine support. With our recent improvements, your experience should be smoother than ever!</p>
            
            <p>If you have any questions or need support, we're always here to help.</p>
            
            <p>Keep connecting,<br>
            <strong>The Shared Genes Team</strong></p>
          </div>
          
          <div class="footer">
            <p>
              <a href="https://sharedgenes.lovable.app/feedback" style="color: #6366f1; text-decoration: none;">Share Feedback</a> • 
              <a href="https://sharedgenes.lovable.app" style="color: #6366f1; text-decoration: none;">Visit App</a>
            </p>
            <p>You're receiving this because you joined our MS community. We're committed to supporting your journey.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: 'Shared Genes Community <team@sharedgenes.org>',
      to: [email],
      subject: '🧬 Building Deeper Connections - Day 4 with Shared Genes',
      html: emailHtml,
    });

    console.log(`✅ Day 4 email sent successfully to ${email}:`, emailResponse);

    // Track the email sending in the database
    if (user_id) {
      const { error: trackingError } = await supabase
        .from('re_engagement_emails')
        .insert({
          user_id: user_id,
          email_type: 'day4_engagement'
        });

      if (trackingError) {
        console.error('❌ Error tracking day 4 email:', trackingError);
      } else {
        console.log('✅ Day 4 email tracked successfully');
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Day 4 email sent successfully' }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('❌ Error in send-day4-email function:', error);
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