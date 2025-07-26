import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const handler = async (req: Request): Promise<Response> => {
  console.log('🚀 Send Day 3 emails to all users function called');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get all verified users from profiles with their emails
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, first_name');

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
      throw profilesError;
    }

    // Get emails from auth.users for these profiles
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      throw usersError;
    }

    // Filter to only verified users and match with profiles
    const verifiedUsers = users.users
      .filter(user => user.email_confirmed_at)
      .map(user => {
        const profile = profiles?.find(p => p.user_id === user.id);
        return {
          email: user.email,
          first_name: profile?.first_name || '',
          user_id: user.id
        };
      })
      .filter(user => user.email);

    console.log(`📧 Found ${verifiedUsers.length} verified users`);

    // Filter out users who already received day 3 email
    const { data: alreadySent, error: sentError } = await supabase
      .from('re_engagement_emails')
      .select('email_address')
      .eq('email_type', 'day_3_update');

    if (sentError) {
      console.error('❌ Error fetching sent emails:', sentError);
      throw sentError;
    }

    const alreadySentEmails = new Set(alreadySent?.map(email => email.email_address) || []);
    const usersToEmail = verifiedUsers.filter(user => !alreadySentEmails.has(user.email));

    console.log(`📧 Sending day 3 emails to ${usersToEmail.length} users (${alreadySentEmails.size} already sent)`);

    let successCount = 0;
    let errorCount = 0;

    // Send emails to all users
    for (const user of usersToEmail) {
      try {
        console.log(`📧 Sending day 3 email to: ${user.email}`);
        
        // Call the individual email function
        const emailResponse = await supabase.functions.invoke('send-day3-email', {
          body: {
            email: user.email,
            first_name: user.first_name,
          }
        });

        if (emailResponse.error) {
          console.error(`❌ Error sending day 3 email to ${user.email}:`, emailResponse.error);
          errorCount++;
        } else {
          successCount++;
          console.log(`✅ Day 3 email sent successfully to: ${user.email}`);
        }
        
        // Small delay between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Error processing email for ${user.email}:`, error);
        errorCount++;
      }
    }

    const result = {
      success: true,
      message: `Day 3 emails processing completed`,
      total_users: usersToEmail.length,
      successful_sends: successCount,
      errors: errorCount
    };

    console.log('📊 Day 3 email batch results:', result);

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('❌ Error in send-day3-all-users function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        total_users: 0,
        successful_sends: 0,
        errors: 1
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);