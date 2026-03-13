import { GlassCard } from "./GlassCard";
import { TodayEvents } from "@/components/TodayEvents";
import { MondayGoalsReview } from "@/components/MondayGoalsReview";
import { FridayWeeklyReport } from "@/components/FridayWeeklyReport";
import { QuickOverview } from "@/components/QuickOverview";
import { WeeklyCorrelationChart } from "@/components/WeeklyCorrelationChart";

interface InicioContentProps {
  isCrisis: boolean;
  showMondayReview: boolean;
  showFridayReport: boolean;
  onDismissMonday: () => void;
  onDismissFriday: () => void;
}

export function InicioContent({ isCrisis, showMondayReview, showFridayReport, onDismissMonday, onDismissFriday }: InicioContentProps) {
  return (
    <div className="space-y-4 animate-fade-in">
      {!isCrisis && <TodayEvents />}

      {showMondayReview && <MondayGoalsReview onDismiss={onDismissMonday} />}
      {showFridayReport && <FridayWeeklyReport onDismiss={onDismissFriday} />}

      <QuickOverview />

      {!isCrisis && (
        <GlassCard className="p-4">
          <WeeklyCorrelationChart />
        </GlassCard>
      )}
    </div>
  );
}
