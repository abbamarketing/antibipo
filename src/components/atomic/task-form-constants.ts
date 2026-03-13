import {
  Briefcase, Home, Heart, Clock, AlertTriangle, Zap,
  Users, FileText, Wrench, Stethoscope,
} from "lucide-react";

// ─── Templates ──────────────────────────────────────────────
export const TEMPLATES = [
  { id: "acao_cliente", label: "Ação / Cliente", icon: Briefcase, fields: ["acao", "cliente", "data_entrega"] },
  { id: "reuniao", label: "Reunião / Call", icon: Users, fields: ["assunto", "participante", "data_entrega"] },
  { id: "entrega", label: "Entregar projeto", icon: FileText, fields: ["projeto", "cliente", "data_entrega"] },
  { id: "tarefa_geral", label: "Tarefa operacional", icon: Wrench, fields: ["descricao", "data_entrega"] },
  { id: "domestico", label: "Tarefa doméstica", icon: Home, fields: ["tarefa_casa", "comodo", "data_entrega"] },
  { id: "saude", label: "Tarefa de saúde", icon: Stethoscope, fields: ["atividade", "data_entrega"] },
] as const;

export type TemplateId = typeof TEMPLATES[number]["id"];
export type FieldValues = Record<string, string>;

export const ACOES = [
  "Integração", "Deploy", "Design", "Desenvolvimento", "Revisão",
  "Configuração", "Análise", "Documentação", "Teste", "Suporte",
  "Atualização", "Migração", "Correção", "Otimização", "Apresentação",
];

export const ASSUNTOS = [
  "Alinhamento", "Planejamento", "Retrospectiva", "Review", "Daily",
  "Kickoff", "Follow-up", "Feedback", "Onboarding", "Treinamento",
];

export const COMODOS = [
  "Cozinha", "Sala", "Quarto", "Banheiro", "Lavanderia",
  "Escritório", "Varanda", "Garagem", "Geral",
];

export const TAREFAS_CASA = [
  "Lavar louça", "Aspirar", "Limpar", "Organizar", "Arrumar cama",
  "Tirar lixo", "Lavar roupa", "Passar roupa", "Cozinhar", "Compras",
];

export const ATIVIDADES_SAUDE = [
  "Consulta médica", "Exame", "Tomar medicamento", "Exercício",
  "Fisioterapia", "Terapia", "Nutricionista", "Dentista", "Check-up",
];

export const PROJETOS = [
  "App", "Site", "Sistema", "Integração", "Automação",
  "Dashboard", "Landing Page", "E-commerce", "API", "MVP",
];

export const URGENCIA_OPTIONS = [
  { value: 1, label: "Baixa", icon: Clock, color: "bg-secondary text-muted-foreground", activeColor: "bg-secondary border-muted-foreground text-foreground" },
  { value: 2, label: "Média", icon: AlertTriangle, color: "bg-amber-500/15 text-amber-700 dark:text-amber-300", activeColor: "bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300" },
  { value: 3, label: "Alta", icon: Zap, color: "bg-destructive/15 text-destructive", activeColor: "bg-destructive/15 border-destructive text-destructive" },
];

export const MODULO_OPTIONS = [
  { value: "trabalho", label: "Trabalho", icon: Briefcase },
  { value: "casa", label: "Casa", icon: Home },
  { value: "saude", label: "Saúde", icon: Heart },
];

export const RECURRENCE_OPTIONS = [
  { value: "diario", label: "Diário" },
  { value: "semanal", label: "Semanal" },
  { value: "quinzenal", label: "Quinzenal" },
  { value: "mensal", label: "Mensal" },
];

// ─── Keyword-based module detection ─────────────────────────
const KEYWORD_MODULE_MAP: { keywords: string[]; module: "trabalho" | "casa" | "saude" }[] = [
  { keywords: ["cliente", "deploy", "código", "api", "design", "meeting", "reunião", "projeto", "sprint", "dev", "review", "apresentação", "relatório", "email", "contrato"], module: "trabalho" },
  { keywords: ["limpeza", "cozinha", "lavar", "aspirar", "organizar", "compras", "mercado", "louça", "roupa", "varrer", "lixo", "cama", "banheiro", "jardim"], module: "casa" },
  { keywords: ["médico", "remédio", "exercício", "terapia", "exame", "consulta", "dentista", "academia", "caminhada", "fisio", "nutricionista", "sono", "medicamento", "saúde"], module: "saude" },
];

