import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const VF_USAGE = "https://analytics-api.voiceflow.com/v2/query/usage";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { startDate, endDate, queryType = "interactions" } = await req.json();
    if (!startDate || !endDate) {
      throw new Error("Start date and end date are required");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (userError || !user) throw new Error("Invalid user token");

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile?.organization_id) throw new Error("User has no organization assigned");

    const { data: org } = await supabase
      .from("organizations")
      .select("voiceflow_api_key, voiceflow_project_id")
      .eq("id", profile.organization_id)
      .maybeSingle();
    if (!org?.voiceflow_api_key || !org?.voiceflow_project_id) {
      throw new Error("Organization has no Voiceflow credentials");
    }

    // Map our internal queryType to Voiceflow v2 metric name.
    // Voiceflow v2 does not expose "sessions"; transcript count is the closest equivalent.
    const nameMap: Record<string, string> = {
      interactions: "interactions",
      sessions: "transcripts",
      top_intents: "top_intents",
      daily_interactions: "interactions",
      daily_sessions: "transcripts",
    };
    const vfName = nameMap[queryType];
    if (!vfName) throw new Error(`Unknown queryType: ${queryType}`);

    const requestBody = {
      data: {
        name: vfName,
        filter: {
          projectID: org.voiceflow_project_id,
          startTime: startDate,
          endTime: endDate,
          limit: 500,
        },
      },
    };

    const callVf = async () => {
      const r = await fetch(VF_USAGE, {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          authorization: org.voiceflow_api_key,
        },
        body: JSON.stringify(requestBody),
      });
      if (!r.ok) {
        const txt = await r.text();
        throw new Error(`Voiceflow API error ${r.status}: ${txt}`);
      }
      return r.json();
    };

    const vfJson = await callVf();

    // Top intents returns result.intents instead of result.items.
    if (queryType === "top_intents") {
      const intents = (vfJson?.result?.intents || []).map((it: any) => ({
        name: it.name || it.intent || it.intentName || "unknown",
        count: Number(it.count) || 0,
      }));
      console.log(`v2 ${vfName} returned ${intents.length} intents`);
      return new Response(
        JSON.stringify({ result: [{ intents }] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const items: any[] = vfJson?.result?.items || [];
    console.log(`v2 ${vfName} returned ${items.length} items`);

    // Daily mode: aggregate items by date and return { dailyData: [{ date, count }] }
    if (queryType === "daily_interactions" || queryType === "daily_sessions") {
      const byDay = new Map<string, number>();
      for (const it of items) {
        const period: string = it.period || it.startTime || "";
        const day = period.slice(0, 10); // YYYY-MM-DD
        if (!day) continue;
        byDay.set(day, (byDay.get(day) || 0) + (Number(it.count) || 0));
      }
      // Fill missing days with 0 between start and end
      const start = new Date(startDate);
      const end = new Date(endDate);
      const dailyData: { date: string; count: number }[] = [];
      const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
      const endUtc = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
      while (cursor <= endUtc) {
        const ds = cursor.toISOString().slice(0, 10);
        dailyData.push({ date: ds, count: byDay.get(ds) || 0 });
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }
      return new Response(JSON.stringify({ dailyData }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Default totals: sum counts and return result[0].count to preserve frontend shape
    const total = items.reduce((acc, it) => acc + (Number(it.count) || 0), 0);
    return new Response(
      JSON.stringify({ result: [{ count: total }] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in get-voiceflow-analytics:", error);
    return new Response(
      JSON.stringify({ error: error?.message || String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
