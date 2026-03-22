import { Task, EnergyState } from "@/lib/store";
import { Check, Clock, ArrowRight, Send, Repeat, UserCheck, ChevronDown, ChevronRight, Calendar } from "lucide-react";
import { useState } from "react";

interface TaskCardProps {
  task: Task;
  clienteName?: string;
  subtasks?: Task[];
  onComplete: (id: string) => void;
  onDelegate: (id: string) => void;
  onPush: (id: string) => void;
}

const typeLabels: Record<string, string> = {
  operacional: "Operacional",
  domestico: "Doméstico",
};

const freqLabels: Record<string, string> = {
  diario: "Diário",
  semanal: "Semanal",
  quinzenal: "Quinzenal",
  mensal: "Mensal",
};

export function TaskCard({ task, clienteName, subtasks, onComplete, onDelegate, onPush }: TaskCardProps) {
  const [showSubs, setShowSubs] = useState(false);
  const urgencyBorder = task.urgencia === 3 ? "border-l-queue-red" : task.urgencia === 2 ? "border-l-queue-yellow" : "border-l-transparent";
  const hasSubtasks = subtasks && subtasks.length > 0;
  const completedSubs = subtasks?.filter(s => s.status === "feito").length || 0;

  return (
    <div className={`bg-card rounded-lg border p-4 border-l-[3px] ${urgencyBorder} animate-fade-in`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug">{task.titulo}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
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
            {clienteName && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <span className="font-mono text-[10px] text-accent-foreground bg-accent px-1.5 py-0.5 rounded">
                  {clienteName}
                </span>
              </>
            )}
          </div>

          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {(task as any).recorrente && (
              <span className="inline-flex items-center gap-1 font-mono text-[9px] tracking-wider text-blue-600 bg-blue-500/10 px-1.5 py-0.5 rounded">
                <Repeat className="w-2.5 h-2.5" />
                {freqLabels[(task as any).frequencia_recorrencia] || "Recorrente"}
              </span>
            )}
            {(task as any).depende_de && (
              <span className="inline-flex items-center gap-1 font-mono text-[9px] tracking-wider text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded">
                <UserCheck className="w-2.5 h-2.5" />
                Depende: {(task as any).depende_de}
              </span>
            )}
            {(task as any).data_limite && (
              <span className="inline-flex items-center gap-1 font-mono text-[9px] tracking-wider text-red-600 bg-red-500/10 px-1.5 py-0.5 rounded">
                <Calendar className="w-2.5 h-2.5" />
                {new Date((task as any).data_limite + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
              </span>
            )}
          </div>

          {/* Notas */}
          {(task as any).notas && (
            <p className="text-[11px] text-muted-foreground mt-1.5 font-body leading-relaxed">
              {(task as any).notas}
            </p>
          )}
        </div>
      </div>

      {/* Subtasks */}
      {hasSubtasks && (
        <div className="mt-2">
          <button
            onClick={() => setShowSubs(!showSubs)}
            className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            {showSubs ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            SUBTAREFAS {completedSubs}/{subtasks!.length}
          </button>
          {showSubs && (
            <div className="mt-1.5 pl-3 space-y-1 border-l border-border">
              {subtasks!.map(sub => (
                <div key={sub.id} className="flex items-center gap-2">
                  <button
                    onClick={() => sub.status !== "feito" && onComplete(sub.id)}
                    className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                      sub.status === "feito" ? "bg-primary border-primary" : "border-muted-foreground/40 hover:border-primary"
                    }`}
                  >
                    {sub.status === "feito" && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                  </button>
                  <span className={`text-xs font-body ${sub.status === "feito" ? "line-through text-muted-foreground/50" : ""}`}>
                    {sub.titulo}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
