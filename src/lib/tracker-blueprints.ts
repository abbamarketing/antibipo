/**
 * Pre-scripted module blueprints.
 * The AI picks a blueprint and fills parameters — no generative AI needed after initial parse.
 */

export type TrackerType = "recorrente" | "checklist" | "meta" | "alerta";

export interface RecorrenteConfig {
  frequencia_dias: number;
  ultima_vez?: string; // ISO date
  icone?: string;
}

export interface ChecklistConfig {
  itens: { id: string; label: string }[];
  reseta_diario: boolean;
}

export interface MetaConfig {
  alvo: number;
  unidade: string;
  atual: number;
  prazo?: string; // ISO date
}

export interface AlertaConfig {
  data_alvo: string; // ISO date
  lembrete_dias_antes: number;
  recorrente: boolean;
  frequencia_dias?: number;
}

export type TrackerConfig = RecorrenteConfig | ChecklistConfig | MetaConfig | AlertaConfig;

export interface Blueprint {
  tipo: TrackerType;
  label: string;
  descricao: string;
  defaultConfig: TrackerConfig;
  defaultSecao: string;
  defaultModulo: string;
}

/**
 * Blueprints available for the AI to instantiate.
 * AI just picks one and fills the parameters — zero generative tokens after parse.
 */
export const BLUEPRINTS: Record<string, Blueprint> = {
  tarefa_recorrente: {
    tipo: "recorrente",
    label: "Tarefa Recorrente",
    descricao: "Tarefa que se repete a cada X dias (ex: cortar cabelo, trocar lençol)",
    defaultConfig: { frequencia_dias: 7 } as RecorrenteConfig,
    defaultSecao: "geral",
    defaultModulo: "casa",
  },
  checklist_diario: {
    tipo: "checklist",
    label: "Checklist Diário",
    descricao: "Lista de itens para completar todo dia (ex: rotina matinal)",
    defaultConfig: { itens: [], reseta_diario: true } as ChecklistConfig,
    defaultSecao: "rotina",
    defaultModulo: "saude",
  },
  meta_progresso: {
    tipo: "meta",
    label: "Meta com Progresso",
    descricao: "Objetivo com valor numérico a alcançar (ex: ler 12 livros, perder 5kg)",
    defaultConfig: { alvo: 1, unidade: "unidades", atual: 0 } as MetaConfig,
    defaultSecao: "metas",
    defaultModulo: "saude",
  },
  alerta_lembrete: {
    tipo: "alerta",
    label: "Alerta/Lembrete",
    descricao: "Lembrete para uma data específica (ex: renovar documento, consulta médica)",
    defaultConfig: { data_alvo: "", lembrete_dias_antes: 3, recorrente: false } as AlertaConfig,
    defaultSecao: "lembretes",
    defaultModulo: "saude",
  },
  higiene_recorrente: {
    tipo: "recorrente",
    label: "Higiene Recorrente",
    descricao: "Tarefa de higiene pessoal recorrente (ex: cortar cabelo, fazer barba)",
    defaultConfig: { frequencia_dias: 15 } as RecorrenteConfig,
    defaultSecao: "higiene",
    defaultModulo: "saude",
  },
  escovacao: {
    tipo: "checklist",
    label: "Escovação de Dentes",
    descricao: "Rastrear escovação manhã e noite",
    defaultConfig: {
      itens: [
        { id: "manha", label: "Manhã" },
        { id: "noite", label: "Noite" },
      ],
      reseta_diario: true,
    } as ChecklistConfig,
    defaultSecao: "higiene",
    defaultModulo: "saude",
  },
};

/**
 * Check if a recurrent tracker is due based on last completion date.
 */
export function isRecorrenteDue(config: RecorrenteConfig, lastDate?: string): boolean {
  if (!lastDate) return true;
  const last = new Date(lastDate);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= config.frequencia_dias;
}

/**
 * Days remaining until a recurrent task is due.
 */
export function diasRestantes(config: RecorrenteConfig, lastDate?: string): number {
  if (!lastDate) return 0;
  const last = new Date(lastDate);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, config.frequencia_dias - diffDays);
}

/**
 * Days until an alert is due.
 */
export function diasParaAlerta(config: AlertaConfig): number {
  const alvo = new Date(config.data_alvo);
  const now = new Date();
  return Math.ceil((alvo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}
