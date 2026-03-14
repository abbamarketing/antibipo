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

  const topActions = Object.entries(actionCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `${k}: ${v}x`).join(", ");
  return `${logs.length} ações registradas. Principais: ${topActions}`;
}

async function consolidateForUser(supabase: any, userId: string) {
  // Get ALL logs ordered by date
  const { data: allLogs, error: logsErr } = await supabase
    .from("activity_log").select("*").eq("user_id", userId)
    .order("criado_em", { ascending: true });

  if (logsErr) throw logsErr;
  if (!allLogs || allLogs.length < 200) {
    return new Response(JSON.stringify({ message: "Not enough logs to consolidate", count: allLogs?.length || 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // KEEP the last 100 logs for AI context — consolidate the rest in batches of 100
  const logsToKeep = allLogs.slice(-100);
  const logsToConsolidate = allLogs.slice(0, -100);

  let batchesCreated = 0;

  // Process in batches of 100
  for (let i = 0; i < logsToConsolidate.length; i += 100) {
    const batch = logsToConsolidate.slice(i, i + 100);
    if (batch.length === 0) continue;

    const periodoInicio = batch[0].criado_em;
    const periodoFim = batch[batch.length - 1].criado_em;

    const actionCounts: Record<string, number> = {};
    for (const log of batch) {
      actionCounts[log.acao] = (actionCounts[log.acao] || 0) + 1;
    }

    const resumo = await generateSummary(batch, periodoInicio, periodoFim, actionCounts);

    // Store batch in log_consolidado with tipo "activity_batch"
    await supabase.from("log_consolidado").insert({
      tipo: "activity_batch",
      periodo_inicio: periodoInicio.split("T")[0],
      periodo_fim: periodoFim.split("T")[0],
      user_id: userId,
      resumo,
      metricas: { total_logs: batch.length, por_acao: actionCounts, user_id: userId },
      detalhes: batch.map((l: any) => ({
        id: l.id,
        acao: l.acao,
        detalhes: l.detalhes,
        contexto: l.contexto,
        criado_em: l.criado_em,
      })),
    });

    batchesCreated++;
  }

  // Delete only the consolidated logs (keep last 100)
  const idsToDelete = logsToConsolidate.map((l: any) => l.id);
  // Delete in chunks to avoid query limits
  for (let i = 0; i < idsToDelete.length; i += 100) {
    const chunk = idsToDelete.slice(i, i + 100);
    await supabase.from("activity_log").delete().in("id", chunk);
  }

  // Save summary to configuracoes for AI memory
  await supabase.from("configuracoes").upsert({
    user_id: userId,
    chave: `resumo_logs_${new Date().toISOString().split("T")[0]}`,
    valor: {
      consolidado_em: new Date().toISOString(),
      logs_consolidados: logsToConsolidate.length,
      logs_mantidos: logsToKeep.length,
      batches_criados: batchesCreated,
    },
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,chave" });

  console.log(`Consolidated ${logsToConsolidate.length} logs into ${batchesCreated} batches for user ${userId}. Kept ${logsToKeep.length} recent logs.`);

  return new Response(JSON.stringify({
    success: true,
    consolidated: logsToConsolidate.length,
    kept: logsToKeep.length,
    batches: batchesCreated,
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function scheduledConsolidation(supabase: any) {
  // Find users with > 200 logs and consolidate each
  const { data: users } = await supabase
    .from("activity_log")
    .select("user_id")
    .not("user_id", "is", null);

  if (!users) {
    return new Response(JSON.stringify({ ok: true, message: "No logs found" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const uniqueUsers = [...new Set(users.map((u: any) => u.user_id))];
  const results: any[] = [];

  for (const userId of uniqueUsers) {
    try {
      const resp = await consolidateForUser(supabase, userId as string);
      const data = await resp.json();
      results.push({ user_id: userId, ...data });
    } catch (e) {
      results.push({ user_id: userId, error: (e as Error).message });
    }
  }

  return new Response(JSON.stringify({ ok: true, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
