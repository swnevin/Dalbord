
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
    const { startDate, endDate, queryType = 'interactions', previewMode = false, previewOrgId = null } = await req.json()

    if (!startDate || !endDate) {
      throw new Error('Start date and end date are required')
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    let organizationId;

    // If in preview mode, use the provided previewOrgId
    if (previewMode && previewOrgId) {
      console.log(`Using preview organization ID: ${previewOrgId}`)
      organizationId = previewOrgId
    } else {
      // Get the user's JWT from the authorization header
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) {
        throw new Error('Missing authorization header')
      }

      // Get the user's organization ID from their profile
      const { data: { user }, error: userError } = await supabase.auth.getUser(
        authHeader.replace('Bearer ', '')
      )
      if (userError || !user) {
        throw new Error('Invalid user token')
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) {
        throw new Error('Error fetching user profile')
      }

      if (!profile?.organization_id) {
        throw new Error('User has no organization assigned')
      }
      
      organizationId = profile.organization_id
    }

    console.log(`Getting Voiceflow credentials for organization: ${organizationId}`)

    // Get the organization's Voiceflow credentials
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('voiceflow_api_key, voiceflow_project_id')
      .eq('id', organizationId)
      .maybeSingle()

    if (orgError) {
      console.error(`Error fetching organization: ${orgError.message}`)
      throw new Error('Error fetching organization')
    }

    if (!org?.voiceflow_api_key || !org?.voiceflow_project_id) {
      console.error(`Organization has no Voiceflow credentials, organization ID: ${organizationId}`)
      throw new Error('Organization has no Voiceflow credentials')
    }

    console.log(`Using Voiceflow project ID: ${org.voiceflow_project_id}`)

    // Prepare the query based on the query type
    let queryName = 'interactions'; // Default is interactions (messages)
    let endpoint = 'https://analytics-api.voiceflow.com/v1/query/usage';
    
    if (queryType === 'sessions') {
      queryName = 'sessions';
    } else if (queryType === 'top_intents') {
      queryName = 'top_intents';
    }

    console.log(`Making query for ${queryName} from ${startDate} to ${endDate}`)

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
            name: queryName,
            filter: {
              projectID: org.voiceflow_project_id,
              startTime: startDate,
              endTime: endDate
            }
          }
        ]
      })
    };

    const response = await fetch(endpoint, options)
    
    if (!response.ok) {
      console.error(`Voiceflow API error: ${response.status} ${response.statusText}`)
      throw new Error(`Voiceflow API error: ${response.status}`)
    }
    
    const data = await response.json()
    console.log(`Voiceflow ${queryName} analytics response status: success`)

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in get-voiceflow-analytics:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
