import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { message, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const today = new Date().toISOString().split("T")[0];
    const now = new Date().toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });

    const systemPrompt = `Voce e o assistente do app AntiBipolaridade. Sua funcao e interpretar comandos em linguagem natural do usuario e converter em acoes estruturadas.

Data de hoje: ${today}
Hora atual (Brasilia): ${now}

Contexto do usuario:
${context || "Nenhum contexto adicional."}

Voce DEVE responder usando a tool parse_command para TODAS as mensagens do usuario. Interprete o texto e extraia a acao correta.

Regras:
- "gastei X reais" / "paguei X" / "recebi X" -> financeiro (entrada ou saida)
- "reuniao" / "call" / "agendei" / "consulta" -> calendario
- "lavei" / "limpei" / "arrumei" / "passei" / "aspirei" -> casa (tarefa de limpeza)
- "fiz exercicio" / "caminhei" / "corri" / "academia" / "treino" -> saude_exercicio
- "tomei remedio" / "tomei medicamento" -> saude_medicamento
- "peso X" / "estou pesando X" -> saude_peso
- "humor X" / "me sinto" / "to bem" / "to mal" -> saude_humor
- "preciso fazer" / "tarefa" / "to do" / qualquer tarefa de trabalho -> trabalho
- "comprar" / "preciso comprar" / "lista" -> compras
- "meta" / "objetivo" / "quero alcançar" -> meta
- Para datas relativas: "amanha" = dia seguinte, "segunda" = proxima segunda, etc.
- Para valores financeiros: extraia o numero e determine se e entrada ou saida pelo contexto
- Se o usuario nao especificar urgencia, use 2 (semana)
- Responda com uma confirmacao curta e amigavel no campo "resposta"`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "parse_command",
              description: "Converte texto natural do usuario em acao estruturada para o app FLOW.",
              parameters: {
                type: "object",
                properties: {
                  tipo: {
                    type: "string",
                    enum: ["financeiro", "calendario", "casa", "trabalho", "saude_exercicio", "saude_medicamento", "saude_peso", "saude_humor", "compras", "meta"],
                    description: "Tipo da acao detectada"
                  },
                  resposta: {
                    type: "string",
                    description: "Confirmacao curta e amigavel para o usuario (max 80 chars)"
                  },
                  dados: {
                    type: "object",
                    description: "Dados estruturados da acao",
                    properties: {
                      // Financeiro
                      valor: { type: "number" },
                      tipo_lancamento: { type: "string", enum: ["entrada", "saida"] },
                      descricao: { type: "string" },
                      // Calendario
                      titulo: { type: "string" },
                      data: { type: "string", description: "YYYY-MM-DD" },
                      hora_inicio: { type: "string", description: "HH:MM" },
                      hora_fim: { type: "string", description: "HH:MM ou null" },
                      local: { type: "string" },
                      participantes: { type: "array", items: { type: "string" } },
                      tipo_reuniao: { type: "string", enum: ["reuniao", "consulta", "call", "evento"] },
                      // Casa
                      tarefa: { type: "string" },
                      comodo: { type: "string" },
                      // Trabalho
                      urgencia: { type: "number", enum: [1, 2, 3] },
                      modulo: { type: "string", enum: ["trabalho", "casa", "saude"] },
                      // Saude
                      tipo_exercicio: { type: "string" },
                      duracao_min: { type: "number" },
                      intensidade: { type: "number", enum: [1, 2, 3] },
                      peso_kg: { type: "number" },
                      humor_valor: { type: "number", enum: [1, 2, 3, 4, 5] },
                      humor_notas: { type: "string" },
                      // Compras
                      item: { type: "string" },
                      quantidade: { type: "string" },
                      categoria: { type: "string" },
                      // Meta
                      meta_titulo: { type: "string" },
                      meta_prazo: { type: "string", enum: ["1_mes", "6_meses", "1_ano"] },
                    },
                    additionalProperties: false,
                  },
                },
                required: ["tipo", "resposta", "dados"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "parse_command" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisicoes excedido. Tente novamente em instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Creditos insuficientes." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI error:", status, text);
      throw new Error(`AI gateway error: ${status}`);
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      return new Response(JSON.stringify({ error: "Nao consegui interpretar. Tente reformular." }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-command error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
