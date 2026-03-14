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
    const hoje = new Date();
    const hojeStr = hoje.toISOString().split("T")[0];
    const sessentaDiasAtras = new Date(Date.now() - 60 * 86400000);

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // fc_lancamentos uses ano/mes/dia columns, not a date column
    // Fetch all recent lancamentos and humor
    const [{ data: lancamentos }, { data: humor }] = await Promise.all([
      adminClient.from("fc_lancamentos").select("*")
        .gte("created_at", sessentaDiasAtras.toISOString())
        .order("created_at", { ascending: false }),
      adminClient.from("registros_humor").select("*")
        .eq("user_id", effectiveUserId)
        .gte("data", sessentaDiasAtras.toISOString().split("T")[0])
        .order("data", { ascending: false }),
    ]);

    // Build date string from ano/mes/dia and compute daily spend
    const toDateStr = (l: any) =>
      `${l.ano}-${String(l.mes).padStart(2, "0")}-${String(l.dia).padStart(2, "0")}`;

    const allWithDate = (lancamentos ?? []).map((l: any) => ({
      ...l,
      dateStr: toDateStr(l),
      spendValue: l.saida ?? 0,
    }));

    const seteDiasAtrasStr = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
    const trintaDiasAtrasStr = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];

    const saidas30d = allWithDate.filter((l: any) => l.spendValue > 0 && l.dateStr >= trintaDiasAtrasStr && l.dateStr <= hojeStr);
    const saidas7d = allWithDate.filter((l: any) => l.spendValue > 0 && l.dateStr >= seteDiasAtrasStr && l.dateStr <= hojeStr);

    const totalSpend30d = saidas30d.reduce((s: number, l: any) => s + l.spendValue, 0);
    const avg30dSpend = totalSpend30d / 30;
    const spend7d = saidas7d.reduce((s: number, l: any) => s + l.spendValue, 0);
    const spendingSpike = avg30dSpend > 0 ? spend7d / (avg30dSpend * 7) : null;

    // Correlation: high spend days with high mood
    const moodByDay = new Map((humor ?? []).map((h: any) => [h.data, h.valor]));
    const spendByDay = new Map<string, number>();
    allWithDate
      .filter((l: any) => l.spendValue > 0 && l.dateStr <= hojeStr)
      .forEach((l: any) => spendByDay.set(l.dateStr, (spendByDay.get(l.dateStr) ?? 0) + l.spendValue));

    let spendMoodCorrelation = 0;
    spendByDay.forEach((spend, date) => {
      const mood = moodByDay.get(date) ?? 0;
      if (spend > avg30dSpend * 1.5 && mood >= 1) spendMoodCorrelation++;
    });

    const patterns: string[] = [];
    if (spendingSpike !== null && spendingSpike > 1.5)
      patterns.push(`Spike de gastos: ${Math.round(spendingSpike * 100)}% acima da média dos últimos 30 dias`);
    if (spendMoodCorrelation >= 2)
      patterns.push(`${spendMoodCorrelation} dias com gasto alto correlacionado com humor elevado — sinal maníaco de alta confiança`);

    const status = spendMoodCorrelation >= 2 ? "crisis" : patterns.length > 0 ? "warning" : "stable";

    await adminClient.from("agentes_relatorios").upsert(
      {
        user_id: effectiveUserId, agent: "financeiro", tipo: "financeiro", periodo: hojeStr, status,
        signals: { avg30dSpend, spend7d, spendingSpike, spendMoodCorrelation },
        patterns,
        context: { trigger, windowDays: 60 },
      },
      { onConflict: "user_id,agent,periodo" }
    );

    // Fire-and-forget
    adminClient.functions
      .invoke("agente-orquestradora", { body: { user_id: effectiveUserId, triggeringAgent: "financeiro" } })
      .catch((e: any) => console.error("Orchestrator call failed:", e));

    return new Response(JSON.stringify({ status, patterns }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("agente-financeiro error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
