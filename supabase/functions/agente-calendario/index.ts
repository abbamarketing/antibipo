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
    const quatorzeDiasFuturos = new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0];

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const [{ data: reunioes }, { data: tasksDeadline }] = await Promise.all([
      adminClient.from("reunioes").select("*").eq("user_id", effectiveUserId).gte("data", seteDiasAtras).lte("data", quatorzeDiasFuturos),
      adminClient.from("tasks").select("*").eq("user_id", effectiveUserId).not("data_limite", "is", null).lte("data_limite", quatorzeDiasFuturos),
    ]);

    const reunioesSemana = reunioes?.filter((r: any) => r.data >= seteDiasAtras && r.data <= hoje)?.length ?? 0;
    const reunioesFuturas = reunioes?.filter((r: any) => r.data > hoje)?.length ?? 0;
    const tasksComDeadline = tasksDeadline?.length ?? 0;

    const diasSemReuniao = (() => {
      if (!reunioes?.length) return 7;
      const diasComReuniao = new Set(reunioes.filter((r: any) => r.data <= hoje).map((r: any) => r.data));
      let count = 0;
      for (let i = 1; i <= 7; i++) {
        const d = new Date(Date.now() - i * 86400000).toISOString().split("T")[0];
        if (!diasComReuniao.has(d)) count++;
        else break;
      }
      return count;
    })();

    const patterns: string[] = [];
    if (reunioesSemana >= 8) patterns.push(`${reunioesSemana} reuniões na última semana — sobrecompromisso`);
    if (diasSemReuniao >= 7) patterns.push(`${diasSemReuniao} dias consecutivos sem reuniões — possível isolamento social`);
    if (tasksComDeadline > 5) patterns.push(`${tasksComDeadline} tarefas com deadline nos próximos 14 dias`);

    const status = patterns.length >= 2 ? "crisis" : patterns.length === 1 ? "warning" : "stable";

    await adminClient.from("agentes_relatorios").upsert(
      {
        user_id: effectiveUserId, agent: "calendario", tipo: "calendario", periodo: hoje, status,
        signals: { reunioesSemana, reunioesFuturas, tasksComDeadline, diasSemReuniao },
        patterns,
        context: { trigger, windowDays: 7 },
      },
      { onConflict: "user_id,agent,periodo" }
    );

    // Fire-and-forget
    adminClient.functions
      .invoke("agente-orquestradora", { body: { user_id: effectiveUserId, triggeringAgent: "calendario" } })
      .catch((e: any) => console.error("Orchestrator call failed:", e));

    return new Response(JSON.stringify({ status, patterns }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("agente-calendario error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
