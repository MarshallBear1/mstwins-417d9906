import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  preview_only?: boolean;
  preview_email?: string;
}

const getEmailTemplate = (firstName: string) => ({
  subject: "🎉 Bug Fixed! Come Back & Like People - Amazing Community Growth!",
  html: `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Liking Bug Fixed - MSTwins</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">🤖 MSTwins Here!</h1>
            <p style="color: #666; font-size: 16px;">Great news from your friendly neighborhood dating app!</p>
        </div>
        
        <div style="background: linear-gradient(135deg, #f0f9ff, #e0f2fe); padding: 25px; border-radius: 12px; margin-bottom: 25px;">
            <h2 style="color: #0369a1; margin-top: 0; margin-bottom: 15px;">🎉 Bug Fixed - Liking System is Back!</h2>
            <p>Hi ${firstName}!</p>
            <p style="font-size: 16px; margin-bottom: 15px;">
                <strong>Excellent news!</strong> We've completely fixed the liking bug that was preventing you from expressing interest in other amazing people in our community.
            </p>
            <p style="font-size: 16px; margin-bottom: 15px;">
                The liking system is now <strong>100% working</strong> and ready for you to start connecting with potential matches again! 💕
            </p>
        </div>

        <div style="background: #fefce8; border-left: 4px solid #eab308; padding: 20px; margin-bottom: 25px;">
            <h3 style="color: #a16207; margin-top: 0; margin-bottom: 10px;">🚀 Incredible Community Growth!</h3>
            <p style="margin-bottom: 10px;">
                We're absolutely thrilled to share that we've built an <strong>amazing community in under 2 weeks</strong>! 
                The response has been overwhelming, and we couldn't be more excited about the connections happening.
            </p>
            <p style="margin-bottom: 0;">
                <strong>This is just the beginning</strong> - with the liking system now fully functional, we expect even more incredible matches and connections! 🌟
            </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <a href="https://mstwins.lovable.app" 
               style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; display: inline-block; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
                ❤️ Start Liking People Now!
            </a>
        </div>

        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="color: #475569; margin-top: 0; margin-bottom: 15px;">💬 We'd Love Your Feedback!</h3>
            <p style="margin-bottom: 10px;">
                As we continue to grow and improve MSTwins, your input is invaluable. What features would you love to see next? 
                How can we make your dating experience even better?
            </p>
            <p style="margin-bottom: 0;">
                <strong>Reply to this email</strong> with your thoughts, suggestions, or just to say hello! We read every message. 📧
            </p>
        </div>

        <div style="background: #ecfdf5; border: 1px solid #10b981; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="color: #047857; margin-top: 0; margin-bottom: 15px;">🤝 Help Us Grow!</h3>
            <p style="margin-bottom: 10px;">
                Know someone who would benefit from connecting with others who understand the MS journey? 
                MSTwins is all about building a supportive community where real understanding leads to meaningful connections.
            </p>
            <p style="margin-bottom: 0;">
                <strong>Share MSTwins</strong> with friends, family, or anyone in the MS community who might be looking for love, friendship, or support! 💕
            </p>
        </div>

        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #e5e7eb; margin-top: 30px;">
            <p style="color: #6b7280; margin-bottom: 10px;">
                Keep being awesome! 🌟<br>
                <strong>The MSTwins Team 🤖</strong>
            </p>
            <p style="color: #9ca3af; font-size: 14px; margin-bottom: 0;">
                MSTwins - Where Understanding Meets Love ❤️<br>
                <a href="https://mstwins.lovable.app" style="color: #3b82f6;">mstwins.lovable.app</a>
            </p>
        </div>
    </body>
    </html>
  `
});

const handler = async (req: Request): Promise<Response> => {
  console.log('Liking bug fix email function called');

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { preview_only = false, preview_email }: EmailRequest = await req.json();
    console.log('Request params:', { preview_only, preview_email });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (preview_only) {
      if (!preview_email) {
        throw new Error('Preview email address is required');
      }

      console.log('Sending preview email to:', preview_email);
      const template = getEmailTemplate('Preview User');
      
      console.log('Email template generated, sending via Resend...');
      const emailResponse = await resend.emails.send({
        from: "MSTwins <team@sharedgenes.org.uk>",
        to: [preview_email],
        subject: template.subject,
        html: template.html,
      });

      console.log('Resend response:', emailResponse);
      
      if (emailResponse.error) {
        console.error('Resend error:', emailResponse.error);
        throw new Error(`Email send failed: ${emailResponse.error.message}`);
      }

      console.log('Preview email sent successfully:', emailResponse.data?.id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Preview email sent successfully',
          email_id: emailResponse.data?.id 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Send to all users
    console.log('Fetching all user profiles for bulk email send');
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, first_name')
      .not('first_name', 'is', null);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw new Error(`Failed to fetch user profiles: ${profilesError.message}`);
    }

    console.log(`Found ${profiles?.length || 0} profiles to email`);

    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'No user profiles found' 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get user emails from auth.users
    const userIds = profiles.map(p => p.user_id);
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('Error fetching auth users:', authError);
      throw new Error(`Failed to fetch user emails: ${authError.message}`);
    }

    console.log(`Found ${authUsers?.users?.length || 0} auth users`);

    // Create user ID to email mapping
    const userEmailMap = new Map();
    authUsers.users?.forEach(user => {
      if (user.email) {
        userEmailMap.set(user.id, user.email);
      }
    });

    console.log(`Created email map with ${userEmailMap.size} entries`);

    // Send emails in batches
    const batchSize = 10;
    const batches = [];
    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < profiles.length; i += batchSize) {
      const batch = profiles.slice(i, i + batchSize);
      
      const emailPromises = batch
        .filter(profile => userEmailMap.has(profile.user_id))
        .map(async (profile) => {
          try {
            const email = userEmailMap.get(profile.user_id);
            const template = getEmailTemplate(profile.first_name || 'Friend');
            
            const result = await resend.emails.send({
              from: "MSTwins <team@sharedgenes.org.uk>",
              to: [email],
              subject: template.subject,
              html: template.html,
            });

            console.log(`Email sent to ${email}:`, result.data?.id);
            return { success: true, email, id: result.data?.id };
          } catch (error) {
            console.error(`Failed to send email to profile ${profile.user_id}:`, error);
            return { success: false, email: userEmailMap.get(profile.user_id), error: error.message };
          }
        });

      const batchResults = await Promise.all(emailPromises);
      
      batchResults.forEach(result => {
        if (result.success) {
          successCount++;
        } else {
          failedCount++;
          errors.push(`${result.email}: ${result.error}`);
        }
      });

      // Rate limiting: wait 1 second between batches
      if (i + batchSize < profiles.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const stats = {
      total_profiles: profiles.length,
      total_with_emails: userEmailMap.size,
      success_count: successCount,
      failed_count: failedCount,
      errors: errors.slice(0, 10) // Limit error list
    };

    console.log('Bulk email campaign completed:', stats);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Liking bug fix announcement sent to ${successCount} users`,
        stats
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error in liking bug fix email function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'An unexpected error occurred' 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);