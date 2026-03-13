import { useFlowStore } from "@/lib/store";
import { UnifiedKanban } from "@/components/UnifiedKanban";
import { WorkModule } from "@/components/WorkModule";
import { HomeModule } from "@/components/HomeModule";
import { HealthModule } from "@/components/HealthModule";
import { MetasModule } from "@/components/MetasModule";
import { ModuleOnboardingGuard } from "@/components/ModuleOnboardingGuard";
import type { NavModulo } from "@/components/ModuleNav";
import type { Database } from "@/integrations/supabase/types";

type EnergyState = Database["public"]["Enums"]["energy_state"];

interface ModuleContentProps {
  activeNav: NavModulo;
  energy: EnergyState;
  lastMoodValue?: number;
  isCrisis: boolean;
  onComplete: (id: string) => void;
  onDelegate: (id: string) => void;
  onPush: (id: string) => void;
  onTakeMed: (medId: string, horario: string) => void;
  onMood: (valor: number, notas?: string) => void;
  onSleep: (type: "dormir" | "acordar", qualidade?: 1 | 2 | 3) => void;
  onAddMed: (med: any) => void;
}

export function ModuleContent({
  activeNav, energy, lastMoodValue, isCrisis,
  onComplete, onDelegate, onPush, onTakeMed, onMood, onSleep, onAddMed,
}: ModuleContentProps) {
  const { state, getFilteredTasks, isMedTakenToday, todayHumor } = useFlowStore();
  const kanbanModule = activeNav === "metas" ? null : (activeNav as "trabalho" | "casa" | "saude");

  return (
    <div className="space-y-4">
      <UnifiedKanban energy={energy} lastMoodValue={lastMoodValue} preferredModule={kanbanModule} />

      {!isCrisis && (
        <div className="animate-fade-in">
          {activeNav === "trabalho" && (
            <ModuleOnboardingGuard modulo="trabalho">
              <WorkModule energy={energy} tasks={getFilteredTasks("trabalho", energy)} allTasks={state.tasks} onComplete={onComplete} onDelegate={onDelegate} onPush={onPush} />
            </ModuleOnboardingGuard>
          )}
          {activeNav === "casa" && (
            <ModuleOnboardingGuard modulo="casa">
              <HomeModule energy={energy} />
            </ModuleOnboardingGuard>
          )}
          {activeNav === "saude" && (
            <ModuleOnboardingGuard modulo="saude">
              <HealthModule energy={energy} medicamentos={state.medicamentos} registros_humor={state.registros_humor} registros_sono={state.registros_sono} onTakeMed={onTakeMed} isMedTaken={isMedTakenToday} onMood={onMood} onSleep={onSleep} onAddMed={onAddMed} todayHumor={todayHumor} />
            </ModuleOnboardingGuard>
          )}
          {activeNav === "metas" && <MetasModule />}
        </div>
      )}
    </div>
  );
}
