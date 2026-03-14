import { GlassCard } from "./GlassCard";
import { DayScore } from "@/components/DayScore";
import { WeatherWidget } from "@/components/WeatherWidget";
import { MoodCheckIn } from "@/components/MoodCheckIn";
import { MedAlert } from "@/components/MedAlert";
import { WeeklyCorrelationChart } from "@/components/WeeklyCorrelationChart";
import { CustomTrackers } from "@/components/CustomTrackers";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useIsMobile } from "@/hooks/use-mobile";
import type { NavModulo } from "@/components/ModuleNav";

interface ContextWidgetsProps {
  isCrisis: boolean;
  isLowState?: boolean;
  activeNav: NavModulo;
  pending: { medicamento: { id: string; nome: string; dose: string }; horario: string }[];
  onTakeMed: (medId: string, horario: string) => void;
  onMoodUpdated: (val: number) => void;
}

export function ContextWidgets({ isCrisis, isLowState = false, activeNav, pending, onTakeMed, onMoodUpdated }: ContextWidgetsProps) {
  const isMobile = useIsMobile();

  return (
    <div className="space-y-4">
      <GlassCard className="p-4">
        <DayScore />
      </GlassCard>


      <MoodCheckIn onMoodUpdated={onMoodUpdated} />

      {pending.length > 0 && (
        <GlassCard className={`p-1 ${isCrisis || isLowState ? "ring-2 ring-destructive/30" : ""}`}>
          <MedAlert pendingMeds={pending} onTake={onTakeMed} />
        </GlassCard>
      )}

      {!isCrisis && !isLowState && activeNav !== "inicio" && (
        <GlassCard className="p-4">
          <WeeklyCorrelationChart />
        </GlassCard>
      )}

      {!isCrisis && !isLowState && activeNav !== "inicio" && (
        <CustomTrackers modulo={activeNav === "metas" ? "saude" : activeNav} />
      )}
    </div>
  );
}
