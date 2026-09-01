import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map new API log types to legacy format
function mapLogType(logType: string): string {
  switch (logType) {
    case 'trace': return 'text';
    case 'action': return 'request';
    default: return logType;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Service-role client to bypass column-level grants on voiceflow_api_key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verify user is authenticated using the token from the request
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get request body
    const { transcriptId } = await req.json();
    if (!transcriptId) {
      return new Response(
        JSON.stringify({ error: 'Missing transcriptId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching transcript ${transcriptId} for user ${user.id}`);

    // Get user's organization
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.organization_id) {
      console.error('Profile error:', profileError);
      return new Response(
        JSON.stringify({ error: 'User not associated with an organization' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get organization's Voiceflow credentials
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('voiceflow_api_key, voiceflow_project_id')
      .eq('id', profile.organization_id)
      .single();

    if (orgError || !org) {
      console.error('Organization error:', orgError);
      return new Response(
        JSON.stringify({ error: 'Organization not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!org.voiceflow_api_key || !org.voiceflow_project_id) {
      return new Response(
        JSON.stringify({ error: 'Organization missing Voiceflow credentials' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Voiceflow Analytics API (new format)
    console.log(`Calling Voiceflow Analytics API for transcript ${transcriptId}`);
    const voiceflowResponse = await fetch(
      `https://analytics-api.voiceflow.com/v1/transcript/${transcriptId}?filterConversation=false`,
      {
        headers: {
          'Accept': 'application/json',
          'Authorization': org.voiceflow_api_key,
        },
      }
    );

    if (!voiceflowResponse.ok) {
      const errorText = await voiceflowResponse.text();
      console.error('Voiceflow API error:', voiceflowResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch transcript from Voiceflow', details: errorText }),
        { status: voiceflowResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await voiceflowResponse.json();
    
    // New API returns { transcript: { logs: [...] } }
    const logs = data.transcript?.logs || [];
    console.log(`Successfully fetched transcript ${transcriptId}, logs items: ${logs.length}`);

    // Debug: Log first few raw logs to understand structure
    if (logs.length > 0) {
      console.log('Sample log structure:', JSON.stringify(logs.slice(0, 5), null, 2));
    }

    // Helper function to safely extract string from data
    // Handles nested Voiceflow trace structure: { type: "speak", payload: { message: "..." } }
    function extractStringValue(data: any): string | null {
      if (typeof data === 'string') return data;
      if (data === null || data === undefined) return null;
      
      // BLOCKED trace types - never display these (debug info, navigation, etc.)
      const blockedTypes = ['debug', 'block', 'flow', 'path', 'no-reply', 'visual', 'carousel', 'card', 'choice', 'end'];
      if (data.type && blockedTypes.includes(data.type)) {
        return null;
      }
      
      // ALLOWED trace types - only these should show messages to users
      const allowedTypes = ['speak', 'text'];
      if (data.type && allowedTypes.includes(data.type)) {
        if (typeof data.payload?.message === 'string') {
          return data.payload.message;
        }
        return null;
      }
      
      // If no type specified, try direct message properties (rare case)
      if (typeof data.message === 'string') return data.message;
      if (typeof data.text === 'string') return data.text;
      
      return null;
    }

    // Transform logs to legacy format for backward compatibility
    const transformedLogs = logs.map((log: any) => {
      const mappedType = mapLogType(log.type);
      
      let payload;
      if (log.type === 'trace') {
        // Bot message - extract message property
        const message = extractStringValue(log.data);
        // Skip traces without displayable message
        if (message === null) {
          return null;
        }
        payload = { payload: { message } };
      } else if (log.type === 'action') {
        // User input - handle various action formats
        let query: string | null = null;
        
        // Skip launch events - they are not user messages
        if (log.data?.type === 'launch') {
          return null;
        }
        
        // Try different locations for user input
        if (typeof log.data === 'string') {
          query = log.data;
        } else if (typeof log.data?.payload === 'string') {
          query = log.data.payload;
        } else if (log.data?.type === 'intent' && typeof log.data?.payload?.query === 'string') {
          // Intent-based input
          query = log.data.payload.query;
        } else if (typeof log.data?.query === 'string') {
          query = log.data.query;
        } else if (typeof log.data?.label === 'string') {
          query = log.data.label;
        }
        
        // Skip actions without user text
        if (!query) {
          return null;
        }
        payload = { payload: { query } };
      } else {
        // Other types - skip them
        return null;
      }
      
      return {
        type: mappedType,
        startTime: log.createdAt,
        payload
      };
    }).filter(Boolean); // Remove null entries

    console.log(`Transformed ${transformedLogs.length} displayable messages from ${logs.length} logs`);

    return new Response(
      JSON.stringify({ 
        history: transformedLogs, 
        transcript: data.transcript 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
