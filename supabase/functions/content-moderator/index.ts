import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, contentType, contentId, userId } = await req.json();

    console.log('Moderating content:', { contentType, contentId, userId, contentLength: content?.length });

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    if (!content || typeof content !== 'string') {
      throw new Error('Content is required and must be a string');
    }

    // Call OpenAI Moderation API
    const moderationResponse = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: content,
        model: 'text-moderation-latest'
      }),
    });

    if (!moderationResponse.ok) {
      throw new Error(`OpenAI API error: ${moderationResponse.status}`);
    }

    const moderationData = await moderationResponse.json();
    const result = moderationData.results[0];
    
    console.log('Moderation result:', result);

    // Extract flagged categories
    const flaggedCategories = Object.keys(result.categories).filter(
      category => result.categories[category]
    );

    // Determine if content should be blocked
    const isBlocked = result.flagged || flaggedCategories.some(cat => 
      ['hate', 'harassment', 'self-harm', 'sexual/minors'].includes(cat)
    );

    // Calculate overall confidence score
    const scores = Object.values(result.category_scores) as number[];
    const confidenceScore = Math.max(...scores);

    // Store moderation result in database
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    
    const { data: moderationFlag, error: flagError } = await supabase
      .from('moderation_flags')
      .insert({
        user_id: userId,
        content_type: contentType,
        content_id: contentId,
        content_text: content.substring(0, 2000), // Limit stored content length
        moderation_result: result,
        is_flagged: result.flagged,
        flagged_categories: flaggedCategories,
        confidence_score: confidenceScore,
        status: isBlocked ? 'auto_blocked' : 'approved'
      })
      .select()
      .single();

    if (flagError) {
      console.error('Error storing moderation flag:', flagError);
      throw new Error('Failed to store moderation result');
    }

    console.log('Moderation flag created:', moderationFlag.id);

    // If content is a message and it's blocked, don't allow it to be sent
    if (contentType === 'message' && isBlocked) {
      console.log('Message blocked due to moderation:', flaggedCategories);
      
      // Update message status to blocked
      if (contentId) {
        await supabase
          .from('messages')
          .update({ 
            moderation_status: 'blocked',
            moderation_flag_id: moderationFlag.id
          })
          .eq('id', contentId);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      flagged: result.flagged,
      blocked: isBlocked,
      categories: flaggedCategories,
      confidence: confidenceScore,
      moderationFlagId: moderationFlag.id,
      details: result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in content-moderator function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false,
      flagged: false,
      blocked: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});