import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PatrickEmailRequest {
  email: string;
  firstName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, firstName }: PatrickEmailRequest = await req.json();

    console.log("Sending personalized feedback response email to:", email);

    // Use background task for email sending to improve performance
    const emailTask = async () => {
      try {
        const emailResponse = await resend.emails.send({
          from: "MSTwins Team <team@sharedgenes.org>",
          to: [email],
          subject: "Thank you for your feedback - Password Reset Link Sent 💙",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 15px; border-radius: 10px; display: inline-block;">
                  <span style="color: white; font-size: 24px;">💙</span>
                </div>
                <h1 style="color: #333; margin-top: 20px;">Thank You for Your Feedback!</h1>
              </div>
              
              <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                <h2 style="color: #333; margin-top: 0;">Hi ${firstName || 'Patrick'}! 👋</h2>
                <p style="color: #666; line-height: 1.6;">
                  Thank you so much for taking the time to provide feedback about MSTwins. Your input is incredibly valuable to us as we continue to improve our platform for the MS community.
                </p>
                <p style="color: #666; line-height: 1.6;">
                  We truly appreciate your engagement and willingness to help make MSTwins better for everyone.
                </p>
              </div>

              <div style="background: #fef3c7; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                <h3 style="color: #333; margin-top: 0;">🔑 Password Reset Link Sent</h3>
                <p style="color: #666; line-height: 1.6;">
                  We've sent you a password reset link to help you access your account. Please check your email inbox (and spam folder just in case) for the reset instructions.
                </p>
                <p style="color: #666; line-height: 1.6;">
                  <strong>Please let me know when the password reset works for you!</strong> I want to make sure everything is functioning properly on our end.
                </p>
              </div>

              <div style="background: #f0fdf4; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                <h3 style="color: #333; margin-top: 0;">💬 Stay in Touch</h3>
                <p style="color: #666; line-height: 1.6;">
                  If you have any other feedback, suggestions, or if you encounter any issues, please don't hesitate to reach out. Your experience matters to us, and we're here to help.
                </p>
                <div style="text-align: center; margin: 20px 0;">
                  <a href="mailto:team@sharedgenes.org" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                    Contact MSTwins Team
                  </a>
                </div>
              </div>

              <div style="text-align: center; margin-top: 30px;">
                <p style="color: #888; font-size: 14px;">
                  🚫 Not for dating • 💙 MS support network • 🤝 Community focused
                </p>
              </div>

              <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="color: #999; font-size: 12px;">
                  This email was sent to ${email}. Thank you for being part of the MSTwins community!
                </p>
                <p style="color: #999; font-size: 12px; margin-top: 10px;">
                  Best regards,<br>Marshall @ MSTwins
                </p>
              </div>
            </div>
          `,
        });

        console.log("Patrick feedback response email sent successfully:", emailResponse);
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
      message: "Patrick feedback response email queued for delivery" 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error processing Patrick feedback response email:", error);
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