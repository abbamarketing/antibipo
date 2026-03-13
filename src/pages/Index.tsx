import { useEffect, useState } from "react";
import { useFlowStore } from "@/lib/store";
import { useDayContext } from "@/hooks/use-day-context";
import { startTimeThemeWatcher } from "@/lib/time-theme";
import { brasiliaTimeString, brasiliaTime } from "@/lib/brasilia";
import { logActivity } from "@/lib/activity-log";
import { EnergyStateSelector } from "@/components/EnergyStateSelector";
import { ModuleNav, type NavModulo } from "@/components/ModuleNav";
import { SpeedDialFAB, type SpeedDialAction } from "@/components/SpeedDialFAB";
import { StructuredTaskForm } from "@/components/StructuredTaskForm";
import { NotificationManager } from "@/components/NotificationManager";
import { DayGate } from "@/components/DayGate";
import { MoodCheckIn } from "@/components/MoodCheckIn";
import { DayScore } from "@/components/DayScore";
import { MedAlert } from "@/components/MedAlert";
import { CustomTrackers } from "@/components/CustomTrackers";
import { GlassCard } from "@/components/layout/GlassCard";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { ContextWidgets } from "@/components/layout/ContextWidgets";
import { InicioContent } from "@/components/layout/InicioContent";
import { ModuleContent } from "@/components/layout/ModuleContent";
import { useIsMobile } from "@/hooks/use-mobile";
import { Zap, Sun, Battery } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

const energyConfig: Record<string, { icon: typeof Zap; label: string }> = {
  foco_total: { icon: Zap, label: "FOCO TOTAL" },
  modo_leve: { icon: Sun, label: "MODO LEVE" },
  basico: { icon: Battery, label: "SO O BASICO" },
};

