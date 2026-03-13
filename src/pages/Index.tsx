import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useFlowStore } from "@/lib/store";
import { useDayContext } from "@/hooks/use-day-context";
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
import { QuickOverview } from "@/components/QuickOverview";
import { useIsMobile } from "@/hooks/use-mobile";
import { Plus, Zap, Sun, Battery, Wallet, Settings, CalendarDays, Activity, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";

/** Reusable glass-card wrapper – 24px radius + heavy blur */
function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl bg-card/40 backdrop-blur-xl shadow-sm border border-border/20 ${className}`}>
      {children}
    </div>
  );
}

/** Adaptive micro-copy based on dayScore */
function AdaptiveGreeting({ dayScore, alertLevel }: { dayScore: number; alertLevel: string }) {
  let message: string;
  if (dayScore >= 75) {
    message = "Você está voando hoje! Aproveite o momentum.";
  } else if (dayScore >= 50) {
    message = "Dia estável. Mantenha o ritmo, sem pressa.";
  } else if (dayScore >= 30) {
    message = "Um passo de cada vez hoje. Tudo bem ir devagar.";
  } else {
    message = "Dia de cuidar de si. Só o essencial, sem cobranças.";
  }

  return (
    <p className="font-body text-xs text-foreground/70 leading-relaxed">
      {message}
    </p>
  );
}

const Index = () => {
  const {
    state, setEnergy, setModulo, addTask, completeTask, updateTask,
    addMedicamento, registrarMedicamento, registrarHumor, registrarSono,
    isMedTakenToday, pendingMeds, getFilteredTasks, todayHumor,
  } = useFlowStore();

  const dayCtx = useDayContext();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
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

  const isCrisis = dayCtx.alertLevel === "crise";
  const isOptimal = dayCtx.alertLevel === "otimo";

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

  /* ── Context widgets (DayScore, Weather, Mood, Meds) ── */
  const ContextWidgets = () => (
    <div className="space-y-4">
      <GlassCard className="p-4">
        <DayScore />
      </GlassCard>

      {!isCrisis && !isMobile && (
        <GlassCard>
          <WeatherWidget />
        </GlassCard>
      )}

      <MoodCheckIn onMoodUpdated={(val) => setLastMoodValue(val)} />

      {pending.length > 0 && (
        <GlassCard className={`p-1 ${isCrisis ? "ring-2 ring-destructive/30" : ""}`}>
          <MedAlert pendingMeds={pending} onTake={handleTakeMed} />
        </GlassCard>
      )}

      {!isCrisis && (
        <GlassCard className="p-4">
          <WeeklyCorrelationChart />
        </GlassCard>
      )}

      {!isCrisis && (
        <CustomTrackers modulo={activeNav === "metas" ? "saude" : activeNav} />
      )}

      <QuickOverview />
    </div>
  );

  /* ── Main content (kanban + modules) ── */
  const MainContent = () => (
    <div className="space-y-4">
      {!isCrisis && <TodayEvents />}

      {isOptimal && (
        <button
          onClick={() => { setActiveNav("trabalho"); setModulo("trabalho"); }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-3xl bg-primary/10 text-primary font-mono text-xs tracking-wider hover:bg-primary/15 active:scale-[0.98] transition-all duration-200 animate-fade-in"
        >
          <Target className="w-4 h-4" />
          TAREFAS ESTRATÉGICAS — DIA FORTE
        </button>
      )}

      {showMondayReview && <MondayGoalsReview onDismiss={() => setShowMondayReview(false)} />}
      {showFridayReport && <FridayWeeklyReport onDismiss={() => setShowFridayReport(false)} />}

      {!showMondayReview && !showFridayReport && (
        <>
          <UnifiedKanban energy={current_energy!} lastMoodValue={lastMoodValue} preferredModule={activeNav === "metas" ? null : activeNav} />

          {!isCrisis && (
            <div className="animate-fade-in">
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
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <DayGate>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30">
        <NotificationManager
          medicamentos={state.medicamentos}
          isMedTaken={isMedTakenToday}
          hasEnergy={!!current_energy}
        />

        {/* pb-24 on mobile for fixed bottom nav + FAB clearance */}
        <div className={`max-w-7xl mx-auto px-4 py-6 ${isMobile ? "pb-32" : "pb-6"}`}>
          {/* Header */}
          <header className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <p className="text-[11px] text-muted-foreground font-mono tracking-widest">
                  {brasiliaDateString()}
                </p>
                {/* Compact weather icon in header on mobile */}
                {isMobile && !isCrisis && (
                  <WeatherWidget compact />
                )}
              </div>
              <div className="flex items-center gap-1">
                {[
                  { icon: Wallet, path: "/financeiro", title: "Financeiro" },
                  { icon: CalendarDays, path: "/calendario", title: "Calendário" },
                  { icon: Activity, path: "/log", title: "Log" },
                  { icon: Settings, path: "/config", title: "Configurações" },
                ].map(({ icon: Icon, path, title }) => (
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
            {current_energy && (
              <div className="mb-1">
                <AdaptiveGreeting dayScore={dayCtx.dayScore} alertLevel={dayCtx.alertLevel} />
              </div>
            )}
            <DailyNudge />
          </header>

          {showEnergySelector ? (
            <EnergyStateSelector current={current_energy} onSelect={handleSetEnergy} />
          ) : (
            <div className="space-y-4">
              {/* Energy indicator */}
              <div className="flex items-center gap-2">
                {current_energy && (() => {
                  const cfg = energyConfig[current_energy];
                  const EIcon = cfg.icon;
                  return (
                    <>
                      <EIcon className="w-4 h-4 text-primary" />
                      <span className="font-mono text-xs tracking-wider text-primary">{cfg.label}</span>
                    </>
                  );
                })()}
                <span className="text-muted-foreground/30">·</span>
                <button
                  onClick={() => handleSetEnergy(current_energy === "foco_total" ? "modo_leve" : current_energy === "modo_leve" ? "basico" : "foco_total")}
                  className="font-mono text-[11px] text-muted-foreground hover:text-foreground active:scale-95 transition-all duration-150 py-1 px-2"
                >
                  mudar
                </button>
              </div>

              {/* ── Responsive Dashboard Grid ── */}
              {isMobile ? (
                /* Mobile: priority content first — tasks then context */
                <div className="space-y-5">
                  {/* Med alert — urgent, always first on mobile */}
                  {pending.length > 0 && (
                    <GlassCard className={`p-1 ${isCrisis ? "ring-2 ring-destructive/30" : ""}`}>
                      <MedAlert pendingMeds={pending} onTake={handleTakeMed} />
                    </GlassCard>
                  )}

                  {/* Compact DayScore on mobile */}
                  <GlassCard className="p-3">
                    <DayScore />
                  </GlassCard>

                  {/* Mood — important for tracking */}
                  <MoodCheckIn onMoodUpdated={(val) => setLastMoodValue(val)} />

                  {/* Quick Overview — one task per module */}
                  <QuickOverview />

                  {/* Main content: tasks */}
                  <MainContent />

                  {/* Secondary context widgets — below the fold */}
                  {!isCrisis && (
                    <GlassCard className="p-4">
                      <WeeklyCorrelationChart />
                    </GlassCard>
                  )}
                  {!isCrisis && (
                    <CustomTrackers modulo={activeNav === "metas" ? "saude" : activeNav} />
                  )}
                </div>
              ) : (
                /* Desktop: 12-col grid — sidebar 3 cols, main 9 cols */
                <div className="grid grid-cols-12 gap-5">
                  <aside className="col-span-3 space-y-4 sticky top-6 self-start max-h-[calc(100vh-4rem)] overflow-y-auto scrollbar-thin">
                    <ContextWidgets />
                  </aside>
                  <main className="col-span-9">
                    <MainContent />
                  </main>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Module Nav — mobile: fixed bottom bar; desktop: inline */}
        {current_energy && !isCrisis && (
          isMobile ? (
            <div className="fixed bottom-0 inset-x-0 z-40 bg-card/90 backdrop-blur-xl border-t border-border/30 safe-area-bottom">
              <ModuleNav current={activeNav} onSelect={handleModulo} />
            </div>
          ) : (
            <div className="max-w-7xl mx-auto px-4 pb-4">
              <GlassCard className="p-1.5">
                <ModuleNav current={activeNav} onSelect={handleModulo} />
              </GlassCard>
            </div>
          )
        )}

        {/* FAB — positioned above bottom nav on mobile */}
        {current_energy && (
          <button
            onClick={() => setCaptureOpen(true)}
            className={`fixed ${isMobile ? "bottom-[4.5rem]" : "bottom-6"} right-5 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 flex items-center justify-center hover:opacity-90 active:scale-90 transition-all duration-200 z-50`}
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
