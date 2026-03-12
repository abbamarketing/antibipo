import { useMemo } from "react";
import { Check, Clock } from "lucide-react";
import { isSameDay } from "date-fns";
import { brasiliaISO } from "@/lib/brasilia";
import { useDayContext } from "@/hooks/use-day-context";
import type { TarefaCasa, RegistroLimpeza } from "@/lib/casa-store";
import type { EnergyState } from "@/lib/store";

interface WeeklyTaskViewProps {
  tarefasDevidas: { task: TarefaCasa; urgencia: number; daysSince: number }[];
  registros: RegistroLimpeza[];
  energy: EnergyState;
  onCompletarTarefa: (t: { tarefa_casa_id: string; comodo: string; tarefa: string }) => void;
}

export function WeeklyTaskView({ tarefasDevidas, registros, energy, onCompletarTarefa }: WeeklyTaskViewProps) {
  const dayCtx = useDayContext();
  const todayStr = brasiliaISO();

  // Apply mood-driven limit (same as Kanban's casaLimit)
  const casaLimit = dayCtx.casaLimit;

  // Mood bonus: show a few extra when mood is good
  const moodBonus = dayCtx.moodLabel === "muito_bom" ? 3 : dayCtx.moodLabel === "bom" ? 1 : 0;
  const effectiveLimit = casaLimit + moodBonus;

  const visibleTasks = useMemo(() => {
    return tarefasDevidas.slice(0, effectiveLimit);
  }, [tarefasDevidas, effectiveLimit]);

  // Check if task was done today
  const isFeitoHoje = (tarefaCasaId: string): boolean => {
    const today = new Date(todayStr + "T12:00:00");
    return registros.some(
      (r) => r.tarefa_casa_id === tarefaCasaId && isSameDay(new Date(r.feito_em), today)
    );
  };

  // Group by comodo
  const porComodo = useMemo(() => {
    const map = new Map<string, typeof visibleTasks>();
    visibleTasks.forEach((item) => {
      const key = item.task.comodo;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    });
    return map;
  }, [visibleTasks]);

  const totalDia = visibleTasks.length;
  const feitosDia = visibleTasks.filter((item) => isFeitoHoje(item.task.id)).length;

  return (
    <div className="space-y-4">
      {/* Progress */}
      {totalDia > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${(feitosDia / totalDia) * 100}%` }}
            />
          </div>
          <span className="font-mono text-[10px] text-muted-foreground">
            {feitosDia}/{totalDia}
          </span>
        </div>
      )}

      {/* Tasks grouped by room */}
      {porComodo.size > 0 ? (
        Array.from(porComodo.entries()).map(([comodo, items]) => (
          <div key={comodo} className="space-y-1.5">
            <h4 className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
              {comodo}
            </h4>
            {items.map(({ task: t, daysSince }) => {
              const feito = isFeitoHoje(t.id);
              return (
                <div
                  key={t.id}
                  className={`rounded-lg border p-3 flex items-center justify-between gap-3 transition-all ${
                    feito ? "bg-card/50 border-dashed" : "bg-card"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${feito ? "line-through text-muted-foreground" : ""}`}>
                      {t.tarefa}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {t.tempo_min && (
                        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                          <Clock className="w-2.5 h-2.5" />
                          {t.tempo_min}min
                        </span>
                      )}
                      {daysSince > 1 && !feito && (
                        <span className="text-[10px] text-amber-500 font-mono">
                          {daysSince}d atrás
                        </span>
                      )}
                    </div>
                  </div>
                  {feito ? (
                    <span className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-muted text-muted-foreground font-mono text-[10px]">
                      <Check className="w-3 h-3" /> FEITO
                    </span>
                  ) : (
                    <button
                      onClick={() =>
                        onCompletarTarefa({
                          tarefa_casa_id: t.id,
                          comodo: t.comodo,
                          tarefa: t.tarefa,
                        })
                      }
                      className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-primary text-primary-foreground font-mono text-[10px] hover:opacity-90 transition-opacity"
                    >
                      <Check className="w-3 h-3" /> FEITO
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ))
      ) : (
        <div className="bg-card rounded-lg border p-6 text-center">
          <p className="text-xs text-muted-foreground font-body">
            Nenhuma tarefa pendente. Tudo em dia! 🎉
          </p>
        </div>
      )}
    </div>
  );
}
