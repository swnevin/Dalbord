
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to format date for Voiceflow API (DD.MM.YYYY)
const formatDateForVoiceflow = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

// Helper function to generate array of dates between start and end
const generateDateRange = (startDate: string, endDate: string): Date[] => {
  const dates: Date[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Normalize to start of day
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  const currentDate = new Date(start);
  while (currentDate <= end) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
};

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

    // Generate array of dates to query
    const dates = generateDateRange(startDate, endDate);
    console.log(`Fetching ${queryType} data for ${dates.length} days`);

    // Make parallel requests for each day
    const dailyResults = await Promise.allSettled(
      dates.map(async (date) => {
        const dateStr = formatDateForVoiceflow(date);
        
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
                name: queryType,
                filter: {
                  projectID: org.voiceflow_project_id,
                  startTime: dateStr,
                  endTime: dateStr
                }
              }
            ]
          })
        };

        const response = await fetch('https://analytics-api.voiceflow.com/v1/query/usage', options);
        
        if (!response.ok) {
          throw new Error(`Voiceflow API error for ${dateStr}: ${response.status}`);
        }
        
        const data = await response.json();
        const count = data.result?.[0]?.count || 0;
        
        return {
          date: date.toISOString().split('T')[0], // YYYY-MM-DD format
          count: count
        };
      })
    );

    // Process results and handle any failures
    const successfulResults = dailyResults
      .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
      .map(result => result.value);

    const failedResults = dailyResults
      .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
      .map(result => result.reason);

    if (failedResults.length > 0) {
      console.warn(`Failed to fetch data for ${failedResults.length} days:`, failedResults);
    }

    console.log(`Successfully fetched ${queryType} data for ${successfulResults.length} days`);

    // Calculate total for verification
    const total = successfulResults.reduce((sum, day) => sum + day.count, 0);
    console.log(`Total ${queryType} count: ${total}`);

    const responseData = {
      dailyData: successfulResults,
      total: total,
      queryType: queryType,
      period: {
        startDate,
        endDate,
        days: dates.length
      }
    };

    return new Response(
      JSON.stringify(responseData),
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
