import { useState, useEffect, useCallback, useRef } from "react";
import { EnergyState, Task } from "@/lib/store";
import { TaskCard } from "./TaskCard";
import {
  Inbox,
  Search,
  Filter,
  Timer,
  Play,
  Pause,
  RotateCcw,
  X,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface WorkModuleProps {
  energy: EnergyState;
  tasks: Task[];
  allTasks: Task[];
  onComplete: (id: string) => void;
  onDelegate: (id: string) => void;
  onPush: (id: string) => void;
}

const statusColumns: { key: string; label: string; color: string }[] = [
  { key: "hoje", label: "HOJE", color: "bg-primary" },
  { key: "em_andamento", label: "EM ANDAMENTO", color: "bg-amber-400" },
  { key: "aguardando", label: "AGUARDANDO", color: "bg-blue-400" },
  { key: "backlog", label: "BACKLOG", color: "bg-muted-foreground/30" },
];

const energyMessages: Record<EnergyState, string> = {
  foco_total: "Kanban completo — todas as tarefas visíveis.",
  modo_leve: "Foco no que importa hoje.",
  basico: "1 tarefa — a que trava alguém.",
};

export function WorkModule({ energy, tasks, allTasks, onComplete, onDelegate, onPush }: WorkModuleProps) {
  const [view, setView] = useState<"focus" | "kanban">(energy === "foco_total" ? "kanban" : "focus");
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterOwner, setFilterOwner] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [collapsedCols, setCollapsedCols] = useState<Set<string>>(new Set());

  // Pomodoro
  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [pomodoroTaskId, setPomodoroTaskId] = useState<string | null>(null);
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60); // 25 min
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (pomodoroRunning && pomodoroTime > 0) {
      intervalRef.current = setInterval(() => {
        setPomodoroTime((t) => t - 1);
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (pomodoroTime === 0 && pomodoroRunning) {
        setPomodoroRunning(false);
        // Could add notification here
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [pomodoroRunning, pomodoroTime]);

  const startPomodoro = (taskId: string) => {
    setPomodoroActive(true);
    setPomodoroTaskId(taskId);
    setPomodoroTime(25 * 60);
    setPomodoroRunning(true);
  };

  const resetPomodoro = () => {
    setPomodoroRunning(false);
    setPomodoroTime(25 * 60);
  };

  const closePomodoro = () => {
    setPomodoroActive(false);
    setPomodoroRunning(false);
    setPomodoroTaskId(null);
    setPomodoroTime(25 * 60);
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const toggleCol = (key: string) => {
    const next = new Set(collapsedCols);
    next.has(key) ? next.delete(key) : next.add(key);
    setCollapsedCols(next);
  };

  // Filter work tasks
  const workTasks = allTasks.filter(
    (t) => t.modulo === "trabalho" && t.status !== "feito" && t.status !== "descartado"
  );

  const filtered = workTasks.filter((t) => {
    if (search && !t.titulo.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterType && t.tipo !== filterType) return false;
    if (filterOwner && t.dono !== filterOwner) return false;
    return true;
  });

  const getColumnTasks = (status: string) =>
    filtered.filter((t) => t.status === status).sort((a, b) => b.urgencia - a.urgencia || b.impacto - a.impacto);

  const pomodoroTask = pomodoroTaskId ? allTasks.find((t) => t.id === pomodoroTaskId) : null;

  // In basic/leve mode, show focused view
  if (view === "focus" || energy === "basico") {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-mono text-lg font-bold tracking-tight">Trabalho</h2>
            <p className="text-sm text-muted-foreground font-body mt-0.5">
              {energyMessages[energy]}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {energy === "foco_total" && (
              <button
                onClick={() => setView("kanban")}
                className="font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                KANBAN
              </button>
            )}
            <span className="font-mono text-xs text-muted-foreground">
              {workTasks.length} tarefas
            </span>
          </div>
        </div>

        {/* Pomodoro bar */}
        {pomodoroActive && pomodoroTask && (
          <PomodoroBar
            task={pomodoroTask}
            time={pomodoroTime}
            running={pomodoroRunning}
            onToggle={() => setPomodoroRunning(!pomodoroRunning)}
            onReset={resetPomodoro}
            onClose={closePomodoro}
            formatTime={formatTime}
          />
        )}

        {tasks.length === 0 ? (
          <div className="bg-card rounded-lg border p-8 text-center">
            <Inbox className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground font-body">
              Nenhuma tarefa para este estado. Use + para adicionar.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="space-y-1">
                <TaskCard task={task} onComplete={onComplete} onDelegate={onDelegate} onPush={onPush} />
                {!pomodoroActive && (
                  <button
                    onClick={() => startPomodoro(task.id)}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Timer className="w-3 h-3" /> INICIAR POMODORO
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Kanban view (foco_total)
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-mono text-lg font-bold tracking-tight">Trabalho</h2>
          <p className="text-sm text-muted-foreground font-body mt-0.5">{energyMessages[energy]}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView("focus")}
            className="font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            FOCO
          </button>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1 transition-colors ${filterType || filterOwner ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Filter className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="relative animate-fade-in">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar tarefa..."
            className="w-full bg-background border rounded-lg pl-9 pr-3 py-2 text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="bg-card rounded-lg border p-3 space-y-2 animate-fade-in">
          <div>
            <span className="text-[10px] font-mono text-muted-foreground uppercase">Tipo</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {["estrategico", "operacional", "delegavel", "administrativo"].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(filterType === t ? null : t)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
                    filterType === t ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="text-[10px] font-mono text-muted-foreground uppercase">Dono</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {["eu", "socio_medico", "editor"].map((d) => (
                <button
                  key={d}
                  onClick={() => setFilterOwner(filterOwner === d ? null : d)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
                    filterOwner === d ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {d === "socio_medico" ? "sócio" : d}
                </button>
              ))}
            </div>
          </div>
          {(filterType || filterOwner) && (
            <button
              onClick={() => { setFilterType(null); setFilterOwner(null); }}
              className="text-[10px] font-mono text-destructive hover:opacity-80"
            >
              LIMPAR FILTROS
            </button>
          )}
        </div>
      )}

      {/* Pomodoro bar */}
      {pomodoroActive && pomodoroTask && (
        <PomodoroBar
          task={pomodoroTask}
          time={pomodoroTime}
          running={pomodoroRunning}
          onToggle={() => setPomodoroRunning(!pomodoroRunning)}
          onReset={resetPomodoro}
          onClose={closePomodoro}
          formatTime={formatTime}
        />
      )}

      {/* Kanban columns */}
      <div className="space-y-4">
        {statusColumns.map((col) => {
          const colTasks = getColumnTasks(col.key);
          const isCollapsed = collapsedCols.has(col.key);

          return (
            <div key={col.key} className="space-y-2">
              <button
                onClick={() => toggleCol(col.key)}
                className="flex items-center gap-2 w-full"
              >
                {isCollapsed ? (
                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                )}
                <div className={`w-2 h-2 rounded-full ${col.color}`} />
                <span className="font-mono text-[10px] tracking-widest text-muted-foreground">
                  {col.label}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground/50">{colTasks.length}</span>
              </button>

              {!isCollapsed && (
                <div className="space-y-2 pl-5">
                  {colTasks.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground/40 font-mono py-2">Vazio</p>
                  ) : (
                    colTasks.map((task) => (
                      <div key={task.id} className="space-y-1">
                        <TaskCard task={task} onComplete={onComplete} onDelegate={onDelegate} onPush={onPush} />
                        {!pomodoroActive && (
                          <button
                            onClick={() => startPomodoro(task.id)}
                            className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Timer className="w-3 h-3" /> POMODORO
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PomodoroBar({
  task,
  time,
  running,
  onToggle,
  onReset,
  onClose,
  formatTime,
}: {
  task: Task;
  time: number;
  running: boolean;
  onToggle: () => void;
  onReset: () => void;
  onClose: () => void;
  formatTime: (s: number) => string;
}) {
  const progress = ((25 * 60 - time) / (25 * 60)) * 100;

  return (
    <div className="bg-card rounded-lg border p-3 space-y-2 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Timer className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium truncate max-w-[200px]">{task.titulo}</span>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-secondary rounded-full h-1.5">
          <div
            className="bg-primary h-1.5 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="font-mono text-lg font-bold tabular-nums w-16 text-right">
          {formatTime(time)}
        </span>
        <div className="flex gap-1">
          <button
            onClick={onToggle}
            className="p-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90"
          >
            {running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onReset}
            className="p-1.5 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
