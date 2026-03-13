import { cn } from "@/lib/utils";
import { TEMPLATES, type TemplateId } from "./task-form-constants";

interface TemplateSelectorProps {
  selected: TemplateId | null;
  onSelect: (id: TemplateId) => void;
}

export function TemplateSelector({ selected, onSelect }: TemplateSelectorProps) {
  return (
    <div>
      <label className="font-mono text-[10px] text-muted-foreground tracking-wider block mb-2">
        TIPO DE TAREFA
      </label>
      <div className="grid grid-cols-2 gap-2">
        {TEMPLATES.map((t) => {
          const TIcon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => onSelect(t.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-3 rounded-lg text-xs font-mono text-left transition-all border min-h-[48px]",
                selected === t.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary text-muted-foreground border-transparent hover:border-primary/30 active:bg-secondary/80"
              )}
            >
              <TIcon className="w-4 h-4 shrink-0" />
              <span className="leading-tight">{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
