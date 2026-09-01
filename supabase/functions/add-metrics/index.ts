
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Create a Supabase client with the Admin key
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)

interface MetricRequest {
  organization_id: string
  metric_type: 'happy_face' | 'neutral_face' | 'sad_face' | 'escalated_to_human'
  api_key?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    })
  }

  try {
    // Ensure the request method is POST
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Parse the request body
    const body: MetricRequest = await req.json()
    
    console.log('Received metric:', JSON.stringify(body))

    if (!body.organization_id || !body.metric_type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: organization_id and metric_type are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Validate the metric type
    const validMetricTypes = ['happy_face', 'neutral_face', 'sad_face', 'escalated_to_human']
    if (!validMetricTypes.includes(body.metric_type)) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid metric_type', 
          message: `Metric type must be one of: ${validMetricTypes.join(', ')}` 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Call the stored procedure to add the metric
    const { data, error } = await supabaseClient.rpc('add_conversation_metric', {
      org_id: body.organization_id,
      metric: body.metric_type,
      api_key: body.api_key || null
    })

    if (error) {
      console.error('Error adding metric:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('Metric added successfully, ID:', data)

    // Return the ID of the newly created metric
    return new Response(
      JSON.stringify({ success: true, id: data }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(
      JSON.stringify({ error: 'Unexpected error', message: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