const Index = () => {
  const {
    state, setEnergy, setModulo, addTask, completeTask, updateTask,
    addMedicamento, registrarMedicamento, registrarHumor, registrarSono,
    isMedTakenToday, pendingMeds, todayHumor,
  } = useFlowStore();

  const dayCtx = useDayContext();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const [captureOpen, setCaptureOpen] = useState(false);
  const [activeNav, setActiveNav] = useState<NavModulo>(() => {
    const mod = searchParams.get("mod");
    if (mod && ["inicio", "trabalho", "casa", "saude", "metas"].includes(mod)) return mod as NavModulo;
    return "inicio";
  });

  // Sync URL param to nav
  useEffect(() => {
    const mod = searchParams.get("mod");
    if (mod && ["inicio", "trabalho", "casa", "saude", "metas"].includes(mod) && mod !== activeNav) {
      setActiveNav(mod as NavModulo);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);
  const [showMondayReview, setShowMondayReview] = useState(false);
  const [showFridayReport, setShowFridayReport] = useState(false);
  const [lastMoodValue, setLastMoodValue] = useState<number | undefined>(todayHumor?.valor);

  useEffect(() => startTimeThemeWatcher(), []);
  useEffect(() => { if (todayHumor?.valor !== undefined) setLastMoodValue(todayHumor.valor); }, [todayHumor]);

  const pending = pendingMeds();
  const { current_energy, current_modulo } = state;
  const showEnergySelector = !current_energy;
  const isCrisis = dayCtx.alertLevel === "crise";

  // ── Visão Adaptativa: determina se modo reduzido está ativo ──
  const isLowState = current_energy === "basico" || (dayCtx.moodValue !== null && dayCtx.moodValue <= 0);
  const isVeryLow = current_energy === "basico" && dayCtx.moodValue !== null && dayCtx.moodValue <= -1;

  // Force nav back to "inicio" if user is in low state and on a hidden tab
  useEffect(() => {
    if (isLowState && (activeNav === "metas")) {
      setActiveNav("inicio");
    }
  }, [isLowState, activeNav]);

  // ── Handlers ──
  const handleSetEnergy = (energy: typeof current_energy) => { if (energy) setEnergy(energy); };

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
      if (dia === 1 && !sessionStorage.getItem(`${sessionKey}_monday`)) { sessionStorage.setItem(`${sessionKey}_monday`, "1"); setShowMondayReview(true); }
      if (dia === 5 && !sessionStorage.getItem(`${sessionKey}_friday`)) { sessionStorage.setItem(`${sessionKey}_friday`, "1"); setShowFridayReport(true); }
    }
  };

  const handleCapture = async (data: Parameters<typeof addTask>[0]) => {
    await addTask(data);
    logActivity("tarefa_capturada", { titulo: data.titulo, modulo: data.modulo, urgencia: data.urgencia, hora: brasiliaTimeString() });
  };

  const handleModulo = (m: NavModulo) => {
    setActiveNav(m);
    if (m !== "metas" && m !== "inicio") setModulo(m as typeof current_modulo);
  };

  const handleAddMed = (med: Parameters<typeof addMedicamento>[0]) => {
    addMedicamento(med);
    logActivity("medicamento_adicionado", { nome: med.nome, hora: brasiliaTimeString() });
  };

  // ── Adaptative SpeedDial: hide financial & calendar actions in low state ──
  const handleSpeedDial = (action: SpeedDialAction) => {
    switch (action) {
      case "tarefa": setCaptureOpen(true); break;
      case "entrada": case "saida": navigate("/financeiro"); break;
      case "evento": navigate("/calendario"); break;
    }
  };

  // ── Main content switch ──
  const MainContent = () =>
    activeNav === "inicio" ? (
      <InicioContent isCrisis={isCrisis || isVeryLow} showMondayReview={showMondayReview && !isLowState} showFridayReport={showFridayReport && !isLowState} onDismissMonday={() => setShowMondayReview(false)} onDismissFriday={() => setShowFridayReport(false)} />
    ) : (
      <ModuleContent activeNav={activeNav} energy={current_energy!} lastMoodValue={lastMoodValue} isCrisis={isCrisis || isVeryLow} onComplete={handleCompleteTask} onDelegate={handleDelegate} onPush={handlePush} onTakeMed={handleTakeMed} onMood={handleMood} onSleep={handleSleep} onAddMed={handleAddMed} />
    );

  // ── Background class based on energy state for visual feedback ──
  const bgClass = isVeryLow
    ? "min-h-screen bg-gradient-to-br from-[hsl(210,20%,92%)] via-background to-[hsl(210,15%,88%)]"
    : isLowState
    ? "min-h-screen bg-gradient-to-br from-background via-[hsl(210,10%,93%)] to-secondary/30"
    : current_energy === "foco_total"
    ? "min-h-screen bg-gradient-to-br from-background via-background to-[hsl(22,20%,92%)]"
    : "min-h-screen bg-gradient-to-br from-background via-background to-secondary/30";

  return (
    <DayGate>
      <div className={bgClass}>
        <NotificationManager medicamentos={state.medicamentos} isMedTaken={isMedTakenToday} hasEnergy={!!current_energy} />

        <div className={`max-w-7xl mx-auto px-4 py-6 ${isMobile ? "pb-32" : "pb-6"}`}>
          <DashboardHeader isCrisis={isCrisis} hasEnergy={!!current_energy} dayScore={dayCtx.dayScore} alertLevel={dayCtx.alertLevel} hiddenNavItems={isLowState ? ["financeiro", "calendario"] : []} />

          {showEnergySelector ? (
            <EnergyStateSelector current={current_energy} onSelect={handleSetEnergy} />
          ) : (
            <div className="space-y-4">
              {/* Energy indicator (read-only) */}
              <div className="flex items-center gap-2">
                {current_energy && (() => {
                  const cfg = energyConfig[current_energy];
                  const EIcon = cfg.icon;
                  return (
                    <>
                      <EIcon className={`w-4 h-4 ${isLowState ? "text-muted-foreground" : "text-primary"}`} />
                      <span className={`font-mono text-xs tracking-wider ${isLowState ? "text-muted-foreground" : "text-primary"}`}>{cfg.label}</span>
                    </>
                  );
                })()}
              </div>

              {isMobile ? (
                <div className="space-y-5">
                  {/* Med alert — always visible, priority in low state */}
                  {pending.length > 0 && (
                    <GlassCard className={`p-1 ${isCrisis || isLowState ? "ring-2 ring-destructive/30" : ""}`}>
                      <MedAlert pendingMeds={pending} onTake={handleTakeMed} />
                    </GlassCard>
                  )}

                  {/* DayScore & Mood — only on inicio */}
                  {activeNav === "inicio" && (
                    <>
                      <GlassCard className="p-3"><DayScore /></GlassCard>
                      <MoodCheckIn onMoodUpdated={(val) => setLastMoodValue(val)} />
                    </>
                  )}

                  {/* Low state message */}
                  {isVeryLow && (
                    <div className="rounded-2xl bg-[hsl(210,20%,95%)] border border-border/30 p-4 text-center animate-fade-in">
                      <p className="font-body text-sm text-muted-foreground leading-relaxed">
                         Modo protegido ativo. Mostrando apenas o essencial.
                      </p>
                    </div>
                  )}

                  {/* Main content */}
                  <MainContent />

                  {/* Custom trackers — hidden in low state */}
                  {activeNav !== "inicio" && !isCrisis && !isLowState && (
                    <CustomTrackers modulo={activeNav === "metas" ? "saude" : activeNav} />
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-12 gap-5">
                  <aside className="col-span-3 space-y-4 sticky top-6 self-start max-h-[calc(100vh-4rem)] overflow-y-auto scrollbar-thin">
                    <ContextWidgets isCrisis={isCrisis} isLowState={isLowState} activeNav={activeNav} pending={pending} onTakeMed={handleTakeMed} onMoodUpdated={(val) => setLastMoodValue(val)} />
                  </aside>
                  <main className="col-span-9">
                    {isVeryLow && (
                      <div className="rounded-2xl bg-[hsl(210,20%,95%)] border border-border/30 p-4 text-center mb-4 animate-fade-in">
                        <p className="font-body text-sm text-muted-foreground leading-relaxed">
                          Modo protegido ativo. Mostrando apenas o essencial.
                        </p>
                      </div>
                    )}
                    <MainContent />
                  </main>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Module Nav — hide Metas tab in low state */}
        {current_energy && !isCrisis && (
          isMobile ? (
            <div className="fixed bottom-0 inset-x-0 z-40 bg-card/90 backdrop-blur-xl border-t border-border/30 safe-area-bottom">
              <ModuleNav current={activeNav} onSelect={handleModulo} hiddenModules={isLowState ? ["metas"] : []} />
            </div>
          ) : (
            <div className="max-w-7xl mx-auto px-4 pb-4">
              <GlassCard className="p-1.5">
                <ModuleNav current={activeNav} onSelect={handleModulo} hiddenModules={isLowState ? ["metas"] : []} />
              </GlassCard>
            </div>
          )
        )}

        {/* SpeedDial — reduce options in low state */}
        {current_energy && (
          <SpeedDialFAB onAction={handleSpeedDial} reducedMode={isLowState} />
        )}

        <StructuredTaskForm open={captureOpen} onClose={() => setCaptureOpen(false)} onCreated={() => {}} />
      </div>
    </DayGate>
  );
};

export default Index;
