import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Allowed secrets that can be retrieved (whitelist approach)
const ALLOWED_SECRETS = [
  'OPENAI_API_KEY',
  'RESEND_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'POSTHOG_API_KEY',
  'ADMIN_PASSWORD'
]

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { name } = await req.json()
    
    // Special case: Allow ADMIN_PASSWORD access without authentication (for login purposes)
    if (name === 'ADMIN_PASSWORD') {
      const secretValue = Deno.env.get(name)
      
      if (!secretValue) {
        console.warn('Admin password secret not configured')
        return new Response(
          JSON.stringify({ error: 'Admin password not configured' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Log admin password access attempt (without user ID since unauthenticated)
      console.log('Admin password accessed for login attempt')
      
      return new Response(
        JSON.stringify({ value: secretValue }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract JWT token from Authorization header for all other secrets
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      console.warn('Unauthorized secrets access attempt - no auth header')
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client for authentication
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify the JWT token and get user
    const token = authHeader.replace('Bearer ', '')
    const { data: userData, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !userData.user) {
      console.warn('Unauthorized secrets access attempt - invalid token:', userError?.message)
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Allow PostHog API key access for all authenticated users
    if (name === 'POSTHOG_API_KEY') {
      const secretValue = Deno.env.get(name)
      
      if (!secretValue) {
        console.warn(`User ${userData.user.id} requested non-existent PostHog secret`)
        return new Response(
          JSON.stringify({ error: `Secret ${name} not found` }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Log successful PostHog secret access
      console.log(`User ${userData.user.id} successfully accessed PostHog secret`)
      await supabase.rpc('log_security_event', {
        user_id_param: userData.user.id,
        event_type_param: 'posthog_secret_accessed',
        event_details_param: {
          ip_address: req.headers.get('cf-connecting-ip') || 'unknown',
          user_agent: req.headers.get('user-agent') || 'unknown',
          timestamp: new Date().toISOString()
        }
      })

      return new Response(
        JSON.stringify({ value: secretValue }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }


    // Check if user has admin role for other secrets
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .eq('role', 'admin')
      .single()

    if (roleError || !roleData) {
      console.warn(`Unauthorized secrets access attempt by user ${userData.user.id} - not admin`)
      
      // Log security event
      await supabase.rpc('log_security_event', {
        user_id_param: userData.user.id,
        event_type_param: 'unauthorized_secrets_access',
        event_details_param: {
          ip_address: req.headers.get('cf-connecting-ip') || 'unknown',
          user_agent: req.headers.get('user-agent') || 'unknown',
          timestamp: new Date().toISOString()
        }
      })

      return new Response(
        JSON.stringify({ error: 'Admin privileges required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    
    if (!name) {
      return new Response(
        JSON.stringify({ error: 'Secret name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if the requested secret is in the allowed list
    if (!ALLOWED_SECRETS.includes(name)) {
      console.warn(`Admin ${userData.user.id} requested unauthorized secret: ${name}`)
      
      // Log security event for unauthorized secret request
      await supabase.rpc('log_security_event', {
        user_id_param: userData.user.id,
        event_type_param: 'unauthorized_secret_request',
        event_details_param: {
          requested_secret: name,
          ip_address: req.headers.get('cf-connecting-ip') || 'unknown',
          user_agent: req.headers.get('user-agent') || 'unknown',
          timestamp: new Date().toISOString()
        }
      })

      return new Response(
        JSON.stringify({ error: `Secret '${name}' is not available through this endpoint` }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const secretValue = Deno.env.get(name)
    
    if (!secretValue) {
      console.warn(`Admin ${userData.user.id} requested non-existent secret: ${name}`)
      return new Response(
        JSON.stringify({ error: `Secret ${name} not found` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Log successful secret access
    console.log(`Admin ${userData.user.id} successfully accessed secret: ${name}`)
    await supabase.rpc('log_security_event', {
      user_id_param: userData.user.id,
      event_type_param: 'secret_accessed',
      event_details_param: {
        secret_name: name,
        ip_address: req.headers.get('cf-connecting-ip') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown',
        timestamp: new Date().toISOString()
      }
    })

    return new Response(
      JSON.stringify({ value: secretValue }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in secrets function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})