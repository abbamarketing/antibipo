import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useFlowStore, type Task, type EnergyState } from "@/lib/store";
import { useDayContext } from "@/hooks/use-day-context";
import { useCasaStore } from "@/lib/casa-store";
import { useTrackerStore } from "@/lib/tracker-store";
import { isRecorrenteDue, type RecorrenteConfig, type ChecklistConfig } from "@/lib/tracker-blueprints";
import { logActivity } from "@/lib/activity-log";
import { brasiliaTimeString, brasiliaISO } from "@/lib/brasilia";
import { CheckCircle2, Sparkles } from "lucide-react";
import { TaskDetailDialog } from "@/components/kanban/TaskDetailDialog";
import { PomodoroBar } from "@/components/atomic/PomodoroBar";
import { CompletedSection } from "@/components/atomic/CompletedSection";
import { KanbanColumn } from "@/components/kanban/KanbanColumn";
import { KanbanFilters } from "@/components/kanban/KanbanFilters";
import { type UnifiedTask, STATUS_COLUMNS } from "@/components/kanban/kanban-types";

interface UnifiedKanbanProps {
  energy: EnergyState;
  lastMoodValue?: number;
  preferredModule?: "casa" | "saude" | null;
}

function getMoodMessage(mood?: number, todayCount?: number, energy?: string): string {
  if (energy === "basico" && (mood === undefined || mood === null || mood <= 0)) return "Só uma tarefa por vez. Sem pressa.";
  if (mood === undefined || mood === null) return "Todas as suas tarefas em um só lugar.";
  if (mood <= -2) return "Vai com calma hoje. Só o essencial.";
  if (mood === -1) return "Dia mais leve — uma coisa de cada vez.";
  if (mood === 0) return "Dia neutro — ritmo regular.";
  if (mood === 1) return "Bom dia! Vamos manter o ritmo.";
  if (mood >= 2) return `Dia excelente! ${todayCount || 0} tarefas te esperam.`;
  return "Suas tarefas do dia.";
}

