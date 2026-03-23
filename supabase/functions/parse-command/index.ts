import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "parse_command",
      description: "Converte texto natural do usuario em acao estruturada para o app AntiBipolaridade.",
      parameters: {
        type: "object",
        properties: {
          tipo: { type: "string", enum: ["financeiro", "calendario", "casa", "trabalho", "saude_exercicio", "saude_medicamento", "saude_peso", "saude_humor", "compras", "meta", "diario", "criar_tracker", "plano_casa"], description: "Tipo da acao detectada" },
          resposta: { type: "string", description: "Confirmacao curta e amigavel para o usuario (max 80 chars)" },
          dados: {
            type: "object",
            description: "Dados estruturados da acao",
            properties: {
              valor: { type: "number" }, tipo_lancamento: { type: "string", enum: ["entrada", "saida"] },
              descricao: { type: "string" }, titulo: { type: "string" },
              data: { type: "string", description: "YYYY-MM-DD" },
              hora_inicio: { type: "string", description: "HH:MM" },
              hora_fim: { type: "string", description: "HH:MM ou null" },
              local: { type: "string" },
              participantes: { type: "array", items: { type: "string" } },
              tipo_reuniao: { type: "string", enum: ["reuniao", "consulta", "call", "evento"] },
              tarefa: { type: "string" }, comodo: { type: "string" },
              urgencia: { type: "number" },
              modulo: { type: "string", enum: ["trabalho", "casa", "saude"] },
              cliente_nome: { type: "string" },
              recorrente: { type: "boolean" },
              frequencia_recorrencia: { type: "string", enum: ["diario", "semanal", "quinzenal", "mensal"] },
              subtarefas: { type: "array", items: { type: "string" } },
              depende_de: { type: "string" }, data_limite: { type: "string" },
              notas: { type: "string" },
              tipo_exercicio: { type: "string" }, duracao_min: { type: "number" },
              intensidade: { type: "number" }, peso_kg: { type: "number" },
              humor_valor: { type: "number" }, humor_notas: { type: "string" },
              item: { type: "string" }, quantidade: { type: "string" }, categoria: { type: "string" },
              meta_titulo: { type: "string" }, meta_prazo: { type: "string", enum: ["1_mes", "6_meses", "1_ano"] },
              diario_texto: { type: "string" }, diario_humor: { type: "number" },
              diario_sentimento: { type: "string" }, diario_tags: { type: "array", items: { type: "string" } },
              tracker_titulo: { type: "string" },
              tracker_tipo: { type: "string", enum: ["recorrente", "checklist", "meta", "alerta"] },
              tracker_modulo: { type: "string", enum: ["saude", "casa", "trabalho"] },
              tracker_secao: { type: "string" },
              tracker_frequencia_dias: { type: "number" },
              tracker_checklist_itens: { type: "array", items: { type: "string" } },
              tracker_meta_alvo: { type: "number" },
              tracker_meta_unidade: { type: "string" },
              tracker_data_alvo: { type: "string" },
              tracker_lembrete_dias: { type: "number" },
              plano_tarefas: { type: "array", items: { type: "object", properties: { comodo: { type: "string" }, tarefa: { type: "string" }, prioridade: { type: "number" }, tempo_estimado_min: { type: "number" } }, required: ["comodo", "tarefa"] } },
              plano_prazo: { type: "string" },
              plano_resumo: { type: "string" },
            },
          },
        },
        required: ["tipo", "resposta", "dados"],
      },
    },
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // 1. Verify JWT authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // user_id comes from JWT, never from body
    const userId = claimsData.claims.sub as string;

    const { message, context } = await req.json();
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
- "lavei" / "limpei" / "arrumei" / "passei" / "aspirei" -> casa (tarefa de limpeza ja feita)
- "fiz exercicio" / "caminhei" / "corri" / "academia" / "treino" -> saude_exercicio
- "tomei remedio" / "tomei medicamento" -> saude_medicamento
- "peso X" / "estou pesando X" -> saude_peso
- "humor X" / "me sinto" / "to bem" / "to mal" -> saude_humor
- "preciso fazer" / "tarefa" / "to do" / qualquer tarefa de trabalho -> trabalho
- "comprar" / "preciso comprar" / "lista" -> compras
- "meta" / "objetivo" / "quero alcançar" -> meta
- QUALQUER texto que seja relato pessoal, diario, documentacao do dia, reflexao, desabafo -> diario

REGRAS PARA PLANO DE ORGANIZACAO DA CASA (plano_casa):
- "arrumar a casa" / "organizar a casa" / "limpeza geral" / "faxina" -> plano_casa
- Gere um PLANO com lista de tarefas por comodo

REGRAS PARA CRIAR TRACKERS:
- "quero uma feature" / "criar rastreador" / "adicionar tracker" -> criar_tracker

REGRAS ESPECIAIS PARA TAREFAS DE TRABALHO:
- Detecte cliente, recorrencia, subtarefas, dependencias, prazo
- Se mencionar "toda semana/mes/dia", marque como recorrente
- Para datas relativas: "amanha" = dia seguinte, "segunda" = proxima segunda, etc.
- Se o usuario nao especificar urgencia, use 2 (semana)
- Responda com uma confirmacao curta e amigavel no campo "resposta"`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("No AI provider available");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        tools: TOOLS,
        tool_choice: { type: "function", function: { name: "parse_command" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Limite de requisicoes excedido." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Creditos insuficientes." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${status}`);
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) return new Response(JSON.stringify({ error: "Nao consegui interpretar." }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ ...parsed, user_id: userId, ai_provider: "lovable_ai" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("parse-command error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
