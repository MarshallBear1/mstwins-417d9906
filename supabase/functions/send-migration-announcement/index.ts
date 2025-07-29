import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';
import { Resend } from "npm:resend@2.0.0";

const resendApiKey = Deno.env.get("RESEND_API_KEY");
if (!resendApiKey) {
  console.error("❌ RESEND_API_KEY environment variable is not set");
}
const resend = new Resend(resendApiKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendAnnouncementRequest {
  campaign_name: string;
  list_name: string;
  send_to_all?: boolean;
  test_email?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { campaign_name, list_name, send_to_all = false, test_email }: SendAnnouncementRequest = await req.json();

    console.log('📧 Migration announcement request:', { campaign_name, list_name, send_to_all, test_email });

    // Email content for the migration announcement
    const emailSubject = "Important Update: SharedGenes is Moving to MStwins!";
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin-bottom: 10px;">🚀 Exciting News!</h1>
          <h2 style="color: #4b5563;">SharedGenes is Moving to MStwins.com</h2>
        </div>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
            Hello from the SharedGenes team!
          </p>
          
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
            We're excited to announce that <strong>SharedGenes.org is moving to our new home at MStwins.com!</strong> 
            This transition represents our commitment to building an even better platform for our community.
          </p>
          
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
            🔥 <strong>What's New:</strong>
          </p>
          <ul style="font-size: 16px; line-height: 1.6; margin-bottom: 15px; padding-left: 20px;">
            <li>Enhanced matching experience</li>
            <li>Improved mobile interface</li>
            <li>Better privacy and security features</li>
            <li>More community features</li>
          </ul>
          
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
            📱 <strong>Mobile App Coming Soon!</strong> Our mobile app is launching in just a few days, 
            bringing you the full MStwins experience right to your pocket.
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://mstwins.com" 
             style="background-color: #2563eb; color: white; padding: 15px 30px; 
                    text-decoration: none; border-radius: 8px; font-weight: bold; 
                    display: inline-block; font-size: 18px;">
            Visit MStwins.com Now
          </a>
        </div>
        
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <p style="font-size: 14px; margin: 0; color: #92400e;">
            <strong>Action Required:</strong> Please visit MStwins.com to create your new account and 
            reconnect with your community. Your data from SharedGenes will not automatically transfer.
          </p>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
          We thought we'd change up a few things to make it more interesting, and we'd love to 
          <strong>hear what you think!</strong> Your feedback has always been valuable to us.
        </p>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
          <p style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">
            Thank you for being part of our journey. We can't wait to see you at MStwins.com!
          </p>
          <p style="font-size: 14px; color: #6b7280; margin: 0;">
            Best regards,<br>
            The MStwins Team
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #9ca3af;">
            This email was sent to announce the migration from SharedGenes.org to MStwins.com
          </p>
        </div>
      </div>
    `;

    if (test_email) {
      // Send test email only
      console.log('📧 Sending test migration announcement email to:', test_email);
      
      const emailResponse = await resend.emails.send({
        from: "MStwins Team <noreply@mstwins.com>",
        to: [test_email],
        subject: `[TEST] ${emailSubject}`,
        html: emailContent,
      });

      console.log('✅ Test email sent successfully:', emailResponse);

      return new Response(JSON.stringify({
        success: true,
        message: 'Test email sent successfully',
        email_id: emailResponse.data?.id
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!send_to_all) {
      return new Response(JSON.stringify({
        error: 'Please specify either test_email or set send_to_all to true'
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log('🔍 Debug: Starting bulk email process...');
    
    // Get the list ID first
    console.log('🔍 Debug: Querying for list:', list_name);
    const { data: listData, error: listError } = await supabaseClient
      .from('announcement_email_lists')
      .select('id')
      .eq('list_name', list_name)
      .single();

    if (listError || !listData) {
      console.error('❌ Failed to find email list:', listError);
      throw new Error(`Email list '${list_name}' not found: ${listError?.message || 'No data returned'}`);
    }

    console.log('✅ Found email list:', listData);

    // Create the campaign directly in database
    console.log('🔍 Debug: Creating campaign in database...');
    const { data: campaignData, error: campaignError } = await supabaseClient
      .from('announcement_campaigns')
      .insert({
        campaign_name,
        subject: emailSubject,
        content: emailContent,
        list_id: listData.id,
        created_by: null // Edge function - no specific user
      })
      .select()
      .single();

    if (campaignError) {
      console.error('❌ Failed to create campaign:', campaignError);
      throw new Error(`Failed to create campaign: ${campaignError.message}`);
    }

    console.log('✅ Campaign created:', campaignData);

    // Get all active email addresses from the list
    console.log('🔍 Debug: Querying email addresses for list:', list_name);
    const { data: emailList, error: emailError } = await supabaseClient
      .from('announcement_email_addresses')
      .select(`
        email,
        announcement_email_lists!inner(list_name)
      `)
      .eq('announcement_email_lists.list_name', list_name)
      .eq('status', 'active');

    if (emailError) {
      console.error('❌ Failed to fetch email list:', emailError);
      throw new Error(`Failed to fetch email list: ${emailError.message}`);
    }

    console.log(`✅ Found ${emailList?.length || 0} active email addresses to send to`);
    if (emailList && emailList.length > 0) {
      console.log('🔍 Debug: First few emails:', emailList.slice(0, 3).map(item => item.email));
    }

    let sentCount = 0;
    let failedCount = 0;
    const batchSize = 10; // Send in batches to avoid overwhelming Resend

    // Send emails in batches
    for (let i = 0; i < (emailList?.length || 0); i += batchSize) {
      const batch = emailList?.slice(i, i + batchSize) || [];
      const batchEmails = batch.map(item => item.email);

      try {
        console.log(`📧 Sending batch ${Math.floor(i / batchSize) + 1}: ${batchEmails.length} emails`);
        
        const emailResponse = await resend.emails.send({
          from: "MStwins Team <noreply@mstwins.com>",
          to: batchEmails,
          subject: emailSubject,
          html: emailContent,
        });

        console.log(`✅ Batch sent successfully:`, emailResponse);
        sentCount += batchEmails.length;

      } catch (error) {
        console.error(`❌ Failed to send batch:`, error);
        console.error(`❌ Batch details: ${batchEmails.length} emails to:`, batchEmails);
        
        // If this is a 400 error from Resend, it might be due to invalid email addresses
        // Let's try sending individually to identify the problematic emails
        if (error?.message?.includes('400')) {
          console.log('🔄 Attempting individual sends for this batch...');
          for (const email of batchEmails) {
            try {
              await resend.emails.send({
                from: "MStwins Team <noreply@mstwins.com>",
                to: [email],
                subject: emailSubject,
                html: emailContent,
              });
              sentCount += 1;
              console.log(`✅ Individual email sent to: ${email}`);
            } catch (individualError) {
              console.error(`❌ Failed to send individual email to ${email}:`, individualError);
              failedCount += 1;
            }
          }
        } else {
          failedCount += batchEmails.length;
        }
      }

      // Wait a bit between batches to be respectful to the email service
      if (i + batchSize < (emailList?.length || 0)) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      }
    }

    // Update campaign status
    const { error: updateError } = await supabaseClient
      .from('announcement_campaigns')
      .update({
        status: failedCount > 0 ? 'completed_with_errors' : 'completed',
        sent_count: sentCount,
        failed_count: failedCount,
        sent_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      })
      .eq('id', campaignData.id);

    if (updateError) {
      console.error('❌ Failed to update campaign status:', updateError);
    }

    console.log(`📊 Campaign completed: ${sentCount} sent, ${failedCount} failed`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Migration announcement emails sent successfully',
      campaign_id: campaignData.id,
      sent_count: sentCount,
      failed_count: failedCount,
      total_emails: emailList?.length || 0
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error('❌ Error in send-migration-announcement function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to send migration announcement emails'
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);