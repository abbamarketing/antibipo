import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { titulo } = await req.json();
    if (!titulo) throw new Error("titulo is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Você é um classificador de tarefas para o sistema AntiBipolaridade. Recebe o título de uma tarefa e retorna a classificação usando tool calling.

Contexto do usuário:
- Empreendedor, dono de agência de vídeo para clínicas médicas
- Sócio médico cuida de burocracia/finanças
- Sócio editor cuida de produção de vídeos
- Clientes são clínicas médicas

Tipos de tarefa:
- estrategico: Proposta nova, estratégia, criação autoral, decisão de negócio
- operacional: Revisar vídeo, aprovar post, enviar relatório, responder briefing
- delegavel: Contrato, NF, pagamento (sócio médico) ou edição, entrega (editor)
- administrativo: Responder email, atualizar planilha, agendar reunião
- domestico: Tarefas de casa

Estado ideal:
- foco_total: Tarefas estratégicas e criativas que exigem concentração
- modo_leve: Tarefas operacionais curtas (<30 min)
- basico: Só o urgente que trava outros
- qualquer: Pode ser feito em qualquer estado

Dono:
- eu: Tarefa que eu preciso fazer
- socio_medico: Tarefas de burocracia, finanças, contratos, NFs
- editor: Tarefas de edição de vídeo, entregas de produção

Urgência: 1=talvez, 2=esta semana, 3=hoje
Impacto: 1=baixo, 2=médio, 3=alto
Tempo estimado em minutos (padrão 30)`,
          },
          {
            role: "user",
            content: `Classifique esta tarefa: "${titulo}"`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "classify_task",
              description: "Classifica uma tarefa do AntiBipolaridade com tipo, estado ideal, urgência, impacto, dono e tempo estimado.",
              parameters: {
                type: "object",
                properties: {
                  tipo: { type: "string", description: "One of: estrategico, operacional, delegavel, administrativo, domestico" },
                  estado_ideal: { type: "string", description: "One of: foco_total, modo_leve, basico, qualquer" },
                  urgencia: { type: "number", description: "1=talvez, 2=esta semana, 3=hoje" },
                  impacto: { type: "number", description: "1=baixo, 2=medio, 3=alto" },
                  dono: { type: "string", description: "One of: eu, socio_medico, editor" },
                  tempo_min: { type: "number", description: "Estimated minutes" },
                  modulo: { type: "string", description: "One of: trabalho, casa, saude" },
                },
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "classify_task" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const text = await response.text();
      console.error("AI gateway error:", status, text);

      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway returned ${status}`);
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No classification returned");
    }

    const classification = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ classification }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("classify-task error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
