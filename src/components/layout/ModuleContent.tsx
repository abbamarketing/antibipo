import { useFlowStore } from "@/lib/store";
import { UnifiedKanban } from "@/components/UnifiedKanban";
import { ErrorBoundary } from "@/components/ErrorBoundary";
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
  const { state, isMedTakenToday, todayHumor, updateMedicamento, deleteMedicamento } = useFlowStore();
  const kanbanModule = activeNav === "metas" ? null : (activeNav as "casa" | "saude");

  return (
    <div className="space-y-4">
      {activeNav !== "metas" && (
        <ErrorBoundary name="UnifiedKanban"><UnifiedKanban energy={energy} lastMoodValue={lastMoodValue} preferredModule={kanbanModule} /></ErrorBoundary>
      )}

      {!isCrisis && (
        <div className="animate-fade-in">
          {activeNav === "casa" && (
            <ModuleOnboardingGuard modulo="casa">
              <HomeModule energy={energy} />
            </ModuleOnboardingGuard>
          )}
          {activeNav === "saude" && (
            <ModuleOnboardingGuard modulo="saude">
              <HealthModule energy={energy} medicamentos={state.medicamentos} registros_humor={state.registros_humor} registros_sono={state.registros_sono} onTakeMed={onTakeMed} isMedTaken={isMedTakenToday} onMood={onMood} onSleep={onSleep} onAddMed={onAddMed} onUpdateMed={updateMedicamento} onDeleteMed={deleteMedicamento} todayHumor={todayHumor} />
            </ModuleOnboardingGuard>
          )}
          {activeNav === "metas" && <MetasModule />}
        </div>
      )}
    </div>
  );
}
