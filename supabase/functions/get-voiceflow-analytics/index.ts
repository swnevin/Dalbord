
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { startDate, endDate } = await req.json()

    if (!startDate || !endDate) {
      throw new Error('Start date and end date are required')
    }

    const options = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: '{{vf.apiKey}}'
      },
      body: JSON.stringify({
        query: [
          {
            name: 'interactions',
            filter: {
              projectID: '{{vf.projectID}}',
              startTime: startDate,
              endTime: endDate
            }
          }
        ]
      })
    };

    const response = await fetch('https://analytics-api.voiceflow.com/v1/query/usage', options)
    
    if (!response.ok) {
      throw new Error(`Voiceflow API error: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('Voiceflow analytics response:', data)

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