export function UnifiedKanban({ energy, lastMoodValue, preferredModule = null }: UnifiedKanbanProps) {
  const { state, completeTask, updateTask, deleteTask } = useFlowStore();
  const casa = useCasaStore();
  const { trackers, getTodayRegistros, getLastCompletion } = useTrackerStore();
  const dayCtx = useDayContext();

  const [detailTask, setDetailTask] = useState<UnifiedTask | null>(null);
  const [collapsedCols, setCollapsedCols] = useState<Set<string>>(
    () => new Set(energy === "basico" ? ["em_andamento", "aguardando", "backlog"] : energy === "modo_leve" ? ["backlog"] : [])
  );
  const [filterModule, setFilterModule] = useState<"casa" | "saude" | null>(preferredModule);
  const [showCompleted, setShowCompleted] = useState(false);
  const [focusIndex, setFocusIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<"up" | "none">("none");
  const slideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Pomodoro state
  const [pomodoroTaskId, setPomodoroTaskId] = useState<string | null>(null);
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (energy === "basico") setCollapsedCols(new Set(["em_andamento", "aguardando", "backlog"]));
    else if (energy === "modo_leve") setCollapsedCols(new Set(["backlog"]));
    else setCollapsedCols(new Set());
  }, [energy]);

  useEffect(() => { setFilterModule(preferredModule); }, [preferredModule]);

  useEffect(() => {
    if (pomodoroRunning && pomodoroTime > 0) {
      intervalRef.current = setInterval(() => setPomodoroTime((t) => t - 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (pomodoroTime === 0 && pomodoroRunning) setPomodoroRunning(false);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [pomodoroRunning, pomodoroTime]);

  // Build subtask map
  const subtaskMap = useMemo(() => {
    const map: Record<string, Task[]> = {};
    state.tasks.forEach((t) => {
      if (t.parent_task_id) {
        if (!map[t.parent_task_id]) map[t.parent_task_id] = [];
        map[t.parent_task_id].push(t);
      }
    });
    return map;
  }, [state.tasks]);

  // Build unified task list
  const allItems = useMemo(() => {
    const items: UnifiedTask[] = [];
    const todayStr = brasiliaISO();
    const addDays = (iso: string, days: number) => {
      const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + days);
      return d.toISOString().split("T")[0];
    };
    const tomorrowStr = addDays(todayStr, 1);
    const day2Str = addDays(todayStr, 2);
    const mood = dayCtx.moodLabel;

    state.tasks
      .filter((t) => !t.parent_task_id && t.status !== "feito" && t.status !== "descartado" && t.modulo !== "trabalho")
      .forEach((t) => {
        let displayStatus = t.status;
        if (t.status === "backlog" && t.data_limite) {
          if (t.data_limite <= todayStr) displayStatus = "hoje";
          else if (t.data_limite === tomorrowStr && (mood === "bom" || mood === "muito_bom")) displayStatus = "hoje";
          else if (t.data_limite === day2Str && mood === "muito_bom") displayStatus = "hoje";
        }
        items.push({
          id: t.id, titulo: t.titulo, modulo: t.modulo as any, tipo: "task",
          status: displayStatus, urgencia: t.urgencia, done: false, sourceData: t,
          tempo_min: t.tempo_min, taskType: t.tipo, dono: t.dono,
          data_limite: t.data_limite, recorrente: t.recorrente,
          frequencia_recorrencia: t.frequencia_recorrencia,
          depende_de: t.depende_de, notas: t.notas, subtasks: subtaskMap[t.id],
        });
      });

    const casaLimit = dayCtx.casaLimit;
    const moodBonus = dayCtx.moodLabel === "muito_bom" ? 3 : dayCtx.moodLabel === "bom" ? 1 : 0;
    casa.getTarefasDevidas().slice(0, casaLimit + moodBonus).forEach(({ task: t, urgencia }) => {
      items.push({
        id: `casa_${t.id}`, titulo: `${t.tarefa} — ${t.comodo}`, modulo: "casa", tipo: "casa",
        status: "hoje", urgencia, done: false, sourceData: t, tempo_min: t.tempo_min || undefined,
      });
    });

    trackers.filter((t) => t.ativo).forEach((t) => {
      if (t.tipo === "recorrente") {
        const config = t.config as unknown as RecorrenteConfig;
        if (isRecorrenteDue(config, getLastCompletion(t.id))) {
          items.push({ id: `tracker_${t.id}`, titulo: t.titulo, modulo: t.modulo as any, tipo: "tracker", status: "hoje", urgencia: 2, done: false, sourceData: t });
        }
      } else if (t.tipo === "checklist") {
        const config = t.config as unknown as ChecklistConfig;
        const todayRegs = getTodayRegistros(t.id);
        if (!config.itens.every((item) => todayRegs.some((r) => r.dados?.item_id === item.id))) {
          items.push({ id: `tracker_${t.id}`, titulo: t.titulo, modulo: t.modulo as any, tipo: "tracker", status: "hoje", urgencia: 1, done: false, sourceData: t });
        }
      }
    });

    return items;
  }, [state.tasks, casa.tarefas, casa.registros, trackers, getTodayRegistros, getLastCompletion, subtaskMap, energy, dayCtx.casaLimit, dayCtx.moodLabel]);

  const completedToday = state.tasks.filter(
    (t) => t.status === "feito" && t.feito_em && t.feito_em.startsWith(new Date().toISOString().split("T")[0])
  );

  const filtered = filterModule ? allItems.filter((i) => i.modulo === filterModule) : allItems;
  const moduleCounts = useMemo(() => ({
    casa: allItems.filter((i) => i.modulo === "casa").length,
    saude: allItems.filter((i) => i.modulo === "saude").length,
  }), [allItems]);

  const getColumnTasks = useCallback((status: string) => {
    let tasks = filtered.filter((t) => t.status === status).sort((a, b) => {
      const energyMatch = (t: UnifiedTask) => {
        const ideal = t.sourceData?.estado_ideal;
        if (!ideal || ideal === "qualquer") return 0;
        return ideal === energy ? 1 : -1;
      };
      const emA = energyMatch(a), emB = energyMatch(b);
      if (emB !== emA) return emB - emA;
      if (b.urgencia !== a.urgencia) return b.urgencia - a.urgencia;
      const dateA = a.data_limite ? new Date(a.data_limite).getTime() : Infinity;
      const dateB = b.data_limite ? new Date(b.data_limite).getTime() : Infinity;
      if (dateA !== dateB) return dateA - dateB;
      const tp: Record<string, number> = { estrategico: 5, operacional: 4, administrativo: 3, delegavel: 2, domestico: 1 };
      const tpA = tp[a.taskType || ""] || 0, tpB = tp[b.taskType || ""] || 0;
      if (tpB !== tpA) return tpB - tpA;
      return (b.tipo === "task" ? 1 : 0) - (a.tipo === "task" ? 1 : 0);
    });
    if (status === "hoje") return tasks.slice(0, dayCtx.taskLimit);
    return tasks;
  }, [filtered, energy, dayCtx.taskLimit]);

  const todayTasks = useMemo(() => getColumnTasks("hoje"), [getColumnTasks]);

  useEffect(() => {
    if (focusIndex >= todayTasks.length) setFocusIndex(Math.max(0, todayTasks.length - 1));
  }, [todayTasks.length, focusIndex]);

  const toggleCol = (key: string) => { const next = new Set(collapsedCols); next.has(key) ? next.delete(key) : next.add(key); setCollapsedCols(next); };

  const triggerSlideUp = () => {
    setSlideDirection("up");
    if (slideTimeoutRef.current) clearTimeout(slideTimeoutRef.current);
    slideTimeoutRef.current = setTimeout(() => setSlideDirection("none"), 400);
  };

  const handleComplete = (item: UnifiedTask) => {
    if (item.tipo === "task") { completeTask(item.id); logActivity("tarefa_concluida", { task_id: item.id, titulo: item.titulo, hora: brasiliaTimeString() }); }
    else if (item.tipo === "casa") { const t = item.sourceData; casa.completarTarefa({ tarefa_casa_id: t.id, comodo: t.comodo, tarefa: t.tarefa }); logActivity("tarefa_casa_concluida", { tarefa: t.tarefa, comodo: t.comodo, hora: brasiliaTimeString() }); }
    triggerSlideUp();
  };

  const handleDelegate = (item: UnifiedTask) => {
    updateTask(item.id, { status: "aguardando" });
    logActivity("tarefa_delegada", { task_id: item.id, hora: brasiliaTimeString() });
    triggerSlideUp();
  };

  const handlePush = (item: UnifiedTask) => {
    const task = state.tasks.find((t) => t.id === item.id);
    updateTask(item.id, { urgencia: Math.max(1, (task?.urgencia || 2) - 1) as 1 | 2 | 3 });
    logActivity("tarefa_empurrada", { task_id: item.id, hora: brasiliaTimeString() });
    triggerSlideUp();
  };

  const handleDelete = (item: UnifiedTask) => { if (item.tipo === "task") { deleteTask(item.id); logActivity("tarefa_excluida", { task_id: item.id, titulo: item.titulo, hora: brasiliaTimeString() }); } setDetailTask(null); };
  const handleMoveStatus = (item: UnifiedTask, newStatus: string) => {
    updateTask(item.id, { status: newStatus as any });
    logActivity("tarefa_movida", { task_id: item.id, status: newStatus, hora: brasiliaTimeString() });
    if (newStatus !== "hoje") triggerSlideUp();
  };

  const handleCompleteSubtask = (subId: string) => { completeTask(subId); logActivity("subtarefa_concluida", { task_id: subId, hora: brasiliaTimeString() }); };

  const pomodoroTask = pomodoroTaskId ? allItems.find((t) => t.id === pomodoroTaskId) : null;
  const moodMessage = getMoodMessage(lastMoodValue, todayTasks.length, energy);
  const visibleColumns = energy === "basico"
    ? STATUS_COLUMNS.filter((c) => c.key === "hoje")
    : energy === "modo_leve" ? STATUS_COLUMNS.filter((c) => c.key === "hoje" || c.key === "em_andamento") : STATUS_COLUMNS;

  const focusedTask = todayTasks[focusIndex] || null;
  const isLowState = energy === "basico" || (lastMoodValue !== undefined && lastMoodValue !== null && lastMoodValue <= 0);
  const calmClass = isLowState ? "opacity-90" : "";

  const startPomodoro = (item: UnifiedTask) => { setPomodoroTaskId(item.id); setPomodoroTime(25 * 60); setPomodoroRunning(true); };

  return (
    <>
      <div className={`space-y-4 animate-fade-in ${calmClass}`}>
        {/* Header */}
        <div>
          <h2 className={`font-mono text-lg font-bold tracking-tight flex items-center gap-2 ${isLowState ? "text-muted-foreground" : ""}`}>
            <Sparkles className={`w-4 h-4 ${isLowState ? "text-muted-foreground/60" : "text-primary"}`} /> Meu Dia
          </h2>
          <p className="text-sm text-muted-foreground font-body mt-0.5">{moodMessage}</p>
          {!isLowState && (
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[11px] font-mono text-muted-foreground">{todayTasks.length} hoje</span>
              <span className="text-muted-foreground/30">·</span>
              <span className="text-[11px] font-mono text-muted-foreground">{filtered.length} total</span>
              <span className="text-muted-foreground/30">·</span>
              <span className="text-[11px] font-mono text-muted-foreground">{completedToday.length} feitas</span>
            </div>
          )}
        </div>

        {!isLowState && <KanbanFilters filterModule={filterModule} onFilterChange={setFilterModule} moduleCounts={moduleCounts} />}

        {pomodoroTask && (
          <PomodoroBar
            taskTitle={pomodoroTask.titulo} time={pomodoroTime} running={pomodoroRunning}
            onToggle={() => setPomodoroRunning(!pomodoroRunning)}
            onReset={() => { setPomodoroRunning(false); setPomodoroTime(25 * 60); }}
            onClose={() => { setPomodoroRunning(false); setPomodoroTaskId(null); setPomodoroTime(25 * 60); }}
          />
        )}

        <div className="space-y-4">
          {visibleColumns.map((col) => {
            const isHoje = col.key === "hoje";
            return (
              <KanbanColumn
                key={col.key}
                colKey={col.key}
                label={col.label}
                dot={col.dot}
                tasks={isHoje ? todayTasks : getColumnTasks(col.key)}
                isCollapsed={collapsedCols.has(col.key)}
                onToggleCollapse={() => toggleCol(col.key)}
                focusMode={isHoje}
                focusIndex={focusIndex}
                focusedTask={isHoje ? focusedTask : undefined}
                slideDirection={isHoje ? slideDirection : undefined}
                onFocusPrev={() => { triggerSlideUp(); setFocusIndex((i) => (i > 0 ? i - 1 : todayTasks.length - 1)); }}
                onFocusNext={() => { triggerSlideUp(); setFocusIndex((i) => (i < todayTasks.length - 1 ? i + 1 : 0)); }}
                onComplete={handleComplete}
                onDelegate={handleDelegate}
                onPush={handlePush}
                onMoveStatus={handleMoveStatus}
                onStartPomodoro={startPomodoro}
                showPomodoro={!pomodoroTask}
                onCompleteSubtask={handleCompleteSubtask}
                onOpen={setDetailTask}
                onDelete={handleDelete}
              />
            );
          })}
        </div>

        <CompletedSection tasks={completedToday} show={showCompleted} onToggle={() => setShowCompleted(!showCompleted)} />

        {filtered.length === 0 && (
          <div className="rounded-3xl bg-card/40 backdrop-blur-xl shadow-sm border border-border/20 p-8 text-center">
            <CheckCircle2 className="w-8 h-8 mx-auto text-primary/40 mb-3" />
            <p className="text-sm text-muted-foreground font-body">Nenhuma tarefa pendente hoje.</p>
            <p className="text-xs text-muted-foreground/60 font-body mt-1">Aproveite o momento!</p>
          </div>
        )}
      </div>

      {detailTask && (
        <TaskDetailDialog
          item={detailTask} onClose={() => setDetailTask(null)}
          onUpdateNotes={(notes) => { if (detailTask.tipo === "task") { updateTask(detailTask.id, { notas: notes || null }); setDetailTask({ ...detailTask, notas: notes || null }); } }}
          onDelete={() => handleDelete(detailTask)}
          onComplete={() => { handleComplete(detailTask); setDetailTask(null); }}
          onMoveStatus={(s) => { if (detailTask.tipo === "task") handleMoveStatus(detailTask, s); }}
        />
      )}
    </>
  );
}
