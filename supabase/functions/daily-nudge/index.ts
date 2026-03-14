import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader! } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ message: "Bom dia! Vamos começar bem hoje." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    const todayStr = new Date().toISOString().split("T")[0];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split("T")[0];

    // 6 parallel queries (down from 14)
    const timeout = new Promise<null[]>((r) => setTimeout(() => r(Array(6).fill(null)), 5000));

    const queries = Promise.all([
      // Q1: activity_log — 7 days unified
      supabase.from("activity_log").select("acao, detalhes, criado_em")
        .gte("criado_em", `${weekAgoStr}T00:00:00`).lt("criado_em", `${todayStr}T00:00:00`)
        .order("criado_em", { ascending: false }).limit(70),

      // Q2: diario — 7 days unified
      supabase.from("diario_entradas").select("texto, humor_detectado, sentimento, data")
        .eq("user_id", user.id).gte("data", weekAgoStr).lte("data", yesterdayStr)
        .order("created_at", { ascending: false }).limit(15),

      // Q3: humor — 8 days unified (week + yesterday)
      supabase.from("registros_humor").select("valor, notas, data")
        .gte("data", weekAgoStr).lte("data", yesterdayStr)
        .order("data", { ascending: false }),

      // Q4: sono + meds + exercicio + tasks (grouped health/tasks)
      Promise.all([
        supabase.from("registros_sono").select("horario_dormir, horario_acordar, duracao_min, qualidade").eq("data", yesterdayStr).maybeSingle(),
        supabase.from("registros_medicamento").select("tomado, medicamento_id").eq("data", yesterdayStr),
        supabase.from("bm_exercicios").select("tipo, duracao_min, intensidade").eq("data", yesterdayStr),
        supabase.from("tasks").select("titulo, status, urgencia").in("status", ["hoje", "em_andamento", "aguardando"]).limit(5),
        supabase.from("tasks").select("titulo").eq("status", "feito").gte("feito_em", `${yesterdayStr}T00:00:00`).lt("feito_em", `${todayStr}T00:00:00`),
      ]),

      // Q5: metas
      supabase.from("metas_pessoais").select("titulo, progresso, status")
        .eq("user_id", user.id).eq("status", "ativa").limit(5),

      // Q6: profile + latestSummary
      Promise.all([
        supabase.from("profiles").select("nome, objetivo_saude").eq("user_id", user.id).maybeSingle(),
        supabase.from("configuracoes").select("valor").eq("user_id", user.id).like("chave", "resumo_logs_%").order("updated_at", { ascending: false }).limit(1),
      ]),
    ]);

    const results = await Promise.race([queries, timeout]);

    // If timed out, return fallback
    if (!results || results.every((r) => r === null)) {
      return new Response(JSON.stringify({ message: "Bom dia! Vamos começar bem hoje." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [allLogsRes, allDiaryRes, allHumorRes, healthResults, metasRes, profileResults] = results as any[];

    // Split activity logs by date
    const allLogs = allLogsRes?.data || [];
    const yesterdayLogs = allLogs.filter((l: any) => l.criado_em?.startsWith(yesterdayStr));
    const weekLogs = allLogs.filter((l: any) => !l.criado_em?.startsWith(yesterdayStr));

    // Split diary by date
    const allDiary = allDiaryRes?.data || [];
    const diary = allDiary.filter((d: any) => d.data === yesterdayStr);
    const weekDiary = allDiary.filter((d: any) => d.data !== yesterdayStr);

    // Split humor: yesterday vs week
    const allHumor = allHumorRes?.data || [];
    const yesterdayHumor = allHumor.find((h: any) => h.data === yesterdayStr) || null;
    const weekHumor = allHumor;

    // Destructure health group
    const [sonoRes, medsRes, exercicioRes, pendingRes, completedRes] = healthResults || [];
    const yesterdaySono = sonoRes?.data || null;
    const yesterdayMeds = medsRes?.data || [];
    const yesterdayExercicio = exercicioRes?.data || [];
    const pendingTasks = pendingRes?.data || [];
    const completedYesterday = completedRes?.data || [];

    const metas = metasRes?.data || [];

    // Profile group
    const [profileRes, summaryRes] = profileResults || [];
    const profile = profileRes?.data || null;
    const latestSummary = summaryRes?.data || [];

    const summarize = (logs: any[]) => {
      const counts: Record<string, number> = {};
      for (const l of logs) counts[l.acao] = (counts[l.acao] || 0) + 1;
      return Object.entries(counts).map(([k, v]) => `${k}: ${v}x`).join(", ");
    };

    const yesterdaySummary = summarize(yesterdayLogs);
    const weekSummary = summarize(weekLogs);
    const diaryText = diary.map((d: any) => `[humor:${d.humor_detectado}] ${d.texto}`).join("\n");
    const weekDiaryText = weekDiary.map((d: any) => `[${d.data}] ${d.texto}`).join("\n");
    const metasText = metas.map((m: any) => `${m.titulo} (${m.progresso}%)`).join(", ");

    const wellBeing: string[] = [];
    if (yesterdayHumor) wellBeing.push(`Humor ontem: ${yesterdayHumor.valor}/5${yesterdayHumor.notas ? ` (${yesterdayHumor.notas})` : ""}`);
    if (weekHumor?.length) {
      const avg = weekHumor.reduce((s: number, h: any) => s + h.valor, 0) / weekHumor.length;
      wellBeing.push(`Humor médio semana: ${avg.toFixed(1)}/5 (${weekHumor.length} registros)`);
    }
    if (yesterdaySono) {
      const si: string[] = [];
      if (yesterdaySono.duracao_min) si.push(`${Math.round(yesterdaySono.duracao_min / 60)}h`);
      if (yesterdaySono.qualidade) si.push(`qualidade ${yesterdaySono.qualidade}/3`);
      if (si.length) wellBeing.push(`Sono ontem: ${si.join(", ")}`);
    }
    if (yesterdayMeds?.length) {
      const taken = yesterdayMeds.filter((m: any) => m.tomado).length;
      wellBeing.push(`Medicamentos ontem: ${taken}/${yesterdayMeds.length} tomados`);
    }
    if (yesterdayExercicio?.length) {
      const totalMin = yesterdayExercicio.reduce((s: number, e: any) => s + e.duracao_min, 0);
      wellBeing.push(`Exercício ontem: ${totalMin}min (${yesterdayExercicio.map((e: any) => e.tipo).join(", ")})`);
    }
    if (completedYesterday?.length) wellBeing.push(`Tarefas concluídas ontem: ${completedYesterday.length}`);
    if (pendingTasks?.length) wellBeing.push(`Pendentes hoje: ${pendingTasks.map((t: any) => `${t.titulo} [urg:${t.urgencia}]`).join(", ")}`);

    const hasData = yesterdayLogs.length > 0 || diary.length > 0 || wellBeing.length > 0;
    if (!hasData) {
      const registrosNaSemana = weekHumor?.length || 0;

      // Check how long since last data via activity_log or humor
      const lastDataDate = allLogs.length > 0
        ? allLogs[0].criado_em
        : allHumor.length > 0
        ? allHumor[0].data
        : null;

      const diasSemDados = lastDataDate
        ? Math.floor((Date.now() - new Date(lastDataDate).getTime()) / (1000 * 60 * 60 * 24))
        : null;

      let noDataMessage: string;
      if (diasSemDados === null || diasSemDados < 1) {
        noDataMessage = "Hoje ainda não tem dados registrados. Que tal começar com como você está dormindo?";
      } else if (diasSemDados === 1) {
        noDataMessage = "Ontem você não registrou dados. Não precisa ser completo — um registro de humor já ajuda.";
      } else if (diasSemDados <= 3) {
        noDataMessage = `Faz ${diasSemDados} dias sem registros. Tudo bem parar. Quando quiser, estou aqui.`;
      } else {
        noDataMessage = `Faz ${diasSemDados} dias sem registros. Sem pressão — um check-in rápido quando puder já ajuda.`;
      }

      return new Response(JSON.stringify({ message: noDataMessage }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const nome = profile?.nome || "usuário";
    const memoryContext = latestSummary?.[0]?.valor?.resumo || "";

    // Parse orchestration context from request body (optional)
    let orchestrationContext: any = null;
    try {
      const body = await req.json().catch(() => null);
      orchestrationContext = body?.orchestration_context || null;
    } catch { /* no body */ }

    const registrosHumorSemana = weekHumor?.length || 0;
    const lacunaAviso = registrosHumorSemana < 3
      ? `\nATENCAO: usuario tem apenas ${registrosHumorSemana} registros de humor nos ultimos 7 dias. Mencione gentilmente essa lacuna e incentive a registrar.`
      : "";

    // Tone instruction from orchestration
    let toneInstruction = "Tom: parceiro, factual, direto.";
    if (orchestrationContext?.depressive_precursor) {
      toneInstruction = "Tom: acolhedor e sem pressão. Foco em pequenos passos. Reconheça o esforço mínimo.";
    } else if (orchestrationContext?.manic_precursor) {
      toneInstruction = "Tom: atencioso e calmante. Foco em consistência e pausas. Evite estimular novos projetos.";
    } else if (orchestrationContext?.nudge_tone) {
      toneInstruction = `Tom: ${orchestrationContext.nudge_tone}.`;
    }

    const focusInstruction = orchestrationContext?.nudge_focus
      ? `\nFoco principal: ${orchestrationContext.nudge_focus}.` : "";
    const factualBase = orchestrationContext?.nudge_factual_base
      ? `\nBase factual da orquestradora: ${orchestrationContext.nudge_factual_base}` : "";
    const medsAnchor = orchestrationContext?.meds_as_anchor
      ? "\nMedicação é âncora importante hoje — reforce adesão gentilmente." : "";

    const systemContent = `Você gera UMA frase curta (máx 20 palavras) para ${nome} que relata algo CONCRETO de ontem.
NÃO seja motivacional genérico. Seja factual e específico.
Use dados reais: tarefas concluídas, exercícios, medicamentos, sono, humor.
Cruze módulos quando possível: "treinou e fechou 3 tarefas, humor subiu pra 4".
Se o sono foi ruim ou humor baixo, seja empático sem ser dramático.
Se há padrão de consistência na semana, reconheça.
${toneInstruction} Sem emojis, sem aspas.${focusInstruction}${factualBase}${medsAnchor}${lacunaAviso}`;

    const userContent = `ONTEM:\nAções: ${yesterdaySummary || "nenhuma"}\nDiário: ${diaryText || "nenhum"}\nBem-estar: ${wellBeing.join("; ") || "sem dados"}\n\nSEMANA:\nAções: ${weekSummary || "sem dados"}\nDiário: ${weekDiaryText || "nenhum"}\nMetas ativas: ${metasText || "nenhuma"}${memoryContext ? `\nMemória IA: ${memoryContext}` : ""}`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ message: "Ontem foi produtivo. Hoje pode ser ainda melhor!", ai_provider: "none" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemContent },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!aiResponse.ok) {
      return new Response(JSON.stringify({ message: "Ontem foi um bom dia. Hoje pode ser ainda melhor!", ai_provider: "none" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const message = aiData.choices?.[0]?.message?.content?.trim() || "Vamos fazer hoje valer a pena!";
    return new Response(JSON.stringify({ message, ai_provider: "lovable_ai" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("daily-nudge error:", e);
    return new Response(JSON.stringify({ message: "Hoje é um bom dia para avançar!" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