export function detectModuleFromKeywords(text: string): "trabalho" | "casa" | "saude" | null {
  const lower = text.toLowerCase();
  for (const entry of KEYWORD_MODULE_MAP) {
    if (entry.keywords.some((kw) => lower.includes(kw))) return entry.module;
  }
  return null;
}

// ─── Quick Bar parsing ──────────────────────────────────────
const TAG_MODULE_MAP: Record<string, "trabalho" | "casa" | "saude"> = {
  "@trabalho": "trabalho", "@work": "trabalho", "@trab": "trabalho",
  "@casa": "casa", "@home": "casa", "@lar": "casa",
  "@saude": "saude", "@saúde": "saude", "@health": "saude", "@med": "saude",
};

const TAG_URGENCIA_MAP: Record<string, number> = {
  "!alta": 3, "!urgente": 3, "!high": 3,
  "!media": 2, "!média": 2, "!med": 2,
  "!baixa": 1, "!low": 1,
};

export interface QuickBarResult {
  titulo: string;
  modulo: "trabalho" | "casa" | "saude" | null;
  urgencia: number | null;
}

export function parseQuickBar(input: string): QuickBarResult {
  let text = input.trim();
  let modulo: "trabalho" | "casa" | "saude" | null = null;
  let urgencia: number | null = null;

  // Extract @module tags
  for (const [tag, mod] of Object.entries(TAG_MODULE_MAP)) {
    const regex = new RegExp(tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    if (regex.test(text)) {
      modulo = mod;
      text = text.replace(regex, '').trim();
      break;
    }
  }

  // Extract !urgency tags
  for (const [tag, urg] of Object.entries(TAG_URGENCIA_MAP)) {
    const regex = new RegExp(tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    if (regex.test(text)) {
      urgencia = urg;
      text = text.replace(regex, '').trim();
      break;
    }
  }

  // Fallback: detect module from keywords if no explicit tag
  if (!modulo) {
    modulo = detectModuleFromKeywords(text);
  }

  // Default urgency to 2 (média) if module was detected but no urgency specified
  if (modulo && urgencia === null) {
    urgencia = 2;
  }

  // Clean up extra spaces
  text = text.replace(/\s+/g, ' ').trim();

  return { titulo: text, modulo, urgencia };
}

export function getSubtaskOptions(template: TemplateId | null): string[] {
  switch (template) {
    case "acao_cliente":
    case "entrega":
      return ["Planejamento", "Desenvolvimento", "Teste", "Review", "Deploy", "Documentação", "Notificar cliente"];
    case "reuniao":
      return ["Preparar pauta", "Enviar convite", "Criar apresentação", "Anotar ata", "Enviar follow-up"];
    case "tarefa_geral":
      return ["Pesquisar", "Executar", "Revisar", "Finalizar", "Reportar"];
    case "domestico":
      return ["Separar materiais", "Executar", "Guardar tudo", "Verificar resultado"];
    case "saude":
      return ["Agendar", "Preparar documentos", "Ir ao local", "Registrar resultado"];
    default:
      return [];
  }
}

export function buildTitle(template: TemplateId | null, fields: FieldValues): string {
  switch (template) {
    case "acao_cliente": return `${fields.acao || "Ação"} para ${fields.cliente || "cliente"}`;
    case "reuniao": return `${fields.assunto || "Reunião"} com ${fields.participante || "participante"}`;
    case "entrega": return `Entregar ${fields.projeto || "projeto"} — ${fields.cliente || "cliente"}`;
    case "tarefa_geral": return fields.descricao || "Tarefa";
    case "domestico": return `${fields.tarefa_casa || "Tarefa"} — ${fields.comodo || "Geral"}`;
    case "saude": return fields.atividade || "Saúde";
    default: return "";
  }
}
