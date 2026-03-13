import { Briefcase, Home, Heart, Target } from "lucide-react";

export type NavModulo = "trabalho" | "casa" | "saude" | "metas";

interface ModuleNavProps {
  current: NavModulo;
  onSelect: (m: NavModulo) => void;
}

const modules: { key: NavModulo; label: string; icon: typeof Briefcase }[] = [
  { key: "trabalho", label: "TRABALHO", icon: Briefcase },
  { key: "casa", label: "CASA", icon: Home },
  { key: "saude", label: "SAÚDE", icon: Heart },
  { key: "metas", label: "METAS", icon: Target },
];

export function ModuleNav({ current, onSelect }: ModuleNavProps) {
  return (
    <nav className="flex gap-1 rounded-xl p-1">
      {modules.map((m) => {
        const Icon = m.icon;
        const isActive = current === m.key;
        return (
          <button
            key={m.key}
            onClick={() => onSelect(m.key)}
            className={`
              flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-mono text-xs font-medium tracking-wider
              transition-all duration-200 ease-out
              ${isActive
                ? "bg-card text-foreground shadow-md scale-[1.02]"
                : "text-muted-foreground hover:text-foreground hover:bg-card/50 active:scale-95"
              }
            `}
          >
            <Icon className={`w-3.5 h-3.5 transition-colors duration-200 ${isActive ? "text-primary" : ""}`} />
            <span className="hidden sm:inline">{m.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
