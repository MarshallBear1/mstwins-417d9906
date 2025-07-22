import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  firstName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, firstName }: WelcomeEmailRequest = await req.json();

    console.log("Sending welcome email to:", email);

    // Use background task for email sending to improve performance
    const emailTask = async () => {
      try {
        const emailResponse = await resend.emails.send({
          from: "MSTwins <onboarding@resend.dev>",
          to: [email],
          subject: "Welcome to MSTwins! 💙",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 15px; border-radius: 10px; display: inline-block;">
                  <span style="color: white; font-size: 24px;">💙</span>
                </div>
                <h1 style="color: #333; margin-top: 20px;">Welcome to MSTwins!</h1>
              </div>
              
              <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                <h2 style="color: #333; margin-top: 0;">Hi ${firstName || 'there'}! 👋</h2>
                <p style="color: #666; line-height: 1.6;">
                  Thank you for joining MSTwins, a supportive community designed specifically for people living with Multiple Sclerosis.
                </p>
                <p style="color: #666; line-height: 1.6;">
                  We're here to help you connect with others who understand your journey, share experiences, and build meaningful friendships within our MS community.
                </p>
              </div>

              <div style="background: #fef3c7; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                <h3 style="color: #333; margin-top: 0;">🤝 Community Guidelines</h3>
                <ul style="color: #666; line-height: 1.6;">
                  <li>Focus on supportive, non-romantic connections</li>
                  <li>Share experiences and offer encouragement</li>
                  <li>Respect everyone's MS journey and challenges</li>
                  <li>Build lasting friendships within our community</li>
                </ul>
              </div>

              <div style="text-align: center; margin-top: 30px;">
                <p style="color: #888; font-size: 14px;">
                  🚫 Not for dating • 💙 MS support network • 🤝 Community focused
                </p>
              </div>

              <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="color: #999; font-size: 12px;">
                  This email was sent to ${email}. If you didn't sign up for MSTwins, you can safely ignore this email.
                </p>
              </div>
            </div>
          `,
        });

        console.log("Welcome email sent successfully:", emailResponse);
        return emailResponse;
      } catch (error) {
        console.error("Background email task failed:", error);
        throw error;
      }
    };

    // Start background task and return immediate response
    EdgeRuntime.waitUntil(emailTask());

    // Return immediate success response
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Welcome email queued for delivery" 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error processing welcome email request:", error);
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