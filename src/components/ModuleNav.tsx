import { Home, Heart, Target, LayoutDashboard } from "lucide-react";

export type NavModulo = "inicio" | "casa" | "saude" | "metas";

interface ModuleNavProps {
  current: NavModulo;
  onSelect: (m: NavModulo) => void;
  hiddenModules?: NavModulo[];
}

const modules: { key: NavModulo; label: string; icon: typeof Home }[] = [
  { key: "inicio", label: "INÍCIO", icon: LayoutDashboard },
  { key: "casa", label: "CASA", icon: Home },
  { key: "saude", label: "SAÚDE", icon: Heart },
  { key: "metas", label: "METAS", icon: Target },
];

export function ModuleNav({ current, onSelect, hiddenModules = [] }: ModuleNavProps) {
  const visibleModules = modules.filter((m) => !hiddenModules.includes(m.key));

  return (
    <nav className="flex gap-1 rounded-xl p-1">
      {visibleModules.map((m) => {
        const Icon = m.icon;
        const isActive = current === m.key;
        return (
          <button
            key={m.key}
            onClick={() => onSelect(m.key)}
            className={`
              flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2
              py-3 sm:py-2.5 px-2 sm:px-3 rounded-lg font-mono text-[10px] sm:text-xs font-medium tracking-wider
              transition-all duration-200 min-h-[44px]
              ${isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60 active:scale-95"
              }
            `}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{m.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
