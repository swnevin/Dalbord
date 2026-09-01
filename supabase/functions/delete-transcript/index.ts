import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (userError || !user) throw new Error("Invalid user token");

    const { transcriptId } = await req.json();
    if (!transcriptId) throw new Error("Missing transcriptId");

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile?.organization_id) throw new Error("User has no organization");

    const { data: org } = await supabase
      .from("organizations")
      .select("voiceflow_api_key, voiceflow_project_id")
      .eq("id", profile.organization_id)
      .maybeSingle();
    if (!org?.voiceflow_api_key || !org?.voiceflow_project_id) {
      throw new Error("Missing Voiceflow credentials");
    }

    const r = await fetch(
      `https://api.voiceflow.com/v2/transcripts/${org.voiceflow_project_id}/${transcriptId}`,
      { method: "DELETE", headers: { Authorization: org.voiceflow_api_key } }
    );

    if (!r.ok) {
      const t = await r.text();
      throw new Error(`Voiceflow delete error: ${r.status} ${t}`);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("delete-transcript error:", error);
    return new Response(
      JSON.stringify({ error: error?.message || String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
