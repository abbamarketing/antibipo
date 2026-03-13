import type { Task } from "@/lib/store";
import { Briefcase, Home, Heart } from "lucide-react";

export interface UnifiedTask {
  id: string;
  titulo: string;
  modulo: "trabalho" | "casa" | "saude";
  tipo: "task" | "casa" | "tracker";
  status: string;
  urgencia: number;
  done: boolean;
  sourceData?: any;
  tempo_min?: number;
  taskType?: string;
  dono?: string;
  clienteName?: string;
  data_limite?: string | null;
  recorrente?: boolean;
  frequencia_recorrencia?: string | null;
  depende_de?: string | null;
  notas?: string | null;
  subtasks?: Task[];
}

export const STATUS_COLUMNS = [
  { key: "hoje", label: "HOJE", dot: "bg-primary" },
  { key: "em_andamento", label: "EM ANDAMENTO", dot: "bg-amber-400" },
  { key: "aguardando", label: "AGUARDANDO", dot: "bg-blue-400" },
  { key: "backlog", label: "BACKLOG", dot: "bg-muted-foreground/30" },
];

export const MODULE_COLORS: Record<string, string> = {
  trabalho: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  casa: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  saude: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
};

export const MODULE_LABELS: Record<string, string> = {
  trabalho: "Trabalho",
  casa: "Casa",
  saude: "Saúde",
};

export const MODULE_ICONS: Record<string, typeof Briefcase> = {
  trabalho: Briefcase,
  casa: Home,
  saude: Heart,
};

export const TYPE_LABELS: Record<string, string> = {
  estrategico: "Estratégico",
  operacional: "Operacional",
  delegavel: "Delegável",
  administrativo: "Admin",
  domestico: "Doméstico",
};
