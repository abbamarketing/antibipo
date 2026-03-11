import { useEffect, useState, useCallback } from "react";
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
import { QuickCapture } from "@/components/QuickCapture";
import { WeatherWidget } from "@/components/WeatherWidget";
import { NotificationManager } from "@/components/NotificationManager";
import { ModuleOnboardingGuard } from "@/components/ModuleOnboardingGuard";
import { MondayGoalsReview } from "@/components/MondayGoalsReview";
import { FridayWeeklyReport } from "@/components/FridayWeeklyReport";
import { Plus, Activity, Zap, Sun, Battery, Wallet, LogOut, CalendarDays } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const {
    state,
    setEnergy,
    setModulo,
    addTask,
    completeTask,
    updateTask,
    addMedicamento,
    registrarMedicamento,
    registrarHumor,
    registrarSono,
    isMedTakenToday,
    pendingMeds,
    getFilteredTasks,
    todayHumor,
  } = useFlowStore();

  const navigate = useNavigate();
  const [captureOpen, setCaptureOpen] = useState(false);
  const [clock, setClock] = useState(brasiliaTimeString());
  const [activeNav, setActiveNav] = useState<NavModulo>("trabalho");
  const [showMondayReview, setShowMondayReview] = useState(false);
  const [showFridayReport, setShowFridayReport] = useState(false);

  useEffect(() => {
    const cleanup = startTimeThemeWatcher();
    const clockInterval = setInterval(() => setClock(brasiliaTimeString()), 30000);
    return () => { cleanup(); clearInterval(clockInterval); };
  }, []);

  const pending = pendingMeds();
  const { current_energy, current_modulo } = state;
  const showEnergySelector = !current_energy;

  const energyConfig: Record<string, { icon: typeof Zap; label: string }> = {
    foco_total: { icon: Zap, label: "FOCO TOTAL" },
    modo_leve: { icon: Sun, label: "MODO LEVE" },
    basico: { icon: Battery, label: "SÓ O BÁSICO" },
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
    logActivity("humor_registrado", { valor, notas, hora: brasiliaTimeString() });
  };

  const handleSleep = (type: "dormir" | "acordar", qualidade?: 1 | 2 | 3) => {
    registrarSono(type, qualidade);
    logActivity(type === "dormir" ? "sono_dormir" : "sono_acordar", { qualidade, hora: brasiliaTimeString() });
    
    // Trigger Monday/Friday modals on "acordei"
    if (type === "acordar") {
      const hoje = brasiliaTime();
      const dia = hoje.getDay();
      const sessionKey = `flow_review_${hoje.toISOString().split("T")[0]}`;
      
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
    <div className="min-h-screen bg-background">
      <NotificationManager
        medicamentos={state.medicamentos}
        isMedTaken={isMedTakenToday}
        hasEnergy={!!current_energy}
      />

      <div className="max-w-lg mx-auto px-4 py-6 pb-24">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="font-mono text-xl font-bold tracking-tight">FLOW</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/financeiro")}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                title="Financeiro"
              >
                <Wallet className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate("/log")}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                title="Log de atividade"
              >
                <Activity className="w-4 h-4" />
              </button>
              <button
                onClick={async () => { await supabase.auth.signOut(); navigate("/auth"); }}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>
              <span className="font-mono text-sm text-muted-foreground tabular-nums">{clock}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground font-mono tracking-widest mt-1">
            {brasiliaDateString()}
          </p>
        </header>

        {/* Weather */}
        <div className="mb-4">
          <WeatherWidget />
        </div>

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
                    <span className="font-mono text-[11px] tracking-wider text-primary">
                      {cfg.label}
                    </span>
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

            {/* Monday Goals Review */}
            {showMondayReview && (
              <MondayGoalsReview onDismiss={() => setShowMondayReview(false)} />
            )}

            {/* Friday Weekly Report */}
            {showFridayReport && (
              <FridayWeeklyReport onDismiss={() => setShowFridayReport(false)} />
            )}

            {/* Normal content when no review/report showing */}
            {!showMondayReview && !showFridayReport && (
              <>
                {/* Module Nav */}
                <div className="mb-6">
                  <ModuleNav current={activeNav} onSelect={handleModulo} />
                </div>

                {/* Module Content */}
                {activeNav === "trabalho" && (
                  <ModuleOnboardingGuard modulo="trabalho">
                    <WorkModule
                      energy={current_energy}
                      tasks={getFilteredTasks("trabalho", current_energy)}
                      allTasks={state.tasks}
                      onComplete={handleCompleteTask}
                      onDelegate={handleDelegate}
                      onPush={handlePush}
                    />
                  </ModuleOnboardingGuard>
                )}

                {activeNav === "casa" && (
                  <ModuleOnboardingGuard modulo="casa">
                    <HomeModule energy={current_energy} />
                  </ModuleOnboardingGuard>
                )}

                {activeNav === "saude" && (
                  <ModuleOnboardingGuard modulo="saude">
                    <HealthModule
                      energy={current_energy}
                      medicamentos={state.medicamentos}
                      registros_humor={state.registros_humor}
                      registros_sono={state.registros_sono}
                      onTakeMed={handleTakeMed}
                      isMedTaken={isMedTakenToday}
                      onMood={handleMood}
                      onSleep={handleSleep}
                      onAddMed={handleAddMed}
                      todayHumor={todayHumor}
                    />
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

      <QuickCapture
        open={captureOpen}
        onClose={() => setCaptureOpen(false)}
        onCapture={handleCapture}
      />
    </div>
  );
};

export default Index;
