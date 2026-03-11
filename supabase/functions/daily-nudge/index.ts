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

    // Fetch yesterday's activity
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // Fetch last 7 days for weekly context
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split("T")[0];

    const [
      { data: yesterdayLogs },
      { data: weekLogs },
      { data: diary },
      { data: weekDiary },
      { data: metas },
    ] = await Promise.all([
      supabase.from("activity_log").select("acao, detalhes")
        .gte("criado_em", `${yesterdayStr}T00:00:00`)
        .lt("criado_em", `${yesterdayStr}T23:59:59`)
        .order("criado_em", { ascending: false }).limit(20),
      supabase.from("activity_log").select("acao, detalhes")
        .gte("criado_em", `${weekAgoStr}T00:00:00`)
        .lt("criado_em", `${yesterdayStr}T00:00:00`)
        .order("criado_em", { ascending: false }).limit(50),
      supabase.from("diario_entradas").select("texto, humor_detectado, sentimento")
        .eq("user_id", user.id).eq("data", yesterdayStr)
        .order("created_at", { ascending: false }).limit(5),
      supabase.from("diario_entradas").select("texto, humor_detectado, sentimento, data")
        .eq("user_id", user.id)
        .gte("data", weekAgoStr).lt("data", yesterdayStr)
        .order("created_at", { ascending: false }).limit(10),
      supabase.from("metas_pessoais").select("titulo, progresso, status")
        .eq("user_id", user.id).eq("status", "ativa").limit(5),
    ]);

    // Summarize actions into counts
    const summarize = (logs: any[]) => {
      const counts: Record<string, number> = {};
      for (const l of logs) {
        counts[l.acao] = (counts[l.acao] || 0) + 1;
      }
      return Object.entries(counts).map(([k, v]) => `${k}: ${v}x`).join(", ");
    };

    const yesterdaySummary = summarize(yesterdayLogs || []);
    const weekSummary = summarize(weekLogs || []);
    const diaryText = (diary || []).map(d => `[humor:${d.humor_detectado}] ${d.texto}`).join("\n");
    const weekDiaryText = (weekDiary || []).map(d => `[${d.data}] ${d.texto}`).join("\n");
    const metasText = (metas || []).map(m => `${m.titulo} (${m.progresso}%)`).join(", ");

    const hasData = (yesterdayLogs?.length || 0) > 0 || (diary?.length || 0) > 0;

    if (!hasData) {
      return new Response(JSON.stringify({ message: "Novo dia, novas possibilidades. Vamos nessa!" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ message: "Ontem foi produtivo. Hoje pode ser ainda melhor!" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `Você gera UMA frase curta (máx 15 palavras) que relata algo CONCRETO que o usuário fez ontem.
NÃO seja motivacional genérico. Seja factual e específico.
Use dados reais: tarefas concluídas, exercícios feitos, medicamentos tomados, entradas de diário.
Se houver contexto semanal, reconheça padrões de consistência ou evolução.
Tom: parceiro, factual, direto. Sem emojis, sem aspas, sem exclamação exagerada.

BOM: "Ontem você fechou 3 tarefas e treinou, quinto dia seguido"
BOM: "Tomou todos os remédios e registrou como se sentiu, isso importa"
BOM: "Semana com 4 dias de exercício, ontem não foi exceção"
RUIM: "Você é incrível, continue assim!" (vazio demais)
RUIM: "Novo dia, novas possibilidades" (genérico)

Se as metas tiverem progresso, mencione. Se o humor subiu, note.`,
          },
          {
            role: "user",
            content: `ONTEM: ${yesterdaySummary}\nDiário ontem: ${diaryText || "nenhum"}\n\nSEMANA ANTERIOR: ${weekSummary || "sem dados"}\nDiário da semana: ${weekDiaryText || "nenhum"}\n\nMetas ativas: ${metasText || "nenhuma"}`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      return new Response(JSON.stringify({ message: "Ontem foi um bom dia. Hoje pode ser ainda melhor!" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const message = aiData.choices?.[0]?.message?.content?.trim() || "Vamos fazer hoje valer a pena!";

    return new Response(JSON.stringify({ message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("daily-nudge error:", e);
    return new Response(JSON.stringify({ message: "Hoje é um bom dia para avançar!" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
