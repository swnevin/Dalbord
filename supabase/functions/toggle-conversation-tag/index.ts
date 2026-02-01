import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with the user's auth token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's organization
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.organization_id) {
      console.error('Profile error:', profileError);
      return new Response(
        JSON.stringify({ error: 'User profile not found or no organization' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { transcriptId, tag } = await req.json();

    // Validate input
    if (!transcriptId || !tag) {
      return new Response(
        JSON.stringify({ error: 'Missing transcriptId or tag' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!['saved', 'reviewed'].includes(tag)) {
      return new Response(
        JSON.stringify({ error: 'Invalid tag. Must be "saved" or "reviewed"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Toggle tag request: transcriptId=${transcriptId}, tag=${tag}, org=${profile.organization_id}`);

    // Check if tag exists
    const { data: existingTag, error: selectError } = await supabase
      .from('conversation_tags')
      .select('id')
      .eq('organization_id', profile.organization_id)
      .eq('transcript_id', transcriptId)
      .eq('tag', tag)
      .maybeSingle();

    if (selectError) {
      console.error('Select error:', selectError);
      return new Response(
        JSON.stringify({ error: 'Failed to check existing tag' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let action: 'added' | 'removed';

    if (existingTag) {
      // Tag exists, delete it
      const { error: deleteError } = await supabase
        .from('conversation_tags')
        .delete()
        .eq('id', existingTag.id);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        return new Response(
          JSON.stringify({ error: 'Failed to remove tag' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      action = 'removed';
      console.log(`Tag removed: ${tag} from ${transcriptId}`);
    } else {
      // Tag doesn't exist, create it
      const { error: insertError } = await supabase
        .from('conversation_tags')
        .insert({
          organization_id: profile.organization_id,
          transcript_id: transcriptId,
          tag: tag
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to add tag' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      action = 'added';
      console.log(`Tag added: ${tag} to ${transcriptId}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        action, 
        tag,
        transcriptId 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
