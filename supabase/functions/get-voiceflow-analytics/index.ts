
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
    const { startDate, endDate, queryType = 'interactions' } = await req.json()

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

    // Get the organization's Voiceflow credentials
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('voiceflow_api_key, voiceflow_project_id')
      .eq('id', profile.organization_id)
      .maybeSingle()

    if (orgError) {
      throw new Error('Error fetching organization')
    }

    if (!org?.voiceflow_api_key || !org?.voiceflow_project_id) {
      throw new Error('Organization has no Voiceflow credentials')
    }

    // Handle daily data requests
    if (queryType === 'daily_interactions' || queryType === 'daily_sessions') {
      return await handleDailyData(startDate, endDate, queryType, org)
    }

    // Handle regular total requests (existing logic)
    let queryName = 'interactions';
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

async function handleDailyData(startDate: string, endDate: string, queryType: string, org: any) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const dailyData = []
  
  const queryName = queryType === 'daily_interactions' ? 'interactions' : 'sessions'
  console.log(`Fetching daily ${queryName} data from ${startDate} to ${endDate}`)

  // Iterate through each day
  const currentDate = new Date(start)
  while (currentDate <= end) {
    try {
      // Set start of day in UTC
      const dayStart = new Date(currentDate)
      dayStart.setUTCHours(0, 0, 0, 0)
      
      // Set end of day in UTC
      const dayEnd = new Date(currentDate)
      dayEnd.setUTCHours(23, 59, 59, 999)
      
      const dayStartISO = dayStart.toISOString()
      const dayEndISO = dayEnd.toISOString()
      
      console.log(`Fetching ${queryName} for ${dayStartISO} to ${dayEndISO}`)

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
                startTime: dayStartISO,
                endTime: dayEndISO
              }
            }
          ]
        })
      }

      const response = await fetch('https://analytics-api.voiceflow.com/v1/query/usage', options)
      
      if (response.ok) {
        const data = await response.json()
        const count = data?.result?.[0]?.count || 0
        
        dailyData.push({
          date: currentDate.toISOString().split('T')[0], // YYYY-MM-DD format
          count: count
        })
        
        console.log(`${queryName} for ${currentDate.toISOString().split('T')[0]}: ${count}`)
      } else {
        console.warn(`Failed to fetch ${queryName} for ${currentDate.toISOString().split('T')[0]}`)
        dailyData.push({
          date: currentDate.toISOString().split('T')[0],
          count: 0
        })
      }
    } catch (error) {
      console.error(`Error fetching ${queryName} for ${currentDate.toISOString().split('T')[0]}:`, error)
      dailyData.push({
        date: currentDate.toISOString().split('T')[0],
        count: 0
      })
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1)
  }

  console.log(`Daily ${queryName} data:`, dailyData)
  
  return new Response(
    JSON.stringify({ dailyData }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
