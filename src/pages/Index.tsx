import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useFlowStore } from "@/lib/store";
import { startTimeThemeWatcher } from "@/lib/time-theme";
import { brasiliaTimeString, brasiliaDateString, brasiliaTime } from "@/lib/brasilia";
import { logActivity } from "@/lib/activity-log";
import { EnergyStateSelector } from "@/components/EnergyStateSelector";
import { MedAlert } from "@/components/MedAlert";
import { ModuleNav, type NavModulo } from "@/components/ModuleNav";
import { WorkModule } from "@/components/WorkModule";
import { HomeModule } from "@/components/HomeModule";
import { HealthModule } from "@/components/HealthModule";
import { MetasModule } from "@/components/MetasModule";
import { StructuredTaskForm } from "@/components/StructuredTaskForm";
import { CustomTrackers } from "@/components/CustomTrackers";
import { WeatherWidget } from "@/components/WeatherWidget";
import { NotificationManager } from "@/components/NotificationManager";
import { ModuleOnboardingGuard } from "@/components/ModuleOnboardingGuard";
import { MondayGoalsReview } from "@/components/MondayGoalsReview";
import { FridayWeeklyReport } from "@/components/FridayWeeklyReport";
import { TodayEvents } from "@/components/TodayEvents";
import { DailyNudge } from "@/components/DailyNudge";
import { UnifiedKanban } from "@/components/UnifiedKanban";
import { DayGate } from "@/components/DayGate";
import { MoodCheckIn } from "@/components/MoodCheckIn";
import { ModuleDashboard } from "@/components/ModuleDashboard";
import { DayScore } from "@/components/DayScore";
import { WeeklyCorrelationChart } from "@/components/WeeklyCorrelationChart";
import { Plus, Zap, Sun, Battery, Wallet, Settings, CalendarDays, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const {
    state, setEnergy, setModulo, addTask, completeTask, updateTask,
    addMedicamento, registrarMedicamento, registrarHumor, registrarSono,
    isMedTakenToday, pendingMeds, getFilteredTasks, todayHumor,
  } = useFlowStore();

  const navigate = useNavigate();
  const [captureOpen, setCaptureOpen] = useState(false);
  
  const [activeNav, setActiveNav] = useState<NavModulo>("trabalho");
  const [showMondayReview, setShowMondayReview] = useState(false);
  const [showFridayReport, setShowFridayReport] = useState(false);
  const [lastMoodValue, setLastMoodValue] = useState<number | undefined>(todayHumor?.valor);

  useEffect(() => {
    const cleanup = startTimeThemeWatcher();
    return () => { cleanup(); };
  }, []);

  useEffect(() => {
    if (todayHumor?.valor !== undefined) setLastMoodValue(todayHumor.valor);
  }, [todayHumor]);

  const pending = pendingMeds();
  const { current_energy, current_modulo } = state;
  const showEnergySelector = !current_energy;

  const energyConfig: Record<string, { icon: typeof Zap; label: string }> = {
    foco_total: { icon: Zap, label: "FOCO TOTAL" },
    modo_leve: { icon: Sun, label: "MODO LEVE" },
    basico: { icon: Battery, label: "SO O BASICO" },
  };

  const handleSetEnergy = (energy: typeof current_energy) => {
    if (!energy) return;
    setEnergy(energy);
  };

  const handleCompleteTask = (id: string) => {
    const task = state.tasks.find((t) => t.id === id);
    completeTask(id);
    logActivity("tarefa_concluida", { task_id: id, titulo: task?.titulo, hora: brasiliaTimeString() });
  };

  const handleDelegate = (id: string) => {
    const task = state.tasks.find((t) => t.id === id);
    updateTask(id, { status: "aguardando" });
    logActivity("tarefa_delegada", { task_id: id, titulo: task?.titulo, hora: brasiliaTimeString() });
  };

  const handlePush = (id: string) => {
    const task = state.tasks.find((t) => t.id === id);
    updateTask(id, { urgencia: Math.max(1, (task?.urgencia || 2) - 1) as 1 | 2 | 3 });
    logActivity("tarefa_empurrada", { task_id: id, titulo: task?.titulo, hora: brasiliaTimeString() });
  };

  const handleTakeMed = (medId: string, horario: string) => {
    const med = state.medicamentos.find((m) => m.id === medId);
    registrarMedicamento(medId, horario);
    logActivity("medicamento_tomado", { medicamento: med?.nome, horario, hora: brasiliaTimeString() });
  };

  const handleMood = (valor: number, notas?: string) => {
    registrarHumor(valor, notas);
    setLastMoodValue(valor);
    logActivity("humor_registrado", { valor, notas, hora: brasiliaTimeString() });
  };

  const handleSleep = (type: "dormir" | "acordar", qualidade?: 1 | 2 | 3) => {
    registrarSono(type, qualidade);
    logActivity(type === "dormir" ? "sono_dormir" : "sono_acordar", { qualidade, hora: brasiliaTimeString() });
    
    if (type === "acordar") {
      const hoje = brasiliaTime();
      const dia = hoje.getDay();
      const sessionKey = `ab_review_${hoje.toISOString().split("T")[0]}`;
      
      if (dia === 1 && !sessionStorage.getItem(`${sessionKey}_monday`)) {
        sessionStorage.setItem(`${sessionKey}_monday`, "1");
        setShowMondayReview(true);
      }
      if (dia === 5 && !sessionStorage.getItem(`${sessionKey}_friday`)) {
        sessionStorage.setItem(`${sessionKey}_friday`, "1");
        setShowFridayReport(true);
      }
    }
  };

  const handleCapture = async (data: Parameters<typeof addTask>[0]) => {
    await addTask(data);
    logActivity("tarefa_capturada", { titulo: data.titulo, modulo: data.modulo, urgencia: data.urgencia, hora: brasiliaTimeString() });
  };

  const handleModulo = (m: NavModulo) => {
    setActiveNav(m);
    if (m !== "metas") setModulo(m as typeof current_modulo);
  };

  const handleAddMed = (med: Parameters<typeof addMedicamento>[0]) => {
    addMedicamento(med);
    logActivity("medicamento_adicionado", { nome: med.nome, hora: brasiliaTimeString() });
  };

  return (
    <DayGate>
    <div className="min-h-screen bg-background">
      <NotificationManager
        medicamentos={state.medicamentos}
        isMedTaken={isMedTakenToday}
        hasEnergy={!!current_energy}
      />

      <div className="max-w-lg mx-auto px-4 py-4 pb-24">
        {/* Header */}
        <header className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] text-muted-foreground font-mono tracking-widest">
              {brasiliaDateString()}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => navigate("/financeiro")} className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                <Wallet className="w-4 h-4" />
              </button>
              <button onClick={() => navigate("/calendario")} className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                <CalendarDays className="w-4 h-4" />
              </button>
              <button onClick={() => navigate("/log")} className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" title="Log de atividade">
                <Activity className="w-4 h-4" />
              </button>
              <button onClick={() => navigate("/config")} className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
          <DailyNudge />
        </header>

        {/* Weather */}
        <div className="mb-4">
          <WeatherWidget />
        </div>

        {/* Mood Check-In (every 3h) */}
        <MoodCheckIn onMoodUpdated={(val) => setLastMoodValue(val)} />

        {/* Today's events */}
        <TodayEvents />

        {/* Med Alert */}
        {pending.length > 0 && (
          <div className="mb-4">
            <MedAlert pendingMeds={pending} onTake={handleTakeMed} />
          </div>
        )}

        {showEnergySelector ? (
          <EnergyStateSelector current={current_energy} onSelect={handleSetEnergy} />
        ) : (
          <>
            {/* Energy indicator */}
            <div className="flex items-center gap-2 mb-4">
              {current_energy && (() => {
                const cfg = energyConfig[current_energy];
                const EIcon = cfg.icon;
                return (
                  <>
                    <EIcon className="w-3.5 h-3.5 text-primary" />
                    <span className="font-mono text-[11px] tracking-wider text-primary">{cfg.label}</span>
                  </>
                );
              })()}
              <span className="text-muted-foreground/30">·</span>
              <button
                onClick={() => handleSetEnergy(current_energy === "foco_total" ? "modo_leve" : current_energy === "modo_leve" ? "basico" : "foco_total")}
                className="font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                mudar
              </button>
            </div>

            {showMondayReview && <MondayGoalsReview onDismiss={() => setShowMondayReview(false)} />}
            {showFridayReport && <FridayWeeklyReport onDismiss={() => setShowFridayReport(false)} />}

            {!showMondayReview && !showFridayReport && (
              <>
                {/* Integrated day score — crosses mood, meds, sleep, tasks */}
                <div className="mb-4">
                  <DayScore />
                </div>

                {/* Unified Daily Tasks - always visible */}
                  <UnifiedKanban energy={current_energy!} lastMoodValue={lastMoodValue} preferredModule={activeNav === "metas" ? null : activeNav} />

                {/* Trackers */}
                <div className="mb-6">
                  <div className="mt-4">
                    <CustomTrackers modulo={activeNav === "metas" ? "saude" : activeNav} />
                  </div>
                </div>

                <div className="mb-6">
                  <ModuleNav current={activeNav} onSelect={handleModulo} />
                </div>

                {activeNav === "trabalho" && (
                  <ModuleOnboardingGuard modulo="trabalho">
                    <WorkModule energy={current_energy!} tasks={getFilteredTasks("trabalho", current_energy!)} allTasks={state.tasks} onComplete={handleCompleteTask} onDelegate={handleDelegate} onPush={handlePush} />
                  </ModuleOnboardingGuard>
                )}
                {activeNav === "casa" && (
                  <ModuleOnboardingGuard modulo="casa">
                    <HomeModule energy={current_energy!} />
                  </ModuleOnboardingGuard>
                )}
                {activeNav === "saude" && (
                  <ModuleOnboardingGuard modulo="saude">
                    <HealthModule energy={current_energy!} medicamentos={state.medicamentos} registros_humor={state.registros_humor} registros_sono={state.registros_sono} onTakeMed={handleTakeMed} isMedTaken={isMedTakenToday} onMood={handleMood} onSleep={handleSleep} onAddMed={handleAddMed} todayHumor={todayHumor} />
                  </ModuleOnboardingGuard>
                )}
                {activeNav === "metas" && <MetasModule />}
              </>
            )}
          </>
        )}
      </div>

      {/* FAB */}
      {current_energy && (
        <button
          onClick={() => setCaptureOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity z-40"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      <StructuredTaskForm open={captureOpen} onClose={() => setCaptureOpen(false)} onCreated={() => {}} />
    </div>
    </DayGate>
  );
};

export default Index;
