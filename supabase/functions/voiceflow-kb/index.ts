import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const VF_BASE = "https://api.voiceflow.com/v1/knowledge-base/docs";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
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

    if (!profile?.organization_id) throw new Error("User has no organization");

    const { data: org } = await supabase
      .from("organizations")
      .select("voiceflow_api_key")
      .eq("id", profile.organization_id)
      .maybeSingle();

    if (!org?.voiceflow_api_key) throw new Error("Missing Voiceflow API key");

    const apiKey = org.voiceflow_api_key as string;
    const body = await req.json();
    const action = body.action as string;

    const json = (data: unknown, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    if (action === "list_docs") {
      const limit = 100;
      let page = 1;
      let all: any[] = [];
      let hasMore = true;
      let total = 0;
      while (hasMore) {
        const r = await fetch(`${VF_BASE}?limit=${limit}&page=${page}`, {
          headers: { accept: "application/json", Authorization: apiKey },
        });
        if (!r.ok) throw new Error(`Voiceflow list_docs error: ${r.status}`);
        const j = await r.json();
        all = [...all, ...(j.data || [])];
        total = j.total ?? all.length;
        hasMore = (j.data?.length || 0) === limit && total > all.length;
        page++;
      }
      return json({ data: all, total });
    }

    if (action === "get_doc") {
      const r = await fetch(`${VF_BASE}/${body.documentID}`, {
        headers: { accept: "application/json", Authorization: apiKey },
      });
      if (!r.ok) throw new Error(`Voiceflow get_doc error: ${r.status}`);
      return json(await r.json());
    }

    if (action === "delete_doc") {
      const r = await fetch(`${VF_BASE}/${body.documentID}`, {
        method: "DELETE",
        headers: { Authorization: apiKey },
      });
      if (!r.ok) throw new Error(`Voiceflow delete_doc error: ${r.status}`);
      return json({ ok: true });
    }

    if (action === "upload_qa") {
      const overwrite = !!body.overwrite;
      const r = await fetch(
        `${VF_BASE}/upload/table?overwrite=${overwrite}`,
        {
          method: "POST",
          headers: {
            accept: "application/json",
            "content-type": "application/json",
            Authorization: apiKey,
          },
          body: JSON.stringify({ data: body.payload }),
        }
      );
      if (!r.ok) {
        const txt = await r.text();
        throw new Error(`Voiceflow upload_qa error: ${r.status} ${txt}`);
      }
      return json(await r.json());
    }

    if (action === "upload_url") {
      const r = await fetch(`${VF_BASE}/upload?maxChunkSize=1000`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json; charset=utf-8",
          Authorization: apiKey,
        },
        body: JSON.stringify({ data: body.payload }),
      });
      if (!r.ok) {
        const txt = await r.text();
        throw new Error(`Voiceflow upload_url error: ${r.status} ${txt}`);
      }
      return json(await r.json());
    }

    if (action === "upload_file") {
      // body.file: { name, type, base64 }
      const { name, type, base64 } = body.file;
      const bin = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const file = new File([bin], name, { type: type || "application/octet-stream" });
      const form = new FormData();
      form.append("file", file);
      if (body.metadata) {
        form.append("metadata", JSON.stringify(body.metadata));
      }
      const r = await fetch(`${VF_BASE}/upload?maxChunkSize=1000`, {
        method: "POST",
        headers: { accept: "application/json", Authorization: apiKey },
        body: form,
      });
      if (!r.ok) {
        const txt = await r.text();
        throw new Error(`Voiceflow upload_file error: ${r.status} ${txt}`);
      }
      return json(await r.json());
    }

    if (action === "find_qa_by_name") {
      // helper for CreateFAQDialog: returns whether a doc with the given name exists
      const limit = 100;
      let page = 1;
      let hasMore = true;
      while (hasMore) {
        const r = await fetch(`${VF_BASE}?limit=${limit}&page=${page}`, {
          headers: { accept: "application/json", Authorization: apiKey },
        });
        if (!r.ok) throw new Error(`Voiceflow find_qa_by_name error: ${r.status}`);
        const j = await r.json();
        const match = (j.data || []).find((d: any) => d?.data?.name === body.name);
        if (match) return json({ exists: true });
        hasMore = (j.data?.length || 0) === limit;
        page++;
      }
      return json({ exists: false });
    }

    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (error: any) {
    console.error("voiceflow-kb error:", error);
    return new Response(
      JSON.stringify({ error: error?.message || String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
