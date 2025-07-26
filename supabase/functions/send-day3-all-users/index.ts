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
    // For testing - send only to specific email
    const testEmail = "marshallgould303030@gmail.com";
    
    console.log(`📧 Sending day 3 email to test user: ${testEmail}`);

    let successCount = 0;
    let errorCount = 0;

    try {
      console.log(`📧 Sending day 3 email to: ${testEmail}`);
      
      // Call the individual email function
      const emailResponse = await supabase.functions.invoke('send-day3-email', {
        body: {
          email: testEmail,
          first_name: "Marshall",
        }
      });

      if (emailResponse.error) {
        console.error(`❌ Error sending day 3 email:`, emailResponse.error);
        errorCount++;
      } else {
        successCount++;
        console.log(`✅ Day 3 email sent successfully to: ${testEmail}`);
      }
      
    } catch (error) {
      console.error(`❌ Error processing email:`, error);
      errorCount++;
    }

    const result = {
      success: true,
      message: `Day 3 emails processing completed`,
      total_users: 1,
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