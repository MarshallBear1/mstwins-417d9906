import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ModerationRequest {
  content: string;
}

interface OpenAIModerationResponse {
  id: string;
  model: string;
  results: Array<{
    flagged: boolean;
    categories: {
      "sexual": boolean;
      "hate": boolean;
      "harassment": boolean;
      "self-harm": boolean;
      "sexual/minors": boolean;
      "hate/threatening": boolean;
      "violence/graphic": boolean;
      "self-harm/intent": boolean;
      "self-harm/instructions": boolean;
      "harassment/threatening": boolean;
      "violence": boolean;
    };
    category_scores: Record<string, number>;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify the request has authorization
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get the OpenAI API key from environment
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      console.warn('OpenAI API key not configured')
      return new Response(
        JSON.stringify({ 
          flagged: false, 
          categories: [],
          reason: 'OpenAI moderation not available' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse the request body
    const { content }: ModerationRequest = await req.json()
    
    if (!content || typeof content !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Content is required and must be a string' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Call OpenAI Moderation API
    const moderationResponse = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: content,
        model: 'text-moderation-latest'
      }),
    })

    if (!moderationResponse.ok) {
      console.error('OpenAI API error:', moderationResponse.status, await moderationResponse.text())
      return new Response(
        JSON.stringify({ 
          flagged: false, 
          categories: [],
          reason: 'Moderation service temporarily unavailable' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const moderationResult: OpenAIModerationResponse = await moderationResponse.json()
    const result = moderationResult.results[0]

    // Extract flagged categories
    const flaggedCategories: string[] = []
    if (result.flagged) {
      for (const [category, isFlagged] of Object.entries(result.categories)) {
        if (isFlagged) {
          flaggedCategories.push(category)
        }
      }
    }

    // Log the moderation check for audit purposes
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Log to security audit table
    await supabase.rpc('log_security_event', {
      user_id_param: null, // We don't have user context in this function
      event_type_param: 'content_moderation_check',
      event_details_param: {
        flagged: result.flagged,
        categories: flaggedCategories,
        content_length: content.length,
        highest_score: Math.max(...Object.values(result.category_scores))
      }
    })

    return new Response(
      JSON.stringify({
        flagged: result.flagged,
        categories: flaggedCategories,
        reason: result.flagged ? `Content violates policies: ${flaggedCategories.join(', ')}` : undefined
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in moderate-content function:', error)
    return new Response(
      JSON.stringify({ 
        flagged: false, 
        categories: [],
        reason: 'Moderation check failed' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 