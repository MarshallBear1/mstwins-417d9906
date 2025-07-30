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
  subject: "🐛 Bug Fixes + 💬 New Forum Feature - MST wins Updates!",
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>MST wins - Latest Updates</title>
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
            We've been hard at work improving your MST wins experience! Here's what's new and fixed in our latest update.
          </p>

          <!-- Bug Fixes Section -->
          <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 25px 0; border-radius: 4px;">
            <h3 style="color: #065f46; margin: 0 0 15px 0; font-size: 18px;">🐛 Bug Fixes & Improvements</h3>
            <ul style="color: #047857; margin: 0; padding-left: 20px; line-height: 1.8;">
              <li>Fixed profile dialog positioning issues in chat</li>
              <li>Improved likes tab to exclude already matched users</li>
              <li>Enhanced mobile responsiveness across the platform</li>
              <li>Resolved various performance issues</li>
              <li>Better error handling and user feedback</li>
            </ul>
          </div>

          <!-- New Forum Feature -->
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 4px;">
            <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 18px;">💬 NEW: Community Forum!</h3>
            <p style="color: #a16207; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">
              🎉 Introducing our brand new community forum!
            </p>
            <ul style="color: #a16207; margin: 0; padding-left: 20px; line-height: 1.8;">
              <li>Share experiences and support each other</li>
              <li>Ask questions and get answers from the community</li>
              <li>Discuss MS-related topics in a safe space</li>
              <li>Like and comment on posts</li>
              <li>Connect beyond just dating and relationships</li>
            </ul>
          </div>

          <p style="color: #4a5568; line-height: 1.6; margin: 20px 0; font-size: 16px;">
            The forum is perfect for building deeper connections within our MS community. Whether you want to share tips, ask for advice, or just chat with others who understand your journey!
          </p>

          <!-- Call to Action Buttons -->
          <div style="text-align: center; margin: 35px 0;">
            <a href="https://mstwins.com/dashboard?tab=forum" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold; margin: 0 10px 15px 0; font-size: 16px;">
              💬 Try the Forum
            </a>
            <a href="https://mstwins.com/dashboard" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold; margin: 0 10px 15px 0; font-size: 16px;">
              🔥 Log Back In
            </a>
          </div>

          <div style="background-color: #edf2f7; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center;">
            <h4 style="color: #2d3748; margin: 0 0 15px 0; font-size: 16px;">Keep the Feedback Coming!</h4>
            <p style="color: #4a5568; margin: 0 0 15px 0; font-size: 14px;">
              Your feedback helps us build the best possible experience for our community.
            </p>
            <a href="https://mstwins.com/dashboard" style="display: inline-block; background-color: #4299e1; color: #ffffff; text-decoration: none; padding: 10px 25px; border-radius: 6px; font-weight: bold; font-size: 14px;">
              💝 Send Feedback
            </a>
          </div>

          <p style="color: #4a5568; line-height: 1.6; margin: 25px 0 0 0; font-size: 16px;">
            Thank you for being part of our growing MS community. Together, we're building something truly special! 💜
          </p>

          <p style="color: #4a5568; line-height: 1.6; margin: 15px 0 0 0; font-size: 16px;">
            With love and support,<br>
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
        from: "MST wins Team <team@sharedgenes.org>",
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

    // Get email addresses from auth.users table - fetch ALL users with pagination
    const userIds = profiles.map(p => p.user_id);
    
    let allUsers = [];
    let page = 1;
    const perPage = 1000; // Max allowed by Supabase
    
    while (true) {
      const { data: users, error: usersError } = await supabase.auth.admin.listUsers({
        page: page,
        perPage: perPage
      });
      
      if (usersError) {
        throw new Error(`Failed to fetch users: ${usersError.message}`);
      }
      
      if (!users || users.users.length === 0) {
        break;
      }
      
      allUsers.push(...users.users);
      
      // If we got fewer users than perPage, we've reached the end
      if (users.users.length < perPage) {
        break;
      }
      
      page++;
    }
    
    console.log(`Found ${allUsers.length} total users`);

    // Create a map of user_id to email and match with profiles
    const userEmailMap = new Map(allUsers.map(user => [user.id, user.email]));
    
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
            from: "MST wins Team <team@sharedgenes.org>",
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