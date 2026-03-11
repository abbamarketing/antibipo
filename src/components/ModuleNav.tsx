import { Modulo } from "@/lib/store";
import { Briefcase, Home, Heart } from "lucide-react";

interface ModuleNavProps {
  current: Modulo;
  onSelect: (m: Modulo) => void;
}

const modules = [
  { key: "trabalho" as Modulo, label: "TRABALHO", icon: Briefcase },
  { key: "casa" as Modulo, label: "CASA", icon: Home },
  { key: "saude" as Modulo, label: "SAÚDE", icon: Heart },
];

export function ModuleNav({ current, onSelect }: ModuleNavProps) {
  return (
    <nav className="flex gap-1 bg-secondary rounded-lg p-1">
      {modules.map((m) => {
        const Icon = m.icon;
        const isActive = current === m.key;
        return (
          <button
            key={m.key}
            onClick={() => onSelect(m.key)}
            className={`
              flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-md font-mono text-xs font-medium tracking-wider transition-all
              ${isActive
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
              }
            `}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{m.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
