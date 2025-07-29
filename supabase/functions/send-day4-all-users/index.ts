import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

const handler = async (req: Request): Promise<Response> => {
  console.log('🚀 Send Day 4 to All Users function called');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const sendToAll = body?.sendToAll || false;
    
    console.log(`📧 Send mode: ${sendToAll ? 'ALL USERS' : 'TEST ONLY'}`);

    if (!sendToAll) {
      // Test mode - send only to test email
      const testEmail = "marshallgould303030@gmail.com";
      console.log(`🧪 Test mode: Sending to ${testEmail} only`);
      
      const emailResponse = await supabase.functions.invoke('send-day4-email', {
        body: {
          email: testEmail,
          first_name: "Marshall",
          user_id: null // Test email, no specific user_id
        }
      });

      if (emailResponse.error) {
        console.error(`❌ Error sending test email:`, emailResponse.error);
        throw new Error(`Test email failed: ${emailResponse.error.message}`);
      }

      const result = {
        success: true,
        message: 'Day 4 test email sent successfully',
        test_mode: true,
        test_email: testEmail,
        stats: {
          total_users: 1,
          emails_sent: 1,
          errors: 0
        }
      };

      console.log('✅ Test email sent successfully:', result);

      return new Response(
        JSON.stringify(result),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Production mode - send to ALL users regardless of join date
    console.log(`🔍 Looking for ALL users who haven't received day 4 email yet`);

    // Get ALL users who haven't received day 4 email yet
    const { data: usersToEmail, error: usersError } = await supabase
      .from('profiles')
      .select(`
        user_id,
        first_name,
        created_at
      `)
      .not('user_id', 'in', `(
        SELECT user_id 
        FROM re_engagement_emails 
        WHERE email_type = 'day4_engagement'
      )`);

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      throw new Error(`Database error: ${usersError.message}`);
    }

    if (!usersToEmail || usersToEmail.length === 0) {
      console.log('ℹ️ No users found who need day 4 emails');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No users found who need day 4 emails',
          stats: {
            total_users: 0,
            emails_sent: 0,
            errors: 0
          }
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`📋 Found ${usersToEmail.length} users who need day 4 emails`);

    // Get email addresses for these users
    const userIds = usersToEmail.map(user => user.user_id);
    const { data: userEmails, error: emailError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000 // Adjust if you have more users
    });

    if (emailError) {
      console.error('❌ Error fetching user emails:', emailError);
      throw new Error(`Email fetch error: ${emailError.message}`);
    }

    // Create a map of user_id to email
    const emailMap = new Map();
    userEmails.users?.forEach(user => {
      emailMap.set(user.id, user.email);
    });

    let successCount = 0;
    let errorCount = 0;

    // Send emails to all users
    for (const user of usersToEmail) {
      try {
        const userEmail = emailMap.get(user.user_id);
        if (!userEmail) {
          console.log(`⚠️ No email found for user ${user.user_id}, skipping`);
          errorCount++;
          continue;
        }

        console.log(`📧 Sending day 4 email to: ${userEmail}`);
        
        // Call the individual email function
        const emailResponse = await supabase.functions.invoke('send-day4-email', {
          body: {
            email: userEmail,
            first_name: user.first_name,
            user_id: user.user_id
          }
        });

        if (emailResponse.error) {
          console.error(`❌ Error sending day 4 email to ${userEmail}:`, emailResponse.error);
          errorCount++;
        } else {
          console.log(`✅ Day 4 email sent successfully to ${userEmail}`);
          successCount++;
        }

        // Add a small delay to avoid overwhelming the email service
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Error processing user ${user.user_id}:`, error);
        errorCount++;
      }
    }

    const result = {
      success: true,
      message: `Day 4 emails processing complete`,
      stats: {
        total_users: usersToEmail.length,
        emails_sent: successCount,
        errors: errorCount
      }
    };

    console.log('📊 Day 4 email campaign results:', result);

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('❌ Error in send-day4-all-users function:', error);
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