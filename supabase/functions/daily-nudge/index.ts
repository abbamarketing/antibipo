import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const [
      { data: yesterdayLogs }, { data: weekLogs }, { data: diary }, { data: weekDiary },
      { data: metas }, { data: yesterdayHumor }, { data: weekHumor }, { data: yesterdaySono },
      { data: yesterdayMeds }, { data: yesterdayExercicio }, { data: pendingTasks },
      { data: completedYesterday }, { data: profile }, { data: latestSummary },
    ] = await Promise.all([
      supabase.from("activity_log").select("acao, detalhes").gte("criado_em", `${yesterdayStr}T00:00:00`).lt("criado_em", `${yesterdayStr}T23:59:59`).order("criado_em", { ascending: false }).limit(20),
      supabase.from("activity_log").select("acao, detalhes").gte("criado_em", `${weekAgoStr}T00:00:00`).lt("criado_em", `${yesterdayStr}T00:00:00`).order("criado_em", { ascending: false }).limit(50),
      supabase.from("diario_entradas").select("texto, humor_detectado, sentimento").eq("user_id", user.id).eq("data", yesterdayStr).order("created_at", { ascending: false }).limit(5),
      supabase.from("diario_entradas").select("texto, humor_detectado, sentimento, data").eq("user_id", user.id).gte("data", weekAgoStr).lt("data", yesterdayStr).order("created_at", { ascending: false }).limit(10),
      supabase.from("metas_pessoais").select("titulo, progresso, status").eq("user_id", user.id).eq("status", "ativa").limit(5),
      supabase.from("registros_humor").select("valor, notas").eq("data", yesterdayStr).maybeSingle(),
      supabase.from("registros_humor").select("valor, data").gte("data", weekAgoStr).lte("data", yesterdayStr).order("data", { ascending: false }),
      supabase.from("registros_sono").select("horario_dormir, horario_acordar, duracao_min, qualidade").eq("data", yesterdayStr).maybeSingle(),
      supabase.from("registros_medicamento").select("tomado, medicamento_id").eq("data", yesterdayStr),
      supabase.from("bm_exercicios").select("tipo, duracao_min, intensidade").eq("data", yesterdayStr),
      supabase.from("tasks").select("titulo, status, urgencia").in("status", ["hoje", "em_andamento", "aguardando"]).limit(5),
      supabase.from("tasks").select("titulo").eq("status", "feito").gte("feito_em", `${yesterdayStr}T00:00:00`).lt("feito_em", `${todayStr}T00:00:00`),
      supabase.from("profiles").select("nome, objetivo_saude").eq("user_id", user.id).maybeSingle(),
      supabase.from("configuracoes").select("valor").eq("user_id", user.id).like("chave", "resumo_logs_%").order("updated_at", { ascending: false }).limit(1),
    ]);

    const summarize = (logs: any[]) => {
      const counts: Record<string, number> = {};
      for (const l of logs) counts[l.acao] = (counts[l.acao] || 0) + 1;
      return Object.entries(counts).map(([k, v]) => `${k}: ${v}x`).join(", ");
    };

    const yesterdaySummary = summarize(yesterdayLogs || []);
    const weekSummary = summarize(weekLogs || []);
    const diaryText = (diary || []).map((d: any) => `[humor:${d.humor_detectado}] ${d.texto}`).join("\n");
    const weekDiaryText = (weekDiary || []).map((d: any) => `[${d.data}] ${d.texto}`).join("\n");
    const metasText = (metas || []).map((m: any) => `${m.titulo} (${m.progresso}%)`).join(", ");

    const wellBeing: string[] = [];
    if (yesterdayHumor) wellBeing.push(`Humor ontem: ${(yesterdayHumor as any).valor}/5${(yesterdayHumor as any).notas ? ` (${(yesterdayHumor as any).notas})` : ""}`);
    if (weekHumor?.length) {
      const avg = weekHumor.reduce((s: number, h: any) => s + h.valor, 0) / weekHumor.length;
      wellBeing.push(`Humor médio semana: ${avg.toFixed(1)}/5 (${weekHumor.length} registros)`);
    }
    if (yesterdaySono) {
      const si: string[] = [];
      if ((yesterdaySono as any).duracao_min) si.push(`${Math.round((yesterdaySono as any).duracao_min / 60)}h`);
      if ((yesterdaySono as any).qualidade) si.push(`qualidade ${(yesterdaySono as any).qualidade}/3`);
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

    const hasData = (yesterdayLogs?.length || 0) > 0 || (diary?.length || 0) > 0 || wellBeing.length > 0;
    if (!hasData) {
      // Count how many days in last 7 have humor records for this user
      const { data: recentHumor } = await supabase
        .from("registros_humor")
        .select("data")
        .gte("data", weekAgoStr)
        .lte("data", todayStr);

      const registrosNaSemana = recentHumor?.length || 0;

      let noDataMessage: string;
      if (registrosNaSemana === 0) {
        noDataMessage = "Nenhum registro esta semana. Isso pode dificultar identificar padroes. Como voce esta?";
      } else if (registrosNaSemana < 3) {
        noDataMessage = "Voce esta sem registrar ha alguns dias. Tudo bem? Um check-in rapido pode ajudar o app a te ajudar melhor.";
      } else if (registrosNaSemana < 5) {
        noDataMessage = "Ontem sem registros, mas a semana esta indo. Que tal um check-in rapido?";
      } else {
        noDataMessage = "Novo dia. Voce tem sido consistente esta semana, continue assim!";
      }

      return new Response(JSON.stringify({ message: noDataMessage }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const nome = (profile as any)?.nome || "usuário";
    const memoryContext = (latestSummary as any)?.[0]?.valor?.resumo || "";

    const registrosHumorSemana = weekHumor?.length || 0;
    const lacunaAviso = registrosHumorSemana < 3
      ? `\nATENCAO: usuario tem apenas ${registrosHumorSemana} registros de humor nos ultimos 7 dias. Mencione gentilmente essa lacuna e incentive a registrar.`
      : "";

    const systemContent = `Você gera UMA frase curta (máx 20 palavras) para ${nome} que relata algo CONCRETO de ontem.
NÃO seja motivacional genérico. Seja factual e específico.
Use dados reais: tarefas concluídas, exercícios, medicamentos, sono, humor.
Cruze módulos quando possível: "treinou e fechou 3 tarefas, humor subiu pra 4".
Se o sono foi ruim ou humor baixo, seja empático sem ser dramático.
Se há padrão de consistência na semana, reconheça.
Tom: parceiro, factual, direto. Sem emojis, sem aspas.${lacunaAviso}`;

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
