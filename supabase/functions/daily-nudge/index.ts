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

    const { data: logs } = await supabase
      .from("activity_log")
      .select("acao, detalhes")
      .gte("criado_em", `${yesterdayStr}T00:00:00`)
      .lt("criado_em", `${yesterdayStr}T23:59:59`)
      .order("criado_em", { ascending: false })
      .limit(20);

    // Fetch recent diary entries
    const { data: diary } = await supabase
      .from("diario_entradas")
      .select("texto, humor_detectado, sentimento")
      .eq("user_id", user.id)
      .gte("data", yesterdayStr)
      .order("created_at", { ascending: false })
      .limit(5);

    const context = {
      logs: (logs || []).map(l => `${l.acao}: ${JSON.stringify(l.detalhes)}`).join("\n"),
      diary: (diary || []).map(d => `[humor:${d.humor_detectado}] ${d.texto}`).join("\n"),
    };

    const hasData = context.logs.length > 0 || context.diary.length > 0;

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
            content: `Você é um assistente pessoal brasileiro. Gere UMA frase curta (máximo 12 palavras) positiva e motivacional baseada nas atividades de ontem do usuário. 
Seja específico: mencione algo concreto que ele fez (tarefa, exercício, medicamento, registro). 
Tom: caloroso, direto, sem emojis, sem aspas. Frase completa em português brasileiro.
Exemplos: "Ontem você completou 3 tarefas, hoje vai ser melhor ainda", "Seu treino de ontem mostra disciplina, continue assim"`,
          },
          {
            role: "user",
            content: `Atividades de ontem:\n${context.logs}\n\nDiário:\n${context.diary}`,
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
