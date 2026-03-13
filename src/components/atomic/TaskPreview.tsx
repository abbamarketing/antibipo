import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon, Repeat } from "lucide-react";
import { URGENCIA_OPTIONS, MODULO_OPTIONS, RECURRENCE_OPTIONS } from "./task-form-constants";

interface TaskPreviewProps {
  titulo: string;
  modulo: string;
  urgencia: number;
  recorrente: boolean;
  frequencia: string;
  dataEntrega?: Date;
  subtarefasCount: number;
}

export function TaskPreview({ titulo, modulo, urgencia, recorrente, frequencia, dataEntrega, subtarefasCount }: TaskPreviewProps) {
  if (titulo.length <= 3) return null;

  return (
    <div className="bg-secondary/50 rounded-lg p-3 border border-dashed">
      <p className="font-mono text-[9px] text-muted-foreground tracking-wider mb-1">PREVIEW</p>
      <p className="text-sm font-medium">{titulo}</p>
      <div className="flex flex-wrap gap-1.5 mt-2">
        <span className="inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary">
          {MODULO_OPTIONS.find((m) => m.value === modulo)?.label}
        </span>
        <span className={cn("text-[9px] font-mono px-1.5 py-0.5 rounded", URGENCIA_OPTIONS[urgencia - 1]?.color)}>
          {URGENCIA_OPTIONS[urgencia - 1]?.label}
        </span>
        {recorrente && (
          <span className="inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600">
            <Repeat className="w-2.5 h-2.5" />
            {RECURRENCE_OPTIONS.find((r) => r.value === frequencia)?.label}
          </span>
        )}
        {dataEntrega && (
          <span className="inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
            <CalendarIcon className="w-2.5 h-2.5" />
            {format(dataEntrega, "dd/MM")}
          </span>
        )}
        {subtarefasCount > 0 && (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
            {subtarefasCount} sub
          </span>
        )}
      </div>
    </div>
  );
}
