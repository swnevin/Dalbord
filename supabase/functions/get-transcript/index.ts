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

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
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

    // Helper function to safely extract string from data
    function extractStringValue(data: any): string | null {
      if (typeof data === 'string') return data;
      if (data === null || data === undefined) return null;
      
      // Check for common message properties
      if (typeof data.message === 'string') return data.message;
      if (typeof data.text === 'string') return data.text;
      
      // Skip objects that don't contain displayable text
      // These are typically metadata like browser_url, trace info, etc.
      if (typeof data === 'object') {
        // Check if it's an object with only non-text metadata
        const keys = Object.keys(data);
        const metadataKeys = ['browser_url', 'trace', 'debug', 'path', 'blockID', 'diagramID'];
        const hasOnlyMetadata = keys.every(key => metadataKeys.includes(key) || typeof data[key] === 'object');
        if (hasOnlyMetadata) return null;
        
        // Try to find any string property that might be a message
        for (const key of ['content', 'body', 'reply']) {
          if (typeof data[key] === 'string') return data[key];
        }
      }
      
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
        // User input - map payload to query
        let query: string | null = null;
        if (typeof log.data === 'string') {
          query = log.data;
        } else if (typeof log.data?.payload === 'string') {
          query = log.data.payload;
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
        // Other types - pass through but ensure payload is safe
        payload = { payload: log.data };
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
