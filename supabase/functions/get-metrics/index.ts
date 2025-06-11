
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

interface MetricsRequest {
  organization_id: string
  start_date?: string // ISO date string
  end_date?: string // ISO date string
  metrics?: string[] // metric types to include
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    })
  }

  try {
    // Only allow POST requests (to pass parameters securely)
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get the JWT token from the Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify the JWT token
    const token = authHeader.replace('Bearer ', '')
    const { data: userData, error: verifyError } = await supabaseClient.auth.getUser(token)
    
    if (verifyError || !userData) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get the user's profile data including role and organization_id
    const { data: profileData, error: profileError } = await supabaseClient
      .from('profiles')
      .select('organization_id, role')
      .eq('id', userData.user.id)
      .single()

    if (profileError || !profileData.organization_id) {
      return new Response(JSON.stringify({ error: 'User has no organization' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Parse the request body
    const body: MetricsRequest = await req.json()
    
    console.log('Received metrics request:', {
      organization_id: body.organization_id,
      start_date: body.start_date,
      end_date: body.end_date,
      user_org: profileData.organization_id
    })
    
    // Use the specified organization_id if provided or default to the user's organization
    const organizationId = body.organization_id || profileData.organization_id
    
    // Verify the user has access to the requested organization
    if (organizationId !== profileData.organization_id) {
      // Only admins can access other organizations' data
      if (profileData.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Access denied to organization data' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // Use the provided dates directly without fallback defaults
    const startDate = body.start_date ? new Date(body.start_date) : null
    const endDate = body.end_date ? new Date(body.end_date) : null
    
    console.log('Using date range:', {
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString()
    })
    
    // Prepare the metrics filter
    const metricTypes = body.metrics || ['happy_face', 'neutral_face', 'sad_face', 'escalated_to_human', 'successful_answer', 'thumbs_up', 'thumbs_down']

    // Query the metrics from the database
    let query = supabaseClient
      .from('conversation_metrics')
      .select('*')
      .eq('organization_id', organizationId)
    
    // Only apply date filters if dates are provided
    if (startDate) {
      query = query.gte('timestamp', startDate.toISOString())
    }
    if (endDate) {
      query = query.lte('timestamp', endDate.toISOString())
    }
    
    if (metricTypes.length > 0) {
      query = query.in('metric_type', metricTypes)
    }

    const { data: metrics, error: metricsError } = await query.order('timestamp', { ascending: true })

    if (metricsError) {
      console.error('Error fetching metrics:', metricsError)
      return new Response(JSON.stringify({ error: metricsError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`Found ${metrics.length} conversation metrics`)

    // Query fallback requests from the fallback_requests table
    let fallbackQuery = supabaseClient
      .from('fallback_requests')
      .select('*')
      .eq('organization_id', organizationId)

    // Only apply date filters if dates are provided
    if (startDate) {
      fallbackQuery = fallbackQuery.gte('created_at', startDate.toISOString())
    }
    if (endDate) {
      fallbackQuery = fallbackQuery.lte('created_at', endDate.toISOString())
    }

    const { data: fallbackRequests, error: fallbackError } = await fallbackQuery.order('created_at', { ascending: true })

    if (fallbackError) {
      console.error('Error fetching fallback requests:', fallbackError)
      return new Response(JSON.stringify({ error: fallbackError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    console.log(`Found ${fallbackRequests.length} fallback requests`)
    
    // Process the metrics for different chart types
    
    // 1. Count totals by metric type
    const totals = metricTypes.reduce((acc, type) => {
      acc[type] = metrics.filter(m => m.metric_type === type).length
      return acc
    }, {})
    
    // Add fallback count to totals
    totals.fallback = fallbackRequests.length
    
    console.log('Calculated totals:', totals)
    
    // 2. Group by day for time series charts
    // Create a day-by-day mapping from start to end date
    const days: string[] = []
    const timeSeriesData: Record<string, Record<string, number>> = {}
    
    // Create a set of days from start to end
    if (startDate && endDate) {
      let currentDay = new Date(startDate)
      while (currentDay <= endDate) {
        const dayString = currentDay.toISOString().split('T')[0]
        days.push(dayString)
        
        // Initialize each day with zero counts
        timeSeriesData[dayString] = metricTypes.reduce((acc, type) => {
          acc[type] = 0
          return acc
        }, {})
        
        // Initialize fallback count for each day
        timeSeriesData[dayString].fallback = 0
        
        // Move to next day
        currentDay.setDate(currentDay.getDate() + 1)
      }
    }
    
    // Fill in actual counts from conversation_metrics
    metrics.forEach(metric => {
      const day = new Date(metric.timestamp).toISOString().split('T')[0]
      if (timeSeriesData[day]) {
        timeSeriesData[day][metric.metric_type]++
      }
    })
    
    // Fill in fallback counts from fallback_requests
    fallbackRequests.forEach(fallback => {
      const day = new Date(fallback.created_at).toISOString().split('T')[0]
      if (timeSeriesData[day]) {
        timeSeriesData[day].fallback++
      }
    })
    
    // Convert to array format for the charts (ensuring all days are represented)
    const timeSeries = days.map(day => ({
      date: day,
      ...timeSeriesData[day]
    }))

    const response = {
      totals,
      timeSeries,
      rawMetrics: metrics,
      fallbackRequests: fallbackRequests,
      debug: {
        requestedDateRange: { start_date: body.start_date, end_date: body.end_date },
        actualDateRange: { startDate: startDate?.toISOString(), endDate: endDate?.toISOString() },
        metricsCount: metrics.length,
        fallbackCount: fallbackRequests.length
      }
    }

    console.log('Sending response with totals:', response.totals)

    return new Response(
      JSON.stringify(response),
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
