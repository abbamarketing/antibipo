import { useState, useEffect, useRef, useMemo } from "react";
import { EnergyState, Task } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  Briefcase,
  Timer,
  Play,
  Pause,
  RotateCcw,
  X,
  Users,
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

export function WorkModule({ energy, allTasks }: WorkModuleProps) {
  // Fetch clients for display
  const { data: clientes = [] } = useQuery({
    queryKey: ["clientes_all"],
    queryFn: async () => {
      const { data } = await supabase.from("clientes").select("*").eq("status", "ativo").order("nome");
      return data || [];
    },
  });

  // Pomodoro
  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [pomodoroTaskId, setPomodoroTaskId] = useState<string | null>(null);
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
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

  const pomodoroTask = pomodoroTaskId ? allTasks.find((t) => t.id === pomodoroTaskId) : null;
  const progress = ((25 * 60 - pomodoroTime) / (25 * 60)) * 100;

  // Work task stats
  const workTasks = allTasks.filter(
    (t: any) => t.modulo === "trabalho" && t.status !== "feito" && t.status !== "descartado"
  );
  const todayTasks = workTasks.filter((t) => t.status === "hoje" || t.status === "em_andamento");

  // Client stats
  const [showClientes, setShowClientes] = useState(false);

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h2 className="font-mono text-lg font-bold tracking-tight">Trabalho</h2>
        <p className="text-sm text-muted-foreground font-body mt-0.5">
          {energy === "basico"
            ? "Dia leve — foque no que destravar."
            : energy === "modo_leve"
            ? "Ritmo moderado — tarefas operacionais."
            : "Foco total — tarefas estratégicas e de alto impacto."}
        </p>
        <p className="font-mono text-[10px] text-muted-foreground mt-1">
          {todayTasks.length} ativas · {workTasks.length} no total
        </p>
      </div>

      {/* Pomodoro bar */}
      {pomodoroActive && pomodoroTask && (
        <div className="bg-card rounded-lg border p-3 space-y-2 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium truncate max-w-[200px]">{pomodoroTask.titulo}</span>
            </div>
            <button onClick={closePomodoro} className="text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-secondary rounded-full h-1.5">
              <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <span className="font-mono text-lg font-bold tabular-nums w-16 text-right">
              {formatTime(pomodoroTime)}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPomodoroRunning(!pomodoroRunning)}
                className="p-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90"
              >
                {pomodoroRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={resetPomodoro}
                className="p-1.5 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Pomodoro starter for today's tasks */}
      {!pomodoroActive && todayTasks.length > 0 && (
        <div className="bg-card rounded-lg border p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Timer className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">Iniciar Pomodoro</span>
          </div>
          <div className="space-y-1">
            {todayTasks.slice(0, 3).map((task) => (
              <button
                key={task.id}
                onClick={() => startPomodoro(task.id)}
                className="w-full text-left px-3 py-2 rounded-md text-xs font-body hover:bg-secondary transition-colors flex items-center gap-2"
              >
                <Play className="w-3 h-3 text-primary shrink-0" />
                <span className="truncate">{task.titulo}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Clients */}
      {clientes.length > 0 && (
        <div className="bg-card rounded-lg border p-3">
          <button
            onClick={() => setShowClientes(!showClientes)}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                Clientes ativos ({clientes.length})
              </span>
            </div>
            {showClientes ? (
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
            )}
          </button>
          {showClientes && (
            <div className="space-y-1.5 mt-2 animate-fade-in">
              {clientes.map((c: any) => {
                const clientTasks = workTasks.filter((t) => t.cliente_id === c.id);
                return (
                  <div key={c.id} className="flex items-center justify-between py-1.5 px-1">
                    <span className="text-xs font-body">{c.nome}</span>
                    <div className="flex items-center gap-2">
                      {c.valor_mensal && (
                        <span className="font-mono text-[9px] text-muted-foreground">
                          R$ {Number(c.valor_mensal).toLocaleString("pt-BR")}
                        </span>
                      )}
                      <span className="font-mono text-[9px] text-primary">
                        {clientTasks.length} tarefa{clientTasks.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
