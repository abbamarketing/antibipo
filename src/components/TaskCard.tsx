import { Task, EnergyState } from "@/lib/store";
import { Check, Clock, ArrowRight, Send } from "lucide-react";

interface TaskCardProps {
  task: Task;
  onComplete: (id: string) => void;
  onDelegate: (id: string) => void;
  onPush: (id: string) => void;
}

const typeLabels: Record<string, string> = {
  estrategico: "Estratégico",
  operacional: "Operacional",
  delegavel: "Delegável",
  administrativo: "Admin",
  domestico: "Doméstico",
};

export function TaskCard({ task, onComplete, onDelegate, onPush }: TaskCardProps) {
  const urgencyBorder = task.urgencia === 3 ? "border-l-queue-red" : task.urgencia === 2 ? "border-l-queue-yellow" : "border-l-transparent";

  return (
    <div className={`bg-card rounded-lg border p-4 border-l-[3px] ${urgencyBorder} animate-fade-in`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug">{task.titulo}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
              {typeLabels[task.tipo] || task.tipo}
            </span>
            <span className="text-muted-foreground/40">·</span>
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="w-3 h-3" />
              {task.tempo_min}min
            </span>
            {task.dono !== "eu" && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <span className="font-mono text-[10px] text-primary">
                  {task.dono === "socio_medico" ? "Sócio Médico" : "Editor"}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => onComplete(task.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground font-mono text-[11px] font-medium hover:opacity-90 transition-opacity"
        >
          <Check className="w-3 h-3" /> Feito
        </button>
        <button
          onClick={() => onPush(task.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground font-mono text-[11px] font-medium hover:bg-secondary/80 transition-colors"
        >
          <ArrowRight className="w-3 h-3" /> Empurrar
        </button>
        {(task.tipo === "delegavel" || task.dono !== "eu") && (
          <button
            onClick={() => onDelegate(task.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground font-mono text-[11px] font-medium hover:bg-secondary/80 transition-colors"
          >
            <Send className="w-3 h-3" /> Delegar
          </button>
        )}
      </div>
    </div>
  );
}
