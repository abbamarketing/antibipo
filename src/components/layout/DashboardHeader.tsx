import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { brasiliaTime } from "@/lib/brasilia";
import { WeatherWidget } from "@/components/WeatherWidget";
import { DailyNudge } from "@/components/DailyNudge";
import { ErrorBoundary } from "@/components/ErrorBoundary";

import { Wallet, Settings, CalendarDays, Bot } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DashboardHeaderProps {
  isCrisis: boolean;
  hasEnergy: boolean;
  dayScore: number;
  alertLevel: string;
  hiddenNavItems?: string[];
}

const ALL_NAV_ITEMS = [
  { icon: Wallet, path: "/financeiro", title: "Financeiro", key: "financeiro" },
  { icon: CalendarDays, path: "/calendario", title: "Calendário", key: "calendario" },
  { icon: Bot, path: "/agentes", title: "Agentes", key: "agentes" },
  { icon: Settings, path: "/config", title: "Configurações", key: "config" },
] as const;

export function DashboardHeader({ isCrisis, hasEnergy, dayScore, alertLevel, hiddenNavItems = [] }: DashboardHeaderProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const now = brasiliaTime();
  const formatted = format(now, "EEEE, d", { locale: ptBR });

  const visibleNavItems = ALL_NAV_ITEMS.filter((item) => !hiddenNavItems.includes(item.key));

  return (
    <header className="mb-5">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-muted-foreground tracking-wide">{formatted}</span>
          {isMobile && !isCrisis && <WeatherWidget compact />}
        </div>
        <div className="flex items-center gap-1">
          {visibleNavItems.map(({ icon: Icon, path, title }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              title={title}
              className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/60 active:scale-95 transition-all duration-150"
            >
              <Icon className="w-5 h-5" />
            </button>
          ))}
        </div>
      </div>

      {/* Inline 7-day forecast strip */}
      {!isCrisis && <WeatherWidget inline />}

      <ErrorBoundary name="DailyNudge"><DailyNudge /></ErrorBoundary>
    </header>
  );
}
