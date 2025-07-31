import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetEmailRequest {
  email: string;
  resetLink: string;
  firstName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, resetLink, firstName }: PasswordResetEmailRequest = await req.json();

    console.log("Sending password reset email to:", email);

    const emailResponse = await resend.emails.send({
      from: "MSTwins Support <team@sharedgenes.org>",
      to: [email],
      subject: "🔐 Reset Your MSTwins Password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 15px; border-radius: 10px; display: inline-block;">
              <span style="color: white; font-size: 24px;">🔐</span>
            </div>
            <h1 style="color: #333; margin-top: 20px;">Password Reset Request</h1>
          </div>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-top: 0;">Hi ${firstName || 'there'}! 👋</h2>
            <p style="color: #666; line-height: 1.6;">
              You requested to reset your password for your MSTwins account. Click the button below to set a new password.
            </p>
            <p style="color: #666; line-height: 1.6;">
              <strong>This is NOT a magic link</strong> - you'll need to enter a new password on the secure reset page.
            </p>
            <p style="color: #666; line-height: 1.6;">
              If you didn't request this password reset, you can safely ignore this email.
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background: #6366f1; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
              🔐 Reset My Password
            </a>
          </div>

          <div style="background: #fef3c7; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <h3 style="color: #333; margin-top: 0;">🔒 Security Information</h3>
            <p style="color: #666; line-height: 1.6;">
              • This link will take you to a secure password reset page<br/>
              • You'll be asked to enter a new password<br/>
              • The link expires in 24 hours for your security<br/>
              • Your current password remains active until you complete the reset
            </p>
          </div>

          <div style="background: #f0fdf4; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <h3 style="color: #333; margin-top: 0;">💬 Need Help?</h3>
            <p style="color: #666; line-height: 1.6;">
              If you're having trouble with the password reset or have any questions, please don't hesitate to reach out to our support team.
            </p>
            <div style="text-align: center; margin: 15px 0;">
              <a href="mailto:team@sharedgenes.org?subject=Password Reset Help" style="background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Contact Support
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
              This email was sent to ${email} from MSTwins. If you didn't request this password reset, please ignore this email.
            </p>
            <p style="color: #999; font-size: 12px; margin-top: 10px;">
              For your security, this link will expire in 24 hours.
            </p>
          </div>
        </div>
      `,
    });

    console.log("Password reset email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Password reset email sent successfully",
      id: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending password reset email:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);