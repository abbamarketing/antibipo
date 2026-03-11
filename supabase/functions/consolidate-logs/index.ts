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

  try {
    const body = await req.json().catch(() => ({}));
    const userId = body.user_id;

    if (userId) {
      return await consolidateForUser(supabase, userId);
    }
    return await scheduledConsolidation(supabase);
  } catch (e) {
    console.error("Consolidation error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function generateSummary(logs: any[], periodoInicio: string, periodoFim: string, actionCounts: Record<string, number>): Promise<string> {
  const prompt = `Você é um assistente pessoal. Analise estes ${logs.length} registros de atividade e crie um mini-resumo de 2-3 frases sobre o que o usuário fez neste período. Seja factual e direto.\n\nPeríodo: ${periodoInicio} a ${periodoFim}\nAções: ${JSON.stringify(actionCounts)}\nDetalhes recentes: ${JSON.stringify(logs.slice(-10).map((l: any) => ({ acao: l.acao, detalhes: l.detalhes })))}\n\nResponda APENAS o resumo, sem introduções.`;

  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  if (lovableKey) {
    try {
      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "google/gemini-2.5-flash-lite", messages: [{ role: "user", content: prompt }] }),
      });
      if (aiResp.ok) {
        const aiData = await aiResp.json();
        const text = aiData.choices?.[0]?.message?.content;
        if (text) return text;
      }
    } catch (e) {
      console.error("AI summary failed:", e);
    }
  }

  // Static fallback
  const topActions = Object.entries(actionCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `${k}: ${v}x`).join(", ");
  return `${logs.length} ações registradas. Principais: ${topActions}`;
}

async function consolidateForUser(supabase: any, userId: string) {
  const { data: logs, error: logsErr } = await supabase
    .from("activity_log").select("*").eq("user_id", userId)
    .order("criado_em", { ascending: true });

  if (logsErr) throw logsErr;
  if (!logs || logs.length < 100) {
    return new Response(JSON.stringify({ message: "Not enough logs" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const actionCounts: Record<string, number> = {};
  const periodoInicio = logs[0].criado_em;
  const periodoFim = logs[logs.length - 1].criado_em;
  for (const log of logs) actionCounts[log.acao] = (actionCounts[log.acao] || 0) + 1;

  const resumo = await generateSummary(logs, periodoInicio, periodoFim, actionCounts);

  await supabase.from("configuracoes").upsert({
    user_id: userId,
    chave: `resumo_logs_${new Date().toISOString().split("T")[0]}`,
    valor: { resumo, periodo_inicio: periodoInicio, periodo_fim: periodoFim, total_acoes: logs.length, acoes: actionCounts },
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,chave" });

  await supabase.from("log_consolidado").insert({
    tipo: "activity_summary",
    periodo_inicio: periodoInicio.split("T")[0],
    periodo_fim: periodoFim.split("T")[0],
    resumo,
    metricas: actionCounts,
    detalhes: logs.slice(-10).map((l: any) => ({ acao: l.acao, detalhes: l.detalhes })),
  });

  const logIds = logs.map((l: any) => l.id);
  await supabase.from("activity_log").delete().in("id", logIds);

  console.log(`Consolidated ${logs.length} logs for user ${userId}`);
  return new Response(JSON.stringify({ success: true, consolidated: logs.length, resumo }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function scheduledConsolidation(supabase: any) {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().split("T")[0];

  const { data: existingWeekly } = await supabase
    .from("log_consolidado").select("id").eq("tipo", "semanal").eq("periodo_fim", today).maybeSingle();

  if (!existingWeekly) {
    const { data: logs } = await supabase
      .from("activity_log").select("*")
      .gte("criado_em", weekAgo.toISOString()).lte("criado_em", now.toISOString())
      .order("criado_em");

    if (logs?.length) {
      const acaoCounts: Record<string, number> = {};
      logs.forEach((l: any) => { acaoCounts[l.acao] = (acaoCounts[l.acao] || 0) + 1; });

      await supabase.from("log_consolidado").insert({
        tipo: "semanal",
        periodo_inicio: weekAgoStr,
        periodo_fim: today,
        resumo: `Semana ${weekAgoStr} a ${today}: ${logs.length} ações. ${Object.entries(acaoCounts).map(([k, v]) => `${k}: ${v}`).join(", ")}`,
        metricas: { total_acoes: logs.length, por_acao: acaoCounts },
        detalhes: logs.slice(0, 100),
      });
    }
  }

  const monthAgo = new Date(now);
  monthAgo.setDate(monthAgo.getDate() - 30);
  const monthAgoStr = monthAgo.toISOString().split("T")[0];

  const { data: weeklyLogs } = await supabase
    .from("log_consolidado").select("*").eq("tipo", "semanal")
    .gte("periodo_inicio", monthAgoStr).order("periodo_inicio");

  if (weeklyLogs && weeklyLogs.length >= 4) {
    const { data: existingMonthly } = await supabase
      .from("log_consolidado").select("id").eq("tipo", "mensal")
      .gte("periodo_fim", monthAgoStr).maybeSingle();

    if (!existingMonthly) {
      const mergedMetrics: Record<string, number> = {};
      let totalAcoes = 0;
      weeklyLogs.forEach((wl: any) => {
        const m = wl.metricas as any;
        if (m?.por_acao) Object.entries(m.por_acao).forEach(([k, v]) => { mergedMetrics[k] = (mergedMetrics[k] || 0) + (v as number); });
        totalAcoes += m?.total_acoes || 0;
      });

      await supabase.from("log_consolidado").insert({
        tipo: "mensal",
        periodo_inicio: monthAgoStr,
        periodo_fim: today,
        resumo: `Mês ${monthAgoStr} a ${today}: ${totalAcoes} ações em ${weeklyLogs.length} semanas.`,
        metricas: { total_acoes: totalAcoes, por_acao: mergedMetrics, semanas: weeklyLogs.length },
        detalhes: weeklyLogs.map((wl: any) => ({ id: wl.id, periodo: `${wl.periodo_inicio} - ${wl.periodo_fim}`, resumo: wl.resumo })),
      });

      await supabase.from("activity_log").delete().lt("criado_em", monthAgo.toISOString());
    }
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
