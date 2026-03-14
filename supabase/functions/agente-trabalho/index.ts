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
    const trintaDiasAtras = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
    const seteDiasAtras = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const [{ data: tasks30d }, { data: tasks7d }] = await Promise.all([
      adminClient.from("tasks").select("*").eq("user_id", effectiveUserId).eq("modulo", "trabalho").gte("criado_em", trintaDiasAtras),
      adminClient.from("tasks").select("*").eq("user_id", effectiveUserId).eq("modulo", "trabalho").gte("criado_em", seteDiasAtras),
    ]);

    const completionRate30d = tasks30d?.length
      ? tasks30d.filter((t: any) => t.status === "feito").length / tasks30d.length : null;
    const completionRate7d = tasks7d?.length
      ? tasks7d.filter((t: any) => t.status === "feito").length / tasks7d.length : null;

    const completionDrop = (completionRate30d && completionRate7d)
      ? completionRate30d - completionRate7d : null;

    const allUrgent = tasks7d?.length ? tasks7d.every((t: any) => t.urgencia >= 3) : false;

    const noCompletionDays = (() => {
      if (!tasks7d) return 0;
      const byDay = new Map<string, boolean>();
      tasks7d.forEach((t: any) => {
        const d = t.criado_em?.split("T")[0];
        if (d) byDay.set(d, byDay.get(d) || t.status === "feito");
      });
      return Array.from(byDay.values()).filter((v) => !v).length;
    })();

    const patterns: string[] = [];
    if (completionDrop !== null && completionDrop > 0.3)
      patterns.push(`Queda de ${Math.round(completionDrop * 100)}% na conclusão de tarefas em 7 dias vs 30 dias`);
    if (allUrgent && (tasks7d?.length ?? 0) > 3)
      patterns.push("Todas as tarefas recentes marcadas como urgentes");
    if (noCompletionDays >= 3)
      patterns.push(`${noCompletionDays} dias nos últimos 7 sem nenhuma tarefa concluída`);

    const status = patterns.length >= 2 ? "crisis" : patterns.length === 1 ? "warning" : "stable";

    await adminClient.from("agentes_relatorios").upsert(
      {
        user_id: effectiveUserId, agent: "trabalho", tipo: "trabalho", periodo: hoje, status,
        signals: { completionRate7d, completionRate30d, completionDrop, allUrgent, noCompletionDays },
        patterns,
        context: { trigger, windowDays: 30 },
      },
      { onConflict: "user_id,agent,periodo" }
    );

    // Fire-and-forget
    adminClient.functions
      .invoke("agente-orquestradora", { body: { user_id: effectiveUserId, triggeringAgent: "trabalho" } })
      .catch((e: any) => console.error("Orchestrator call failed:", e));

    return new Response(JSON.stringify({ status, patterns }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("agente-trabalho error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
