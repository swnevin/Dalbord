
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify the user and get their organization
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (userError || !user) throw new Error('Invalid token')

    // Get organization details
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('voiceflow_api_key, voiceflow_project_id')
      .eq('id', user.user_metadata.organization_id)
      .single()

    if (orgError || !org) throw new Error('Organization not found')

    const { startDate, endDate } = await req.json()

    const options = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: org.voiceflow_api_key
      },
      body: JSON.stringify({
        query: [
          {
            name: 'interactions',
            filter: {
              projectID: org.voiceflow_project_id,
              startTime: startDate,
              endTime: endDate
            }
          }
        ]
      })
    };

    const response = await fetch('https://analytics-api.voiceflow.com/v1/query/usage', options)
    const data = await response.json()

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
