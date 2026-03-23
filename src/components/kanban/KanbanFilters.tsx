import { MODULE_ICONS, MODULE_LABELS } from "./kanban-types";

interface KanbanFiltersProps {
  filterModule: "trabalho" | "casa" | "saude" | null;
  onFilterChange: (mod: "trabalho" | "casa" | "saude" | null) => void;
  moduleCounts: Record<"trabalho" | "casa" | "saude", number>;
}

export function KanbanFilters({ filterModule, onFilterChange, moduleCounts }: KanbanFiltersProps) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onFilterChange(null)}
        className={`px-3 py-2 rounded-xl text-[11px] font-mono transition-all min-h-[40px] ${
          !filterModule ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
        }`}
      >
        TODOS
      </button>
      {(["trabalho", "casa", "saude"] as const).map((m) => {
        const Icon = MODULE_ICONS[m];
        return (
          <button
            key={m}
            onClick={() => onFilterChange(filterModule === m ? null : m)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-mono transition-all min-h-[40px] ${
              filterModule === m ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {MODULE_LABELS[m]}
            {moduleCounts[m] > 0 && <span className="opacity-60">({moduleCounts[m]})</span>}
          </button>
        );
      })}
    </div>
  );
}
