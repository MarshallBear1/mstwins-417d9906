import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Day3EmailRequest {
  email: string;
  first_name: string;
}

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const handler = async (req: Request): Promise<Response> => {
  console.log('🚀 Day 3 email function called');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, first_name }: Day3EmailRequest = await req.json();
    console.log(`📧 Sending day 3 email to: ${email}`);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Day 3 Update - MSTWins</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #e1e5e9; }
          .logo { font-size: 28px; font-weight: bold; color: #8b5cf6; }
          .content { padding: 30px 0; }
          .highlight { background: linear-gradient(135deg, #8b5cf6, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: bold; }
          .cta-section { background: linear-gradient(135deg, #8b5cf6, #06b6d4); padding: 25px; border-radius: 12px; text-align: center; margin: 25px 0; }
          .cta-button { display: inline-block; background: white; color: #8b5cf6; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 10px; }
          .footer { text-align: center; padding: 20px 0; border-top: 1px solid #e1e5e9; color: #666; font-size: 14px; }
          .update-badge { background: #10b981; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">MSTWins</div>
            <p style="margin: 10px 0 0 0; color: #666;">Connecting the MS Community</p>
          </div>
          
          <div class="content">
            <h1>Day 3 Update! 🎉</h1>
            
            <p>Hi ${first_name || 'there'},</p>
            
            <p>It's been an incredible <span class="highlight">3 days since we launched</span> MSTWins, and we wanted to share some exciting updates with you!</p>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #8b5cf6;">✨ What's New</h3>
              <p style="margin-bottom: 0;">We've been hard at work making improvements to the app experience! We've enhanced the visuals and made several updates based on early feedback to make MSTWins even better for our community.</p>
            </div>
            
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <h3 style="margin-top: 0; color: #d97706;">📱 App Store Release Coming Soon!</h3>
              <p style="margin-bottom: 0;">We're excited to announce that MSTWins will be available on the App Store very soon! Keep an eye out for the official release.</p>
            </div>
            
            <h3>🙏 Help Us Grow</h3>
            <p>Your feedback has been invaluable in making MSTWins better. Please continue sharing your thoughts and suggestions - every piece of feedback helps us create a better experience for the entire MS community.</p>
            
            <p>If you're enjoying MSTWins, we'd be incredibly grateful if you could <strong>share it with your friends</strong>. Word of mouth from our community members like you is the best way to help us grow and connect more people in the MS community.</p>
            
            <div class="cta-section" style="color: white;">
              <h3 style="margin-top: 0; color: white;">Keep Connecting & Sharing! 💜</h3>
              <p style="color: white; margin-bottom: 20px;">Continue exploring MSTWins and help us build something amazing together.</p>
              <a href="https://fscendubnktdtmnxiipk.supabase.co" class="cta-button">Open MSTWins</a>
            </div>
            
            <p>Thank you for being part of our journey from day one. Together, we're building something special for the MS community! 🌟</p>
            
            <p>With gratitude,<br>
            <strong>The MSTWins Team</strong></p>
          </div>
          
          <div class="footer">
            <p>MSTWins - Connecting people with Multiple Sclerosis</p>
            <p style="font-size: 12px; color: #999;">This email was sent because you're a valued member of the MSTWins community.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "MSTWins Team <noreply@mstwins.com>",
      to: [email],
      subject: "Day 3 Update: Visual improvements & App Store coming soon! 🎉",
      html: emailHtml,
    });

    console.log('✅ Day 3 email sent successfully:', emailResponse);

    // Record the email send
    const { error: recordError } = await supabase
      .from('re_engagement_emails')
      .insert({
        user_id: null, // We'll update this in the calling function
        email_type: 'day_3_update',
        sent_at: new Date().toISOString(),
        email_address: email
      });

    if (recordError) {
      console.error('❌ Error recording day 3 email send:', recordError);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Day 3 email sent successfully' }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('❌ Error in send-day3-email function:', error);
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