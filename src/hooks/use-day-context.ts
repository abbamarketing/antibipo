/**
 * useDayContext — Centralized hook that crosses mood, energy, sleep,
 * medication, tasks and exercise into a unified "day state" that all
 * components can consume. This is the connective tissue between modules.
 */
import { useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useFlowStore, today, type EnergyState, type Task } from "@/lib/store";
import { useBemEstarStore } from "@/lib/bem-estar-store";
import { useCasaStore } from "@/lib/casa-store";
import { useTrackerStore } from "@/lib/tracker-store";

export type DayMood = "muito_baixo" | "baixo" | "neutro" | "bom" | "muito_bom";
export type DayAlert = "crise" | "atencao" | "estavel" | "otimo";

export interface AgentAlert {
  severity: "warning" | "error";
  title: string;
  body: string;
  module_focus: string;
  recommended_action: string;
}

export interface Orchestration {
  manic_precursor: boolean | null;
  depressive_precursor: boolean | null;
  manic_confidence: number | null;
  depressive_confidence: number | null;
  weights: Record<string, number>;
  weight_adjustment_reason: string | null;
  module_order: string[];
  modules_to_show: string[] | null;
  modules_to_hide: string[] | null;
  nudge_tone: string | null;
  nudge_focus: string | null;
  nudge_factual_base: string | null;
  meds_adherence_7d: number | null;
  meds_status: string | null;
  meds_as_anchor: boolean | null;
  day_score_recalibrated: number | null;
  alert_level_recalibrated: string | null;
  score_shift: number | null;
}

export interface DayContext {
  // Raw values
  moodValue: number | null; // -2 to 2
  moodLabel: DayMood;
  energy: EnergyState | null;
  sleepQuality: number | null; // 1-3
  sleepHours: number | null;
  medsTaken: number;
  medsTotal: number;
  medsAdherence: number | null; // 0-100% or null when no meds registered
  exerciseDone: boolean;
  exerciseMinutes: number;

  // Cross-module computed
  dayScore: number; // 0-100 composite score
  alertLevel: DayAlert;
  alertMessage: string;
  taskLimit: number; // max tasks for "hoje" based on mood+energy
  casaLimit: number; // max casa tasks based on mood+energy
  suggestedActions: string[];
  contextMessage: string; // adaptive message for the user
  consecutiveDaysWithoutData: number;

  // Stats
  tasksCompletedToday: number;
  tasksPending: number;
  tasksOverdue: number;

  // Orchestration
  moduleOrder: string[];
  orchestration: Orchestration | null;
  scoreShift: number | null;
  weightAdjustmentReason: string | null;
  alerts: AgentAlert[];
}

function moodToLabel(val: number | null): DayMood {
  if (val === null) return "neutro";
  if (val <= -2) return "muito_baixo";
  if (val === -1) return "baixo";
  if (val === 0) return "neutro";
  if (val === 1) return "bom";
  return "muito_bom";
}

