import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { brasiliaDateString } from "@/lib/brasilia";
import { WeatherWidget } from "@/components/WeatherWidget";
import { DailyNudge } from "@/components/DailyNudge";
import { AdaptiveGreeting } from "./AdaptiveGreeting";
import { Wallet, Settings, CalendarDays, Activity } from "lucide-react";

interface DashboardHeaderProps {
  isCrisis: boolean;
  hasEnergy: boolean;
  dayScore: number;
  alertLevel: string;
}

const NAV_ITEMS = [
  { icon: Wallet, path: "/financeiro", title: "Financeiro" },
  { icon: CalendarDays, path: "/calendario", title: "Calendário" },
  { icon: Activity, path: "/log", title: "Log" },
  { icon: Settings, path: "/config", title: "Configurações" },
] as const;

export function DashboardHeader({ isCrisis, hasEnergy, dayScore, alertLevel }: DashboardHeaderProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  return (
    <header className="mb-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <p className="text-[11px] text-muted-foreground font-mono tracking-widest">
            {brasiliaDateString()}
          </p>
          {isMobile && !isCrisis && <WeatherWidget compact />}
        </div>
        <div className="flex items-center gap-1">
          {NAV_ITEMS.map(({ icon: Icon, path, title }) => (
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
      {hasEnergy && (
        <div className="mb-1">
          <AdaptiveGreeting dayScore={dayScore} alertLevel={alertLevel} />
        </div>
      )}
      <DailyNudge />
    </header>
  );
}
