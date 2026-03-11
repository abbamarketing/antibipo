import { useState, useMemo } from "react";
import { Check, Clock, History, RotateCcw } from "lucide-react";
import { format, startOfWeek, addDays, isSameDay, isToday, subWeeks, addWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { brasiliaTime } from "@/lib/brasilia";
import type { TarefaCasa, RegistroLimpeza } from "@/lib/casa-store";
import type { EnergyState } from "@/lib/store";

interface WeeklyTaskViewProps {
  tarefas: TarefaCasa[];
  registros: RegistroLimpeza[];
  comodos: string[];
  energy: EnergyState;
  onCompletarTarefa: (t: { tarefa_casa_id: string; comodo: string; tarefa: string }) => void;
}

const DIAS_SEMANA_CURTO = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// Map frequency to days per week
function getTarefasDoDia(tarefas: TarefaCasa[], dayOfWeek: number): TarefaCasa[] {
  return tarefas.filter((t) => {
    switch (t.frequencia) {
      case "diario":
        return true;
      case "semanal":
        // Distribute weekly tasks: hash task id to a specific day
        return hashToDay(t.id) === dayOfWeek;
      case "quinzenal":
        // Show on hashed day, every other week handled at display
        return hashToDay(t.id) === dayOfWeek;
      case "mensal":
        // Show on first occurrence of hashed day
        return hashToDay(t.id) === dayOfWeek;
      default:
        return true;
    }
  });
}

function hashToDay(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  // Map to 1-6 (Seg-Sáb), avoid Sunday=0 for chores
  return (Math.abs(hash) % 6) + 1;
}

export function WeeklyTaskView({ tarefas, registros, comodos, energy, onCompletarTarefa }: WeeklyTaskViewProps) {
  const hoje = brasiliaTime();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDayIdx, setSelectedDayIdx] = useState(hoje.getDay());

  const weekStart = useMemo(() => {
    const base = weekOffset === 0 ? hoje : addWeeks(hoje, weekOffset);
    return startOfWeek(base, { weekStartsOn: 0 });
  }, [weekOffset]);

  const dias = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const selectedDate = dias[selectedDayIdx];

  const tarefasDoDia = useMemo(() => {
    const filtered = getTarefasDoDia(tarefas, selectedDayIdx);
    if (energy === "basico") return filtered.slice(0, 3);
    if (energy === "modo_leve") return filtered.slice(0, 6);
    return filtered;
  }, [tarefas, selectedDayIdx, energy]);

  // Group by comodo
  const porComodo = useMemo(() => {
    const map = new Map<string, TarefaCasa[]>();
    tarefasDoDia.forEach((t) => {
      if (!map.has(t.comodo)) map.set(t.comodo, []);
      map.get(t.comodo)!.push(t);
    });
    return map;
  }, [tarefasDoDia]);

  // Check if task was done on selected date
  const isFeitoNoDia = (tarefaCasaId: string): boolean => {
    return registros.some(
      (r) => r.tarefa_casa_id === tarefaCasaId && isSameDay(new Date(r.feito_em), selectedDate)
    );
  };

  // Count done for a day
  const countFeitosDia = (dayIdx: number): number => {
    const date = dias[dayIdx];
    const tarefasDay = getTarefasDoDia(tarefas, dayIdx);
    return tarefasDay.filter((t) =>
      registros.some((r) => r.tarefa_casa_id === t.id && isSameDay(new Date(r.feito_em), date))
    ).length;
  };

  const totalDia = getTarefasDoDia(tarefas, selectedDayIdx).length;
  const feitosDia = countFeitosDia(selectedDayIdx);

  return (
    <div className="space-y-4">
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setWeekOffset((w) => w - 1)}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <span className="font-mono text-xs text-muted-foreground">
          {format(weekStart, "dd MMM", { locale: ptBR })} — {format(addDays(weekStart, 6), "dd MMM", { locale: ptBR })}
        </span>
        <button
          onClick={() => setWeekOffset((w) => Math.min(w + 1, 0))}
          disabled={weekOffset >= 0}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-all disabled:opacity-30"
        >
          <RotateCcw className="w-3.5 h-3.5 scale-x-[-1]" />
        </button>
      </div>

      {/* Day selector */}
      <div className="grid grid-cols-7 gap-1">
        {dias.map((d, i) => {
          const isHoje = isToday(d);
          const isSelected = i === selectedDayIdx;
          const totalDay = getTarefasDoDia(tarefas, i).length;
          const doneDay = countFeitosDia(i);
          const allDone = totalDay > 0 && doneDay === totalDay;

          return (
            <button
              key={i}
              onClick={() => setSelectedDayIdx(i)}
              className={`flex flex-col items-center py-2 px-1 rounded-lg transition-all text-center ${
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : isHoje
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-secondary"
              }`}
            >
              <span className="text-[10px] font-mono font-medium">{DIAS_SEMANA_CURTO[i]}</span>
              <span className={`text-sm font-bold ${isSelected ? "" : "text-foreground"}`}>
                {format(d, "dd")}
              </span>
              {totalDay > 0 && (
                <div className={`mt-0.5 w-1.5 h-1.5 rounded-full ${
                  allDone
                    ? "bg-green-500"
                    : doneDay > 0
                    ? "bg-yellow-500"
                    : isSelected
                    ? "bg-primary-foreground/40"
                    : "bg-muted-foreground/30"
                }`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Progress for selected day */}
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
        Array.from(porComodo.entries()).map(([comodo, tasks]) => (
          <div key={comodo} className="space-y-1.5">
            <h4 className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
              {comodo}
            </h4>
            {tasks.map((t) => {
              const feito = isFeitoNoDia(t.id);
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
            Nenhuma tarefa para {format(selectedDate, "EEEE", { locale: ptBR })}.
          </p>
        </div>
      )}
    </div>
  );
}
