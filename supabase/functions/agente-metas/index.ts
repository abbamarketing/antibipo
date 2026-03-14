import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // 1. Verify JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authenticatedUserId = claimsData.claims.sub as string;

    const { user_id, trigger } = await req.json();
    if (user_id && user_id !== authenticatedUserId) {
      return new Response(JSON.stringify({ error: "Forbidden: user_id mismatch" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const effectiveUserId = authenticatedUserId;
    const hoje = new Date().toISOString().split("T")[0];
    const seteDiasAtras = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const [{ data: metasAtivas }, { data: metasRecentes }] = await Promise.all([
      adminClient.from("metas_pessoais").select("*").eq("user_id", effectiveUserId).eq("status", "ativa"),
      adminClient.from("metas_pessoais").select("*").eq("user_id", effectiveUserId).gte("created_at", seteDiasAtras),
    ]);

    const totalAtivas = metasAtivas?.length ?? 0;
    const novasUltima7d = metasRecentes?.length ?? 0;
    const semProgressoAtivas = metasAtivas?.filter((m: any) => (m.progresso ?? 0) === 0)?.length ?? 0;
    const progressoMedio = totalAtivas > 0
      ? (metasAtivas!.reduce((s: number, m: any) => s + (m.progresso ?? 0), 0) / totalAtivas)
      : null;

    const patterns: string[] = [];
    if (novasUltima7d >= 10)
      patterns.push(`${novasUltima7d} novas metas criadas nos últimos 7 dias — possível meta-chasing maníaco`);
    if (totalAtivas > 0 && semProgressoAtivas === totalAtivas)
      patterns.push("Nenhuma das metas ativas tem progresso registrado — possível retraimento depressivo");
    if (progressoMedio !== null && progressoMedio < 10 && totalAtivas > 5)
      patterns.push(`Progresso médio de apenas ${Math.round(progressoMedio)}% em ${totalAtivas} metas ativas`);

    const status = patterns.length >= 2 ? "crisis" : patterns.length === 1 ? "warning" : "stable";

    await adminClient.from("agentes_relatorios").upsert(
      {
        user_id: effectiveUserId, agent: "metas", tipo: "metas", periodo: hoje, status,
        signals: { totalAtivas, novasUltima7d, semProgressoAtivas, progressoMedio },
        patterns,
        context: { trigger, windowDays: 7 },
      },
      { onConflict: "user_id,agent,periodo" }
    );

    // Fire-and-forget
    adminClient.functions
      .invoke("agente-orquestradora", { body: { user_id: effectiveUserId, triggeringAgent: "metas" } })
      .catch((e: any) => console.error("Orchestrator call failed:", e));

    return new Response(JSON.stringify({ status, patterns }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("agente-metas error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
