import { useState, useMemo } from "react";
import { useFlowStore, type Task, type EnergyState } from "@/lib/store";
import { useCasaStore } from "@/lib/casa-store";
import { useTrackerStore } from "@/lib/tracker-store";
import { isRecorrenteDue, type RecorrenteConfig, type ChecklistConfig } from "@/lib/tracker-blueprints";
import { TaskCard } from "./TaskCard";
import { logActivity } from "@/lib/activity-log";
import { brasiliaTimeString } from "@/lib/brasilia";
import { CheckCircle2, Clock, Briefcase, Home, Heart, ChevronDown, ChevronUp, Sparkles } from "lucide-react";

interface DailyTasksViewProps {
  energy: EnergyState;
  lastMoodValue?: number;
}

interface UnifiedTask {
  id: string;
  titulo: string;
  modulo: "trabalho" | "casa" | "saude";
  tipo: "task" | "casa" | "tracker";
  urgencia: number;
  done: boolean;
  sourceData?: any;
}

export function DailyTasksView({ energy, lastMoodValue }: DailyTasksViewProps) {
  const {
    state, completeTask, updateTask,
  } = useFlowStore();
  const casa = useCasaStore();
  const { trackers, getTodayRegistros, getLastCompletion } = useTrackerStore();
  const [revealedCount, setRevealedCount] = useState(getInitialReveal(energy, lastMoodValue));
  const [showCompleted, setShowCompleted] = useState(false);

  // Build unified task list from all modules
  const allItems = useMemo(() => {
    const items: UnifiedTask[] = [];

    // Work tasks (hoje + em_andamento)
    state.tasks
      .filter((t) => !t.parent_task_id && (t.status === "hoje" || t.status === "em_andamento"))
      .forEach((t) => {
        items.push({
          id: t.id,
          titulo: t.titulo,
          modulo: t.modulo as "trabalho" | "casa" | "saude",
          tipo: "task",
          urgencia: t.urgencia,
          done: t.status === "feito",
          sourceData: t,
        });
      });

    // Casa tasks due today
    const today = new Date();
    const dayOfWeek = today.getDay();
    casa.tarefas
      .filter((t) => t.ativo !== false)
      .forEach((t) => {
        const lastDone = casa.registros.find((r) => r.tarefa_casa_id === t.id);
        const lastDate = lastDone ? new Date(lastDone.feito_em) : null;
        const daysSince = lastDate ? Math.floor((today.getTime() - lastDate.getTime()) / 86400000) : 999;
        const freqDays = t.frequencia === "diario" ? 1 : t.frequencia === "semanal" ? 7 : t.frequencia === "quinzenal" ? 15 : 30;
        const isDue = daysSince >= freqDays;
        if (isDue) {
          items.push({
            id: `casa_${t.id}`,
            titulo: `${t.tarefa} (${t.comodo})`,
            modulo: "casa",
            tipo: "casa",
            urgencia: daysSince > freqDays * 1.5 ? 3 : 2,
            done: false,
            sourceData: t,
          });
        }
      });

    // Trackers due today (recorrente + checklist)
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
              urgencia: 1,
              done: false,
              sourceData: t,
            });
          }
        }
      });

    // Sort by urgency desc
    items.sort((a, b) => b.urgencia - a.urgencia);
    return items;
  }, [state.tasks, casa.tarefas, casa.registros, trackers, getTodayRegistros, getLastCompletion]);

  const pendingItems = allItems.filter((i) => !i.done);
  const completedToday = state.tasks.filter((t) => t.status === "feito" && t.feito_em && t.feito_em.startsWith(new Date().toISOString().split("T")[0]));

  // Progressive reveal: show only N items initially
  const visibleItems = pendingItems.slice(0, revealedCount);
  const hasMore = pendingItems.length > revealedCount;

  const handleComplete = (item: UnifiedTask) => {
    if (item.tipo === "task") {
      completeTask(item.id);
      logActivity("tarefa_concluida", { task_id: item.id, titulo: item.titulo, hora: brasiliaTimeString() });
    } else if (item.tipo === "casa") {
      const t = item.sourceData;
      casa.completarTarefa({ tarefa_casa_id: t.id, comodo: t.comodo, tarefa: t.tarefa });
      logActivity("tarefa_casa_concluida", { tarefa: t.tarefa, comodo: t.comodo, hora: brasiliaTimeString() });
    }
    // After completing, reveal one more if available
    if (hasMore) {
      setRevealedCount((c) => c + 1);
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

  const moduloIcon = (m: string) => {
    switch (m) {
      case "trabalho": return <Briefcase className="w-3 h-3" />;
      case "casa": return <Home className="w-3 h-3" />;
      case "saude": return <Heart className="w-3 h-3" />;
      default: return null;
    }
  };

  const moduloLabel = (m: string) => {
    switch (m) {
      case "trabalho": return "Trabalho";
      case "casa": return "Casa";
      case "saude": return "Saúde";
      default: return m;
    }
  };

  const moodMessage = getMoodMessage(lastMoodValue, pendingItems.length);

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h2 className="font-mono text-lg font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" /> Meu Dia
        </h2>
        <p className="text-sm text-muted-foreground font-body mt-0.5">
          {moodMessage}
        </p>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-[10px] font-mono text-muted-foreground">
            {pendingItems.length} pendentes
          </span>
          <span className="text-muted-foreground/30">·</span>
          <span className="text-[10px] font-mono text-muted-foreground">
            {completedToday.length} feitas hoje
          </span>
        </div>
      </div>

      {/* Visible tasks */}
      <div className="space-y-2">
        {visibleItems.map((item) => (
          <div key={item.id} className="bg-card rounded-lg border p-4 transition-all hover:border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="flex items-center gap-1 text-muted-foreground">
                  {moduloIcon(item.modulo)}
                </div>
                <span className="text-sm font-medium truncate">{item.titulo}</span>
                <span className="text-[9px] font-mono text-muted-foreground uppercase shrink-0">
                  {moduloLabel(item.modulo)}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                {item.tipo === "task" && (
                  <>
                    <button
                      onClick={() => handleDelegate(item.id)}
                      className="font-mono text-[9px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      DELEGAR
                    </button>
                    <button
                      onClick={() => handlePush(item.id)}
                      className="font-mono text-[9px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      ADIAR
                    </button>
                  </>
                )}
                <button
                  onClick={() => handleComplete(item)}
                  className="font-mono text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-all"
                >
                  FEITO
                </button>
              </div>
            </div>
            {/* Urgency indicator */}
            <div className="flex items-center gap-1 mt-2">
              {[1, 2, 3].map((u) => (
                <div
                  key={u}
                  className={`w-1.5 h-1.5 rounded-full ${
                    u <= item.urgencia ? "bg-primary" : "bg-secondary"
                  }`}
                />
              ))}
              <span className="text-[9px] font-mono text-muted-foreground ml-1">
                {item.urgencia === 3 ? "urgente" : item.urgencia === 2 ? "semana" : "backlog"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Reveal more */}
      {hasMore && (
        <button
          onClick={() => setRevealedCount((c) => c + 2)}
          className="w-full p-3 border border-dashed rounded-lg text-xs font-mono text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all flex items-center justify-center gap-2"
        >
          <Clock className="w-3.5 h-3.5" />
          MOSTRAR MAIS ({pendingItems.length - revealedCount} restantes)
        </button>
      )}

      {/* Empty state */}
      {pendingItems.length === 0 && (
        <div className="bg-card rounded-lg border p-8 text-center">
          <CheckCircle2 className="w-8 h-8 mx-auto text-primary/40 mb-2" />
          <p className="text-sm text-muted-foreground font-body">
            Tudo em dia! Nenhuma tarefa pendente.
          </p>
        </div>
      )}

      {/* Completed today toggle */}
      {completedToday.length > 0 && (
        <div>
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            {showCompleted ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            CONCLUÍDAS HOJE ({completedToday.length})
          </button>
          {showCompleted && (
            <div className="mt-2 space-y-1">
              {completedToday.map((t) => (
                <div key={t.id} className="bg-card/50 rounded-lg border border-dashed p-3 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary/50" />
                  <span className="text-sm text-muted-foreground line-through">{t.titulo}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getInitialReveal(energy: EnergyState, mood?: number): number {
  // Base reveal by energy
  let base = energy === "foco_total" ? 5 : energy === "modo_leve" ? 3 : 1;
  // Adjust by mood: negative mood = fewer tasks
  if (mood !== undefined) {
    if (mood <= -2) base = Math.max(1, base - 2);
    else if (mood === -1) base = Math.max(1, base - 1);
    else if (mood >= 2) base = Math.min(8, base + 1);
  }
  return base;
}

function getMoodMessage(mood?: number, pending?: number): string {
  if (mood === undefined || mood === null) {
    return "Suas tarefas de todos os módulos, organizadas por prioridade.";
  }
  if (mood <= -2) return "Vai com calma hoje. Só o essencial.";
  if (mood === -1) return "Dia mais leve — uma coisa de cada vez.";
  if (mood === 0) return "Dia neutro — ritmo regular.";
  if (mood === 1) return "Bom dia! Vamos manter o ritmo.";
  if (mood >= 2) return `Dia excelente! ${pending || 0} tarefas te esperam.`;
  return "Suas tarefas do dia.";
}
