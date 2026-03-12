import { useState, useMemo, useCallback } from "react";
import { useFlowStore, type Task, type EnergyState } from "@/lib/store";
import { useDayContext } from "@/hooks/use-day-context";
import { useCasaStore } from "@/lib/casa-store";
import { useTrackerStore } from "@/lib/tracker-store";
import { isRecorrenteDue, type RecorrenteConfig, type ChecklistConfig } from "@/lib/tracker-blueprints";
import { logActivity } from "@/lib/activity-log";
import { brasiliaTimeString } from "@/lib/brasilia";
import {
  CheckCircle2, Clock, Briefcase, Home, Heart, ChevronDown, ChevronRight,
  Sparkles, Timer, Play, Pause, RotateCcw, X, ArrowRight, Send, Check,
  Repeat, Calendar, UserCheck,
} from "lucide-react";
import { useEffect, useRef } from "react";

interface UnifiedKanbanProps {
  energy: EnergyState;
  lastMoodValue?: number;
  preferredModule?: "trabalho" | "casa" | "saude" | null;
}

interface UnifiedTask {
  id: string;
  titulo: string;
  modulo: "trabalho" | "casa" | "saude";
  tipo: "task" | "casa" | "tracker";
  status: string;
  urgencia: number;
  done: boolean;
  sourceData?: any;
  tempo_min?: number;
  taskType?: string;
  dono?: string;
  clienteName?: string;
  data_limite?: string | null;
  recorrente?: boolean;
  frequencia_recorrencia?: string | null;
  depende_de?: string | null;
  notas?: string | null;
  subtasks?: Task[];
}

const STATUS_COLUMNS = [
  { key: "hoje", label: "HOJE", dot: "bg-primary" },
  { key: "em_andamento", label: "EM ANDAMENTO", dot: "bg-amber-400" },
  { key: "aguardando", label: "AGUARDANDO", dot: "bg-blue-400" },
  { key: "backlog", label: "BACKLOG", dot: "bg-muted-foreground/30" },
];

const MODULE_COLORS: Record<string, string> = {
  trabalho: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  casa: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  saude: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
};

const MODULE_LABELS: Record<string, string> = {
  trabalho: "Trabalho",
  casa: "Casa",
  saude: "Saúde",
};

const MODULE_ICONS: Record<string, typeof Briefcase> = {
  trabalho: Briefcase,
  casa: Home,
  saude: Heart,
};

const TYPE_LABELS: Record<string, string> = {
  estrategico: "Estratégico",
  operacional: "Operacional",
  delegavel: "Delegável",
  administrativo: "Admin",
  domestico: "Doméstico",
};

