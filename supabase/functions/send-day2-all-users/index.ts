import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const getDayTwoEmailTemplate = (firstName: string = "there") => ({
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
        <h2 style="color: #333; margin-top: 0;">Hi ${firstName}! 👋</h2>
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
          This email was sent because you joined MSTwins 2 days ago. We hope you're enjoying your experience!
        </p>
      </div>
    </div>
  `,
});

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting Day 2 email campaign for all eligible users...");

    // Get users who created their profiles exactly 2 days ago
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const startOfDay = new Date(twoDaysAgo);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(twoDaysAgo);
    endOfDay.setHours(23, 59, 59, 999);

    console.log(`Looking for profiles created between ${startOfDay.toISOString()} and ${endOfDay.toISOString()}`);

    // Get profiles created 2 days ago
    const { data: eligibleProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, first_name')
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString());

    if (profilesError) {
      throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
    }

    if (!eligibleProfiles || eligibleProfiles.length === 0) {
      console.log("No eligible profiles found for Day 2 emails");
      return new Response(JSON.stringify({
        success: true,
        message: "No eligible users found for Day 2 emails",
        stats: { eligible_users: 0, emails_sent: 0, errors: 0 }
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`Found ${eligibleProfiles.length} eligible profiles`);

    // Get email addresses from auth.users
    const userIds = eligibleProfiles.map(p => p.user_id);
    let allUsers = [];
    let page = 1;
    const perPage = 1000;

    // Fetch all users with pagination
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
      
      if (users.users.length < perPage) {
        break;
      }
      
      page++;
    }

    console.log(`Found ${allUsers.length} total users in auth`);

    // Create email list by matching profiles with auth users
    const userEmailMap = new Map(allUsers.map(user => [user.id, user.email]));
    
    const emailList = eligibleProfiles
      .map(profile => ({
        email: userEmailMap.get(profile.user_id),
        firstName: profile.first_name || 'there',
        userId: profile.user_id
      }))
      .filter(item => item.email); // Only include users with emails

    console.log(`Prepared ${emailList.length} emails to send`);

    // Check which users have already received Day 2 emails to avoid duplicates
    const { data: existingDay2Emails, error: existingEmailsError } = await supabase
      .from('re_engagement_emails')
      .select('user_id')
      .eq('email_type', 'day_2')
      .in('user_id', userIds);

    if (existingEmailsError) {
      console.error("Error checking existing Day 2 emails:", existingEmailsError);
    }

    const alreadySentUserIds = new Set(existingDay2Emails?.map(e => e.user_id) || []);
    const usersToEmail = emailList.filter(user => !alreadySentUserIds.has(user.userId));

    console.log(`${usersToEmail.length} users need Day 2 emails (${alreadySentUserIds.size} already sent)`);

    if (usersToEmail.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: "All eligible users have already received Day 2 emails",
        stats: { eligible_users: emailList.length, emails_sent: 0, already_sent: alreadySentUserIds.size }
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let successCount = 0;
    let errorCount = 0;
    const results = [];

    // Send emails in batches to respect rate limits
    const batchSize = 2; // Resend allows 2 requests per second
    
    for (let i = 0; i < usersToEmail.length; i += batchSize) {
      const batch = usersToEmail.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async ({ email, firstName, userId }) => {
        try {
          const emailTemplate = getDayTwoEmailTemplate(firstName);
          
          const result = await resend.emails.send({
            from: "MSTwins <marshall@sharedgenes.org>",
            to: [email!],
            subject: emailTemplate.subject,
            html: emailTemplate.html,
          });

          // Track that we've sent this email
          await supabase
            .from('re_engagement_emails')
            .insert({
              user_id: userId,
              email_type: 'day_2'
            });

          console.log(`Day 2 email sent successfully to ${email}:`, result);
          successCount++;
          return { email, status: 'success', result };
        } catch (error) {
          console.error(`Failed to send Day 2 email to ${email}:`, error);
          errorCount++;
          return { email, status: 'failed', error: error.message };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults.map(result => 
        result.status === 'fulfilled' ? result.value : { status: 'failed', error: result.reason }
      ));

      // Wait 1 second between batches to respect rate limits
      if (i + batchSize < usersToEmail.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`Day 2 email campaign completed. Success: ${successCount}, Failed: ${errorCount}`);

    return new Response(JSON.stringify({
      success: true,
      message: `Day 2 email campaign completed`,
      stats: {
        eligible_users: eligibleProfiles.length,
        users_with_emails: emailList.length,
        already_sent: alreadySentUserIds.size,
        emails_sent: successCount,
        errors: errorCount
      },
      results: results
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in send-day2-all-users function:", error);
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