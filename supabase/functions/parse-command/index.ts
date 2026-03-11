import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callGeminiWithUserToken, getUserIdFromRequest, type GeminiOptions } from "../_shared/google-gemini.ts";

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
          tipo: { type: "string", enum: ["financeiro", "calendario", "casa", "trabalho", "saude_exercicio", "saude_medicamento", "saude_peso", "saude_humor", "compras", "meta", "diario", "criar_tracker"], description: "Tipo da acao detectada" },
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
              // Tracker creation fields
              tracker_titulo: { type: "string", description: "Nome do tracker" },
              tracker_tipo: { type: "string", enum: ["recorrente", "checklist", "meta", "alerta"], description: "Tipo do modulo pre-scriptado" },
              tracker_modulo: { type: "string", enum: ["saude", "casa", "trabalho"], description: "Modulo onde o tracker aparece" },
              tracker_secao: { type: "string", description: "Secao dentro do modulo (ex: higiene, rotina, lembretes)" },
              tracker_frequencia_dias: { type: "number", description: "Frequencia em dias para tipo recorrente" },
              tracker_checklist_itens: { type: "array", items: { type: "string" }, description: "Itens do checklist" },
              tracker_meta_alvo: { type: "number", description: "Valor alvo para tipo meta" },
              tracker_meta_unidade: { type: "string", description: "Unidade da meta (ex: livros, kg, km)" },
              tracker_data_alvo: { type: "string", description: "Data alvo para alertas YYYY-MM-DD" },
              tracker_lembrete_dias: { type: "number", description: "Dias antes para lembrar" },
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
- "lavei" / "limpei" / "arrumei" / "passei" / "aspirei" -> casa (tarefa de limpeza)
- "fiz exercicio" / "caminhei" / "corri" / "academia" / "treino" -> saude_exercicio
- "tomei remedio" / "tomei medicamento" -> saude_medicamento
- "peso X" / "estou pesando X" -> saude_peso
- "humor X" / "me sinto" / "to bem" / "to mal" -> saude_humor
- "preciso fazer" / "tarefa" / "to do" / qualquer tarefa de trabalho -> trabalho
- "comprar" / "preciso comprar" / "lista" -> compras
- "meta" / "objetivo" / "quero alcançar" -> meta
- QUALQUER texto que seja relato pessoal, diario, documentacao do dia, reflexao, desabafo -> diario

REGRAS PARA CRIAR TRACKERS (modulos pre-scriptados):
- "quero uma feature" / "criar rastreador" / "adicionar tracker" / "nova tarefa recorrente" / "me lembre de X a cada Y dias" -> criar_tracker
- "a cada X dias" / "todo mes" / "toda semana" -> tipo recorrente com frequencia
- "checklist de X" / "rotina de X" -> tipo checklist
- "meta de X" / "quero atingir X" -> tipo meta  
- "me avise quando" / "lembrete para" / "renovar X" -> tipo alerta
- Detecte automaticamente o modulo (saude, casa, trabalho) e secao (higiene, rotina, lembretes, etc.)
- Para recorrentes, extraia a frequencia em dias (semanal=7, quinzenal=15, mensal=30)
- Para checklists, extraia os itens individuais
- Para metas, extraia o valor alvo e unidade
- Para alertas, extraia a data e dias de antecedencia

REGRAS ESPECIAIS PARA TAREFAS DE TRABALHO:
- Detecte o nome do cliente quando mencionado
- Detecte se a tarefa e recorrente
- Detecte subtarefas quando o usuario menciona passos
- Detecte dependencias de pessoas
- Detecte prazo/data limite
- Se mencionar "toda semana/mes/dia", marque como recorrente
- Frequencias possiveis: diario, semanal, quinzenal, mensal
- Para datas relativas: "amanha" = dia seguinte, "segunda" = proxima segunda, etc.
- Para valores financeiros: extraia o numero e determine se e entrada ou saida pelo contexto
- Se o usuario nao especificar urgencia, use 2 (semana)
- Responda com uma confirmacao curta e amigavel no campo "resposta"`;

    const geminiOpts: GeminiOptions = {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      tools: TOOLS,
      tool_choice: { type: "function", function: { name: "parse_command" } },
    };

    // Try user's Google token first
    const userId = await getUserIdFromRequest(req);
    let parsed: any = null;
    let ai_provider = "none";

    if (userId) {
      const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const result = await callGeminiWithUserToken(supabaseAdmin, userId, geminiOpts);
      if (result?.toolCall) {
        parsed = JSON.parse(result.toolCall.arguments);
        ai_provider = "gemini_direct";
      }
    }

    // Fallback to Lovable AI
    if (!parsed) {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) throw new Error("No AI provider available");

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: geminiOpts.messages,
          tools: TOOLS,
          tool_choice: geminiOpts.tool_choice,
        }),
      });

      if (!response.ok) {
        const status = response.status;
        if (status === 429) return new Response(JSON.stringify({ error: "Limite de requisicoes excedido." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "Creditos insuficientes." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error(`AI gateway error: ${status}`);
      }

      ai_provider = "lovable_ai";
      const result = await response.json();
      const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) return new Response(JSON.stringify({ error: "Nao consegui interpretar." }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      parsed = JSON.parse(toolCall.function.arguments);
    }

    return new Response(JSON.stringify({ ...parsed, ai_provider }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("parse-command error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