export function UnifiedKanban({ energy, lastMoodValue, preferredModule = null }: UnifiedKanbanProps) {
  const { state, completeTask, updateTask } = useFlowStore();
  const casa = useCasaStore();
  const { trackers, getTodayRegistros, getLastCompletion } = useTrackerStore();
  const dayCtx = useDayContext();

  const [collapsedCols, setCollapsedCols] = useState<Set<string>>(
    () => new Set(energy === "basico" ? ["em_andamento", "aguardando", "backlog"] : energy === "modo_leve" ? ["backlog"] : [])
  );

  // Sync collapsed columns when energy changes
  useEffect(() => {
    if (energy === "basico") {
      setCollapsedCols(new Set(["em_andamento", "aguardando", "backlog"]));
    } else if (energy === "modo_leve") {
      setCollapsedCols(new Set(["backlog"]));
    } else {
      setCollapsedCols(new Set());
    }
  }, [energy]);
  const [filterModule, setFilterModule] = useState<"trabalho" | "casa" | "saude" | null>(preferredModule);
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    setFilterModule(preferredModule);
  }, [preferredModule]);

  // Pomodoro
  const [pomodoroTaskId, setPomodoroTaskId] = useState<string | null>(null);
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (pomodoroRunning && pomodoroTime > 0) {
      intervalRef.current = setInterval(() => setPomodoroTime((t) => t - 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (pomodoroTime === 0 && pomodoroRunning) setPomodoroRunning(false);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [pomodoroRunning, pomodoroTime]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

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

  // Build unified list
  const allItems = useMemo(() => {
    const items: UnifiedTask[] = [];

    // All non-completed tasks from tasks table (no subtasks as top-level)
    state.tasks
      .filter((t) => !t.parent_task_id && t.status !== "feito" && t.status !== "descartado")
      .forEach((t) => {
        items.push({
          id: t.id,
          titulo: t.titulo,
          modulo: t.modulo as "trabalho" | "casa" | "saude",
          tipo: "task",
          status: t.status,
          urgencia: t.urgencia,
          done: false,
          sourceData: t,
          tempo_min: t.tempo_min,
          taskType: t.tipo,
          dono: t.dono,
          data_limite: t.data_limite,
          recorrente: t.recorrente,
          frequencia_recorrencia: t.frequencia_recorrencia,
          depende_de: t.depende_de,
          notas: t.notas,
          subtasks: subtaskMap[t.id],
        });
      });

    // Casa tasks due — limited by mood+energy context
    const casaLimit = dayCtx.casaLimit;
    const today = new Date();
    const casaDue: { task: typeof casa.tarefas[0]; urgencia: number; daysSince: number }[] = [];
    casa.tarefas
      .filter((t) => t.ativo !== false)
      .forEach((t) => {
        const lastDone = casa.registros.find((r) => r.tarefa_casa_id === t.id);
        const lastDate = lastDone ? new Date(lastDone.feito_em) : null;
        const daysSince = lastDate ? Math.floor((today.getTime() - lastDate.getTime()) / 86400000) : 999;
        const freqDays = t.frequencia === "diario" ? 1 : t.frequencia === "semanal" ? 7 : t.frequencia === "quinzenal" ? 15 : 30;
        if (daysSince >= freqDays) {
          casaDue.push({ task: t, urgencia: daysSince > freqDays * 1.5 ? 3 : 2, daysSince });
        }
      });
    // Sort by urgency (highest first) then days overdue, then take limit
    casaDue
      .sort((a, b) => b.urgencia - a.urgencia || b.daysSince - a.daysSince)
      .slice(0, casaLimit)
      .forEach(({ task: t, urgencia }) => {
        items.push({
          id: `casa_${t.id}`,
          titulo: `${t.tarefa} — ${t.comodo}`,
          modulo: "casa",
          tipo: "casa",
          status: "hoje",
          urgencia,
          done: false,
          sourceData: t,
          tempo_min: t.tempo_min || undefined,
        });
      });

    // Trackers due
    trackers
      .filter((t) => t.ativo)
      .forEach((t) => {
        if (t.tipo === "recorrente") {
          const config = t.config as unknown as RecorrenteConfig;
          const last = getLastCompletion(t.id);
          if (isRecorrenteDue(config, last)) {
            items.push({
              id: `tracker_${t.id}`,
              titulo: t.titulo,
              modulo: t.modulo as "trabalho" | "casa" | "saude",
              tipo: "tracker",
              status: "hoje",
              urgencia: 2,
              done: false,
              sourceData: t,
            });
          }
        } else if (t.tipo === "checklist") {
          const config = t.config as unknown as ChecklistConfig;
          const todayRegs = getTodayRegistros(t.id);
          const allDone = config.itens.every((item) =>
            todayRegs.some((r) => r.dados?.item_id === item.id)
          );
          if (!allDone) {
            items.push({
              id: `tracker_${t.id}`,
              titulo: t.titulo,
              modulo: t.modulo as "trabalho" | "casa" | "saude",
              tipo: "tracker",
              status: "hoje",
              urgencia: 1,
              done: false,
              sourceData: t,
            });
          }
        }
      });

    return items;
  }, [state.tasks, casa.tarefas, casa.registros, trackers, getTodayRegistros, getLastCompletion, subtaskMap, energy]);

  const completedToday = state.tasks.filter(
    (t) => t.status === "feito" && t.feito_em && t.feito_em.startsWith(new Date().toISOString().split("T")[0])
  );

  const filtered = filterModule
    ? allItems.filter((i) => i.modulo === filterModule)
    : allItems;

  const moduleCounts = useMemo(
    () => ({
      trabalho: allItems.filter((i) => i.modulo === "trabalho").length,
      casa: allItems.filter((i) => i.modulo === "casa").length,
      saude: allItems.filter((i) => i.modulo === "saude").length,
    }),
    [allItems]
  );

  const getColumnTasks = useCallback(
    (status: string) => {
      let tasks = filtered
        .filter((t) => t.status === status)
        .sort((a, b) => {
          // Boost tasks matching current energy state
          const energyMatch = (t: UnifiedTask) => {
            const ideal = t.sourceData?.estado_ideal;
            if (!ideal || ideal === "qualquer") return 0;
            if (ideal === energy) return 1;
            return -1;
          };
          const emA = energyMatch(a);
          const emB = energyMatch(b);
          if (emB !== emA) return emB - emA;
          // 1. Urgência (3=crítica primeiro)
          if (b.urgencia !== a.urgencia) return b.urgencia - a.urgencia;
          // 2. Data limite (mais próxima primeiro, sem data vai pro final)
          const dateA = a.data_limite ? new Date(a.data_limite).getTime() : Infinity;
          const dateB = b.data_limite ? new Date(b.data_limite).getTime() : Infinity;
          if (dateA !== dateB) return dateA - dateB;
          // 3. Tipo de tarefa: estratégico > operacional > admin > delegável > doméstico
          const typePriority: Record<string, number> = { estrategico: 5, operacional: 4, administrativo: 3, delegavel: 2, domestico: 1 };
          const tpA = typePriority[a.taskType || ""] || 0;
          const tpB = typePriority[b.taskType || ""] || 0;
          if (tpB !== tpA) return tpB - tpA;
          // 4. Tasks reais antes de sintéticas (casa/tracker)
          const realA = a.tipo === "task" ? 1 : 0;
          const realB = b.tipo === "task" ? 1 : 0;
          return realB - realA;
        });

      // Limit "hoje" tasks based on mood+energy context
      if (status === "hoje") return tasks.slice(0, dayCtx.taskLimit);
      return tasks;
    },
    [filtered, energy]
  );

  const toggleCol = (key: string) => {
    const next = new Set(collapsedCols);
    next.has(key) ? next.delete(key) : next.add(key);
    setCollapsedCols(next);
  };

  const handleComplete = (item: UnifiedTask) => {
    if (item.tipo === "task") {
      completeTask(item.id);
      logActivity("tarefa_concluida", { task_id: item.id, titulo: item.titulo, hora: brasiliaTimeString() });
    } else if (item.tipo === "casa") {
      const t = item.sourceData;
      casa.completarTarefa({ tarefa_casa_id: t.id, comodo: t.comodo, tarefa: t.tarefa });
      logActivity("tarefa_casa_concluida", { tarefa: t.tarefa, comodo: t.comodo, hora: brasiliaTimeString() });
    }
  };

  const handleDelegate = (id: string) => {
    updateTask(id, { status: "aguardando" });
    logActivity("tarefa_delegada", { task_id: id, hora: brasiliaTimeString() });
  };

  const handlePush = (id: string) => {
    const task = state.tasks.find((t) => t.id === id);
    updateTask(id, { urgencia: Math.max(1, (task?.urgencia || 2) - 1) as 1 | 2 | 3 });
    logActivity("tarefa_empurrada", { task_id: id, hora: brasiliaTimeString() });
  };

  const handleMoveStatus = (id: string, newStatus: string) => {
    updateTask(id, { status: newStatus as any });
    logActivity("tarefa_movida", { task_id: id, status: newStatus, hora: brasiliaTimeString() });
  };

  const startPomodoro = (taskId: string) => {
    setPomodoroTaskId(taskId);
    setPomodoroTime(25 * 60);
    setPomodoroRunning(true);
  };

  const pomodoroTask = pomodoroTaskId ? allItems.find((t) => t.id === pomodoroTaskId) : null;

  const moodMessage = getMoodMessage(lastMoodValue, filtered.filter((i) => i.status === "hoje").length);

  // Visible columns based on energy
  const visibleColumns = energy === "basico"
    ? STATUS_COLUMNS.filter((c) => c.key === "hoje")
    : energy === "modo_leve"
    ? STATUS_COLUMNS.filter((c) => c.key === "hoje" || c.key === "em_andamento")
    : STATUS_COLUMNS;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="font-mono text-lg font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" /> Meu Dia
        </h2>
        <p className="text-sm text-muted-foreground font-body mt-0.5">{moodMessage}</p>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-[10px] font-mono text-muted-foreground">
            {filtered.filter((i) => i.status === "hoje").length} hoje
          </span>
          <span className="text-muted-foreground/30">·</span>
          <span className="text-[10px] font-mono text-muted-foreground">
            {filtered.length} total
          </span>
          <span className="text-muted-foreground/30">·</span>
          <span className="text-[10px] font-mono text-muted-foreground">
            {completedToday.length} feitas
          </span>
        </div>
      </div>

      {/* Module filter */}
      <div className="flex gap-1.5">
        <button
          onClick={() => setFilterModule(null)}
          className={`px-2.5 py-1 rounded-md text-[10px] font-mono transition-all ${
            !filterModule ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
          }`}
        >
          TODOS
        </button>
        {(["trabalho", "casa", "saude"] as const).map((m) => {
          const Icon = MODULE_ICONS[m];
          const count = moduleCounts[m];
          return (
            <button
              key={m}
              onClick={() => setFilterModule(filterModule === m ? null : m)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-mono transition-all ${
                filterModule === m ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}
            >
              <Icon className="w-3 h-3" />
              {MODULE_LABELS[m]}
              {count > 0 && <span className="opacity-60">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Pomodoro bar */}
      {pomodoroTask && (
        <div className="bg-card rounded-lg border p-3 space-y-2 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium truncate max-w-[200px]">{pomodoroTask.titulo}</span>
            </div>
            <button onClick={() => { setPomodoroRunning(false); setPomodoroTaskId(null); setPomodoroTime(25 * 60); }} className="text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-secondary rounded-full h-1.5">
              <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${((25 * 60 - pomodoroTime) / (25 * 60)) * 100}%` }} />
            </div>
            <span className="font-mono text-lg font-bold tabular-nums w-16 text-right">{formatTime(pomodoroTime)}</span>
            <div className="flex gap-1">
              <button onClick={() => setPomodoroRunning(!pomodoroRunning)} className="p-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90">
                {pomodoroRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => { setPomodoroRunning(false); setPomodoroTime(25 * 60); }} className="p-1.5 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kanban columns */}
      <div className="space-y-4">
        {visibleColumns.map((col) => {
          const colTasks = getColumnTasks(col.key);
          const isCollapsed = collapsedCols.has(col.key);

          return (
            <div key={col.key} className="space-y-2">
              <button onClick={() => toggleCol(col.key)} className="flex items-center gap-2 w-full">
                {isCollapsed ? <ChevronRight className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
                <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                <span className="font-mono text-[10px] tracking-widest text-muted-foreground">{col.label}</span>
                <span className="font-mono text-[10px] text-muted-foreground/50">{colTasks.length}</span>
              </button>

              {!isCollapsed && (
                <div className="space-y-2 pl-5">
                  {colTasks.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground/40 font-mono py-2">Vazio</p>
                  ) : (
                    colTasks.map((item) => (
                      <KanbanCard
                        key={item.id}
                        item={item}
                        onComplete={() => handleComplete(item)}
                        onDelegate={() => item.tipo === "task" && handleDelegate(item.id)}
                        onPush={() => item.tipo === "task" && handlePush(item.id)}
                        onMoveStatus={(s) => item.tipo === "task" && handleMoveStatus(item.id, s)}
                        onStartPomodoro={() => startPomodoro(item.id)}
                        showPomodoro={!pomodoroTask}
                        onCompleteSubtask={(subId) => {
                          completeTask(subId);
                          logActivity("subtarefa_concluida", { task_id: subId, hora: brasiliaTimeString() });
                        }}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Completed today */}
      {completedToday.length > 0 && (
        <div>
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            {showCompleted ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            CONCLUÍDAS HOJE ({completedToday.length})
          </button>
          {showCompleted && (
            <div className="mt-2 space-y-1 pl-5">
              {completedToday.map((t) => (
                <div key={t.id} className="bg-card/50 rounded-lg border border-dashed p-3 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary/50" />
                  <span className="text-sm text-muted-foreground line-through">{t.titulo}</span>
                  <span className={`ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded ${MODULE_COLORS[t.modulo]}`}>
                    {MODULE_LABELS[t.modulo]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty */}
      {filtered.length === 0 && (
        <div className="bg-card rounded-lg border p-8 text-center">
          <CheckCircle2 className="w-8 h-8 mx-auto text-primary/40 mb-2" />
          <p className="text-sm text-muted-foreground font-body">
            Nenhuma tarefa pendente. Use o + para adicionar.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Card Component ─────────────────────────────────────────
function KanbanCard({
  item,
  onComplete,
  onDelegate,
  onPush,
  onMoveStatus,
  onStartPomodoro,
  showPomodoro,
  onCompleteSubtask,
}: {
  item: UnifiedTask;
  onComplete: () => void;
  onDelegate: () => void;
  onPush: () => void;
  onMoveStatus: (status: string) => void;
  onStartPomodoro: () => void;
  showPomodoro: boolean;
  onCompleteSubtask: (id: string) => void;
}) {
  const [showSubs, setShowSubs] = useState(false);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const Icon = MODULE_ICONS[item.modulo];
  const hasSubs = item.subtasks && item.subtasks.length > 0;
  const completedSubs = item.subtasks?.filter((s) => s.status === "feito").length || 0;

  const urgencyBorder =
    item.urgencia === 3 ? "border-l-red-400" : item.urgencia === 2 ? "border-l-amber-400" : "border-l-transparent";

  return (
    <div className={`bg-card rounded-lg border p-3 border-l-[3px] ${urgencyBorder} transition-all hover:border-primary/20`}>
      {/* Title row */}
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug">{item.titulo}</p>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            <span className={`inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded ${MODULE_COLORS[item.modulo]}`}>
              <Icon className="w-2.5 h-2.5" />
              {MODULE_LABELS[item.modulo]}
            </span>
            {item.taskType && (
              <span className="text-[9px] font-mono text-muted-foreground">
                {TYPE_LABELS[item.taskType] || item.taskType}
              </span>
            )}
            {item.tempo_min && (
              <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
                <Clock className="w-2.5 h-2.5" />{item.tempo_min}min
              </span>
            )}
            {item.dono && item.dono !== "eu" && (
              <span className="text-[9px] font-mono text-primary">
                {item.dono === "socio_medico" ? "Sócio" : "Editor"}
              </span>
            )}
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-1 mt-1">
            {item.recorrente && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-mono text-blue-600 bg-blue-500/10 px-1 py-0.5 rounded">
                <Repeat className="w-2.5 h-2.5" />
                {item.frequencia_recorrencia || "Recorrente"}
              </span>
            )}
            {item.depende_de && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-mono text-amber-600 bg-amber-500/10 px-1 py-0.5 rounded">
                <UserCheck className="w-2.5 h-2.5" />
                {item.depende_de}
              </span>
            )}
            {item.data_limite && (() => {
              const deadline = new Date(item.data_limite + "T00:00:00");
              const now = new Date();
              now.setHours(0, 0, 0, 0);
              const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / 86400000);
              const isOverdue = diffDays < 0;
              const isToday = diffDays === 0;
              const isTomorrow = diffDays === 1;
              const label = isOverdue ? `Atrasada (${Math.abs(diffDays)}d)` : isToday ? "Hoje" : isTomorrow ? "Amanhã" : deadline.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
              const colorClass = isOverdue
                ? "text-destructive bg-destructive/15"
                : isToday
                ? "text-primary bg-primary/15"
                : isTomorrow
                ? "text-accent-foreground bg-accent"
                : "text-muted-foreground bg-secondary";
              return (
                <span className={`inline-flex items-center gap-0.5 text-[9px] font-mono px-1 py-0.5 rounded ${colorClass}`}>
                  <Calendar className="w-2.5 h-2.5" />
                  {label}
                </span>
              );
            })()}
          </div>

          {item.notas && (
            <p className="text-[11px] text-muted-foreground mt-1 font-body leading-relaxed line-clamp-2">{item.notas}</p>
          )}
        </div>
      </div>

      {/* Subtasks */}
      {hasSubs && (
        <div className="mt-2">
          <button onClick={() => setShowSubs(!showSubs)} className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors">
            {showSubs ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            SUBTAREFAS {completedSubs}/{item.subtasks!.length}
          </button>
          {showSubs && (
            <div className="mt-1.5 pl-3 space-y-1 border-l border-border">
              {item.subtasks!.map((sub) => (
                <div key={sub.id} className="flex items-center gap-2">
                  <button
                    onClick={() => sub.status !== "feito" && onCompleteSubtask(sub.id)}
                    className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                      sub.status === "feito" ? "bg-primary border-primary" : "border-muted-foreground/40 hover:border-primary"
                    }`}
                  >
                    {sub.status === "feito" && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                  </button>
                  <span className={`text-xs font-body ${sub.status === "feito" ? "line-through text-muted-foreground/50" : ""}`}>
                    {sub.titulo}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-1.5 mt-2.5">
        <button onClick={onComplete} className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary text-primary-foreground font-mono text-[10px] hover:opacity-90 transition-opacity">
          <Check className="w-3 h-3" /> Feito
        </button>
        {item.tipo === "task" && (
          <>
            <button onClick={onPush} className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground font-mono text-[10px] hover:bg-secondary/80 transition-colors">
              <ArrowRight className="w-3 h-3" /> Adiar
            </button>
            {(item.taskType === "delegavel" || (item.dono && item.dono !== "eu")) && (
              <button onClick={onDelegate} className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground font-mono text-[10px] hover:bg-secondary/80 transition-colors">
                <Send className="w-3 h-3" /> Delegar
              </button>
            )}
            {/* Move status */}
            <div className="relative">
              <button
                onClick={() => setShowMoveMenu(!showMoveMenu)}
                className="px-2 py-1 rounded-md bg-secondary text-secondary-foreground font-mono text-[10px] hover:bg-secondary/80 transition-colors"
              >
                Mover ▾
              </button>
              {showMoveMenu && (
                <div className="absolute top-full left-0 mt-1 bg-card border rounded-lg shadow-lg z-10 py-1 min-w-[120px] animate-fade-in">
                  {STATUS_COLUMNS.filter((c) => c.key !== item.status).map((col) => (
                    <button
                      key={col.key}
                      onClick={() => { onMoveStatus(col.key); setShowMoveMenu(false); }}
                      className="w-full text-left px-3 py-1.5 text-[10px] font-mono text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors flex items-center gap-2"
                    >
                      <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                      {col.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
        {showPomodoro && (
          <button onClick={onStartPomodoro} className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors">
            <Timer className="w-3 h-3" /> Pomodoro
          </button>
        )}
      </div>
    </div>
  );
}

function getMoodMessage(mood?: number, todayCount?: number): string {
  if (mood === undefined || mood === null) {
    return "Todas as suas tarefas em um só lugar.";
  }
  if (mood <= -2) return "Vai com calma hoje. Só o essencial.";
  if (mood === -1) return "Dia mais leve — uma coisa de cada vez.";
  if (mood === 0) return "Dia neutro — ritmo regular.";
  if (mood === 1) return "Bom dia! Vamos manter o ritmo.";
  if (mood >= 2) return `Dia excelente! ${todayCount || 0} tarefas te esperam.`;
  return "Suas tarefas do dia.";
}
