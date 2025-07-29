import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ImageModerationRequest {
  imageUrl: string;
}

interface OpenAIVisionResponse {
  choices: Array<{
    message: {
      content: string;
    };
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
          approved: true, 
          reason: 'Image moderation not available' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse the request body
    const { imageUrl }: ImageModerationRequest = await req.json()
    
    if (!imageUrl || typeof imageUrl !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Image URL is required and must be a string' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate that it's a reasonable image URL
    if (!imageUrl.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i) && !imageUrl.includes('supabase')) {
      return new Response(
        JSON.stringify({ 
          approved: false, 
          reason: 'Invalid image format or source' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Call OpenAI Vision API to analyze the image
    const visionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please analyze this image for appropriateness as a profile photo on a medical support community. Check for: inappropriate content, nudity, violence, hate symbols, fake/AI-generated faces, non-human subjects, or anything that would violate community guidelines. Respond with only 'APPROVED' if appropriate, or 'REJECTED: [reason]' if not appropriate."
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl,
                  detail: "low"
                }
              }
            ]
          }
        ],
        max_tokens: 100,
        temperature: 0.1
      }),
    })

    if (!visionResponse.ok) {
      console.error('OpenAI Vision API error:', visionResponse.status, await visionResponse.text())
      return new Response(
        JSON.stringify({ 
          approved: true, 
          reason: 'Image moderation service temporarily unavailable' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const visionResult: OpenAIVisionResponse = await visionResponse.json()
    const analysis = visionResult.choices[0]?.message?.content || ''

    const approved = analysis.toUpperCase().includes('APPROVED')
    const reason = approved ? undefined : analysis.replace('REJECTED:', '').trim()

    // Log the moderation check for audit purposes
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Log to security audit table
    await supabase.rpc('log_security_event', {
      user_id_param: null, // We don't have user context in this function
      event_type_param: 'image_moderation_check',
      event_details_param: {
        approved,
        reason: reason || 'No issues detected',
        image_url_domain: new URL(imageUrl).hostname,
        analysis: analysis.substring(0, 200) // Truncate for storage
      }
    })

    return new Response(
      JSON.stringify({
        approved,
        reason
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in moderate-image function:', error)
    return new Response(
      JSON.stringify({ 
        approved: true, 
        reason: 'Image moderation check failed' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 