import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

function buildSystemPrompt(dayContext?: { mood?: string; energy?: string; alertLevel?: string; dayScore?: number }) {
  const base = `Você é um classificador de tarefas para o sistema AntiBipolaridade. Recebe o título de uma tarefa e informações adicionais e retorna a classificação usando tool calling.

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
Tempo estimado em minutos (padrão 30)

Se a tarefa mencionar repetição ou recorrência, marque recorrente=true e defina a frequência.
Se depender de outra pessoa para começar, identifique quem em depende_de.`;

  // Adaptive rules based on user's current state
  const adaptiveRules: string[] = [];

  if (dayContext) {
    adaptiveRules.push(`\n\n--- ESTADO ATUAL DO USUÁRIO ---`);
    if (dayContext.mood) adaptiveRules.push(`Humor atual: ${dayContext.mood}`);
    if (dayContext.energy) adaptiveRules.push(`Energia atual: ${dayContext.energy}`);
    if (dayContext.alertLevel) adaptiveRules.push(`Nível de alerta: ${dayContext.alertLevel}`);
    if (dayContext.dayScore !== undefined) adaptiveRules.push(`Score do dia: ${dayContext.dayScore}/100`);

    const isLowMood = dayContext.mood === "muito_baixo" || dayContext.mood === "baixo";
    const isLowEnergy = dayContext.energy === "basico";
    const isCrisis = dayContext.alertLevel === "crise";

    if (isLowMood || isLowEnergy || isCrisis) {
      adaptiveRules.push(`\n⚠️ REGRAS DE ADAPTAÇÃO (humor baixo / energia baixa / crise):`);
      adaptiveRules.push(`- REDUZA a urgência em 1 nível (ex: 3→2, 2→1). Nunca classifique como urgência 3 a menos que seja REALMENTE crítico.`);
      adaptiveRules.push(`- AUMENTE o tempo estimado em 50% (ex: 30→45, 60→90). O usuário precisa de mais tempo.`);
      adaptiveRules.push(`- Prefira estado_ideal "modo_leve" ou "basico" em vez de "foco_total".`);
      adaptiveRules.push(`- Se a tarefa pode ser delegada, priorize delegavel.`);
      adaptiveRules.push(`- No campo adaptation_note, SEMPRE explique a adaptação feita (ex: "Reduzi a urgência porque seu humor está baixo hoje").`);
    } else if (dayContext.mood === "muito_bom" && dayContext.energy === "foco_total") {
      adaptiveRules.push(`\n✅ Usuário em excelente estado. Classifique normalmente, pode usar urgência 3 e foco_total quando apropriado.`);
    }
  }

  return base + adaptiveRules.join("\n");
}

const TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "classify_task",
      description: "Classifica uma tarefa com tipo, estado ideal, urgência, impacto, dono, tempo, recorrência, dependências e nota de adaptação.",
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
          recorrente: { type: "boolean", description: "Whether this task repeats" },
          frequencia_recorrencia: { type: "string", description: "diario, semanal, quinzenal, mensal" },
          depende_de: { type: "string", description: "Person this task depends on" },
          adaptation_note: { type: "string", description: "If classification was adapted due to user mood/energy, explain the adaptation briefly in Portuguese. Empty string if no adaptation." },
        },
      },
    },
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { titulo, notas, dayContext } = await req.json();
    if (!titulo) throw new Error("titulo is required");

    const userContent = `Classifique esta tarefa: "${titulo}"${notas ? `\nNotas adicionais: ${notas}` : ""}`;
    const systemPrompt = buildSystemPrompt(dayContext);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("No AI provider available");

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
          { role: "user", content: userContent },
        ],
        tools: TOOLS,
        tool_choice: { type: "function", function: { name: "classify_task" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway returned ${status}`);
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) throw new Error("No classification returned");
    const classification = JSON.parse(toolCall.function.arguments);

    // Extract adaptation_note before sending classification
    const adaptation_note = classification.adaptation_note || null;
    delete classification.adaptation_note;

    return new Response(JSON.stringify({ classification, adaptation_note, ai_provider: "lovable_ai" }), {
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
