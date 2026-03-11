import { useEffect, useState } from "react";
import { useFlowStore } from "@/lib/store";
import { startTimeThemeWatcher } from "@/lib/time-theme";
import { brasiliaTimeString, brasiliaDateString } from "@/lib/brasilia";
import { logActivity } from "@/lib/activity-log";
import { EnergyStateSelector } from "@/components/EnergyStateSelector";
import { MedAlert } from "@/components/MedAlert";
import { ModuleNav } from "@/components/ModuleNav";
import { WorkModule } from "@/components/WorkModule";
import { HomeModule } from "@/components/HomeModule";
import { HealthModule } from "@/components/HealthModule";
import { QuickCapture } from "@/components/QuickCapture";
import { Plus } from "lucide-react";

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

  const [captureOpen, setCaptureOpen] = useState(false);
  const [clock, setClock] = useState(brasiliaTimeString());

  useEffect(() => {
    const cleanup = startTimeThemeWatcher();
    const clockInterval = setInterval(() => setClock(brasiliaTimeString()), 30000);
    return () => { cleanup(); clearInterval(clockInterval); };
  }, []);

  const pending = pendingMeds();
  const { current_energy, current_modulo } = state;
  const showEnergySelector = !current_energy;

  const handleSetEnergy = (energy: typeof current_energy) => {
    if (!energy) return;
    setEnergy(energy);
    logActivity("energia_selecionada", { estado: energy, hora: brasiliaTimeString() });
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
  };

  const handleCapture = async (data: Parameters<typeof addTask>[0]) => {
    await addTask(data);
    logActivity("tarefa_capturada", { titulo: data.titulo, modulo: data.modulo, urgencia: data.urgencia, hora: brasiliaTimeString() });
  };

  const handleModulo = (m: typeof current_modulo) => {
    setModulo(m);
    logActivity("modulo_alterado", { modulo: m, hora: brasiliaTimeString() });
  };

  const handleAddMed = (med: Parameters<typeof addMedicamento>[0]) => {
    addMedicamento(med);
    logActivity("medicamento_adicionado", { nome: med.nome, hora: brasiliaTimeString() });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-6 pb-24">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="font-mono text-xl font-bold tracking-tight">FLOW</h1>
            <span className="font-mono text-sm text-muted-foreground tabular-nums">{clock}</span>
          </div>
          <p className="text-xs text-muted-foreground font-mono tracking-widest mt-1">
            {brasiliaDateString()}
          </p>
        </header>

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
              <span className="font-mono text-[11px] tracking-wider text-primary">
                {current_energy === "foco_total" ? "⚡ FOCO TOTAL" : current_energy === "modo_leve" ? "☀️ MODO LEVE" : "🔋 SÓ O BÁSICO"}
              </span>
              <span className="text-muted-foreground/30">·</span>
              <button
                onClick={() => handleSetEnergy(current_energy === "foco_total" ? "modo_leve" : current_energy === "modo_leve" ? "basico" : "foco_total")}
                className="font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                mudar
              </button>
            </div>

            {/* Module Nav */}
            <div className="mb-6">
              <ModuleNav current={current_modulo} onSelect={handleModulo} />
            </div>

            {/* Module Content */}
            {current_modulo === "trabalho" && (
              <WorkModule
                energy={current_energy}
                tasks={getFilteredTasks("trabalho", current_energy)}
                allTasks={state.tasks}
                onComplete={handleCompleteTask}
                onDelegate={handleDelegate}
                onPush={handlePush}
              />
            )}

            {current_modulo === "casa" && <HomeModule energy={current_energy} />}

            {current_modulo === "saude" && (
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