function computeDayScore(ctx: {
  moodValue: number | null;
  sleepQuality: number | null;
  medsAdherence: number | null;
  exerciseDone: boolean;
  tasksCompletedToday: number;
  energy: EnergyState | null;
  consecutiveDaysWithoutData: number;
}): number {
  let score = 50; // baseline

  // Rebalanced formula (trabalho module removed, weight redistributed):
  // base 50 + mood(±20) + sleep(0-20) + meds(0-20) + exercise(0-15) + tasks(0-15) - gap(0-30)
  // Sleep and meds weighted highest — clinically most important for bipolar condition.
  // Total positive max = 90, capped at 100.

  // Mood contribution (±20)
  if (ctx.moodValue !== null) {
    score += ctx.moodValue * 10; // -20 to +20
  }

  // Sleep contribution (0-20) — increased from 15, critical for bipolar stability
  if (ctx.sleepQuality !== null) {
    score += (ctx.sleepQuality - 1) * 10; // 0, 10, 20
  }

  // Medication adherence (0-20) — increased from 15, most important clinical factor
  score += ctx.medsAdherence !== null ? (ctx.medsAdherence / 100) * 20 : 0;

  // Exercise bonus (0-15) — increased from 10
  if (ctx.exerciseDone) score += 15;

  // Task momentum (0-15) — increased from 10
  score += Math.min(ctx.tasksCompletedToday * 3, 15);

  // Data absence penalty — silence is a signal in bipolar condition
  if (ctx.consecutiveDaysWithoutData >= 1 && ctx.moodValue === null && ctx.sleepQuality === null) {
    score -= 10;
  }
  if (ctx.consecutiveDaysWithoutData >= 3) {
    score -= 20;
  }
  if (ctx.consecutiveDaysWithoutData >= 5) {
    score -= 30;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function computeAlert(score: number, moodValue: number | null, medsAdherence: number | null, consecutiveDaysWithoutData: number): { level: DayAlert; message: string } {
  // Data gap overrides — silence is dangerous in bipolar condition
  if (consecutiveDaysWithoutData >= 5) {
    return { level: "crise", message: `Voce esta sumido ha ${consecutiveDaysWithoutData} dias. Tudo bem? Registre como se sente.` };
  }
  if (consecutiveDaysWithoutData >= 3) {
    return { level: "atencao", message: `Voce esta sumido ha ${consecutiveDaysWithoutData} dias. Tudo bem? Que tal registrar como se sente?` };
  }
  if (consecutiveDaysWithoutData >= 2) {
    return { level: "atencao", message: `${consecutiveDaysWithoutData} dias sem dados. Que tal registrar como voce esta?` };
  }

  if (moodValue !== null && moodValue <= -2 && medsAdherence !== null && medsAdherence < 50) {
    return { level: "crise", message: "Humor muito baixo e medicacao pendente. Priorize so o essencial." };
  }
  if (score < 30 || (moodValue !== null && moodValue <= -2)) {
    return { level: "crise", message: "Dia dificil. Foque no basico: remedio, agua, descanso." };
  }
  if (score < 50 || (moodValue !== null && moodValue === -1)) {
    return { level: "atencao", message: "Energia moderada. Faca o possivel sem se cobrar." };
  }
  if (score >= 75) {
    return { level: "otimo", message: "Dia forte! Bom momento para tarefas estrategicas." };
  }
  return { level: "estavel", message: "Siga no seu ritmo. Tudo fluindo." };
}

function computeTaskLimits(energy: EnergyState | null, moodValue: number | null): { taskLimit: number; casaLimit: number } {
  const energyLimits: Record<string, { tasks: number; casa: number }> = {
    foco_total: { tasks: 10, casa: 5 },
    modo_leve: { tasks: 6, casa: 3 },
    basico: { tasks: 3, casa: 2 },
  };

  const base = energy ? energyLimits[energy] : { tasks: 6, casa: 3 };

  if (moodValue !== null && moodValue <= -2) {
    return { taskLimit: Math.min(base.tasks, 2), casaLimit: 1 };
  }
  if (moodValue !== null && moodValue === -1) {
    return { taskLimit: Math.max(2, base.tasks - 2), casaLimit: Math.max(1, base.casa - 1) };
  }
  if (moodValue !== null && moodValue >= 2) {
    return { taskLimit: base.tasks + 2, casaLimit: base.casa + 1 };
  }

  return { taskLimit: base.tasks, casaLimit: base.casa };
}

function computeSuggestions(ctx: {
  moodValue: number | null;
  medsAdherence: number | null;
  exerciseDone: boolean;
  sleepQuality: number | null;
  tasksCompletedToday: number;
  energy: EnergyState | null;
}): string[] {
  const suggestions: string[] = [];

  if (ctx.medsAdherence !== null && ctx.medsAdherence < 100) {
    suggestions.push("Tomar medicacao pendente");
  }
  if (!ctx.exerciseDone && ctx.moodValue !== null && ctx.moodValue <= 0) {
    suggestions.push("Uma caminhada leve pode ajudar o humor");
  }
  if (ctx.sleepQuality !== null && ctx.sleepQuality <= 1 && ctx.energy === "foco_total") {
    suggestions.push("Sono ruim — considere modo leve hoje");
  }
  if (ctx.tasksCompletedToday >= 5) {
    suggestions.push("Boa produtividade! Que tal uma pausa?");
  }
  if (ctx.moodValue !== null && ctx.moodValue >= 2 && ctx.energy !== "foco_total") {
    suggestions.push("Humor alto — aproveite para aumentar a energia");
  }

  return suggestions;
}

/** Count consecutive days without ANY health data (humor, sono, or meds) going back from yesterday.
 *  Weekends (Saturday=6, Sunday=0) are skipped — they don't count toward the gap
 *  to prevent false "crise" alerts when users legitimately don't check in on weekends. */
function countConsecutiveDaysWithoutData(
  registrosHumor: { data: string }[],
  registrosSono: { data: string }[],
  registrosMed: { data: string }[],
): number {
  const todayDate = new Date();
  let count = 0;

  for (let i = 1; i <= 10; i++) {
    const d = new Date(todayDate);
    d.setDate(d.getDate() - i);
    const dayOfWeek = d.getDay(); // 0=Sunday, 6=Saturday

    // Skip weekends — they don't count toward consecutive gap
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    const dateStr = d.toISOString().split("T")[0];

    const hasHumor = registrosHumor.some((r) => r.data === dateStr);
    const hasSono = registrosSono.some((r) => r.data === dateStr);
    const hasMed = registrosMed.some((r) => r.data === dateStr);

    if (!hasHumor && !hasSono && !hasMed) {
      count++;
    } else {
      break; // consecutive streak broken
    }
  }

  return count;
}

/** Check if a recurring task is due for a new instance based on its frequency */
function isRecurringTaskDue(task: Task): boolean {
  if (!task.recorrente || !task.frequencia_recorrencia || task.status !== "feito" || !task.feito_em) return false;

  const freqDays: Record<string, number> = {
    diario: 1,
    semanal: 7,
    quinzenal: 15,
    mensal: 30,
  };

  const days = freqDays[task.frequencia_recorrencia];
  if (!days) return false;

  const doneDate = new Date(task.feito_em);
  const now = new Date();
  const elapsed = Math.floor((now.getTime() - doneDate.getTime()) / (24 * 60 * 60 * 1000));

  return elapsed >= days;
}

const defaultModuleOrder = ["saude", "casa", "financeiro", "calendario", "metas"];

export function useDayContext(): DayContext {
  const { state, addTask } = useFlowStore();
  const bemEstar = useBemEstarStore();
  const casa = useCasaStore();
  const trackers = useTrackerStore();
  const recurrenceChecked = useRef(false);

  const todayStr = today();

  // Recurrence check: auto-create new instances of recurring tasks when due
  useEffect(() => {
    if (recurrenceChecked.current || state.tasks.length === 0) return;
    recurrenceChecked.current = true;

    const dueTasks = state.tasks.filter(isRecurringTaskDue);
    for (const task of dueTasks) {
      // Check if a new instance already exists (not completed, same title)
      const existingNew = state.tasks.find(
        (t) => t.titulo === task.titulo && t.status !== "feito" && t.status !== "descartado" && t.id !== task.id
      );
      if (existingNew) continue;

      addTask({
        titulo: task.titulo,
        modulo: task.modulo,
        tipo: task.tipo,
        urgencia: task.urgencia,
        impacto: task.impacto,
        dono: task.dono,
        estado_ideal: task.estado_ideal,
        tempo_min: task.tempo_min,
        recorrente: true,
        frequencia_recorrencia: task.frequencia_recorrencia,
        status: "hoje",
        notas: task.notas,
        cliente_id: task.cliente_id,
      });
    }
  }, [state.tasks, addTask]);

  const { data: orchestration } = useQuery({
    queryKey: ["orchestration", todayStr],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return null;
      const { data } = await supabase
        .from("agentes_orquestracao")
        .select("*")
        .eq("user_id", userData.user.id)
        .eq("periodo", todayStr)
        .maybeSingle();
      return data as Orchestration | null;
    },
    staleTime: 1000 * 60 * 15,
    refetchOnWindowFocus: false,
  });

  return useMemo(() => {
    const energy = state.current_energy;

    // Mood
    const todayHumor = state.registros_humor.find((r) => r.data === todayStr);
    const moodValue = todayHumor?.valor ?? null;

    // Sleep
    const todaySleep = state.registros_sono.find((r) => r.data === todayStr);
    const sleepQuality = todaySleep?.qualidade ?? null;
    const sleepHours = todaySleep?.duracao_min ? todaySleep.duracao_min / 60 : null;

    // Meds
    const todayMedRecords = state.registros_medicamento.filter((r) => r.data === todayStr);
    const totalMedSlots = state.medicamentos.reduce((sum, m) => sum + m.horarios.length, 0);
    const medsTaken = todayMedRecords.filter((r) => r.tomado).length;
    const medsAdherence = totalMedSlots > 0 ? Math.round((medsTaken / totalMedSlots) * 100) : null;

    // Exercise
    const exerciseDone = bemEstar.exerciciosHoje.length > 0;
    const exerciseMinutes = bemEstar.exerciciosHoje.reduce((sum, e) => sum + e.duracao_min, 0);

    // Tasks
    const tasksCompletedToday = state.tasks.filter(
      (t) => t.status === "feito" && t.feito_em?.startsWith(todayStr)
    ).length;
    const tasksPending = state.tasks.filter(
      (t) => t.status !== "feito" && t.status !== "descartado"
    ).length;
    const tasksOverdue = state.tasks.filter(
      (t) => t.data_limite && t.data_limite < todayStr && t.status !== "feito" && t.status !== "descartado"
    ).length;

    // Consecutive days without data
    const consecutiveDaysWithoutData = countConsecutiveDaysWithoutData(
      state.registros_humor,
      state.registros_sono,
      state.registros_medicamento,
    );

    // Computed local score
    const localDayScore = computeDayScore({ moodValue, sleepQuality, medsAdherence, exerciseDone, tasksCompletedToday, energy, consecutiveDaysWithoutData });
    const localAlert = computeAlert(localDayScore, moodValue, medsAdherence, consecutiveDaysWithoutData);

    // Prefer orchestration values when available
    const dayScore = orchestration?.day_score_recalibrated ?? localDayScore;
    const alertLevel = (orchestration?.alert_level_recalibrated as DayAlert) ?? localAlert.level;
    const alertMessage = localAlert.message;

    const { taskLimit, casaLimit } = computeTaskLimits(energy, moodValue);
    const suggestedActions = computeSuggestions({ moodValue, medsAdherence, exerciseDone, sleepQuality, tasksCompletedToday, energy });

    const contextMessage = alertMessage;

    return {
      moodValue,
      moodLabel: moodToLabel(moodValue),
      energy,
      sleepQuality,
      sleepHours,
      medsTaken,
      medsTotal: totalMedSlots,
      medsAdherence,
      exerciseDone,
      exerciseMinutes,
      dayScore,
      alertLevel,
      alertMessage,
      taskLimit,
      casaLimit,
      suggestedActions,
      contextMessage,
      consecutiveDaysWithoutData,
      tasksCompletedToday,
      tasksPending,
      tasksOverdue,
      moduleOrder: orchestration?.module_order ?? defaultModuleOrder,
      orchestration: orchestration ?? null,
      scoreShift: orchestration?.score_shift ?? null,
      weightAdjustmentReason: orchestration?.weight_adjustment_reason ?? null,
      alerts: [],
    };
  }, [
    todayStr,
    state.current_energy,
    state.registros_humor,
    state.registros_sono,
    state.registros_medicamento,
    state.medicamentos,
    state.tasks,
    bemEstar.exerciciosHoje,
    orchestration,
  ]);
}
