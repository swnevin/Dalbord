
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Separator used to distinguish between admin and client org IDs
const ORG_ID_SEPARATOR = "::preview::";

// Extract org IDs from concatenated string
const extractOrgIds = (concatenatedId: string) => {
  if (!concatenatedId.includes(ORG_ID_SEPARATOR)) {
    return { adminOrgId: concatenatedId, clientOrgId: concatenatedId };
  }
  
  const [adminOrgId, clientOrgId] = concatenatedId.split(ORG_ID_SEPARATOR);
  return { adminOrgId, clientOrgId };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { startDate, endDate, queryType = 'interactions', isPreviewMode } = await req.json()

    if (!startDate || !endDate) {
      throw new Error('Start date and end date are required')
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

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
    
    // Extract the appropriate organization ID based on the format
    let organizationId = profile.organization_id
    
    // If it's a concatenated ID, extract the appropriate part
    if (organizationId.includes(ORG_ID_SEPARATOR)) {
      const { adminOrgId, clientOrgId } = extractOrgIds(organizationId)
      // For preview mode use client org ID, otherwise use admin org ID
      organizationId = isPreviewMode ? clientOrgId : adminOrgId
    }

    // Get the organization's Voiceflow credentials
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('voiceflow_api_key, voiceflow_project_id')
      .eq('id', organizationId)
      .maybeSingle()

    if (orgError) {
      throw new Error('Error fetching organization')
    }

    if (!org?.voiceflow_api_key || !org?.voiceflow_project_id) {
      throw new Error('Organization has no Voiceflow credentials')
    }

    // Prepare the query based on the query type
    let queryName = 'interactions'; // Default is interactions (messages)
    let endpoint = 'https://analytics-api.voiceflow.com/v1/query/usage';
    
    if (queryType === 'sessions') {
      queryName = 'sessions';
    } else if (queryType === 'top_intents') {
      queryName = 'top_intents';
    }

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
      throw new Error(`Voiceflow API error: ${response.status}`)
    }
    
    const data = await response.json()
    console.log(`Voiceflow ${queryName} analytics response:`, data)

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
