import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AnnouncementEmailRequest {
  preview_only?: boolean;
  preview_email?: string;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const getEmailTemplate = (firstName: string = "there") => ({
  subject: "🎉 Day 1 Complete - Thank You & New Updates Inside!",
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>MST wins - Day 1 Update</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">MST wins</h1>
          <p style="color: #e2e8f0; margin: 10px 0 0 0; font-size: 16px;">Connecting the MS Community</p>
        </div>

        <!-- Main Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #1a202c; margin: 0 0 20px 0; font-size: 24px;">Hey ${firstName}! 🎉</h2>
          
          <p style="color: #4a5568; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
            What an incredible first day! We're absolutely amazed by the response from our MS community. 
            <strong>Thank you</strong> for being part of this journey from day one.
          </p>

          <div style="background-color: #f7fafc; border-left: 4px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 4px;">
            <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 18px;">🚀 New Features Just Dropped!</h3>
            <ul style="color: #4a5568; margin: 0; padding-left: 20px; line-height: 1.8;">
              <li>Enhanced profile viewing with flippable cards</li>
              <li>Improved messaging experience</li>
              <li>Better match discovery</li>
              <li>Smoother notifications</li>
            </ul>
          </div>

          <p style="color: #4a5568; line-height: 1.6; margin: 20px 0; font-size: 16px;">
            We'd love to hear your thoughts! Your feedback helps us build the best possible experience for our community.
          </p>

          <!-- Call to Action Buttons -->
          <div style="text-align: center; margin: 35px 0;">
            <a href="https://7940c4cb-942f-48c4-aaf2-3eeabcbd074e.lovableproject.com/dashboard" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold; margin: 0 10px 15px 0; font-size: 16px;">
              🔥 Log Back In
            </a>
            <a href="https://7940c4cb-942f-48c4-aaf2-3eeabcbd074e.lovableproject.com/" style="display: inline-block; background-color: #48bb78; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold; margin: 0 10px 15px 0; font-size: 16px;">
              💝 Refer Friends
            </a>
          </div>

          <div style="background-color: #edf2f7; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center;">
            <h4 style="color: #2d3748; margin: 0 0 15px 0; font-size: 16px;">Help Us Improve!</h4>
            <p style="color: #4a5568; margin: 0 0 15px 0; font-size: 14px;">
              Your feedback shapes our platform. Let us know what you think!
            </p>
            <a href="https://7940c4cb-942f-48c4-aaf2-3eeabcbd074e.lovableproject.com/dashboard" style="display: inline-block; background-color: #4299e1; color: #ffffff; text-decoration: none; padding: 10px 25px; border-radius: 6px; font-weight: bold; font-size: 14px;">
              💬 Send Feedback
            </a>
          </div>

          <p style="color: #4a5568; line-height: 1.6; margin: 25px 0 0 0; font-size: 16px;">
            Together, we're building something special for the MS community. Thank you for being part of this journey! 💜
          </p>

          <p style="color: #4a5568; line-height: 1.6; margin: 15px 0 0 0; font-size: 16px;">
            With gratitude,<br>
            <strong>The MST wins Team</strong>
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f7fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #718096; margin: 0; font-size: 12px;">
            You're receiving this because you're part of the MST wins community.<br>
            If you have any questions, feel free to reach out to us anytime.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
});

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { preview_only = false, preview_email }: AnnouncementEmailRequest = await req.json();

    if (preview_only && preview_email) {
      // Send preview email
      console.log(`Sending preview email to: ${preview_email}`);
      
      const emailTemplate = getEmailTemplate("Preview User");
      
      const emailResponse = await resend.emails.send({
        from: "MST wins Team <onboarding@resend.dev>",
        to: [preview_email],
        subject: `[PREVIEW] ${emailTemplate.subject}`,
        html: emailTemplate.html,
      });

      console.log("Preview email sent successfully:", emailResponse);

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Preview email sent successfully",
        email_response: emailResponse 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get all users with email addresses
    console.log("Fetching all users...");
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, first_name');

    if (profilesError) {
      throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
    }

    if (!profiles || profiles.length === 0) {
      throw new Error('No profiles found');
    }

    console.log(`Found ${profiles.length} profiles`);

    // Get email addresses from auth.users table
    const userIds = profiles.map(p => p.user_id);
    
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    console.log(`Found ${users.users.length} users`);

    // Create a map of user_id to email and match with profiles
    const userEmailMap = new Map(users.users.map(user => [user.id, user.email]));
    
    const emailList = profiles
      .map(profile => ({
        email: userEmailMap.get(profile.user_id),
        firstName: profile.first_name || 'there'
      }))
      .filter(item => item.email); // Only include users with emails

    console.log(`Sending announcement email to ${emailList.length} users`);

    const emailTemplate = getEmailTemplate();
    let successCount = 0;
    let failureCount = 0;
    const results = [];

    // Send emails in batches to avoid rate limits
    const batchSize = 2; // Resend allows 2 requests per second
    
    for (let i = 0; i < emailList.length; i += batchSize) {
      const batch = emailList.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async ({ email, firstName }) => {
        try {
          const personalizedTemplate = getEmailTemplate(firstName);
          
          const result = await resend.emails.send({
            from: "MST wins Team <onboarding@resend.dev>",
            to: [email!],
            subject: personalizedTemplate.subject,
            html: personalizedTemplate.html,
          });

          console.log(`Announcement email sent successfully to ${email}:`, result);
          successCount++;
          return { email, status: 'success', result };
        } catch (error) {
          console.error(`Failed to send announcement email to ${email}:`, error);
          failureCount++;
          return { email, status: 'failed', error: error.message };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults.map(result => 
        result.status === 'fulfilled' ? result.value : { status: 'failed', error: result.reason }
      ));

      // Wait 1 second between batches to respect rate limits
      if (i + batchSize < emailList.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`Announcement email campaign completed. Success: ${successCount}, Failed: ${failureCount}`);

    return new Response(JSON.stringify({
      success: true,
      message: `Announcement email campaign completed`,
      stats: {
        total_profiles: profiles.length,
        total_with_emails: emailList.length,
        success_count: successCount,
        failure_count: failureCount
      },
      results: results
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in send-announcement-email function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);