import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Day2EmailRequest {
  email: string;
  firstName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, firstName }: Day2EmailRequest = await req.json();

    console.log("Sending Day 2 email to:", email);

    // Use background task for email sending to improve performance
    const emailTask = async () => {
      try {
        const emailResponse = await resend.emails.send({
          from: "MSTwins <marshall@sharedgenes.org>",
          to: [email],
          subject: "How's your MSTwins experience going? 💙",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 15px; border-radius: 10px; display: inline-block;">
                  <span style="color: white; font-size: 24px;">💙</span>
                </div>
                <h1 style="color: #333; margin-top: 20px;">Day 2 with MSTwins!</h1>
              </div>
              
              <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                <h2 style="color: #333; margin-top: 0;">Hi ${firstName || 'there'}! 👋</h2>
                <p style="color: #666; line-height: 1.6;">
                  Thank you for joining MSTwins! We hope you're enjoying the platform and starting to connect with our amazing MS community.
                </p>
                <p style="color: #666; line-height: 1.6;">
                  Your presence here helps make our community stronger and more supportive for everyone living with Multiple Sclerosis.
                </p>
              </div>

              <div style="background: #fef3c7; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                <h3 style="color: #333; margin-top: 0;">📝 We'd Love Your Feedback!</h3>
                <p style="color: #666; line-height: 1.6;">
                  Your feedback is incredibly valuable to us as we continue improving MSTwins. Whether it's suggestions, ideas, or just letting us know how your experience has been so far - we'd love to hear from you!
                </p>
                <div style="text-align: center; margin: 20px 0;">
                  <a href="mailto:marshall@sharedgenes.org?subject=MSTwins Feedback" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                    Share Your Feedback
                  </a>
                </div>
              </div>

              <div style="background: #f0fdf4; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                <h3 style="color: #333; margin-top: 0;">🤝 Help Grow Our Community</h3>
                <p style="color: #666; line-height: 1.6;">
                  If you're enjoying MSTwins, we'd be grateful if you could share it with your MS communities, support groups, or friends who might benefit from connecting with others who understand their journey.
                </p>
                <div style="text-align: center; margin: 20px 0;">
                  <a href="https://mstwins.com" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                    Share MSTwins.com
                  </a>
                </div>
                <p style="color: #666; font-size: 14px; text-align: center; margin-bottom: 0;">
                  Together, we can build the most supportive MS community online 💙
                </p>
              </div>

              <div style="text-align: center; margin-top: 30px;">
                <p style="color: #888; font-size: 14px;">
                  🚫 Not for dating • 💙 MS support network • 🤝 Community focused
                </p>
              </div>

              <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="color: #999; font-size: 12px;">
                  This email was sent to ${email}. We hope you're enjoying your MSTwins experience!
                </p>
              </div>
            </div>
          `,
        });

        console.log("Day 2 email sent successfully:", emailResponse);
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
      message: "Day 2 email queued for delivery" 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error processing Day 2 email request:", error);
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