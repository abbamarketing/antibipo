import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const KNOWLEDGE_BASE = `
# BASE DE CONHECIMENTO — CRM da Abba (Doutor Hérnia)

## VISÃO GERAL
O CRM da Abba (crm.abba.marketing) é o sistema de gestão de pacientes da Clínica Doutor Hérnia. A secretária usa para gerenciar pipeline de vendas, calendário, conversas e contatos.

## ACESSO AO SISTEMA
- URL: crm.abba.marketing (digitar direto na barra, não pesquisar no Google)
- Usar Chrome para melhor compatibilidade
- Primeiro acesso: email com convite → definir senha
- Salvar nos favoritos para facilitar

## PIPELINE DE VENDAS (Oportunidades)
Menu lateral → ícone de $ ou funil → "Pipeline de Vendas"

### Etapas:
| Etapa | Quem move? | Quando |
|---|---|---|
| Novo Lead | AUTOMÁTICO | Paciente chegou pelo anúncio |
| Avaliação Agendada | AUTOMÁTICO | Olivia agendou |
| Não Compareceu | SECRETÁRIA | Paciente faltou |
| Em Negociação | SECRETÁRIA | Veio mas não fechou |
| Protocolo Vendido | SECRETÁRIA | Fechou o protocolo |
| Perdido | AUTOMÁTICO | Desistiu |

### Regras:
- NUNCA mova para "Novo Lead" ou "Perdido" manualmente
- NO FINAL DO DIA: nenhum paciente atendido pode ficar em "Avaliação Agendada"
- Paciente faltou → Não Compareceu (Olivia tenta reagendar automaticamente)
- Veio mas não fechou → Em Negociação
- Fechou → Protocolo Vendido

## CALENDÁRIO
Menu lateral → Calendários

### Tipos de calendário:
- **Avaliação**: Paciente NOVO, primeira consulta
- **Sessão**: Paciente que JÁ fechou protocolo, em tratamento

### Cadastrar compromisso:
1. Selecionar calendário correto (Avaliação ou Sessão)
2. Clicar no dia/horário
3. Buscar contato ou criar novo
4. **IMPORTANTE**: Status SEMPRE como "Unconfirmed"
5. Salvar

### Por que "Unconfirmed"?
- 24h antes: sistema envia lembrete WhatsApp automaticamente
- Se paciente confirmar → status muda para "Confirmed" sozinho
- Se NÃO confirmar → 2h antes a secretária recebe ALERTA para ligar
- NUNCA confirmar manualmente

### Cancelar/Reagendar:
- Cancelar: mudar status para "Cancelled"
- Reagendar: alterar data/horário ou arrastar

## ALERTAS DE NÃO CONFIRMAÇÃO
Quando paciente não responde lembrete de 24h:
1. Secretária recebe alerta 2h antes do horário
2. Ligar para o paciente: "Olá [Nome], aqui é da Clínica Doutor Hérnia. Vi que sua avaliação é hoje às [hora]. Você vem?"
3. Se confirmar: aguardar
4. Se quiser remarcar: cancelar e criar novo compromisso
5. Se não atender: tentar mais uma vez, se não vier → Não Compareceu

## CONVERSAS
Menu lateral → ícone de balão → ver histórico do WhatsApp com a Olivia.
**SOMENTE LEITURA** — não responder pelas conversas. Se precisar falar com paciente, ligar.

## CONTATOS
Menu lateral → Contatos → buscar por nome ou telefone → corrigir dados.
**NUNCA APAGAR CONTATOS** — apagar remove todo o histórico.

## ROTINA DIÁRIA COMPLETA
| Quando | O que fazer | Onde |
|---|---|---|
| Ao chegar | Conferir agenda do dia | Calendário |
| Recebeu alerta | Ligar pro paciente | Telefone |
| Paciente chegou | Consultar conversa da Olivia | Conversas |
| Fez avaliação, não fechou | Mover para Em Negociação | Oportunidades |
| Fechou protocolo | Mover para Protocolo Vendido | Oportunidades |
| Paciente faltou | Mover para Não Compareceu | Oportunidades |
| Novo agendamento | Cadastrar no calendário | Calendário |
| Dado errado | Corrigir na ficha | Contatos |
| Final do dia | Mover todos de Avaliação Agendada | Oportunidades |

## SITUAÇÕES ESPECIAIS
- **Paciente sem agendamento**: atender normalmente, depois buscar em Contatos e criar compromisso
- **Paciente em Negociação quer fechar**: mover para Protocolo Vendido + agendar sessões
- **Sistema lento**: F5 para atualizar, se persistir avisar gestor de marketing

## SOBRE A OLIVIA (SDR)
A Olivia é a consultora virtual que atende pacientes pelo WhatsApp. Ela:
- Acolhe e conduz pacientes com dores na coluna até a avaliação presencial
- Agenda automaticamente no CRM
- Envia lembretes 24h antes
- Tenta reagendar pacientes que faltaram
- NÃO é IA/robô na visão do paciente — é parte da equipe

## GO HIGH LEVEL (GHL) — CONCEITOS BÁSICOS
O CRM da Abba roda sobre o GoHighLevel. Conceitos úteis:
- **Subcontas**: cada clínica tem sua subconta
- **Pipelines**: quadro visual tipo Kanban para acompanhar leads
- **Oportunidades**: cada paciente/lead no pipeline é uma "oportunidade"
- **Workflows**: automações que disparam ações (ex: enviar lembrete)
- **Calendários**: agenda integrada com agendamento online
- **Conversas**: inbox unificado (WhatsApp, SMS, email)
- **Contatos**: base de dados de todos os pacientes/leads
- **Tags**: etiquetas para classificar contatos
- **Custom Values**: variáveis personalizadas (cidade, endereço, valor)
- **Triggers**: gatilhos que iniciam workflows (ex: novo lead criado)
- **Dashboard**: painel com métricas e widgets personalizáveis
`;

const SYSTEM_PROMPT = `Você é a assistente de suporte do CRM da Abba (Clínica Doutor Hérnia). 
Responda APENAS com base na base de conhecimento fornecida. 
Se não souber a resposta, diga "Não tenho essa informação na base. Por favor, consulte o gestor de marketing."

Regras:
- Responda em português do Brasil, de forma clara e objetiva
- Use formatação markdown quando apropriado
- Seja amigável e profissional
- Para perguntas sobre GHL (GoHighLevel), responda conceitos básicos
- Para perguntas fora do escopo (não relacionadas ao CRM ou GHL), diga educadamente que só pode ajudar com o CRM da Abba e GoHighLevel
- Mantenha respostas concisas mas completas

${KNOWLEDGE_BASE}`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Limite de uso atingido." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("crm-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
