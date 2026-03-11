import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const now = new Date();
  const today = now.toISOString().split("T")[0];

  // Weekly consolidation (runs every day, but only creates if 7 days passed)
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().split("T")[0];

  // Check if weekly log already exists for this period
  const { data: existingWeekly } = await supabase
    .from("log_consolidado")
    .select("id")
    .eq("tipo", "semanal")
    .eq("periodo_fim", today)
    .maybeSingle();

  if (!existingWeekly) {
    // Fetch last 7 days of activity
    const { data: logs } = await supabase
      .from("activity_log")
      .select("*")
      .gte("criado_em", weekAgo.toISOString())
      .lte("criado_em", now.toISOString())
      .order("criado_em");

    if (logs && logs.length > 0) {
      // Build metrics
      const acaoCounts: Record<string, number> = {};
      logs.forEach((l: any) => {
        acaoCounts[l.acao] = (acaoCounts[l.acao] || 0) + 1;
      });

      const resumo = `Semana ${weekAgoStr} a ${today}: ${logs.length} acoes registradas. ` +
        Object.entries(acaoCounts).map(([k, v]) => `${k}: ${v}`).join(", ");

      await supabase.from("log_consolidado").insert({
        tipo: "semanal",
        periodo_inicio: weekAgoStr,
        periodo_fim: today,
        resumo,
        metricas: { total_acoes: logs.length, por_acao: acaoCounts },
        detalhes: logs.slice(0, 100), // Keep up to 100 most relevant entries
      });
    }
  }

  // Monthly consolidation (check if we have 4+ weekly logs in the last 30 days)
  const monthAgo = new Date(now);
  monthAgo.setDate(monthAgo.getDate() - 30);
  const monthAgoStr = monthAgo.toISOString().split("T")[0];

  const { data: weeklyLogs } = await supabase
    .from("log_consolidado")
    .select("*")
    .eq("tipo", "semanal")
    .gte("periodo_inicio", monthAgoStr)
    .order("periodo_inicio");

  if (weeklyLogs && weeklyLogs.length >= 4) {
    const { data: existingMonthly } = await supabase
      .from("log_consolidado")
      .select("id")
      .eq("tipo", "mensal")
      .gte("periodo_fim", monthAgoStr)
      .maybeSingle();

    if (!existingMonthly) {
      // Merge weekly metrics
      const mergedMetrics: Record<string, number> = {};
      let totalAcoes = 0;
      weeklyLogs.forEach((wl: any) => {
        const m = wl.metricas as any;
        if (m?.por_acao) {
          Object.entries(m.por_acao).forEach(([k, v]) => {
            mergedMetrics[k] = (mergedMetrics[k] || 0) + (v as number);
          });
        }
        totalAcoes += m?.total_acoes || 0;
      });

      const resumo = `Mes ${monthAgoStr} a ${today}: ${totalAcoes} acoes em ${weeklyLogs.length} semanas. ` +
        Object.entries(mergedMetrics).map(([k, v]) => `${k}: ${v}`).join(", ");

      await supabase.from("log_consolidado").insert({
        tipo: "mensal",
        periodo_inicio: monthAgoStr,
        periodo_fim: today,
        resumo,
        metricas: { total_acoes: totalAcoes, por_acao: mergedMetrics, semanas: weeklyLogs.length },
        detalhes: weeklyLogs.map((wl: any) => ({ id: wl.id, periodo: `${wl.periodo_inicio} - ${wl.periodo_fim}`, resumo: wl.resumo })),
      });

      // Clean old individual activity logs (older than 30 days) to save space
      await supabase
        .from("activity_log")
        .delete()
        .lt("criado_em", monthAgo.toISOString());
    }
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
