import { Plus, Trash2 } from "lucide-react";

interface SubtaskSectionProps {
  subtarefas: string[];
  setSubtarefas: (v: string[]) => void;
  options: string[];
}

export function SubtaskSection({ subtarefas, setSubtarefas, options }: SubtaskSectionProps) {
  return (
    <div>
      <label className="font-mono text-[10px] text-muted-foreground tracking-wider block mb-1.5">
        SUBTAREFAS ({subtarefas.length})
      </label>
      {subtarefas.length > 0 && (
        <div className="space-y-1.5 mb-2">
          {subtarefas.map((sub, i) => (
            <div key={i} className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2.5 min-h-[40px]">
              <span className="text-xs font-mono flex-1">{sub}</span>
              <button
                onClick={() => setSubtarefas(subtarefas.filter((_, idx) => idx !== i))}
                className="text-muted-foreground hover:text-destructive transition-colors p-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      {options.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {options.filter((s) => !subtarefas.includes(s)).map((opt) => (
            <button
              key={opt}
              onClick={() => setSubtarefas([...subtarefas, opt])}
              className="flex items-center gap-1 px-2.5 py-2 rounded-lg text-[10px] font-mono bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all min-h-[36px]"
            >
              <Plus className="w-3 h-3" />
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
