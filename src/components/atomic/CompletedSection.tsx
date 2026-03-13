import { CheckCircle2, ChevronDown, ChevronRight } from "lucide-react";
import { MODULE_COLORS, MODULE_LABELS } from "@/components/kanban/kanban-types";
import type { Task } from "@/lib/store";

interface CompletedSectionProps {
  tasks: Task[];
  show: boolean;
  onToggle: () => void;
}

export function CompletedSection({ tasks, show, onToggle }: CompletedSectionProps) {
  if (tasks.length === 0) return null;

  return (
    <div>
      <button
        onClick={onToggle}
        className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors"
      >
        {show ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        CONCLUÍDAS HOJE ({tasks.length})
      </button>
      {show && (
        <div className="mt-2 space-y-1 pl-5">
          {tasks.map((t) => (
            <div key={t.id} className="bg-card/50 rounded-lg border border-dashed p-3 flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary/50" />
              <span className="text-sm text-muted-foreground line-through">{t.titulo}</span>
              <span className={`ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded ${MODULE_COLORS[t.modulo]}`}>
                {MODULE_LABELS[t.modulo]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
