import { EnergyState } from "@/lib/store";
import { Zap, Sun, Battery } from "lucide-react";

interface EnergyStateSelectorProps {
  current: EnergyState | null;
  onSelect: (state: EnergyState) => void;
}

const states = [
  {
    key: "foco_total" as EnergyState,
    label: "FOCO TOTAL",
    desc: "Energia alta. Cabeça clara.",
    icon: Zap,
    detail: "Até 3 tarefas · Limpeza profunda · Registro completo",
  },
  {
    key: "modo_leve" as EnergyState,
    label: "MODO LEVE",
    desc: "Presente, com ruído.",
    icon: Sun,
    detail: "1 tarefa por vez · 1 cômodo · Confirmar remédio",
  },
  {
    key: "basico" as EnergyState,
    label: "SÓ O BÁSICO",
    desc: "Energia baixa.",
    icon: Battery,
    detail: "1 tarefa urgente · Lixo + 1 louça · Remédio",
  },
];

export function EnergyStateSelector({ current, onSelect }: EnergyStateSelectorProps) {
  return (
    <div className="space-y-3">
      <h2 className="font-mono text-sm tracking-widest text-muted-foreground uppercase">
        Como você está agora?
      </h2>
      <div className="grid gap-3">
        {states.map((s, i) => {
          const Icon = s.icon;
          const isActive = current === s.key;
          return (
            <button
              key={s.key}
              onClick={() => onSelect(s.key)}
              className={`
                group relative w-full text-left p-4 rounded-lg border transition-all duration-200
                animate-slide-up
                ${isActive
                  ? "bg-card border-primary shadow-sm"
                  : "bg-card border-border hover:border-primary/40"
                }
              `}
              style={{ animationDelay: `${i * 80}ms`, animationFillMode: "backwards" }}
            >
              <div className="flex items-start gap-3">
                <div className={`
                  mt-0.5 p-2 rounded-md transition-colors
                  ${isActive ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground group-hover:text-primary"}
                `}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold tracking-wide">
                      {s.label}
                    </span>
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5 font-body">
                    {s.desc}
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1 font-body">
                    {s.detail}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
