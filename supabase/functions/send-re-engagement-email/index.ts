import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReEngagementEmailRequest {
  email: string;
  firstName?: string;
  emailType: '24_hours' | '48_hours' | '1_week' | 'likes_refreshed';
  hoursOffline?: number;
}

const getEmailContent = (emailType: string, firstName: string, hoursOffline?: number) => {
  const name = firstName || 'there';
  
  switch (emailType) {
    case '24_hours':
      return {
        subject: "We miss you at MSTwins! 💙",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 15px; border-radius: 10px; display: inline-block;">
                <span style="color: white; font-size: 24px;">💙</span>
              </div>
              <h1 style="color: #333; margin-top: 20px;">We Miss You!</h1>
            </div>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
              <h2 style="color: #333; margin-top: 0;">Hi ${name}! 👋</h2>
              <p style="color: #666; line-height: 1.6;">
                It's been about a day since we've seen you in the MSTwins community. Your MS family is wondering where you are!
              </p>
              <p style="color: #666; line-height: 1.6;">
                There might be new people looking to connect with someone just like you. Don't miss out on forming meaningful friendships.
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="https://mstwins.com" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Return to MSTwins
              </a>
            </div>

            <div style="background: #e0f2fe; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
              <h3 style="color: #333; margin-top: 0;">🌟 What You're Missing</h3>
              <ul style="color: #666; line-height: 1.6;">
                <li>New members who share your MS journey</li>
                <li>Supportive conversations and encouragement</li>
                <li>Potential matches for meaningful friendships</li>
                <li>A community that truly understands</li>
              </ul>
            </div>

            <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px;">
                You're receiving this because you're part of the MSTwins community. 
                <a href="https://mstwins.com" style="color: #6366f1;">Visit MSTwins.com</a>
              </p>
            </div>
          </div>
        `
      };
      
    case '48_hours':
      return {
        subject: "Your MSTwins community is waiting for you 💙",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 15px; border-radius: 10px; display: inline-block;">
                <span style="color: white; font-size: 24px;">💙</span>
              </div>
              <h1 style="color: #333; margin-top: 20px;">Come Back to Your Community</h1>
            </div>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
              <h2 style="color: #333; margin-top: 0;">Hi ${name}! 🤗</h2>
              <p style="color: #666; line-height: 1.6;">
                It's been 2 days since you last visited MSTwins. The community feels a little emptier without you!
              </p>
              <p style="color: #666; line-height: 1.6;">
                Your unique perspective and support could make someone's day brighter. There are people waiting to meet someone exactly like you.
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="https://mstwins.com" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Reconnect with MSTwins
              </a>
            </div>

            <div style="background: #fff3e0; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
              <h3 style="color: #333; margin-top: 0;">💬 Recent Activity</h3>
              <p style="color: #666; line-height: 1.6;">
                While you've been away, new members have joined who might be perfect friendship matches for you. 
                Don't let these connections slip away!
              </p>
            </div>

            <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px;">
                You're receiving this because you're part of the MSTwins community. 
                <a href="https://mstwins.com" style="color: #6366f1;">Visit MSTwins.com</a>
              </p>
            </div>
          </div>
        `
      };
      
    case '1_week':
      return {
        subject: "We really miss you at MSTwins 💙",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 15px; border-radius: 10px; display: inline-block;">
                <span style="color: white; font-size: 24px;">💙</span>
              </div>
              <h1 style="color: #333; margin-top: 20px;">We Really Miss You!</h1>
            </div>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
              <h2 style="color: #333; margin-top: 0;">Dear ${name} 💜</h2>
              <p style="color: #666; line-height: 1.6;">
                It's been a week since we've seen you in the MSTwins community, and you're truly missed.
              </p>
              <p style="color: #666; line-height: 1.6;">
                Living with MS can be challenging, and having a supportive community makes all the difference. 
                Your MSTwins family is here whenever you're ready to reconnect.
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="https://mstwins.com" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Come Home to MSTwins
              </a>
            </div>

            <div style="background: #f3e5f5; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
              <h3 style="color: #333; margin-top: 0;">🤝 Your Community Awaits</h3>
              <p style="color: #666; line-height: 1.6;">
                Remember why you joined MSTwins - to find understanding, support, and genuine connections with people 
                who truly get what you're going through. That community is still here, ready to welcome you back.
              </p>
              <ul style="color: #666; line-height: 1.6;">
                <li>Reconnect with existing matches</li>
                <li>Meet new community members</li>
                <li>Share your experiences and offer support</li>
                <li>Find the understanding you deserve</li>
              </ul>
            </div>

            <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px;">
                You're receiving this because you're a valued member of MSTwins. 
                <a href="https://mstwins.com" style="color: #6366f1;">Visit MSTwins.com</a>
              </p>
            </div>
          </div>
        `
      };
      
    case 'likes_refreshed':
      return {
        subject: "Your daily likes have refreshed! 💙",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 15px; border-radius: 10px; display: inline-block;">
                <span style="color: white; font-size: 24px;">💙</span>
              </div>
              <h1 style="color: #333; margin-top: 20px;">Your Likes Have Refreshed!</h1>
            </div>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
              <h2 style="color: #333; margin-top: 0;">Good news, ${name}! 🎉</h2>
              <p style="color: #666; line-height: 1.6;">
                You've got 10 fresh likes to use today! Yesterday you used all your likes connecting with people in the MSTwins community - that's awesome!
              </p>
              <p style="color: #666; line-height: 1.6;">
                Ready to make more meaningful connections today?
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="https://mstwins.com" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Start Connecting Again
              </a>
            </div>

            <div style="background: #e8f5e8; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
              <h3 style="color: #333; margin-top: 0;">💚 Daily Like Reset</h3>
              <p style="color: #666; line-height: 1.6;">
                Every day at midnight, your likes refresh back to 10. This helps ensure everyone gets a fair chance to connect and keeps our community balanced and engaged.
              </p>
              <ul style="color: #666; line-height: 1.6;">
                <li>10 fresh likes every day</li>
                <li>Use them to connect with new people</li>
                <li>Quality connections over quantity</li>
                <li>Build meaningful friendships</li>
              </ul>
            </div>

            <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px;">
                You're receiving this because you used all your daily likes yesterday. 
                <a href="https://mstwins.com" style="color: #6366f1;">Visit MSTwins.com</a>
              </p>
            </div>
          </div>
        `
      };
      
    default:
      return {
        subject: "Come back to MSTwins! 💙",
        html: `<p>We miss you at MSTwins!</p>`
      };
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, firstName, emailType, hoursOffline }: ReEngagementEmailRequest = await req.json();

    console.log(`Sending ${emailType} re-engagement email to: ${email}`);

    const { subject, html } = getEmailContent(emailType, firstName || '', hoursOffline);

    const emailResponse = await resend.emails.send({
      from: "MSTwins Community <team@sharedgenes.org>",
      to: [email],
      subject,
      html,
    });

    console.log("Re-engagement email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `${emailType} re-engagement email sent successfully`,
      id: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending re-engagement email:", error);
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